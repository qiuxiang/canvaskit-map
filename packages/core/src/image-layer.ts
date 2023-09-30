import { Canvas, Image } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { canvaskit } from "./tilemap";
import { makeRect, overlays, TaskQueue } from "./utils";

export interface ImageLayerOptions extends LayerOptions {
  image: CanvasImageSource;
  bounds: number[];
}

export class ImageLayer extends Layer {
  options: ImageLayerOptions;
  _element = null as unknown as HTMLElement;
  _images = {} as Record<number, Image>;
  _paint = new canvaskit.Paint();

  constructor(options: ImageLayerOptions) {
    super(options.zIndex ?? 0);
    this.options = options;
  }

  async init() {
    const { image } = this.options;
    if (image instanceof HTMLImageElement && !image.width) {
      await new Promise((resolve) => {
        image.addEventListener("load", resolve);
      });
    }
    let _image = image as HTMLCanvasElement;
    this._images[0] = canvaskit.MakeImageFromCanvasImageSource(image);
    let width = _image.width;
    let height = _image.height;
    for (let zoom = -1; zoom > this.tilemap._minZoom; zoom -= 1) {
      _image = this._downscaleImage(_image);
      this._images[zoom] = canvaskit.MakeImageFromCanvasImageSource(_image);
    }
    this.tilemap.draw();
  }

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
    let zoom = this.tilemap.zoom + 1;
    zoom = Math.ceil(Math.max(Math.min(zoom, 0), this.tilemap._minZoom));

    const image = this._images[zoom] ?? Object.values(this._images).pop();
    if (!image) return;

    const { bounds } = this.options;
    const dstOffset = this.tilemap._toOffset(bounds[0], bounds[1]);
    const src = makeRect(0, 0, image.width(), image.height());
    const dst = makeRect(
      dstOffset[0],
      dstOffset[1],
      (bounds[2] - bounds[0]) * this.tilemap._scale,
      (bounds[3] - bounds[1]) * this.tilemap._scale
    );
    if (overlays(this.tilemap.visibleRect, dst)) {
      canvas.drawImageRect(image, src, dst, this._paint);
    }
  }
}
