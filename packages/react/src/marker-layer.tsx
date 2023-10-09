import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { ReactNode, useRef } from "react";
import { useLayer } from "./hooks";

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;
const _cache = {} as Record<string, HTMLCanvasElement>;
const _queue = new core.TaskQueue();

export interface MarkerLayerProps<T extends core.MarkerItem>
  extends Omit<core.MarkerLayerOptions<T>, "image"> {
  children?: ReactNode;
  className?: string;
  cacheKey?: string;
}

export function MarkerLayer<T extends core.MarkerItem>({
  children,
  className,
  scale,
  cacheKey = "",
  ...options
}: MarkerLayerProps<T>) {
  const element = useRef<HTMLDivElement>(null);
  useLayer(() => {
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
    const layer = new core.MarkerLayer<T>({ scale, ...options });
    _queue.run(async () => {
      function createLayer(image: HTMLCanvasElement) {
        layer.image = image;
        if (cacheKey) {
          _cache[cacheKey] = image;
        }
      }
      const cachedImage = _cache[cacheKey];
      if (cachedImage) {
        createLayer(cachedImage);
      } else {
        // SB safari
        if (isSafari) {
          await toCanvas(element.current!, { pixelRatio });
        }
        createLayer(await toCanvas(element.current!, { pixelRatio }));
      }
    });
    return layer;
  }, options);

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
