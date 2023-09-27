import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { TilemapContext } from "./tilemap";

type Task = () => Promise<void>;

class TaskQueue {
  _queue = [] as Task[];
  _running = false;

  async run(task: Task) {
    this._queue.push(task);
    if (!this._running) {
      this._running = true;
      while (this._queue.length > 0) {
        const task = this._queue.shift()!;
        await task();
      }
      this._running = false;
    }
  }
}

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;
const _cache = {} as Record<string, HTMLCanvasElement>;
const _queue = new TaskQueue();

export interface MarkerLayerProps
  extends Omit<core.MarkerLayerOptions, "image"> {
  children?: ReactNode;
  className?: string;
  cacheKey?: string;
  hidden?: boolean;
}

export function MarkerLayer({
  children,
  className,
  scale,
  cacheKey = "",
  hidden = false,
  ...props
}: MarkerLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  const element = useRef<HTMLDivElement>(null);
  let [layer, setLayer] = useState<core.MarkerLayer | null>(null);

  useEffect(() => {
    let pixelRatio = devicePixelRatio;
    if (!scale) {
      if (isSafari) {
        pixelRatio = 1;
        scale = 1 / devicePixelRatio;
      } else {
        // 1:1 渲染不够锐，1.5 倍渲染比较合适
        pixelRatio *= 1.5;
        scale = 1 / pixelRatio;
      }
    }

    _queue.run(async () => {
      const cachedImage = _cache[cacheKey];
      if (cachedImage) {
        createLayer(cachedImage);
      } else {
        createLayer(await toCanvas(element.current!, { pixelRatio }));
      }
    });

    function createLayer(image: HTMLCanvasElement) {
      layer = new core.MarkerLayer({ image, scale, ...props });
      setLayer(layer);
      tilemap.addLayer(layer);
      if (hidden) {
        tilemap.hideLayer(layer);
      } else {
        tilemap.showLayer(layer);
      }
      if (cacheKey) {
        _cache[cacheKey] = image;
      }
    }

    return () => {
      if (layer) {
        tilemap.removeLayer(layer);
      }
    };
  }, []);

  useEffect(() => {
    if (!layer) return;
    if (hidden) {
      tilemap.hideLayer(layer);
    } else {
      tilemap.showLayer(layer);
    }
  }, [hidden]);

  return (
    <div
      style={{
        position: "absolute",
        zIndex: -1,
        left: "-100%",
        zoom: isSafari ? 1 / devicePixelRatio : undefined,
      }}
    >
      <div ref={element} className={className}>
        {children}
      </div>
    </div>
  );
}
