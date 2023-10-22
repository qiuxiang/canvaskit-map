import * as core from "@canvaskit-map/core";
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
  (props: MarkerLayerProps, { attrs, slots }) => {
    const map = inject("map") as Ref<core.CanvaskitMap>;
    const element = ref<HTMLDivElement>();
    const layer = ref<core.MarkerLayer>();
    watchEffect(() => {
      if (map?.value && !layer.value && element.value) {
        toCanvas(element.value).then((image) => {
          layer.value = new core.MarkerLayer({ ...props, image });
          map.value.addLayer(layer.value);
        });
      }
    });
    onUnmounted(() => {
      if (layer.value) {
        map.value.removeLayer(layer.value);
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
  { props: ["items", "scale", "anchor", "onClick"], inheritAttrs: false }
);
