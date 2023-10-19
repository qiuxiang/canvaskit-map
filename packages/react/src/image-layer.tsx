import * as core from "@canvaskit-map/core";
import { useLayer } from "./hooks";

export interface ImageLayerProps extends core.ImageLayerOptions {}

export function ImageLayer(props: ImageLayerProps) {
  useLayer(() => new core.ImageLayer(props), props);
  return null;
}
