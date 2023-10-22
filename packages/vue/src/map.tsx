import * as core from "@canvaskit-map/core";
import { CanvasKit } from "canvaskit-wasm";
import { defineComponent, provide, ref, watchEffect } from "vue";

interface CanvaskitMapProps extends Omit<core.MapOptions, "element"> {
  canvaskit: CanvasKit;
}

export const CanvaskitMap = defineComponent(
  (props: CanvaskitMapProps, { slots }) => {
    const element = ref<HTMLDivElement>();
    const map = ref<core.CanvaskitMap>();
    watchEffect(() => {
      if (element.value && !map.value) {
        map.value = new core.CanvaskitMap(props.canvaskit, {
          ...props,
          element: element.value,
        });
      }
    });
    provide("map", map);
    return () => <div ref={element}>{slots.default?.()}</div>;
  },
  {
    props: ["canvaskit", "width", "height", "origin", "maxZoom"],
  }
);
