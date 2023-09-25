import { Canvas, Image } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { canvaskit } from "./tilemap";
import { alongSize, makeRSXform } from "./utils";

export interface MarkerItem {
  x: number;
  y: number;
}

export interface MarkerLayerOptions extends LayerOptions {
  items: MarkerItem[];
  image: CanvasImageSource;
  scale?: number;
  anchor?: [number, number];
}

export class MarkerLayer extends Layer {
  /** @internal */
  _options: MarkerLayerOptions;
  /** @internal */
  _paint = new canvaskit.Paint();
  /** @internal */
  _image: Image;

  constructor(options: MarkerLayerOptions) {
    super(options.zIndex ?? 0);
    this._options = {
      ...options,
      scale: options.scale ?? 1 / devicePixelRatio,
      anchor: options.anchor ?? [0, 0],
    };
    this._image = canvaskit.MakeImageFromCanvasImageSource(options.image);
  }

  draw(canvas: Canvas) {
    const { scale, items, anchor: alignment } = this._options;
    const width = this._image.width();
    const height = this._image.height();
    const anchor = alongSize(alignment!, [width, height]);
    let rects = [] as number[];
    let xforms = [] as number[];
    for (const item of items) {
      const offset = this.tilemap._toOffset(item.x, item.y);
      const i = rects.length;
      rects[i] = 0;
      rects[i + 1] = 0;
      rects[i + 2] = width;
      rects[i + 3] = height;
      const xform = makeRSXform(0, scale!, anchor, offset);
      xforms[i] = xform[0];
      xforms[i + 1] = xform[1];
      xforms[i + 2] = xform[2];
      xforms[i + 3] = xform[3];
    }

    canvas.drawAtlas(this._image, rects, xforms, this._paint);
  }
}
