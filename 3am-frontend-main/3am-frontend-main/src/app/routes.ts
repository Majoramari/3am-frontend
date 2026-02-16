import type { RouteMap } from "@lib/router";
import { HomePage } from "@pages/home";
import { NotFoundPage } from "@pages/notFound";
import { CartPage } from "@pages/cart";
export const routes: RouteMap = {
	"/": { title: "Home", create: () => new HomePage() },
	"/cart": { title: "Cart", create: () => new CartPage() },
	"/404": { title: "Not found", create: () => new NotFoundPage() },
};
