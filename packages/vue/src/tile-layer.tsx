import * as core from "@canvaskit-tilemap/core";
import { defineComponent, inject, ref, Ref, watchEffect } from "vue";

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
    return () => null;
  },
  { props: ["tileSize", "minZoom", "maxZoom", "offset", "getTileUrl"] }
);
