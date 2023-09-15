import { initCanvaskit, TileLayer, Tilemap } from "@canvaskit-tilemap/core";

async function main() {
  await initCanvaskit();
  const tilemap = new Tilemap({
    element: "#tilemap",
    mapSize: [17408, 17408],
    origin: [3568, 6286],
    maxZoom: 1,
  });
  tilemap.addLayer(
    new TileLayer({
      minZoom: 10,
      maxZoom: 13,
      offset: [-5888, -2048],
      getTileUrl(x, y, z) {
        return `https://assets.yuanshen.site/tiles_twt40/${z}/${x}_${y}.png`;
      },
    })
  );
}

main();
