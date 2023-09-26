import { Canvas, Image } from "canvaskit-wasm";
import { canvaskit } from ".";
import { Layer, LayerOptions } from "./layer";
import { makeRect, safeCeil } from "./utils";

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
  offset?: [number, number];

  getTileUrl: (x: number, y: number, z: number) => string;
}

export class TileLayer extends Layer {
  /** @internal */
  _options: TileLayerOptions;
  /** @internal */
  _images = {} as Record<string, Image>;
  /** @internal */
  _paint = new canvaskit.Paint();
  /** @internal */
  _taskQueue = new TaskQueue();

  constructor(options: TileLayerOptions) {
    super(options.zIndex ?? 0);
    this._options = {
      ...options,
      tileSize: options.tileSize ?? 256,
      offset: options.offset ?? [0, 0],
    };
  }

  async init() {
    let { maxZoom, minZoom, tileSize, offset, getTileUrl } = this._options;
    const level = maxZoom - minZoom;
    tileSize = tileSize! * Math.pow(2, level);
    const offsetX = Math.floor(offset![0] / tileSize);
    const offsetY = Math.floor(offset![1] / tileSize);
    const cols = safeCeil(this.tilemap._options.mapSize[0] / tileSize);
    const rows = safeCeil(this.tilemap._options.mapSize[1] / tileSize);
    const promises = [] as Promise<void>[];
    console.log(rows, cols);
    for (var row = 0; row < rows; row += 1) {
      for (var col = 0; col < cols; col += 1) {
        const x = col + offsetX;
        const y = row + offsetY;
        console.log(`${x},${y},${minZoom}`);
        promises.push(
          this._fetchImage(getTileUrl(x, y, minZoom), `${x},${y},${minZoom}`)
        );
      }
    }
    await Promise.all(promises);
    super.init();
  }

  /** @internal */
  async _resolveImage(url: string, key: string) {
    this._taskQueue.run(async () => {
      if (!this._images[key]) {
        try {
          await this._fetchImage(url, key);
        } catch (e) {}
      }
    });
  }

  async _fetchImage(url: string, key: string) {
    const response = await fetch(url, {
      headers: { accept: "image/webp" },
      credentials: "omit",
    });
    const bitmap = await createImageBitmap(await response.blob());
    const image = canvaskit.MakeImageFromCanvasImageSource(bitmap)!;
    this._images[key] = image;
    this.tilemap.draw();
  }

  draw(canvas: Canvas): void {
    if (this.tilemap._scale == 0) return;

    const { minZoom, maxZoom } = this._options;
    this._drawTiles(canvas, minZoom);
    let zoom = maxZoom + Math.ceil(Math.log2(this.tilemap._scale));
    zoom = Math.min(Math.max(zoom, minZoom), maxZoom);
    if (zoom > minZoom) {
      this._drawTiles(canvas, zoom);
    }
  }

  /** @internal */
  _drawTiles(canvas: Canvas, zoom: number) {
    const { _size, _scale, _offset } = this.tilemap;
    const level = this._options.maxZoom - zoom;
    const tileSize = this._options.tileSize! * 2 ** level;
    const tileOffset = [
      this._options.offset![0] / tileSize,
      this._options.offset![1] / tileSize,
    ];
    const scaledTileSize = tileSize * _scale;
    const start = [
      Math.floor(_offset[0] / scaledTileSize + tileOffset[0]),
      Math.floor(_offset[1] / scaledTileSize + tileOffset[1]),
    ];
    const end = [
      safeCeil((_size[0] + _offset[0]) / scaledTileSize + tileOffset[0]),
      safeCeil((_size[1] + _offset[1]) / scaledTileSize + tileOffset[1]),
    ];
    for (let y = start[1]; y < end[1]; y += 1) {
      for (let x = start[0]; x < end[0]; x += 1) {
        const url = this._options.getTileUrl(x, y, zoom);
        const key = `${x},${y},${zoom}`;
        const image = this._images[key];
        if (image) {
          const src = makeRect(0, 0, image.width(), image.height());
          const dst = makeRect(
            scaledTileSize * (x - tileOffset[0]),
            scaledTileSize * (y - tileOffset[1]),
            scaledTileSize,
            scaledTileSize
          );
          canvas.drawImageRect(image, src, dst, this._paint);
        } else if (this.initialized) {
          this._resolveImage(url, key);
        }
      }
    }
  }
}

type Task = () => Promise<void>;

class TaskQueue {
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
