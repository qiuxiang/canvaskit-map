import * as core from "@canvaskit-tilemap/core";
import { defineComponent, provide, ref, watchEffect } from "vue";

interface TilemapProps extends Omit<core.TilemapOptions, "element"> {}

export const Tilemap = defineComponent((props: TilemapProps, { slots }) => {
  const element = ref<HTMLDivElement>();
  const tilemap = ref<core.Tilemap>();
  watchEffect(() => {
    if (element.value && !tilemap.value) {
      tilemap.value = new core.Tilemap({ ...props, element: element.value });
    }
  });
  provide("tilemap", tilemap);
  return () => <div ref={element}>{slots.default?.()}</div>;
});
