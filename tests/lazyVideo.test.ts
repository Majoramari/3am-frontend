import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { LazyVideo } from "../src/components/lazyVideo";
import { installDom, resetDom } from "./helpers/dom";

describe("LazyVideo", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	test("renders deferred video source and poster dataset", () => {
		const video = new LazyVideo({
			poster: "/assets/dusk/hero-poster.webp",
			controls: true,
			muted: true,
			playsInline: true,
			sources: [
				{
					src: "/assets/dusk/hero_video.webm",
					type: "video/webm",
				},
			],
		}).renderToNode();

		expect(video.tagName.toLowerCase()).toBe("video");
		expect(video.className).toBe("lazy-video");
		expect(video.getAttribute("poster")).toBe("/assets/shared/placeholder.png");
		expect(video.getAttribute("data-lazy-poster")).toBe(
			"/assets/dusk/hero-poster.webp",
		);
		expect(video.getAttribute("preload")).toBe("none");
		expect(video.hasAttribute("controls")).toBe(true);
		expect(video.hasAttribute("muted")).toBe(true);
		expect(video.hasAttribute("playsinline")).toBe(true);

		const source = video.querySelector("source");
		expect(source).not.toBeNull();
		expect(source?.getAttribute("data-lazy-src")).toBe(
			"/assets/dusk/hero_video.webm",
		);
		expect(source?.getAttribute("src")).toBeNull();
		expect(source?.getAttribute("type")).toBe("video/webm");
	});

	test("supports preload/options and ignores reserved attrs overrides", () => {
		const video = new LazyVideo({
			preload: "metadata",
			sources: [{ src: "/assets/dawn/hero_video.webm" }],
			attrs: {
				title: "Dawn video",
				preload: "auto",
				poster: "/assets/override.webp",
			},
		}).renderToNode();

		expect(video.getAttribute("title")).toBe("Dawn video");
		expect(video.getAttribute("preload")).toBe("metadata");
		expect(video.hasAttribute("poster")).toBe(false);
		expect(video.hasAttribute("data-lazy-poster")).toBe(false);
	});

	test("supports single-source mode with direct src/type fields", () => {
		const video = new LazyVideo({
			src: "/assets/dawn/hero_video.webm",
			type: "video/webm",
			controls: true,
		}).renderToNode();

		const source = video.querySelector("source");
		expect(source).not.toBeNull();
		expect(source?.getAttribute("data-lazy-src")).toBe(
			"/assets/dawn/hero_video.webm",
		);
		expect(source?.getAttribute("type")).toBe("video/webm");
	});

	test("throws when no sources are provided", () => {
		expect(() => {
			new LazyVideo({
				sources: [],
			});
		}).toThrow("LazyVideo requires at least one source");
	});
});
