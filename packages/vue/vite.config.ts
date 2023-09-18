import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
// @ts-ignore
import { dependencies, peerDependencies } from "./package.json";

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        ...Object.keys(dependencies),
        ...Object.keys(peerDependencies),
      ],
    },
  },
});
