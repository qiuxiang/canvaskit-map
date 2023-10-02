import { Canvas, Image } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { canvaskit } from "./tilemap";
import { makeRect } from "./utils";

export interface TextLayerOptions extends LayerOptions {
  text: string;
  x: number;
  y: number;
}

export class TextLayer extends Layer<TextLayerOptions> {
  _image: Image;
  _paint = new canvaskit.Paint();

  constructor(options: TextLayerOptions) {
    super(options);
    const image1 = document.createElement("canvas");
    let canvas = image1.getContext("2d")!;
    canvas.font = "bold 60px sans-serif";
    canvas.fillStyle = "#fff";
    const textMetrics = canvas.measureText(options.text);
    canvas.strokeText(options.text, 0, textMetrics.actualBoundingBoxAscent);
    canvas.fillText(options.text, 0, textMetrics.actualBoundingBoxAscent);
    const image = document.createElement("canvas");
    console.log(textMetrics);
    canvas = image.getContext("2d")!;
    image.width = textMetrics.width;
    image.height =
      textMetrics.actualBoundingBoxAscent +
      textMetrics.actualBoundingBoxDescent;
    canvas.drawImage(image1, 0, 0);
    this._image = canvaskit.MakeImageFromCanvasImageSource(image);
  }

  draw(canvas: Canvas) {
    const { x, y } = this._options;
    const offset = this.tilemap._toOffset(x, y);
    let width = this._image.width();
    let height = this._image.height();
    const src = makeRect(0, 0, width, height);
    width /= 2;
    height /= 2;
    const dst = makeRect(
      offset[0] - width / 2,
      offset[1] - height / 2,
      width,
      height
    );
    canvas.drawImageRect(this._image, src, dst, this._paint);
  }
}
