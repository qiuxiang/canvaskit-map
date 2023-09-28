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
    jsxFragment: "Fragment",
    jsxSideEffects: true,
    banner: { js: 'import { createElement as h, Fragment } from "react"' },
    format: "esm",
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
  };
  if (dev) {
    let buildTime = 0;
    async function _build() {
      const now = Date.now();
      if (now - buildTime > 1000) {
        const { errors, warnings } = await build(options);
        if (errors.length) {
          console.error(errors);
        }
        if (warnings.length) {
          console.error(warnings);
        }
        buildTime = now;
      }
    }
    _build();
    watch("src").on("change", _build);
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
