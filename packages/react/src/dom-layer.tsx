import * as core from "@canvaskit-tilemap/core";
import { DomLayerOptions } from "@canvaskit-tilemap/core";
import { ReactNode, useContext, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { TilemapContext } from "./tilemap";

export interface DomLayerProps extends Omit<DomLayerOptions, "element"> {
  children: ReactNode;
  className?: string;
}

export function DomLayer({ className, children, ...options }: DomLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  const element = useRef<HTMLDivElement>(null);
  const [layer, setLayer] = useState<core.DomLayer | null>(null);
  useEffect(() => {
    const layer = new core.DomLayer({ ...options, element: element.current! });
    tilemap.addLayer(layer);
    setLayer(layer);
    return () => {
      if (layer) {
        tilemap.removeLayer(layer);
      }
    };
  }, []);
  useEffect(() => {
    if (layer) {
      layer.options = { ...layer.options, ...options };
      tilemap.draw();
    }
  }, [options.x]);
  return (
    <div ref={element} className={className}>
      {children}
    </div>
  );
}
