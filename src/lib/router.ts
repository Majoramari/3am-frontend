import { APP_TITLE } from "@content/constants";
import type { ViewInstance } from "@lib/view";

type Route = {
	title: string;
	create: () => ViewInstance | Promise<ViewInstance>;
};

export type RouteMap = Record<string, Route>;

type Router = {
	start(): void;
	stop(): void;
	navigate(path: string): void;
};

type ResolvedRoute = {
	key: string;
	route: Route;
};

const resolveRoute = (path: string, routes: RouteMap): ResolvedRoute | null => {
	const direct = routes[path];
	if (direct) {
		return { key: path, route: direct };
	}

	const fallback = routes["/404"];
	if (fallback) {
		return { key: "/404", route: fallback };
	}

	return null;
};

export const createRouter = (
	outlet: HTMLElement,
	routes: RouteMap,
	onRouteChange?: (path: string) => void,
): Router => {
	let current: ViewInstance | null = null;
	let renderToken = 0;

	const render = async (): Promise<void> => {
		const token = ++renderToken;
		const path = window.location.pathname || "/";
		const resolved = resolveRoute(path, routes);

		if (!resolved) {
			if (current) {
				current.destroy();
			}
			current = null;
			outlet.replaceChildren();
			return;
		}

		document.title = `${APP_TITLE} - ${resolved.route.title}`;

		if (current) {
			current.destroy();
			current = null;
		}

		outlet.replaceChildren();

		try {
			const view = await resolved.route.create();
			if (token !== renderToken) {
				view.destroy();
				return;
			}

			view.mount(outlet);
			current = view;
			onRouteChange?.(path);
		} catch (error) {
			if (token !== renderToken) {
				return;
			}
			outlet.replaceChildren();
			console.error(`Failed to load route: ${path}`, error);
		}
	};

	const navigate = (path: string): void => {
		if (window.location.pathname !== path) {
			window.history.pushState({}, "", path);
		}
		void render();
	};

	const start = (): void => {
		window.addEventListener("popstate", handlePopState);
		void render();
	};

	const stop = (): void => {
		window.removeEventListener("popstate", handlePopState);
		renderToken += 1;
		if (current) {
			current.destroy();
		}
		current = null;
	};

	const handlePopState = (): void => {
		void render();
	};

	return { start, stop, navigate };
};
