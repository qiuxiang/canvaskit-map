<script lang="ts" setup>
import * as core from "@canvaskit-tilemap/core";
import { MarkerItem } from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import {
  defineProps,
  defineOptions,
  inject,
  onUnmounted,
  ref,
  Ref,
  watchEffect,
} from "vue";

export interface MarkerLayerProps {
  items: MarkerItem[];
  scale?: number;
}

defineOptions({ inheritAttrs: false });

const props = defineProps<MarkerLayerProps>();
const tilemap = inject("tilemap") as Ref<core.Tilemap>;
const element = ref<HTMLDivElement>();
const layer = ref<core.MarkerLayer>();

watchEffect(() => {
  if (tilemap?.value && !layer.value && element.value) {
    toCanvas(element.value).then((image) => {
      layer.value = new core.MarkerLayer({
        ...props,
        image,
        items: props.items.slice(),
      });
      tilemap.value.addLayer(layer.value);
    });
  }
});

onUnmounted(() => {
  if (layer.value) {
    tilemap.value.removeLayer(layer.value);
  }
});
</script>

<template>
  <div style="position: absolute; zindex: -1; left: -100%">
    <div ref="element" :class="$attrs.class">
      <slot></slot>
    </div>
  </div>
</template>
