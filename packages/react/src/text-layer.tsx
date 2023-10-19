import * as core from "@canvaskit-map/core";
import { useLayer } from "./hooks";

export interface TextLayerProps extends core.TextLayerOptions {}

export function TextLayer(props: TextLayerProps) {
  useLayer(() => new core.TextLayer(props), props);
  return null;
}
