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
  image?: CanvasImageSource;
  /**
   * 缩放，默认取 1 / devicePixelRatio
   */
  scale?: number;
  anchor?: [number, number];
  onClick?: (markerItem: T) => void;
}

export class MarkerLayer<T extends MarkerItem = MarkerItem> extends Layer<
  MarkerLayerOptions<T>
> {
  /** @internal */
  _paint?: Paint;

  /** @internal */
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
      this._image = this.canvaskit!.MakeImageFromCanvasImageSource(
        this.options.image
      );
    }
  }

  set image(image: CanvasImageSource) {
    this._image = this.canvaskit!.MakeImageFromCanvasImageSource(image);
    this.map!.draw();
  }

  draw(canvas: Canvas) {
    if (!this._image) return;

    const { scale, items, anchor } = this._options;
    const width = this._image.width();
    const height = this._image.height();
    const _anchor = alongSize(anchor!, [width, height]);
    let rects = [] as number[];
    let xforms = [] as number[];
    for (const item of items) {
      const offset = this.map!._toOffset(item.x, item.y);
      const i = rects.length;
      rects[i] = 0;
      rects[i + 1] = 0;
      rects[i + 2] = width;
      rects[i + 3] = height;
      const xform = makeRSXform(0, scale!, _anchor, offset);
      xforms[i] = xform[0];
      xforms[i + 1] = xform[1];
      xforms[i + 2] = xform[2];
      xforms[i + 3] = xform[3];
    }

    canvas.drawAtlas(this._image, rects, xforms, this._paint!);
  }
}

function alongSize(
  align: [number, number],
  size: [number, number]
): [number, number] {
  const centerX = size[0] / 2;
  const centerY = size[1] / 2;
  return [centerX + align[0] * centerX, -centerY - align[1] * centerY];
}
