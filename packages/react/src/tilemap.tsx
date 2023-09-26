import * as core from "@canvaskit-tilemap/core";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";

export interface TilemapProps extends Omit<core.TilemapOptions, "element"> {
  children?: ReactNode;
  className?: string;
}

export const TilemapContext = createContext<core.Tilemap | null>(null);

export function Tilemap({ className, ...props }: TilemapProps) {
  const element = useRef<HTMLDivElement>(null);
  const [tilemap, setTilemap] = useState<core.Tilemap>();
  useEffect(() => {
    setTilemap(new core.Tilemap({ element: element.current!, ...props }));
  }, []);
  return (
    <div ref={element} className={className}>
      {tilemap && (
        <TilemapContext.Provider value={tilemap}>
          {props.children}
        </TilemapContext.Provider>
      )}
    </div>
  );
}
