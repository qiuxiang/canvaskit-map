import { Canvas, Image, Paint } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { rectFromLTWH, overlays } from "./utils";

export interface ImageLayerOptions extends LayerOptions {
  image: CanvasImageSource;
  opacity?: number;
  bounds: number[];
}

export class ImageLayer extends Layer<ImageLayerOptions> {
  /** @internal */
  _element = null as unknown as HTMLElement;

  /** @internal */
  _images = {} as Record<number, Image>;

  /** @internal */
  _paint?: Paint;

  constructor(options: ImageLayerOptions) {
    super(options);
    this._setOpacity();
  }

  get options() {
    return this._options;
  }

  set options(options: ImageLayerOptions) {
    this._options = options;
    this._setOpacity();
  }

  /** @internal */
  _setOpacity() {
    const { opacity } = this._options;
    if (opacity != undefined) {
      this._paint!.setColor(this.canvaskit!.Color(0, 0, 0, opacity));
    }
  }

  async init() {
    this._paint = new this.canvaskit!.Paint();
    const { image } = this._options;
    if (image instanceof HTMLImageElement && !image.width) {
      await new Promise((resolve) => {
        image.addEventListener("load", resolve);
      });
    }
    let _image = image as HTMLCanvasElement;
    this._images[0] = this.canvaskit!.MakeImageFromCanvasImageSource(image);
    for (let zoom = -1; zoom > this.map!._minZoom; zoom -= 1) {
      _image = this._downscaleImage(_image);
      this._images[zoom] =
        this.canvaskit!.MakeImageFromCanvasImageSource(_image);
    }
    this.map!.draw();
  }

  /** @internal */
  _downscaleImage(image: HTMLCanvasElement) {
    const canvas = document.createElement("canvas");
    const canvas2d = canvas.getContext("2d")!;
    canvas.width = image.width / 2;
    canvas.height = image.height / 2;
    if (canvas.width == 0 || canvas.height == 0) {
      return image;
    }
    canvas2d.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  draw(canvas: Canvas) {
    let zoom = this.map!.zoom + 1;
    zoom = Math.ceil(Math.max(Math.min(zoom, 0), this.map!._minZoom));

    const image = this._images[zoom] ?? Object.values(this._images).pop();
    if (!image) return;

    const { bounds } = this._options;
    const dstOffset = this.map!._toOffset(bounds[0], bounds[1]);
    const src = rectFromLTWH(0, 0, image.width(), image.height());
    const dst = rectFromLTWH(
      dstOffset[0],
      dstOffset[1],
      (bounds[2] - bounds[0]) * this.map!._scale,
      (bounds[3] - bounds[1]) * this.map!._scale
    );
    if (overlays(this.map!.visibleRect, dst)) {
      canvas.drawImageRect(image, src, dst, this._paint!);
    }
  }
}
