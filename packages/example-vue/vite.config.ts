import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [unocss(), vue(), vueJsx()],
});
