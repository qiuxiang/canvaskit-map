import { defineConfig } from "vite";
// @ts-ignore
import { dependencies } from "./package.json";

export default defineConfig({
  build: {
    target: "esnext",
    minify: false,
    lib: {
      entry: "src",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: Object.keys(dependencies),
    },
  },
});
