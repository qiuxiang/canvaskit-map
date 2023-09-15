import {
  initCanvaskit,
  TileLayer,
  Tilemap,
  MarkerLayer,
} from "@canvaskit-tilemap/core";
import { toCanvas, toSvg } from "html-to-image";
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

  const { record } = await api("icon/get/list", { size: 1e3 });
  const icons: Record<string, any> = {};
  for (const i of record) {
    icons[i.name] = i;
  }

  const itemList = await api("item/get/list", {
    areaIdList: [6, 17, 2, 3, 12, 13, 14, 19, 21, 22, 23, 28],
    typeIdList: [6],
    size: 1e3,
  });
  const allMarkerList = await api("marker/get/list_byinfo", {
    itemIdList: itemList.record.map((i: any) => i.id),
  });
  const markerListMap: Record<string, any> = {};
  for (const marker of allMarkerList) {
    const markerList = markerListMap[marker.markerTitle];
    if (markerList) {
      markerList.push(marker);
    } else {
      markerListMap[marker.markerTitle] = [marker];
    }
  }
  const $markers = document.querySelector("#markers")!;
  let count = 0;
  for (const name in markerListMap) {
    const icon = icons[name]?.url;
    if (!icon) continue;

    const markerList = markerListMap[name];
    count += markerList.length;
    const div = document.createElement("div");
    div.innerHTML = `
      <div class="marker">
        <img src="${icon}" crossOrigin>
      </div>
    `;
    $markers.append(div);
    const image = div.querySelector("img")!;
    image.addEventListener("load", async () => {
      const canvas = await toCanvas(div, {
        width: 26,
        height: 26,
      });
      tilemap.addLayer(
        new MarkerLayer({
          items: markerList.map((i: any) => {
            const position = i.position
              .split(",")
              .map((i: string) => parseFloat(i));
            return {
              x: position[0],
              y: position[1],
            };
          }),
          image: canvas,
          scale: 1 / devicePixelRatio,
        })
      );
    });
  }
  alert(`${count} 个点`);
}

main();
