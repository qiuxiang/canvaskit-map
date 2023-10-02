import { Canvas } from "canvaskit-wasm";
import { Tilemap } from "./tilemap";

export interface LayerOptions {
  /**
   * 层级, 数值大的显示在数值小的上面, 默认 0
   */
  zIndex?: number;

  /**
   * 是否隐藏
   */
  hidden?: boolean;
}

export abstract class Layer<O extends LayerOptions = LayerOptions> {
  /**
   * addLayer 时由 tilemap 赋值
   */
  tilemap: Tilemap = null as unknown as Tilemap;
  constructor(public _options: O) {}
  abstract draw(canvas: Canvas): void;
  initialized = false;
  init() {
    this.initialized = true;
  }
  dispose() {}
  get zIndex() {
    return this._options.zIndex ?? 0;
  }
  get options() {
    return this._options;
  }
  set options(options: O) {
    this._options = options;
  }
}
