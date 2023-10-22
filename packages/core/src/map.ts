import { CanvasKit, GrDirectContext, Surface } from "canvaskit-wasm";
import { debounceTime, Observable } from "rxjs";
import { MapGesture } from "./gesture";
import { Layer } from "./layer";
import { MarkerItem, MarkerLayer } from "./marker-layer";
import { alongSize, rectFromLTWH } from "./utils";

export interface MapClickEvent {
  coordinate: number[];
  markerLayer?: MarkerLayer;
  markerItem?: MarkerItem;
}

export interface MapOptions {
  /**
   * 入口节点，支持 selector 和 element
   */
  element: string | HTMLElement;

  /**
   * 地图大小，单位像素
   */
  size: number[];

  /**
   * 地图原点
   */
  origin: number[];

  /**
   * 最大缩放级别，默认 0
   */
  maxZoom?: number;

  onMove?: () => void;
  onReady?: (tilemap: CanvaskitMap) => void;
  onClick?: (event: MapClickEvent) => void;
}

export class CanvaskitMap {
  _options: MapOptions;
  _element: HTMLElement;
  _canvasElement: HTMLCanvasElement;
  /**
   * constructor 里调用 resize 时初始化
   */
  _surface = null as unknown as Surface;
  _context: GrDirectContext;
  _gesture: MapGesture;
  _minZoom = 0;
  _layers = new Set<Layer>();
  _dirty = false;
  _initialized = false;

  _size = [0, 0];
  _offset = [0, 0];
  _scale = 0;

  constructor(public canvaskit: CanvasKit, options: MapOptions) {
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
    this._canvasElement.style.position = "absolute";
    this._context = canvaskit.MakeWebGLContext(
      canvaskit.GetWebGLContext(this._canvasElement)
    )!;
    this._element.style.touchAction = "none";
    this._element.appendChild(this._canvasElement);

    this._gesture = new MapGesture(this);
    this._initResizeObserver();
    this._resize(this._element.clientWidth, this._element.clientHeight);
    this._drawFrame();
  }

  _initResizeObserver() {
    const observable = new Observable<number[]>((subscriber) => {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        subscriber.next([Math.floor(width), Math.floor(height)]);
      }).observe(this._element);
    });
    observable.pipe(debounceTime(500)).subscribe((size) => {
      this._resize(size[0], size[1]);
    });
  }

  /**
   * 重新设置画布大小，通常由 resizeObserver 调用，不需要主动调用
   */
  _resize(width: number, height: number) {
    if (this._size[0] == width && this._size[1] == height) {
      return;
    }

    // canvas resize，重新构造 surface
    this._canvasElement.width = width * devicePixelRatio;
    this._canvasElement.height = height * devicePixelRatio;
    this._canvasElement.style.width = `${width}px`;
    this._canvasElement.style.height = `${height}px`;
    this._surface = this.canvaskit.MakeOnScreenGLSurface(
      this._context,
      width * devicePixelRatio,
      height * devicePixelRatio,
      this.canvaskit.ColorSpace.SRGB
    )!;

    // 重新计算 minScale
    this._size[0] = width;
    this._size[1] = height;
    const minScale = Math.max(
      this._size[0] / this._options.size[0],
      this._size[1] / this._options.size[1]
    );
    const minZoom = Math.log2(minScale);

    if (this._minZoom == 0) {
      // 第一次 resize，也标志着初始化完成
      this._scale = minScale;
      this._minZoom = minZoom;
      for (const layer of this._layers) {
        layer.init();
      }
      this._initialized = true;
      this._options.onReady?.(this);
    } else if (this._minZoom != minZoom) {
      this._minZoom = minZoom;
      this._scaleTo(this._scale, this._size[0] / 2, this._size[1] / 2);
    }
    this.draw();
  }

  /**
   * 由 gesture 触发，处理点击事件
   *
   * TODO: 目前只处理了 marker 的点击事件，更合理的设计应该是每个 Laryer
   * 都有可选的点击事件处理方法，由 Map 统一调用。
   */
  _onClick(x: number, y: number) {
    const coordinate = this.toCoordinate(x, y);
    const marker = this._findMarker(coordinate[0], coordinate[1]);
    this._options.onClick?.({
      coordinate,
      markerLayer: marker?.[0],
      markerItem: marker?.[1],
    });
  }

  /**
   * 查询点击的位置是否有 marker
   *
   * TODO: 这个方法放在 MarkerLayer 里更合理，暂时先这样
   */
  _findMarker(x: number, y: number): [MarkerLayer, MarkerItem] | undefined {
    const markerLayers = [...this._layers].filter(
      (i) => i instanceof MarkerLayer && !i.options.hidden
    );
    markerLayers.sort((a, b) => a.zIndex - b.zIndex);
    for (const markerLayer of markerLayers.reverse() as MarkerLayer[]) {
      if (!markerLayer._image) continue;

      const scale = markerLayer.options.scale! / this._scale;
      const width = markerLayer._image.width() * scale;
      const height = markerLayer._image.height() * scale;
      const anchor = alongSize(markerLayer.options.anchor!, width, height);
      for (const item of markerLayer.options.items) {
        const left = item.x - anchor[0];
        const top = item.y - anchor[1];
        const right = left + width;
        const bottom = top + height;
        if (left < x && x < right && top < y && y < bottom) {
          markerLayer.options.onClick?.(item);
          return [markerLayer, item];
        }
      }
    }
  }

  addLayer(layer: Layer) {
    layer.map = this;
    this._layers.add(layer);
    if (this._initialized) {
      layer.init().then(() => {
        layer._initialized = true;
      });
    }
    this.draw();
  }

  removeLayer(layer: Layer) {
    layer.dispose();
    this._layers.delete(layer);
    this.draw();
  }

  _drawFrame() {
    if (this._dirty) {
      const canvas = this._surface.getCanvas();
      // 重置 matrix
      canvas.concat(this.canvaskit.Matrix.invert(canvas.getTotalMatrix())!);
      // scale 依赖原点，必须先 scale 后 translate
      canvas.scale(devicePixelRatio, devicePixelRatio);
      canvas.translate(-this._offset[0], -this._offset[1]);
      const layers = [...this._layers].filter(
        (i) => i._initialized && !i.options.hidden
      );
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

  /**
   * 返回 minZoom，maxZoom 限制下的新 scale
   */
  _newScale(newScale: number) {
    const { _minZoom, _options } = this;
    let zoom = Math.log2(newScale);
    zoom = Math.max(Math.min(zoom, _options.maxZoom!), _minZoom);
    return 2 ** zoom;
  }

  /**
   * 按原点缩放
   */
  _scaleTo(newScale: number, x: number, y: number) {
    const { _offset, _scale } = this;
    newScale = this._newScale(newScale);
    const ratio = (newScale - _scale) / _scale;
    this._scale = newScale;
    this._setOffset(
      _offset[0] + (x + _offset[0]) * ratio,
      _offset[1] + (y + _offset[1]) * ratio
    );
  }

  /**
   * 设置 offset，新的 offset 不会超出边界
   */
  _setOffset(x: number, y: number) {
    const { _size, _options, _offset, _scale } = this;
    const maxX = _options.size[0] * _scale - _size[0];
    const maxY = _options.size[1] * _scale - _size[1];
    _offset[0] = Math.max(Math.min(x, maxX), 0);
    _offset[1] = Math.max(Math.min(y, maxY), 0);
    this.draw();
    this._options.onMove?.();
  }

  /**
   * 地图坐标转 offset
   */
  toOffset(x: number, y: number, scale = this._scale) {
    return [
      (x + this._options.origin[0]) * scale,
      (y + this._options.origin[1]) * scale,
    ];
  }

  /**
   * offset 转地图坐标
   */
  toCoordinate(x: number, y: number) {
    return [
      (x + this._offset[0]) / this._scale - this._options.origin[0],
      (y + this._offset[1]) / this._scale - this._options.origin[1],
    ];
  }

  get zoom() {
    return Math.log2(this._scale);
  }

  get offset() {
    return this._offset;
  }

  get size() {
    return this._size;
  }

  get rect() {
    return rectFromLTWH(
      this._offset[0],
      this._offset[1],
      this._size[0],
      this._size[1]
    );
  }
}
