import type { RouteMap } from "@lib/router";

export const routes: RouteMap = {
  "/": {
    title: "Home",
    create: async () => {
      const { HomePage } = await import("@pages/home");
      return new HomePage();
    },
  },
//  cart page route
  "/cart": {
    title: "Your Cart",
    create: async () => {
      const { CartPage } = await import("@pages/cart");
      return new CartPage();
    },
  },
  "/404": {
    title: "Not found",
    create: async () => {
      const { NotFoundPage } = await import("@pages/notFound");
      return new NotFoundPage();
    },
  },
};