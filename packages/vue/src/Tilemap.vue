<script lang="ts" setup>
import * as core from "@canvaskit-tilemap/core";
import { defineProps, provide, ref, watchEffect } from "vue";

export interface TilemapProps {
  mapSize: [number, number];
  origin: [number, number];
  maxZoom?: number;
}

const props = defineProps<TilemapProps>();
const element = ref<HTMLDivElement>();
const tilemap = ref<core.Tilemap>();

watchEffect(() => {
  if (element.value && !tilemap.value) {
    tilemap.value = new core.Tilemap({ ...props, element: element.value });
  }
});

provide("tilemap", tilemap);
</script>

<template>
  <div ref="element"><slot></slot></div>
</template>
