import { Canvas } from "canvaskit-wasm";
import { Tilemap } from ".";

export interface LayerOptions {
  zIndex?: number;
}

export abstract class Layer {
  /**
   * addLayer 时赋值
   */
  tilemap: Tilemap = null as unknown as Tilemap;
  constructor(public zIndex: number) {}
  abstract draw(canvas: Canvas): void;
  initialized = false;
  init() {
    this.initialized = true;
  }
  dispose() {}
}
