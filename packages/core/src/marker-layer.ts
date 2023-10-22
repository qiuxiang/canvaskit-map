import { Canvas, Image, Paint } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { makeRSXform } from "./utils";

export interface MarkerItem {
  x: number;
  y: number;
}

export interface MarkerLayerOptions<T extends MarkerItem = MarkerItem>
  extends LayerOptions {
  items: T[];
  image?: CanvasImageSource | Image;
  /**
   * 缩放，默认取 1 / devicePixelRatio
   */
  scale?: number;
  anchor?: number[];
  onClick?: (markerItem: T) => void;
}

export class MarkerLayer<T extends MarkerItem = MarkerItem> extends Layer<
  MarkerLayerOptions<T>
> {
  _paint?: Paint;
  _image: Image | null = null;

  constructor(options: MarkerLayerOptions<T>) {
    super({
      ...options,
      scale: options.scale ?? 1 / devicePixelRatio,
      anchor: options.anchor ?? [0, 0],
    });
  }

  async init() {
    this._paint = new this.canvaskit!.Paint();
    if (this.options.image) {
      this._setImage(this.options.image);
    }
  }

  _setImage(image: CanvasImageSource | Image) {
    if ((image as Image).getImageInfo) {
      this._image = image as Image;
    } else {
      this._image = this.canvaskit!.MakeImageFromCanvasImageSource(
        image as CanvasImageSource
      );
    }
  }

  set image(image: CanvasImageSource | Image) {
    this._setImage(image);
    this.map!.draw();
  }

  draw(canvas: Canvas) {
    if (!this._image) return;

    const { scale, items, anchor } = this._options;
    const width = this._image.width();
    const height = this._image.height();
    const _anchor = alongSize(anchor!, width, height);
    let rects = [];
    let xforms = [];
    let index = 0;
    for (const item of items) {
      const offset = this.map!.toOffset(item.x, item.y);
      rects[index] = 0;
      rects[index + 1] = 0;
      rects[index + 2] = width;
      rects[index + 3] = height;
      const xform = makeRSXform(0, scale!, _anchor, offset);
      xforms[index] = xform[0];
      xforms[index + 1] = xform[1];
      xforms[index + 2] = xform[2];
      xforms[index + 3] = xform[3];
      index += 4;
    }

    canvas.drawAtlas(this._image, rects, xforms, this._paint!);
  }
}

function alongSize(align: number[], width: number, height: number) {
  const centerX = width / 2;
  const centerY = height / 2;
  return [centerX + align[0] * centerX, -centerY - align[1] * centerY];
}
