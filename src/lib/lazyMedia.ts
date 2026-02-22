const DEFAULT_ROOT_MARGIN = "300px 0px";

const LAZY_SELECTOR = [
	"img[data-lazy-src]",
	"img[data-lazy-srcset]",
	"img[data-lazy-sizes]",
	"picture source[data-lazy-src]",
	"picture source[data-lazy-srcset]",
	"video[data-lazy-src]",
	"video[data-lazy-poster]",
	"video source[data-lazy-src]",
	"video source[data-lazy-srcset]",
	"[data-lazy-bg-src]",
].join(", ");

type LazyMediaOptions = {
	rootMargin?: string;
};

export type LazyMediaController = {
	scan(root?: ParentNode): void;
	disconnect(): void;
};

const isElementTag = (element: Element, tagName: string): boolean =>
	element.tagName.toLowerCase() === tagName;

const applyDeferredImageAttributes = (element: Element): void => {
	if (!isElementTag(element, "img")) {
		return;
	}

	const image = element as HTMLImageElement;
	const lazySrcset = image.dataset.lazySrcset;
	if (lazySrcset) {
		image.srcset = lazySrcset;
		delete image.dataset.lazySrcset;
	}

	const lazySizes = image.dataset.lazySizes;
	if (lazySizes) {
		image.sizes = lazySizes;
		delete image.dataset.lazySizes;
	}

	const lazySrc = image.dataset.lazySrc;
	if (lazySrc) {
		image.src = lazySrc;
		delete image.dataset.lazySrc;
	}
};

const applyDeferredSourceAttributes = (element: Element): boolean => {
	if (!isElementTag(element, "source")) {
		return false;
	}

	const source = element as HTMLSourceElement;
	let changed = false;

	const lazySrcset = source.dataset.lazySrcset;
	if (lazySrcset) {
		source.srcset = lazySrcset;
		delete source.dataset.lazySrcset;
		changed = true;
	}

	const lazySrc = source.dataset.lazySrc;
	if (lazySrc) {
		source.src = lazySrc;
		delete source.dataset.lazySrc;
		changed = true;
	}

	return changed;
};

const applyDeferredBackground = (element: Element): void => {
	if (!(element instanceof HTMLElement)) {
		return;
	}

	const lazyBackground = element.dataset.lazyBgSrc;
	if (!lazyBackground) {
		return;
	}

	const cssVarName = element.dataset.lazyBgCssVar;
	if (cssVarName) {
		element.style.setProperty(cssVarName, `url("${lazyBackground}")`);
	} else {
		element.style.backgroundImage = `url("${lazyBackground}")`;
	}

	delete element.dataset.lazyBgSrc;
	delete element.dataset.lazyBgCssVar;
};

const applyDeferredVideoAttributes = (element: Element): void => {
	if (!isElementTag(element, "video")) {
		return;
	}

	const video = element as HTMLVideoElement;
	let shouldReload = false;

	const lazyPoster = video.dataset.lazyPoster;
	if (lazyPoster) {
		video.poster = lazyPoster;
		delete video.dataset.lazyPoster;
	}

	const lazySrc = video.dataset.lazySrc;
	if (lazySrc) {
		video.src = lazySrc;
		delete video.dataset.lazySrc;
		shouldReload = true;
	}

	for (const source of video.querySelectorAll("source")) {
		if (applyDeferredSourceAttributes(source)) {
			shouldReload = true;
		}
	}

	if (shouldReload) {
		video.load();
	}
};

const collectLazyCandidates = (target: Element): Element[] => {
	const nested = Array.from(target.querySelectorAll(LAZY_SELECTOR));
	return [target, ...nested];
};

const resolveObservationTarget = (element: Element): Element => {
	if (!isElementTag(element, "source")) {
		return element;
	}

	const parent = element.parentElement;
	if (!parent) {
		return element;
	}

	if (isElementTag(parent, "picture") || isElementTag(parent, "video")) {
		return parent;
	}

	return element;
};

export const createLazyMediaController = (
	options?: LazyMediaOptions,
): LazyMediaController => {
	const hydratedTargets = new WeakSet<Element>();
	const observedTargets = new WeakSet<Element>();
	const IntersectionObserverCtor =
		typeof window !== "undefined" ? window.IntersectionObserver : undefined;

	const observer: IntersectionObserver | null =
		typeof IntersectionObserverCtor === "function"
			? new IntersectionObserverCtor(
					(entries, activeObserver) => {
						for (const entry of entries) {
							if (!entry.isIntersecting) {
								continue;
							}

							const target = entry.target;
							if (!(target instanceof Element)) {
								continue;
							}

							activeObserver.unobserve(target);
							hydrateTarget(target);
						}
					},
					{
						rootMargin: options?.rootMargin ?? DEFAULT_ROOT_MARGIN,
					},
				)
			: null;

	const hydrateTarget = (target: Element): void => {
		if (hydratedTargets.has(target)) {
			return;
		}

		for (const candidate of collectLazyCandidates(target)) {
			applyDeferredImageAttributes(candidate);
			applyDeferredSourceAttributes(candidate);
			applyDeferredVideoAttributes(candidate);
			applyDeferredBackground(candidate);
		}

		hydratedTargets.add(target);
	};

	const scan = (root?: ParentNode): void => {
		const scope = root ?? document;
		const candidates = Array.from(scope.querySelectorAll(LAZY_SELECTOR));
		for (const candidate of candidates) {
			const target = resolveObservationTarget(candidate);
			if (hydratedTargets.has(target) || observedTargets.has(target)) {
				continue;
			}

			if (!observer) {
				hydrateTarget(target);
				continue;
			}

			observer.observe(target);
			observedTargets.add(target);
		}
	};

	const disconnect = (): void => {
		observer?.disconnect();
	};

	return { scan, disconnect };
};
