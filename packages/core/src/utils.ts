import { InputPoint, InputRect, Rect } from "canvaskit-wasm";

export function safeCeil(n: number) {
  return Math.ceil(parseFloat(n.toFixed(3)));
}

export function rectFromLTWH(
  x: number,
  y: number,
  width: number,
  height: number
): Rect {
  const rect = new Float32Array(4);
  rect[0] = x;
  rect[1] = y;
  rect[2] = x + width;
  rect[3] = y + height;
  return rect;
}

export function makeRSXform(
  rotation: number,
  scale: number,
  anchor: InputPoint,
  translate: InputPoint
) {
  const scos = Math.cos(rotation) * scale;
  const ssin = Math.sin(rotation) * scale;
  return [
    scos,
    ssin,
    translate[0] + -scos * anchor[0] + ssin * anchor[1],
    translate[1] + -ssin * anchor[0] + scos * anchor[1],
  ];
}

export function overlays(rect: Rect, other: Rect) {
  if (rect[2] <= other[0] || other[2] <= rect[0]) {
    return false;
  }
  if (rect[3] <= other[1] || other[3] <= rect[1]) {
    return false;
  }
  return true;
}

export function alongSize(
  align: InputPoint,
  size: InputPoint
): [number, number] {
  const centerX = size[0] / 2;
  const centerY = size[1] / 2;
  return [centerX + align[0] * centerX, centerY + align[1] * centerY];
}

export type Task = () => Promise<void>;

export class TaskQueue {
  /** @internal */
  _queue = [] as Task[];
  /** @internal */
  _running = false;

  async run(task: Task) {
    this._queue.push(task);
    if (!this._running) {
      this._running = true;
      while (this._queue.length > 0) {
        const task = this._queue.shift()!;
        try {
          await task();
        } catch (_) {}
      }
      this._running = false;
    }
  }
}
