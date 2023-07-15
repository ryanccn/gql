import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/index.ts"],
	format: ["cjs", "esm"],
	minifySyntax: true,
	minifyWhitespace: true,
	dts: true,
	clean: true,
});
