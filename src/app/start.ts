import { CartDock } from "@app/cart/cartDock";
import { routes } from "@app/routes";
import { Footer } from "@components/footer";
import Navbar from "@components/navbar";
import { ToastStack } from "@components/toastStack";
import { createLazyMediaController } from "@lib/lazyMedia";
import { createRouter, setRouter } from "@lib/router";

const BUILDER_ROUTE_PREFIXES = [
	"/dusk/build",
	"/dusk/buy",
	"/dawn/build",
	"/dawn/buy",
] as const;

const isBuilderRoute = (path: string): boolean =>
	BUILDER_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix));

const isGearsCatalogRoute = (path: string): boolean => path === "/gears";

const hasPaymentResultQuery = (search: string): boolean => {
	const params = new URLSearchParams(search);
	return params.has("payment");
};

const isPlainLeftClick = (event: MouseEvent): boolean =>
	event.button === 0 &&
	!event.metaKey &&
	!event.ctrlKey &&
	!event.shiftKey &&
	!event.altKey;

const getInternalLink = (event: MouseEvent): HTMLAnchorElement | null => {
	if (!isPlainLeftClick(event)) {
		return null;
	}
	const target = event.target as HTMLElement | null;
	if (!target) {
		return null;
	}
	const link = target.closest<HTMLAnchorElement>("a[href]");
	if (!link) {
		return null;
	}
	if (link.target && link.target !== "_self") {
		return null;
	}
	const href = link.getAttribute("href") ?? "";
	if (!href.startsWith("/") || href.startsWith("//")) {
		return null;
	}
	return link;
};

export const startApp = (): void => {
	const app = document.querySelector<HTMLDivElement>("#app");
	if (!app) {
		throw new Error("App root not found");
	}

	if (
		window.location.pathname === "/" &&
		hasPaymentResultQuery(window.location.search)
	) {
		window.history.replaceState(
			{},
			"",
			`/checkout${window.location.search}${window.location.hash}`,
		);
	}

	const navbar = new Navbar();
	navbar.mount(app);

	const main = document.createElement("main");
	main.className = "page";
	app.appendChild(main);

	const footer = new Footer();
	footer.mount(app);

	const cartDock = new CartDock();
	cartDock.mount(app);

	const toastStack = new ToastStack();
	toastStack.mount(document.body);

	const lazyMedia = createLazyMediaController({
		// Preload one slide ahead horizontally to avoid placeholder flashes in carousels.
		rootMargin: "300px 300px",
	});
	const router = createRouter(main, routes, (path) => {
		const onBuilderRoute = isBuilderRoute(path);
		document.body.classList.toggle("route-dusk-build", onBuilderRoute);
		if (onBuilderRoute) {
			window.scrollTo({ top: 0, left: 0, behavior: "auto" });
		}
		document.body.classList.toggle("route-gears", isGearsCatalogRoute(path));

		navbar.setCurrentPath(path);
		cartDock.setCurrentPath(path);
		lazyMedia.scan(main); // scan on route change
	});

	// Set the singleton router for use in other modules
	setRouter(router);

	document.addEventListener("click", (event) => {
		const link = getInternalLink(event);
		if (!link) return;

		const href = link.getAttribute("href");
		if (!href) return;

		event.preventDefault();
		router.navigate(href);
	});

	lazyMedia.scan(app); // initial scan
	cartDock.setCurrentPath(window.location.pathname);
	router.start();
};
