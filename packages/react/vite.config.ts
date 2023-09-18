import { defineConfig } from "vite";
// @ts-ignore
import { dependencies, peerDependencies } from "./package.json";

export default defineConfig({
  build: {
    lib: {
      entry: "src",
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
    jsxInject: "import { createElement as h } from 'react'",
    jsxFactory: "h",
  },
});
