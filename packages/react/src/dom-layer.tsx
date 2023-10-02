import * as core from "@canvaskit-tilemap/core";
import { DomLayerOptions } from "@canvaskit-tilemap/core";
import { ReactNode, useRef } from "react";
import { useLayer } from "./hooks";

export interface DomLayerProps extends Omit<DomLayerOptions, "element"> {
  children: ReactNode;
  className?: string;
}

export function DomLayer({ className, children, ...options }: DomLayerProps) {
  const element = useRef<HTMLDivElement>(null);
  useLayer(
    () => new core.DomLayer({ ...options, element: element.current! }),
    options
  );
  return (
    <div ref={element} className={className}>
      {children}
    </div>
  );
}
