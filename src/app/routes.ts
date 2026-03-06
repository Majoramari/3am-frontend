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
    title: "Gear Shop",
    create: async () => {
        const { GearShopPage } = await import("@pages/gearShop");
        return new GearShopPage();
    }
},
"/gear/product": {
	title: "Product",
	create: async () => {
		const { ProductPage } = await import("@pages/product");
		return new ProductPage();
	},
},
};
