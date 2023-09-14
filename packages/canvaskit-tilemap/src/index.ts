import init, {
  CanvasKit,
  CanvasKitInitOptions,
  GrDirectContext,
  Surface,
} from "canvaskit-wasm";
import { debounceTime, Observable } from "rxjs";
import { Layer } from "./layer";
import { TileLayer } from "./tile-layer";

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
   * 默认 0
   */
  maxZoom?: number;

  onMove?: () => void;
}

export class Tilemap {
  options: TilemapOptions;
  element: HTMLElement;
  canvasElement: HTMLCanvasElement;
  surface = null as unknown as Surface;
  context: GrDirectContext;
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
    this.context = canvaskit.MakeWebGLContext(
      canvaskit.GetWebGLContext(this.canvasElement)
    )!;
    this.element.appendChild(this.canvasElement);

    this.initResizeObserver();
    this.resize([this.element.clientWidth, this.element.clientHeight]);
    this.drawFrame();
  }

  initResizeObserver() {
    const observable = new Observable<[number, number]>((subscriber) => {
      new ResizeObserver(([entry]) => {
        const { width, height } = entry.contentRect;
        subscriber.next([width, height]);
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
      // this.gesture.scaleTo(this.scale, [this.size[0] / 2, this.size[1] / 2]);
    }
    this.draw();
  }

  addLayer(layer: TileLayer) {
    layer.tilemap = this;
    this.layers.add(layer);
    this.draw();
  }

  private drawFrame() {
    if (this.dirty) {
      const canvas = this.surface.getCanvas();
      canvas.concat(canvaskit.Matrix.invert(canvas.getTotalMatrix())!);
      canvas.translate(-this.offset[0], -this.offset[1]);
      canvas.scale(devicePixelRatio, devicePixelRatio);
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
}
