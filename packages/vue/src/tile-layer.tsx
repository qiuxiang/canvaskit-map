import * as core from "@canvaskit-tilemap/core";
import {
  defineComponent,
  inject,
  onUnmounted,
  ref,
  Ref,
  watchEffect,
} from "vue";

interface TileLayerProps extends core.TileLayerOptions {}

export const TileLayer = defineComponent(
  (props: TileLayerProps) => {
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
    return () => null;
  },
);
