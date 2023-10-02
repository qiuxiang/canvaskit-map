import { Canvas } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";

export interface TextLayerOptions extends LayerOptions {
  text: string;
  x: number;
  y: number;
}

export class TextLayer extends Layer<TextLayerOptions> {
  constructor(options: TextLayerOptions) {
    super(options);
    const canvasElement = document.createElement("canvas");
    console.log(canvasElement.width);
  }

  draw(canvas: Canvas) {}
}
