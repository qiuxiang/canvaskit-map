import * as core from "@canvaskit-map/core";
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
    const map = inject("map") as Ref<core.CanvaskitMap>;
    const layer = ref<core.Layer>();
    watchEffect(() => {
      if (map?.value && !layer.value) {
        layer.value = new core.TileLayer(props);
        map.value.addLayer(layer.value);
      }
    });
    onUnmounted(() => {
      if (layer.value) {
        map.value.removeLayer(layer.value);
      }
    });
    return () => null;
  },
  { props: ["tileSize", "minZoom", "maxZoom", "offset", "getTileUrl"] }
);
