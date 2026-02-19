import { routes } from "@app/routes";
import Navbar from "@components/navbar";
import { createRouter } from "@lib/router";

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

	const navbar = new Navbar();
	navbar.mount(app);

	const main = document.createElement("main");
	main.className = "page";
	app.appendChild(main);

	const router = createRouter(main, routes, (path) => {
		navbar.setCurrentPath(path);
	});

	app.addEventListener("click", (event) => {
		const link = getInternalLink(event);
		if (!link) return;

		const href = link.getAttribute("href");
		if (!href) return;

		event.preventDefault();
		router.navigate(href);
	});

	router.start();
};
