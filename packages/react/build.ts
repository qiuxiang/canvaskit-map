import { watch } from "chokidar";
import { build, BuildOptions } from "esbuild";
import { dependencies, peerDependencies } from "./package.json";

const dev = process.argv.pop() == "dev";

async function main() {
  const commonOptions: BuildOptions = {
    outdir: "dist",
    minify: true,
    mangleProps: /^_/,
  };
  const options: BuildOptions = {
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    bundle: true,
    target: "esnext",
    jsxFactory: "_h",
    jsxFragment: "Fragment",
    jsxSideEffects: true,
    banner: { js: 'import { createElement as _h, Fragment } from "react"' },
    format: "esm",
    external: [...Object.keys(dependencies), ...Object.keys(peerDependencies)],
  };
  if (dev) {
    let buildTime = 0;
    async function devBuild() {
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
    devBuild();
    watch("src").on("change", devBuild);
  } else {
    await build(options);
    await build({
      ...options,
      entryPoints: ["dist/index.js"],
      allowOverwrite: true,
    });
  }
}

main();
