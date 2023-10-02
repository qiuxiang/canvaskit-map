import { Layer, LayerOptions } from "@canvaskit-tilemap/core";
import { useContext, useEffect, useState } from "react";
import { TilemapContext } from "./tilemap";

export function useTilemap() {
  return useContext(TilemapContext)!;
}

export function useLayer<P extends LayerOptions, L extends Layer>(
  createLayer: () => L,
  props: P
) {
  const tilemap = useTilemap();
  let [layer, setLayer] = useState<L | null>(null);

  useEffect(() => {
    layer = createLayer();
    setLayer(layer);
    tilemap.addLayer(layer);
    return () => {
      if (layer) {
        tilemap.removeLayer(layer);
      }
    };
  }, []);

  useEffect(() => {
    if (layer) {
      layer.options = { ...layer.options, ...props };
      tilemap.draw();
    }
  }, Object.values(props));

  return layer;
}
