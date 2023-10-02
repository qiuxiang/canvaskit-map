import * as core from "@canvaskit-tilemap/core";
import { useLayer } from "./hooks";

export interface TileLayerProps extends core.TileLayerOptions {}

export function TileLayer(props: TileLayerProps) {
  useLayer(() => new core.TileLayer(props), props);
  return null;
}
