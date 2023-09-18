<script setup lang="ts">
import { Tilemap, TileLayer, initCanvaskit } from "@canvaskit-tilemap/vue";
// @ts-ignore
import wasmUrl from "canvaskit-wasm/bin/canvaskit.wasm?url";
import { ref } from "vue";

const tileOffset: [number, number] = [-5888, -2048];
const loading = ref(true);
initCanvaskit({ locateFile: () => wasmUrl }).then(() => {
  loading.value = false;
});

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
  </Tilemap>
</template>
