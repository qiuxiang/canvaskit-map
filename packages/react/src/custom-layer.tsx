import { Layer } from "@canvaskit-tilemap/core";
import { useLayer } from "./hooks";

export interface CustomLayerProps<L extends Layer> {
  createLayer: () => L;
}

export function CustomLayer<L extends Layer>(props: CustomLayerProps<L>) {
  useLayer(props.createLayer, {});
  return null;
}
