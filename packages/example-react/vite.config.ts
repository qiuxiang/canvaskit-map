import unocss from "unocss/vite";
import { AliasOptions, defineConfig } from "vite";
import { compilerOptions } from "./tsconfig.json";

const alias: AliasOptions = {};
for (const key in compilerOptions.paths) {
  const path = compilerOptions.paths[key as keyof typeof compilerOptions.paths];
  alias[key] = path[0].replace("./node_modules/", "");
}

export default defineConfig({
  plugins: [unocss()],
  resolve: { alias },
});
