import type { RouteMap } from "@lib/router";

export const routes: RouteMap = {
	"/": {
		title: "Home",
		create: async () => {
			const { HomePage } = await import("@pages/home");
			return new HomePage();
		},
	},
	"/404": {
		title: "Not found",
		create: async () => {
			const { NotFoundPage } = await import("@pages/notFound");
			return new NotFoundPage();
		},
	},
	"/gears": {
		title: "Gears",
		create: async () => {
			const { GearsPage } = await import("@pages/gears");
			return new GearsPage();
		},
	},
};
