import {
  CanvaskitMap,
  MarkerLayer,
  TaskQueue,
  TileLayer,
} from "@canvaskit-map/core";
import initCanvaskit from "canvaskit-wasm";
import { toCanvas } from "html-to-image";
import { api } from "./api";

const isSafari = navigator.userAgent.indexOf("iPhone") != -1;

async function main() {
  const canvaskit = await initCanvaskit({
    locateFile() {
      return "https://cdn.staticfile.org/canvaskit-wasm/0.38.2/canvaskit.wasm";
    },
  });
  const map = new CanvaskitMap(canvaskit, {
    element: "#map",
    width: 17408,
    height: 17408,
    origin: [3568 + 5888, 6286 + 2048],
    maxZoom: 1,
  });
  map.addLayer(
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
  const queue = new TaskQueue();
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
      queue.run(async () => {
        const size = { width: 28, height: 28 };
        if (isSafari) {
          // sb safari
          await toCanvas(element, size);
        }
        const image = await toCanvas(element, size);
        map.addLayer(
          new MarkerLayer({ items, image, scale: 1 / devicePixelRatio })
        );
      });
    });
  }
}

main();
