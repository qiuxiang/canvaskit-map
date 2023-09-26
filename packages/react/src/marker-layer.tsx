import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { TilemapContext } from "./tilemap";

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;

export interface MarkerLayerProps
  extends Omit<core.MarkerLayerOptions, "image"> {
  children?: ReactNode;
  className?: string;
}

export function MarkerLayer({
  children,
  className,
  scale,
  ...props
}: MarkerLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let layer: core.MarkerLayer | null = null;
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
    // safari 一次可能获取不到图片
    toCanvas(element.current!).then(() => {
      toCanvas(element.current!, { pixelRatio }).then((image) => {
        layer = new core.MarkerLayer({ image, scale, ...props });
        tilemap.addLayer(layer);
      });
    });
    return () => {
      if (layer) {
        tilemap.removeLayer(layer);
      }
    };
  }, []);
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
