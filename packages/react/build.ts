import { watch } from "chokidar";
import { build, BuildOptions } from "esbuild";
import { dependencies, peerDependencies } from "./package.json";

const dev = process.argv.pop() == "dev";

async function main() {
  const options: BuildOptions = {
    entryPoints: ["src/index.ts"],
    outdir: "dist",
    bundle: true,
    target: "esnext",
    jsxFactory: "h",
    jsxSideEffects: true,
    banner: { js: 'import { createElement as h } from "react"' },
    format: "esm",
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
  };
  if (dev) {
    let buildTime = 0;
    watch("src").on("change", () => {
      const now = Date.now();
      if (now - buildTime > 1000) {
        build(options);
        buildTime = now;
      }
    });
  } else {
    await build(options);
    await build({
      entryPoints: ["dist/index.js"],
      outdir: "dist",
      allowOverwrite: true,
      mangleProps: /^_/,
      minify: true,
    });
  }
}

main();
