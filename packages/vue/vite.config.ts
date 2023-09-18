import { defineConfig } from "vite";
// @ts-ignore
import { dependencies, peerDependencies } from "./package.json";

export default defineConfig({
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
  esbuild: {
    jsxInject: "import { h } from 'vue'",
    jsxFactory: "h",
  },
});
