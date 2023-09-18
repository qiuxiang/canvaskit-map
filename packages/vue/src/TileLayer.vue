<script lang="ts" setup>
import * as core from "@canvaskit-tilemap/core";
import { defineProps, inject, onUnmounted, ref, Ref, watchEffect } from "vue";

export interface TileLayerProps {
  tileSize?: number;
  minZoom: number;
  maxZoom: number;
  offset?: [number, number];
  getTileUrl: (x: number, y: number, z: number) => string;
}

const props = defineProps<TileLayerProps>();
const tilemap = inject("tilemap") as Ref<core.Tilemap>;
const layer = ref<core.Layer>();

watchEffect(() => {
  if (tilemap?.value && !layer.value) {
    layer.value = new core.TileLayer(props);
    tilemap.value.addLayer(layer.value);
  }
});

onUnmounted(() => {
  if (layer.value) {
    tilemap.value.removeLayer(layer.value);
  }
});
</script>

<template></template>
