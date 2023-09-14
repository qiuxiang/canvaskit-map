import { Canvas, Image } from "canvaskit-wasm";
import { canvaskit } from ".";
import { Layer, LayerOptions } from "./layer";
import { makeRect, safeCeil } from "./utils";

interface TileLayerOptions extends LayerOptions {
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
  options: TileLayerOptions;
  images = {} as Record<string, Image>;
  paint = new canvaskit.Paint();
  taskStack = new TaskStack();

  constructor(options: TileLayerOptions) {
    super(options.zIndex ?? 0);
    this.options = {
      ...options,
      tileSize: options.tileSize ?? 256,
      offset: options.offset ?? [0, 0],
    };
  }

  async resolveImage(url: string) {
    this.taskStack.run(async () => {
      if (!this.images[url]) {
        const response = await fetch(url);
        const bytes = await response.arrayBuffer();
        const image = canvaskit.MakeImageFromEncoded(bytes)!;
        this.images[url] = image;
        this.tilemap.draw();
      }
    });
  }

  draw(canvas: Canvas): void {
    if (this.tilemap.scale == 0) return;

    const { minZoom, maxZoom } = this.options;
    this.drawTiles(canvas, minZoom);
    let zoom = maxZoom + Math.floor(Math.log2(this.tilemap.scale));
    zoom = Math.min(Math.max(zoom, minZoom), maxZoom);
    if (zoom > minZoom) {
      this.drawTiles(canvas, zoom);
    }
  }

  drawTiles(canvas: Canvas, zoom: number) {
    const { size, scale, offset } = this.tilemap;
    const level = this.options.maxZoom - zoom;
    const tileSize = this.options.tileSize! * Math.pow(2, level);
    const tileOffset = [
      this.options.offset![0] / tileSize,
      this.options.offset![1] / tileSize,
    ];
    const scaledTileSize = tileSize * scale;
    console.log(tileSize, scaledTileSize);
    const start = [
      Math.floor(offset[0] / scaledTileSize + tileOffset[0]),
      Math.floor(offset[1] / scaledTileSize + tileOffset[1]),
    ];
    const end = [
      safeCeil((size[0] + offset[0]) / scaledTileSize + tileOffset[0]),
      safeCeil((size[1] + offset[1]) / scaledTileSize + tileOffset[1]),
    ];
    for (let y = start[1]; y < end[1]; y += 1) {
      for (let x = start[0]; x < end[0]; x += 1) {
        const url = this.options.getTileUrl(x, y, zoom);
        const image = this.images[url];
        if (image) {
          const src = makeRect(0, 0, image.width(), image.height());
          const dst = makeRect(
            scaledTileSize * (x - tileOffset[0]),
            scaledTileSize * (y - tileOffset[1]),
            scaledTileSize,
            scaledTileSize
          );
          canvas.drawImageRect(image, src, dst, this.paint);
        } else {
          this.resolveImage(url);
        }
      }
    }
  }
}

class TaskStack {
  stack = [] as (() => Promise<void>)[];
  running = false;

  async run(task: () => Promise<void>) {
    this.stack.push(task);
    if (!this.running) {
      this.running = true;
      while (this.stack.length > 0) {
        await this.stack.pop()?.();
      }
      this.running = false;
    }
  }
}
