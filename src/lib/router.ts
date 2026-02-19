import { APP_TITLE } from "@content/constants";
import type { ViewInstance } from "@lib/view";

type Route = {
	title: string;
	create: () => ViewInstance;
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

	const render = (): void => {
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

		const view = resolved.route.create();
		view.mount(outlet);

		current = view;

		onRouteChange?.(path);
	};

	const navigate = (path: string): void => {
		if (window.location.pathname !== path) {
			window.history.pushState({}, "", path);
		}
		render();
	};

	const start = (): void => {
		window.addEventListener("popstate", render);
		render();
	};

	const stop = (): void => {
		window.removeEventListener("popstate", render);
		if (current) {
			current.destroy();
		}
		current = null;
	};

	return { start, stop, navigate };
};
