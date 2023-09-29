import { Canvas, Image } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { canvaskit } from "./tilemap";
import { makeRect, overlays } from "./utils";

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
    let _image = canvaskit.MakeImageFromCanvasImageSource(image);
    this._images[0] = _image;
    let width = _image.width();
    let height = _image.height();
    const surface = canvaskit.MakeSurface(width, height)!;
    const canvas = surface.getCanvas();
    for (let zoom = -1; zoom > this.tilemap._minZoom; zoom -= 1) {
      const src = makeRect(0, 0, width, height);
      width /= 2;
      height /= 2;
      const dst = makeRect(0, 0, width, height);
      canvas.clear(canvaskit.TRANSPARENT);
      canvas.drawImageRect(_image, src, dst, this._paint);
      surface.flush();
      _image = surface.makeImageSnapshot([0, 0, width, height]);
      this._images[zoom] = _image;
    }
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
    if (overlays(this.tilemap._visibleRect, dst)) {
      canvas.drawImageRect(image, src, dst, this._paint);
    }
  }
}
