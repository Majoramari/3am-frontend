import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
	appType: "spa",
	resolve: {
		alias: {
			"@": fileURLToPath(new URL("./src", import.meta.url)),
			"@app": fileURLToPath(new URL("./src/app", import.meta.url)),
			"@lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
			"@components": fileURLToPath(
				new URL("./src/components", import.meta.url),
			),
			"@content": fileURLToPath(new URL("./src/content", import.meta.url)),
			"@pages": fileURLToPath(new URL("./src/pages", import.meta.url)),
			"@sections": fileURLToPath(new URL("./src/sections", import.meta.url)),
			"@assets": fileURLToPath(new URL("./public/assets", import.meta.url)),
		},
	},
});
