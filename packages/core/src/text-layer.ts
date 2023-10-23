import {
  Canvas,
  FontMgr,
  Paint,
  Paragraph,
  ParagraphStyle,
} from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
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
  _paint?: Paint;
  _paragraph?: Paragraph;

  async init() {
    this._paint = new this.canvaskit!.Paint();
    _queue.run(async () => {
      let fontMgr = _cache[this._options.fontUrl];
      if (!fontMgr) {
        const response = await fetch(this._options.fontUrl);
        fontMgr = this.canvaskit!.FontMgr.FromData(
          await response.arrayBuffer()
        )!;
        _cache[this._options.fontUrl] = fontMgr;
      }
      const style = new this.canvaskit!.ParagraphStyle(this._options.style);
      const builder = this.canvaskit!.ParagraphBuilder.Make(style, fontMgr);
      builder.addText(this._options.text);
      this._paragraph = builder.build();
      this._paragraph.layout(this._options.maxWidth ?? this.map!._size[0]);
    });
  }

  draw(canvas: Canvas) {
    const [x, y] = this.map!.toOffset(this._options.x, this._options.y);
    if (this._paragraph) {
      canvas.drawParagraph(
        this._paragraph,
        x - this._paragraph.getMinIntrinsicWidth() / 2,
        y - this._paragraph.getHeight() / 2
      );
    }
  }
}
