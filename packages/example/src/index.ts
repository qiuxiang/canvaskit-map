import {
  initCanvaskit,
  MarkerLayer,
  TileLayer,
  Tilemap,
} from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import { api } from "./api";

async function main() {
  await initCanvaskit();
  const tilemap = new Tilemap({
    element: "#tilemap",
    mapSize: [17408, 17408],
    origin: [3568 + 5888, 6286 + 2048],
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

  const markers = await api.fetchMarkers({
    areaIdList: [6, 17, 2, 3, 12, 13, 14, 19, 21, 22, 23, 28],
    typeIdList: [5],
  });
  const $markers = document.querySelector("#markers")!;
  for (const { icon, items } of markers) {
    const element = document.createElement("div");
    element.innerHTML = `
      <div class="marker">
        <img src="${icon}" cross-origin="">
      </div>
    `;
    $markers.append(element);
    const image = element.querySelector("img")!;
    image.addEventListener("load", async () => {
      const size = { width: 26, height: 26 };
      const image = await toCanvas(element, size);
      tilemap.addLayer(
        new MarkerLayer({ items, image, scale: 1 / devicePixelRatio })
      );
    });
  }
}

main();
