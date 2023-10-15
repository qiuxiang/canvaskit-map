import * as core from "@canvaskit-tilemap/core";
import { Image } from "canvaskit-wasm";
import { toCanvas } from "html-to-image";
import { ReactNode, useRef } from "react";
import { useLayer } from "./hooks";

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;
const _cache = {} as Record<string, Image>;
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
  useLayer((tilemap) => {
    const layer = new core.MarkerLayer<T>(options);
    _queue.run(async () => {
      function setImage(image: Image) {
        layer.image = image;
        if (cacheKey) {
          _cache[cacheKey] = image;
        }
      }
      const cachedImage = _cache[cacheKey];
      if (cachedImage) {
        setImage(cachedImage);
      } else {
        if (isSafari) {
          // sb safari
          await toCanvas(element.current!);
        }
        const canvas = await toCanvas(element.current!);
        setImage(tilemap.canvaskit.MakeImageFromCanvasImageSource(canvas));
      }
    });
    return layer;
  }, options);

  return (
    <div style={{ position: "absolute", zIndex: -1, left: "-100%" }}>
      <div ref={element} className={className}>
        {children}
      </div>
    </div>
  );
}
