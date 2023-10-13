import { Layer } from "@canvaskit-tilemap/core";
import { api, Marker, MarkerItem } from "@canvaskit-tilemap/example";
import {
  CustomLayer,
  DomLayer,
  ImageLayer,
  MarkerLayer,
  TileLayer,
  Tilemap,
} from "@canvaskit-tilemap/react";
import initCanvaskit, { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { useEffect, useState } from "react";

export function Main() {
  const [canvaskit, setCanvaskit] = useState<CanvasKit>();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarker, setActiveMarker] = useState<MarkerItem>();

  useEffect(() => {
    initCanvaskit({
      locateFile() {
        return "https://cdn.staticfile.org/canvaskit-wasm/0.38.2/canvaskit.wasm";
      },
    }).then((canvaskit) => {
      setCanvaskit(canvaskit);
    });
    api
      .fetchMarkers({
        areaIdList: [6, 17, 2, 3, 12, 13, 14, 19, 21, 22, 23, 28],
        typeIdList: [5],
      })
      .then(setMarkers);
  }, []);

  if (!canvaskit) {
    return null;
  }

  const tileOffset: [number, number] = [-5888, -2048];
  return (
    <Tilemap
      canvaskit={canvaskit}
      className="fixed w-full h-full left-0 top-0"
      mapSize={[17408, 17408]}
      origin={[3568 - tileOffset[0], 6286 - tileOffset[1]]}
      maxZoom={1}
      onClick={({ markerItem }) => {
        if (!markerItem) {
          setActiveMarker(undefined);
        }
      }}
    >
      <TileLayer
        minZoom={10}
        maxZoom={13}
        offset={tileOffset}
        getTileUrl={(x, y, z) => {
          return `https://assets.yuanshen.site/tiles_twt40/${z}/${x}_${y}.png`;
        }}
      />
      {markers.map((i) => {
        return (
          <MarkerLayer
            key={i.icon}
            items={i.items}
            className="p-1"
            onClick={setActiveMarker}
          >
            <div className="w-6 h-6 flex justify-center items-center rounded-full border border-solid border-white bg-gray-700">
              <img
                className="w-11/12 h-11/12 object-cover"
                src={i.icon}
                crossOrigin=""
              />
            </div>
          </MarkerLayer>
        );
      })}
      {activeMarker && (
        <DomLayer
          x={activeMarker.x}
          y={activeMarker.y}
          className="relative top-[calc(-100%-1.5rem)] -left-1/2 w-64 text-sm"
        >
          <div className="bg-orange-50 shadow-lg rounded-lg flex flex-col gap-2 p-3 marker relative">
            <div className="text-gray-900">{activeMarker.title}</div>
            <div className="text-gray-500 text-xs">{activeMarker.content}</div>
            {activeMarker.picture && (
              <img className="w-full rounded" src={activeMarker.picture} />
            )}
          </div>
        </DomLayer>
      )}
      <UndergroundMaps />
    </Tilemap>
  );
}

function UndergroundMaps() {
  const [undergroundMaps, setUndergroundMaps] = useState<any[]>([]);
  useEffect(() => {
    api.fetchUndergroundMaps().then(setUndergroundMaps);
  }, []);
  return (
    <>
      <CustomLayer createLayer={() => new MaskLayer()} />
      {undergroundMaps.flatMap(({ overlays, urlTemplate }) => {
        return overlays.map((i: any) => {
          const { chunks } = i.children[0];
          if (!chunks) return null;
          return (
            <>
              {chunks.map((i: any) => {
                const image = new Image();
                image.src = urlTemplate.replace("{{chunkValue}}", i.value);
                image.crossOrigin = "";
                if (!i.bounds) {
                  return null;
                }
                return <ImageLayer image={image} bounds={i.bounds.flat()} />;
              })}
            </>
          );
        });
      })}
    </>
  );
}

class MaskLayer extends Layer {
  _paint?: Paint;

  constructor() {
    super({ zIndex: 0 });
  }

  async init() {
    this._paint = new this.canvaskit!.Paint();
    this._paint.setColor(this.canvaskit!.Color(0, 0, 0, 0.7));
  }

  draw(canvas: Canvas) {
    canvas.drawRect(this.map!.visibleRect, this._paint!);
  }
}
