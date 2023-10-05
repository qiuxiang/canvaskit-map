import * as core from "@canvaskit-tilemap/core";
import { toCanvas } from "html-to-image";
import {
  defineComponent,
  inject,
  onUnmounted,
  ref,
  Ref,
  watchEffect,
} from "vue";

interface MarkerLayerProps extends Omit<core.MarkerLayerOptions, "image"> {}

export const MarkerLayer = defineComponent(
  ({ items, ...props }: MarkerLayerProps, { attrs, slots }) => {
    const tilemap = inject("tilemap") as Ref<core.Tilemap>;
    const element = ref<HTMLDivElement>();
    const layer = ref<core.MarkerLayer>();
    watchEffect(() => {
      if (tilemap?.value && !layer.value && element.value) {
        toCanvas(element.value).then((image) => {
          items = items.slice();
          layer.value = new core.MarkerLayer({ ...props, image, items });
          tilemap.value.addLayer(layer.value);
        });
      }
    });
    onUnmounted(() => {
      if (layer.value) {
        tilemap.value.removeLayer(layer.value);
      }
    });
    return () => (
      <div style={{ position: "absolute", zIndex: -1, left: "-100%" }}>
        <div ref={element} class={attrs.class}>
          {slots.default?.()}
        </div>
      </div>
    );
  },
  { inheritAttrs: false }
);
