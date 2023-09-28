import * as core from "@canvaskit-tilemap/core";
import { DomLayerOptions } from "@canvaskit-tilemap/core";
import { ReactNode, useContext, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { TilemapContext } from "./tilemap";

export interface DomLayerProps extends Omit<DomLayerOptions, "element"> {
  children: ReactNode;
}

export function DomLayer(props: DomLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  useEffect(() => {
    const element = document.createElement("div");
    createRoot(element).render(<>{props.children}</>);
    const layer = new core.DomLayer({ ...props, element });
    tilemap.addLayer(layer);
    return () => {
      tilemap.removeLayer(layer);
    };
  }, []);
  return null;
}
