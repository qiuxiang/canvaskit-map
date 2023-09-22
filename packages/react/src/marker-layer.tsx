import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { ReactNode, useContext, useEffect, useRef } from "react";
import { TilemapContext } from "./tilemap";

export interface MarkerLayerProps
  extends Omit<core.MarkerLayerOptions, "image"> {
  children?: ReactNode;
  className?: string;
}

export function MarkerLayer({
  children,
  className,
  ...props
}: MarkerLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let layer: core.Layer | null = null;
    toCanvas(element.current!).then(() => {
      toCanvas(element.current!).then((image) => {
        layer = new core.MarkerLayer({ image, ...props });
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
    <div style={{ position: "absolute", zIndex: -1, left: "-100%" }}>
      <div ref={element} className={className}>
        {children}
      </div>
    </div>
  );
}
