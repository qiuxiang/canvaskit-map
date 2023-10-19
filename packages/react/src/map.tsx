import * as core from "@canvaskit-map/core";
import { CanvasKit } from "canvaskit-wasm";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";

export interface CanvaskitMapProps extends Omit<core.MapOptions, "element"> {
  canvaskit: CanvasKit;
  children?: ReactNode;
  className?: string;
}

export const MapContext = createContext<core.CanvaskitMap | null>(null);

export function CanvaskitMap({
  className,
  canvaskit,
  ...props
}: CanvaskitMapProps) {
  const element = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<core.CanvaskitMap>();
  useEffect(() => {
    setMap(
      new core.CanvaskitMap(canvaskit, { element: element.current!, ...props })
    );
  }, []);
  return (
    <div ref={element} className={className}>
      {map && (
        <MapContext.Provider value={map}>{props.children}</MapContext.Provider>
      )}
    </div>
  );
}
