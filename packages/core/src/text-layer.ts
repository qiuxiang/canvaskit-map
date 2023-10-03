import { Canvas, FontMgr, Paragraph, ParagraphStyle } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { canvaskit } from "./tilemap";
import { TaskQueue } from "./utils";

export interface TextLayerOptions extends LayerOptions {
  text: string;
  x: number;
  y: number;
  maxWidth?: number;
  fontUrl: string;
  style: ParagraphStyle;
}

const _queue = new TaskQueue();
const _cache = {} as Record<string, FontMgr>;

export class TextLayer extends Layer<TextLayerOptions> {
  _paint = new canvaskit.Paint();
  _paragraph?: Paragraph;

  async init() {
    _queue.run(async () => {
      let fontMgr = _cache[this._options.fontUrl];
      if (!fontMgr) {
        const response = await fetch(this._options.fontUrl);
        fontMgr = canvaskit.FontMgr.FromData(await response.arrayBuffer())!;
      }
      const style = new canvaskit.ParagraphStyle(this._options.style);
      const builder = canvaskit.ParagraphBuilder.Make(style, fontMgr);
      builder.addText(this._options.text);
      this._paragraph = builder.build();
      this._paragraph.layout(this._options.maxWidth ?? this.tilemap._size[0]);
    });
  }

  draw(canvas: Canvas) {
    const [x, y] = this.tilemap._toOffset(this._options.x, this._options.y);
    if (this._paragraph) {
      canvas.drawParagraph(
        this._paragraph,
        x - this._paragraph.getMinIntrinsicWidth() / 2,
        y - this._paragraph.getHeight() / 2
      );
    }
  }
}
