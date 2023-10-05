<script setup lang="ts">
import { ref } from "vue";
import {
  Tilemap,
  TileLayer,
  MarkerLayer,
  initCanvaskit,
} from "@canvaskit-tilemap/vue";
import { api, Marker } from "@canvaskit-tilemap/example";
// @ts-ignore
import wasmUrl from "canvaskit-wasm/bin/canvaskit.wasm?url";

const tileOffset: [number, number] = [-5888, -2048];
const loading = ref(true);
initCanvaskit({ locateFile: () => wasmUrl }).then(() => {
  loading.value = false;
});

const markers = ref<Marker[]>([]);

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
  <Tilemap
    class="absolute w-full h-full left-0 top-0"
    v-if="!loading"
    :map-size="[17408, 17408]"
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
        class="w-6 h-6 shadow shadow-black flex justify-center items-center rounded-full border border-solid border-white bg-gray-700"
      >
        <img
          class="w-11/12 h-11/12 object-cover"
          cross-origin=""
          :src="i.icon"
        />
      </div>
    </MarkerLayer>
  </Tilemap>
</template>
