import { Canvas, Image, InputPoint, Paint } from "canvaskit-wasm";
import { Layer, LayerOptions } from "./layer";
import { rectFromLTWH, safeCeil } from "./utils";

export interface TileLayerOptions extends LayerOptions {
  /**
   * 默认 256
   */
  tileSize?: number;

  /**
   * 最小缩放级别，必须是整数
   */
  minZoom: number;

  /**
   * 最大缩放级别，必须是整数
   */
  maxZoom: number;

  /**
   * 以左上角为原点的偏移量
   */
  offset?: InputPoint;

  getTileUrl: (x: number, y: number, z: number) => string;
}

export class TileLayer extends Layer<TileLayerOptions> {
  _images = {} as Record<string, Image>;
  _loading = {} as Record<string, boolean>;
  _paint?: Paint;
  _tasks = new TaskStack();

  constructor(options: TileLayerOptions) {
    super({
      ...options,
      tileSize: options.tileSize ?? 256,
      offset: options.offset ?? [0, 0],
    });
  }

  async init() {
    this._paint = new this.canvaskit!.Paint();
    let { maxZoom, minZoom, tileSize, offset, getTileUrl } = this._options;
    const level = maxZoom - minZoom;
    tileSize = tileSize! * Math.pow(2, level);
    const offsetX = Math.floor(offset![0] / tileSize);
    const offsetY = Math.floor(offset![1] / tileSize);
    const cols = safeCeil(this.map!._mapSize[0] / tileSize);
    const rows = safeCeil(this.map!._mapSize[1] / tileSize);
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        const x = col + offsetX;
        const y = row + offsetY;
        this._fetchImage(getTileUrl(x, y, minZoom), `${x},${y},${minZoom}`);
      }
    }
    const options = this._options;
    this._options = options;
  }

  async _resolveImage(url: string, key: string) {
    this._tasks.run(async () => {
      if (!this._images[key]) {
        try {
          await this._fetchImage(url, key);
        } catch (e) {}
      }
    });
  }

  async _fetchImage(url: string, key: string) {
    if (this._loading[url]) return;

    this._loading[url] = true;
    const response = await fetch(url, {
      headers: { accept: "image/webp" },
      credentials: "omit",
    });
    const bitmap = await createImageBitmap(await response.blob());
    const image = this.canvaskit!.MakeImageFromCanvasImageSource(bitmap)!;
    this._images[key] = image;
    this.map!.draw();
  }

  draw(canvas: Canvas): void {
    if (this.map!._scale == 0) return;

    const { minZoom, maxZoom } = this._options;
    this._drawTiles(canvas, minZoom);
    let zoom = maxZoom + Math.ceil(Math.log2(this.map!._scale));
    zoom = Math.min(Math.max(zoom, minZoom), maxZoom);
    if (zoom > minZoom) {
      this._drawTiles(canvas, zoom);
    }
  }

  _drawTiles(canvas: Canvas, zoom: number) {
    const { _size, _scale, _offset } = this.map!;
    const level = this._options.maxZoom - zoom;
    const tileSize = this._options.tileSize! * 2 ** level;
    const tileOffsetX = this._options.offset![0] / tileSize;
    const tileOffsetY = this._options.offset![1] / tileSize;
    const scaledTileSize = tileSize * _scale;
    const startX = Math.floor(_offset[0] / scaledTileSize + tileOffsetX);
    const startY = Math.floor(_offset[1] / scaledTileSize + tileOffsetY);
    const endX = safeCeil(
      (_size[0] + _offset[0]) / scaledTileSize + tileOffsetX
    );
    const endY = safeCeil(
      (_size[1] + _offset[1]) / scaledTileSize + tileOffsetY
    );
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const url = this._options.getTileUrl(x, y, zoom);
        const key = `${x},${y},${zoom}`;
        const image = this._images[key];
        if (image) {
          const src = rectFromLTWH(0, 0, image.width(), image.height());
          const dst = rectFromLTWH(
            scaledTileSize * (x - tileOffsetX),
            scaledTileSize * (y - tileOffsetY),
            scaledTileSize,
            scaledTileSize
          );
          canvas.drawImageRect(image, src, dst, this._paint!);
        } else if (this._initialized) {
          this._resolveImage(url, key);
        }
      }
    }
  }
}

type Task = () => Promise<void>;

/**
 * 任务串行化，但是后进的任务先运行
 */
class TaskStack {
  _length = 16;
  _queue = [] as Task[];
  _running = false;
  _count = 0;

  async run(task: Task) {
    this._push(task);
    if (!this._running) {
      this._running = true;
      while (this._queue.length > 0) {
        const task = this._queue.pop();
        if (task) {
          await task();
        } else {
          this._queue = [];
        }
      }
      this._running = false;
    }
  }

  _push(task: Task) {
    this._queue[this._count % this._length] = task;
    this._count += 1;
  }

  _pop(): Task | undefined {
    const index = this._count % this._length;
    const task = this._queue[index];
    delete this._queue[index];
    this._count -= 1;
    return task;
  }
}
