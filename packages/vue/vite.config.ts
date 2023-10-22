import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { dependencies, peerDependencies } from "./package.json";

export default defineConfig({
  plugins: [dts()],
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
