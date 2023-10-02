import { Layer, LayerOptions } from "@canvaskit-tilemap/core";
import { useContext, useEffect, useState } from "react";
import { TilemapContext } from "./tilemap";

export function useTilemap() {
  return useContext(TilemapContext)!;
}

interface LayerProps extends LayerOptions {
  hidden?: boolean;
}

export function useLayer<O extends LayerProps, L extends Layer>(
  createLayer: () => L,
  options: O
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
      layer.options = { ...layer.options, ...options };
      tilemap.draw();
    }
  }, Object.values(options));

  return layer;
}
