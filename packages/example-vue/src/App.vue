<script setup lang="ts">
import { shallowRef } from "vue";
import { CanvaskitMap, TileLayer, MarkerLayer } from "@canvaskit-map/vue";
import initCanvaskit, { CanvasKit } from "canvaskit-wasm";
import { api, Marker } from "@canvaskit-map/example";

const tileOffset: [number, number] = [-5888, -2048];
const canvaskit = shallowRef<CanvasKit>();
initCanvaskit({
  locateFile() {
    return "https://cdn.staticfile.org/canvaskit-wasm/0.38.2/canvaskit.wasm";
  },
}).then((value) => {
  canvaskit.value = value;
});

const markers = shallowRef<Marker[]>([]);

api
  .fetchMarkers({
    areaIdList: [6, 17, 2, 3, 12, 13, 14, 19, 21, 22, 23, 28],
    typeIdList: [5],
  })
  .then((value) => (markers.value = value));

function getTileUrl(x: number, y: number, z: number) {
  return `https://assets.yuanshen.site/tiles_twt40/${z}/${x}_${y}.png`;
}
</script>
<template>
  <CanvaskitMap
    class="absolute w-full h-full left-0 top-0"
    v-if="canvaskit"
    :canvaskit="canvaskit"
    :width="17408"
    :height="17408"
    :origin="[3568 - tileOffset[0], 6286 - tileOffset[1]]"
    :max-zoom="1"
  >
    <TileLayer
      :min-zoom="10"
      :max-zoom="13"
      :offset="tileOffset"
      :get-tile-url="getTileUrl"
    />
    <MarkerLayer class="p-1" :items="i.items" v-for="i in markers">
      <div
        class="w-6 h-6 flex justify-center items-center rounded-full border border-solid border-white bg-gray-700"
      >
        <img
          class="w-11/12 h-11/12 object-cover"
          cross-origin=""
          :src="i.icon"
        />
      </div>
    </MarkerLayer>
  </CanvaskitMap>
</template>
