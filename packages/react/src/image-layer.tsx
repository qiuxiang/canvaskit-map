import * as core from "@canvaskit-tilemap/core";
import { useContext, useEffect } from "react";
import { TilemapContext } from "./tilemap";

export interface ImageLayerProps extends core.ImageLayerOptions {}

export function ImageLayer(props: ImageLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  useEffect(() => {
    const layer = new core.ImageLayer(props);
    tilemap.addLayer(layer);
    return () => {
      tilemap.removeLayer(layer);
    };
  }, []);
  return null;
}
