import * as core from "@canvaskit-tilemap/core";
import { useContext, useEffect } from "react";
import { TilemapContext } from "./tilemap";

export interface TileLayerProps extends core.TileLayerOptions {}

export function TileLayer(props: TileLayerProps) {
  const tilemap = useContext(TilemapContext)!;
  useEffect(() => {
    const layer = new core.TileLayer(props);
    tilemap.addLayer(layer);
    return () => {
      tilemap.removeLayer(layer);
    };
  }, []);
  return <></>;
}
