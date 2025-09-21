import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	test: {
		environment: "jsdom",
		setupFiles: ["./tests/setup.ts"],
		globals: true,
		coverage: {
			reporter: ["text", "json", "html"],
			exclude: ["node_modules/", "tests/", "**/*.d.ts", "**/*.config.*", "**/main.js"],
		},
	},
	resolve: {
		alias: {
			obsidian: path.resolve(__dirname, "../../libs/utils/src/testing/mocks/obsidian.ts"),
		},
	},
});
