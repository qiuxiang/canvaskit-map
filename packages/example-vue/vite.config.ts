import vue from "@vitejs/plugin-vue";
import unocss from "unocss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [unocss(), vue()],
});
