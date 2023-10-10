import { canvaskit, Layer } from "@canvaskit-tilemap/core";
import { api, Marker, MarkerItem } from "@canvaskit-tilemap/example";
import {
  CustomLayer,
  DomLayer,
  ImageLayer,
  initCanvaskit,
  MarkerLayer,
  TileLayer,
  Tilemap,
} from "@canvaskit-tilemap/react";
import { Canvas } from "canvaskit-wasm";
import { useEffect, useState } from "react";

export function Main() {
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [activeMarker, setActiveMarker] = useState<MarkerItem>();

  useEffect(() => {
    initCanvaskit().then(() => setLoading(false));
    api
      .fetchMarkers({
        areaIdList: [6, 17, 2, 3, 12, 13, 14, 19, 21, 22, 23, 28],
        typeIdList: [5],
      })
      .then(setMarkers);
  }, []);

  if (loading) {
    return null;
  }

  const tileOffset: [number, number] = [-5888, -2048];
  return (
    <Tilemap
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
            <div className="w-6 h-6 drop-shadow-sm flex justify-center items-center rounded-full border border-solid border-white bg-gray-700">
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
      {/*
      <UndergroundMaps />
      */}
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
  _paint = new canvaskit.Paint();

  constructor() {
    super({ zIndex: 0 });
    this._paint.setColor(canvaskit.Color(0, 0, 0, 0.7));
  }

  draw(canvas: Canvas) {
    canvas.drawRect(this.tilemap.visibleRect, this._paint);
  }
}
