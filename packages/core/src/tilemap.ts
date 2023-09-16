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
}

export class Tilemap {
  options: TilemapOptions;
  element: HTMLElement;
  canvasElement: HTMLCanvasElement;
  /**
   * constructor 里调用 resize 时初始化
   */
  surface = null as unknown as Surface;
  context: GrDirectContext;
  gesture: TilemapGesture;
  offset = [0, 0];
  scale = 0;
  minZoom = 0;
  size = [0, 0];
  lastDrawTime = 0;
  layers = new Set<Layer>();
  private dirty = false;

  constructor(options: TilemapOptions) {
    this.options = {
      ...options,
      maxZoom: options.maxZoom ?? 0,
    };

    if (typeof options.element == "string") {
      this.element = document.querySelector(options.element)!;
    } else {
      this.element = options.element;
    }
    this.element.style.touchAction = "none";
    this.canvasElement = document.createElement("canvas");
    this.canvasElement.style.position = "absolute";
    this.context = canvaskit.MakeWebGLContext(
      canvaskit.GetWebGLContext(this.canvasElement)
    )!;
    this.element.appendChild(this.canvasElement);

    this.gesture = new TilemapGesture(this);
    this.initResizeObserver();
    this.resize([this.element.clientWidth, this.element.clientHeight]);
    this.drawFrame();
  }

  initResizeObserver() {
    const observable = new Observable<[number, number]>((subscriber) => {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        subscriber.next([Math.floor(width), Math.floor(height)]);
      }).observe(this.element);
    });
    observable.pipe(debounceTime(500)).subscribe((size) => {
      this.resize(size);
    });
  }

  resize(size: [number, number]) {
    if (this.size[0] == size[0] && this.size[1] == size[1]) {
      return;
    }

    this.canvasElement.width = size[0] * devicePixelRatio;
    this.canvasElement.height = size[1] * devicePixelRatio;
    this.canvasElement.style.width = `${size[0]}px`;
    this.canvasElement.style.height = `${size[1]}px`;
    this.surface = canvaskit.MakeOnScreenGLSurface(
      this.context,
      size[0] * devicePixelRatio,
      size[1] * devicePixelRatio,
      canvaskit.ColorSpace.SRGB
    )!;
    this.size = size;
    const minScale = Math.max(
      this.size[0] / this.options.mapSize[0],
      this.size[1] / this.options.mapSize[1]
    );
    const minZoom = Math.log2(minScale);
    if (this.minZoom == 0) {
      this.scale = minScale;
      this.minZoom = minZoom;
    } else if (this.minZoom != minZoom) {
      this.minZoom = minZoom;
      this.scaleTo(this.scale, [this.size[0] / 2, this.size[1] / 2]);
    }
    this.draw();
  }

  addLayer(layer: Layer) {
    layer.tilemap = this;
    this.layers.add(layer);
    this.draw();
  }

  removeLayer(layer: Layer) {
    this.layers.delete(layer);
    this.draw();
  }

  private drawFrame() {
    if (this.dirty) {
      const canvas = this.surface.getCanvas();
      // 重置 matrix
      canvas.concat(canvaskit.Matrix.invert(canvas.getTotalMatrix())!);
      // 因为 scale 有原点，必须先 scale 后 translate
      canvas.scale(devicePixelRatio, devicePixelRatio);
      canvas.translate(-this.offset[0], -this.offset[1]);
      const layers = [...this.layers];
      layers.sort((a, b) => a.zIndex - b.zIndex);
      for (const layer of layers) {
        layer.draw(canvas);
      }
      this.surface.flush();
      this.dirty = false;
    }
    requestAnimationFrame(() => this.drawFrame());
  }

  draw() {
    this.dirty = true;
  }

  newScale(newScale: number) {
    const { minZoom, options } = this;
    let zoom = Math.log2(newScale);
    zoom = Math.max(Math.min(zoom, options.maxZoom!), minZoom);
    return 2 ** zoom;
  }

  scaleTo(newScale: number, origin: [number, number]) {
    const { offset, scale } = this;
    newScale = this.newScale(newScale);
    const ratio = (newScale - scale) / scale;
    this.scale = newScale;
    this.setOffset([
      offset[0] + (origin[0] + offset[0]) * ratio,
      offset[1] + (origin[1] + offset[1]) * ratio,
    ]);
  }

  setOffset(newOffset: [number, number]) {
    const { size, options, offset, scale } = this;
    const max = [
      options.mapSize[0] * scale - size[0],
      options.mapSize[1] * scale - size[1],
    ];
    offset[0] = Math.max(Math.min(newOffset[0], max[0]), 0);
    offset[1] = Math.max(Math.min(newOffset[1], max[1]), 0);
    this.draw();
  }

  toOffset(x: number, y: number, scale?: number): [number, number] {
    return [
      (x + this.options.origin[0]) * (scale ?? this.scale),
      (y + this.options.origin[1]) * (scale ?? this.scale),
    ];
  }
}
