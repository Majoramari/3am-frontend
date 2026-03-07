import { APP_TITLE } from "@content/constants";
import type { ViewInstance } from "@lib/view";

export type RouteParams = Record<string, string>;

export type RouteCreateContext = {
	path: string;
	params: RouteParams;
};

type Route = {
	title: string;
	create: (context: RouteCreateContext) => ViewInstance | Promise<ViewInstance>;
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
	params: RouteParams;
};

const resolveRoute = (path: string, routes: RouteMap): ResolvedRoute | null => {
	// First try direct match
	const direct = routes[path];
	if (direct) {
		return { key: path, route: direct, params: {} };
	}

	// Then try pattern matching for dynamic routes
	for (const [routePattern, route] of Object.entries(routes)) {
		if (routePattern.includes(":")) {
			const patternParts = routePattern.split("/");
			const pathParts = path.split("/");

			if (patternParts.length === pathParts.length) {
				const params: RouteParams = {};
				let matches = true;

				for (let i = 0; i < patternParts.length; i++) {
					const patternPart = patternParts[i];
					const pathPart = pathParts[i];

					if (patternPart.startsWith(":")) {
						// This is a parameter
						const paramName = patternPart.slice(1);
						params[paramName] = pathPart;
					} else if (patternPart !== pathPart) {
						// Static parts must match exactly
						matches = false;
						break;
					}
				}

				if (matches) {
					return { key: routePattern, route, params };
				}
			}
		}
	}

	const fallback = routes["/404"];
	if (fallback) {
		return { key: "/404", route: fallback, params: {} };
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
			const view = await resolved.route.create({
				path,
				params: resolved.params,
			});
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
		const currentLocation = `${window.location.pathname}${window.location.search}${window.location.hash}`;
		if (currentLocation !== path) {
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

// Singleton router instance for use across the app
export let router: ReturnType<typeof createRouter> | null = null;

export const setRouter = (instance: ReturnType<typeof createRouter>): void => {
	router = instance;
};

export const getRouter = (): ReturnType<typeof createRouter> => {
	if (!router) {
		throw new Error("Router not initialized. Call setRouter first.");
	}
	return router;
};
