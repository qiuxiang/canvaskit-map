import { Layer, LayerOptions, CanvaskitMap } from "@canvaskit-map/core";
import { useContext, useEffect, useState } from "react";
import { MapContext } from "./map";

export function useCanvaskitMap() {
  return useContext(MapContext)!;
}

export function useLayer<P extends LayerOptions, L extends Layer>(
  createLayer: (map: CanvaskitMap) => L,
  props: P
) {
  const map = useCanvaskitMap();
  let [layer, setLayer] = useState<L | null>(null);

  useEffect(() => {
    layer = createLayer(map);
    setLayer(layer);
    map.addLayer(layer);
    return () => {
      if (layer) {
        map.removeLayer(layer);
      }
    };
  }, []);

  useEffect(() => {
    if (layer) {
      layer.options = { ...layer.options, ...props };
      map.draw();
    }
  }, Object.values(props));

  return layer;
}
