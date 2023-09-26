import init, {
  CanvasKit,
  CanvasKitInitOptions,
  GrDirectContext,
  Surface,
} from "canvaskit-wasm";
import { debounceTime, Observable } from "rxjs";
import { TilemapGesture } from "./gesture";
import { Layer } from "./layer";

export let canvaskit: CanvasKit;

export async function initCanvaskit(opts?: CanvasKitInitOptions) {
  canvaskit = await init(opts);
}

export interface TilemapOptions {
  /**
   * 入口节点，支持 selector 和 element
   */
  element: string | HTMLElement;

  /**
   * 地图原始尺寸
   */
  mapSize: [number, number];

  /**
   * 地图原点
   */
  origin: [number, number];

  /**
   * 最大缩放级别，默认 0
   */
  maxZoom?: number;

  onMove?: () => {};
}

export class Tilemap {
  /** @internal */
  _options: TilemapOptions;
  /** @internal */
  _element: HTMLElement;
  /** @internal */
  _canvasElement: HTMLCanvasElement;
  /**
   * constructor 里调用 resize 时初始化
   * @internal
   */
  _surface = null as unknown as Surface;
  /** @internal */
  _context: GrDirectContext;
  /** @internal */
  _gesture: TilemapGesture;
  /** @internal */
  _minZoom = 0;
  /** @internal */
  _layers = new Set<Layer>();
  /** @internal */
  _dirty = false;
  /** @internal */
  _initialized = false;

  /** @internal */
  _size = [0, 0];
  /** @internal */
  _offset = [0, 0];
  /** @internal */
  _scale = 0;

  constructor(options: TilemapOptions) {
    this._options = {
      ...options,
      maxZoom: options.maxZoom ?? 0,
    };

    if (typeof options.element == "string") {
      this._element = document.querySelector(options.element)!;
    } else {
      this._element = options.element;
    }
    this._canvasElement = document.createElement("canvas");
    this._canvasElement.style.touchAction = "none";
    this._canvasElement.style.position = "absolute";
    this._context = canvaskit.MakeWebGLContext(
      canvaskit.GetWebGLContext(this._canvasElement)
    )!;
    this._element.appendChild(this._canvasElement);

    this._gesture = new TilemapGesture(this);
    this._initResizeObserver();
    this._resize([this._element.clientWidth, this._element.clientHeight]);
    this._drawFrame();
  }

  /** @internal */
  _initResizeObserver() {
    const observable = new Observable<[number, number]>((subscriber) => {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        subscriber.next([Math.floor(width), Math.floor(height)]);
      }).observe(this._element);
    });
    observable.pipe(debounceTime(500)).subscribe((size) => {
      this._resize(size);
    });
  }

  /** @internal */
  _resize(size: [number, number]) {
    if (this._size[0] == size[0] && this._size[1] == size[1]) {
      return;
    }

    this._canvasElement.width = size[0] * devicePixelRatio;
    this._canvasElement.height = size[1] * devicePixelRatio;
    this._canvasElement.style.width = `${size[0]}px`;
    this._canvasElement.style.height = `${size[1]}px`;
    this._surface = canvaskit.MakeOnScreenGLSurface(
      this._context,
      size[0] * devicePixelRatio,
      size[1] * devicePixelRatio,
      canvaskit.ColorSpace.SRGB
    )!;
    this._size = size;
    const minScale = Math.max(
      this._size[0] / this._options.mapSize[0],
      this._size[1] / this._options.mapSize[1]
    );
    const minZoom = Math.log2(minScale);
    if (this._minZoom == 0) {
      this._scale = minScale;
      this._minZoom = minZoom;
      for (const layer of this._layers) {
        layer.init();
      }
      this._initialized = true;
    } else if (this._minZoom != minZoom) {
      this._minZoom = minZoom;
      this._scaleTo(this._scale, [this._size[0] / 2, this._size[1] / 2]);
    }
    this.draw();
  }

  addLayer(layer: Layer) {
    layer.tilemap = this;
    this._layers.add(layer);
    if (this._initialized) {
      layer.init();
    }
    this.draw();
  }

  removeLayer(layer: Layer) {
    this._layers.delete(layer);
    this.draw();
  }

  /** @internal */
  _drawFrame() {
    if (this._dirty) {
      const canvas = this._surface.getCanvas();
      // 重置 matrix
      canvas.concat(canvaskit.Matrix.invert(canvas.getTotalMatrix())!);
      // 因为 scale 有原点，必须先 scale 后 translate
      canvas.scale(devicePixelRatio, devicePixelRatio);
      canvas.translate(-this._offset[0], -this._offset[1]);
      const layers = [...this._layers];
      layers.sort((a, b) => a.zIndex - b.zIndex);
      for (const layer of layers) {
        layer.draw(canvas);
      }
      this._surface.flush();
      this._dirty = false;
    }
    requestAnimationFrame(() => this._drawFrame());
  }

  draw() {
    this._dirty = true;
  }

  /** @internal */
  _newScale(newScale: number) {
    const { _minZoom, _options } = this;
    let zoom = Math.log2(newScale);
    zoom = Math.max(Math.min(zoom, _options.maxZoom!), _minZoom);
    return 2 ** zoom;
  }

  /** @internal */
  _scaleTo(newScale: number, origin: [number, number]) {
    const { _offset, _scale } = this;
    newScale = this._newScale(newScale);
    const ratio = (newScale - _scale) / _scale;
    this._scale = newScale;
    this._setOffset([
      _offset[0] + (origin[0] + _offset[0]) * ratio,
      _offset[1] + (origin[1] + _offset[1]) * ratio,
    ]);
  }

  /** @internal */
  _setOffset(newOffset: [number, number]) {
    const { _size, _options, _offset, _scale } = this;
    const max = [
      _options.mapSize[0] * _scale - _size[0],
      _options.mapSize[1] * _scale - _size[1],
    ];
    _offset[0] = Math.max(Math.min(newOffset[0], max[0]), 0);
    _offset[1] = Math.max(Math.min(newOffset[1], max[1]), 0);
    this.draw();
    this._options.onMove?.();
  }

  /** @internal */
  _toOffset(x: number, y: number, scale?: number): [number, number] {
    return [
      (x + this._options.origin[0]) * (scale ?? this._scale),
      (y + this._options.origin[1]) * (scale ?? this._scale),
    ];
  }

  get zoom() {
    return Math.log2(this._scale);
  }

  get offset() {
    return this._offset;
  }
}
