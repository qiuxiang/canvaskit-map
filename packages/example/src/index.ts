import { Tilemap, initCanvaskit } from "@canvaskit-tilemap/core";
import { TileLayer } from "@canvaskit-tilemap/core/src/tile-layer";

async function main() {
  await initCanvaskit();
  const tilemap = new Tilemap({
    element: "#tilemap",
    mapSize: [17408, 16384],
    origin: [3568, 6286],
  });
  tilemap.addLayer(
    new TileLayer({
      minZoom: 10,
      maxZoom: 13,
      offset: [-6144, 0],
      getTileUrl(x, y, z) {
        return `https://assets.yuanshen.site/tiles_twt36/${z}/${x}_${y}.png`;
      },
    })
  );
}

main();
