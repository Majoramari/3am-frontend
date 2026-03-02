import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { createLazyMediaController } from "../src/lib/lazyMedia";
import { installDom, resetDom } from "./helpers/dom";

type IntersectionCallback = IntersectionObserverCallback;

class MockIntersectionObserver {
	static latest: MockIntersectionObserver | null = null;
	private readonly callback: IntersectionCallback;
	readonly observed = new Set<Element>();

	constructor(callback: IntersectionCallback) {
		this.callback = callback;
		MockIntersectionObserver.latest = this;
	}

	observe(target: Element): void {
		this.observed.add(target);
	}

	unobserve(target: Element): void {
		this.observed.delete(target);
	}

	disconnect(): void {
		this.observed.clear();
	}

	emitIntersecting(target: Element): void {
		const entry = {
			target,
			isIntersecting: true,
			intersectionRatio: 1,
			boundingClientRect: target.getBoundingClientRect(),
			intersectionRect: target.getBoundingClientRect(),
			rootBounds: null,
			time: Date.now(),
		} as IntersectionObserverEntry;
		this.callback([entry], this as unknown as IntersectionObserver);
	}
}

describe("createLazyMediaController", () => {
	let originalIntersectionObserver: unknown;
	let originalWindowIntersectionObserver: unknown;

	beforeEach(() => {
		installDom();
		originalIntersectionObserver = (
			globalThis as typeof globalThis & {
				IntersectionObserver?: unknown;
			}
		).IntersectionObserver;
		originalWindowIntersectionObserver = (
			window as typeof window & { IntersectionObserver?: unknown }
		).IntersectionObserver;
	});

	afterEach(() => {
		const globalWithObserver = globalThis as typeof globalThis & {
			IntersectionObserver?: unknown;
		};
		if (originalIntersectionObserver !== undefined) {
			globalWithObserver.IntersectionObserver = originalIntersectionObserver;
		} else {
			delete globalWithObserver.IntersectionObserver;
		}

		const windowWithObserver = window as typeof window & {
			IntersectionObserver?: unknown;
		};
		if (originalWindowIntersectionObserver !== undefined) {
			windowWithObserver.IntersectionObserver = originalWindowIntersectionObserver;
		} else {
			delete windowWithObserver.IntersectionObserver;
		}

		resetDom();
	});

	test("hydrates lazy image and backgrounds immediately when IntersectionObserver is unavailable", () => {
		Object.defineProperty(window, "IntersectionObserver", {
			configurable: true,
			value: undefined,
		});

		const image = document.createElement("img");
		image.src = "/assets/shared/placeholder.png";
		image.dataset.lazySrc = "/assets/dusk/hero.webp";
		image.dataset.lazySrcset = "/assets/dusk/hero@2x.webp 2x";
		image.dataset.lazySizes = "100vw";
		document.body.append(image);

		const card = document.createElement("div");
		card.dataset.lazyBgSrc = "/assets/gears/card.webp";
		card.dataset.lazyBgCssVar = "--media-card-bg-image";
		document.body.append(card);

		const controller = createLazyMediaController();
		controller.scan(document);

		expect(image.getAttribute("src")).toBe("/assets/dusk/hero.webp");
		expect(image.getAttribute("srcset")).toBe("/assets/dusk/hero@2x.webp 2x");
		expect(image.getAttribute("sizes")).toBe("100vw");
		expect(image.dataset.lazySrc).toBeUndefined();
		expect(image.dataset.lazySrcset).toBeUndefined();
		expect(image.dataset.lazySizes).toBeUndefined();
		expect(card.style.getPropertyValue("--media-card-bg-image")).toBe(
			'url("/assets/gears/card.webp")',
		);
		expect(card.dataset.lazyBgSrc).toBeUndefined();
	});

	test("hydrates lazy video poster and sources", () => {
		Object.defineProperty(window, "IntersectionObserver", {
			configurable: true,
			value: undefined,
		});

		const video = document.createElement("video");
		video.dataset.lazyPoster = "/assets/dusk/video-poster.webp";

		const source = document.createElement("source");
		source.dataset.lazySrc = "/assets/dusk/hero_video.webm";
		source.type = "video/webm";
		video.append(source);
		document.body.append(video);

		let loadCount = 0;
		Object.defineProperty(video, "load", {
			configurable: true,
			value: () => {
				loadCount += 1;
			},
		});

		const controller = createLazyMediaController();
		controller.scan(document);

		expect(video.poster).toBe("/assets/dusk/video-poster.webp");
		expect(source.getAttribute("src")).toBe("/assets/dusk/hero_video.webm");
		expect(video.dataset.lazyPoster).toBeUndefined();
		expect(source.dataset.lazySrc).toBeUndefined();
		expect(loadCount).toBe(1);
	});

	test("defers hydration until intersection when IntersectionObserver is available", () => {
		Object.defineProperty(window, "IntersectionObserver", {
			configurable: true,
			value: MockIntersectionObserver as unknown as typeof IntersectionObserver,
		});

		const image = document.createElement("img");
		image.src = "/assets/shared/placeholder.png";
		image.dataset.lazySrc = "/assets/dawn/hero.webp";
		document.body.append(image);

		const controller = createLazyMediaController();
		controller.scan(document);

		expect(image.getAttribute("src")).toBe("/assets/shared/placeholder.png");

		const mockObserver = MockIntersectionObserver.latest;
		if (!mockObserver) {
			throw new Error("Expected intersection observer instance");
		}

		mockObserver.emitIntersecting(image);
		expect(image.getAttribute("src")).toBe("/assets/dawn/hero.webp");

		controller.disconnect();
	});
});
