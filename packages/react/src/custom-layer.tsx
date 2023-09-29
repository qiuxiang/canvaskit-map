import * as core from "@canvaskit-tilemap/core";
import { useContext, useEffect } from "react";
import { TilemapContext } from "./tilemap";

export interface CustomLayerProps {
  createLayer: () => core.Layer;
}

export function CustomLayer(props: CustomLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  useEffect(() => {
    const layer = props.createLayer();
    tilemap.addLayer(layer);
    return () => {
      tilemap.removeLayer(layer);
    };
  }, []);
  return null;
}
