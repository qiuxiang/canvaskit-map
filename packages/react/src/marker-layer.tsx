import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { TilemapContext } from "./tilemap";

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;
const _cache = {} as Record<string, HTMLCanvasElement>;

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

    const cachedImage = _cache[cacheKey];
    if (cachedImage) {
      createLayer(cachedImage);
    } else {
      toCanvas(element.current!, { pixelRatio }).then(createLayer);
    }

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
