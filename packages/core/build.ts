import { watch } from "chokidar";
import { build, BuildOptions } from "esbuild";
import { dependencies } from "./package.json";

const dev = process.argv.pop() == "dev";

async function main() {
  const commonOptions: BuildOptions = {
    outdir: "dist",
    mangleProps: /^_/,
    minify: true,
  };
  const options: BuildOptions = {
    ...commonOptions,
    entryPoints: ["src/index.ts"],
    bundle: true,
    target: "esnext",
    format: "esm",
    external: Object.keys(dependencies),
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
      ...commonOptions,
      entryPoints: ["dist/index.js"],
      allowOverwrite: true,
    });
  }
}

main();
