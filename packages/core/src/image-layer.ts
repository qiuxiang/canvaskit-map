import { Canvas, Image, Paint } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { rectFromLTWH } from "./utils";

export interface ImageLayerOptions extends LayerOptions {
  image: CanvasImageSource | string;
  opacity?: number;
  bounds: number[];
}

export class ImageLayer extends Layer<ImageLayerOptions> {
  _image?: Image;
  _paint?: Paint;

  constructor(options: ImageLayerOptions) {
    super(options);
  }

  get options() {
    return this._options;
  }

  set options(options: ImageLayerOptions) {
    this._options = options;
    this._setOpacity();
  }

  _setOpacity() {
    const { opacity } = this._options;
    if (opacity != undefined) {
      this._paint!.setColor(this.canvaskit!.Color(0, 0, 0, opacity));
    }
  }

  async init() {
    this._paint = new this.canvaskit!.Paint();
    const { image } = this._options;
    if (typeof image == "string") {
      const response = await fetch(image);
      const bitmap = await createImageBitmap(await response.blob());
      this._image = this.canvaskit!.MakeImageFromCanvasImageSource(bitmap);
    } else {
      if (image instanceof HTMLImageElement && !image.width) {
        await new Promise((resolve, reject) => {
          image.addEventListener("load", resolve);
          image.addEventListener("error", reject);
        });
      }
      this._image = this.canvaskit!.MakeImageFromCanvasImageSource(image);
    }
    this._setOpacity();
    this.map!.draw();
  }

  draw(canvas: Canvas) {
    if (!this._image) return;

    const { bounds } = this._options;
    const dstOffset = this.map!.toOffset(bounds[0], bounds[1]);
    const src = rectFromLTWH(0, 0, this._image.width(), this._image.height());
    const dst = rectFromLTWH(
      dstOffset[0],
      dstOffset[1],
      (bounds[2] - bounds[0]) * this.map!._scale,
      (bounds[3] - bounds[1]) * this.map!._scale
    );
    canvas.drawImageRect(this._image, src, dst, this._paint!);
  }
}
