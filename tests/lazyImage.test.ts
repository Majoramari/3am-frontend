import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { LazyImage } from "../src/components/lazyImage";
import { installDom, resetDom } from "./helpers/dom";

describe("LazyImage", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	test("renders with placeholder src and lazy dataset defaults", () => {
		const image = new LazyImage({
			src: "/assets/dusk/hero.webp",
			alt: "Dusk hero",
		}).renderToNode();

		expect(image.tagName.toLowerCase()).toBe("img");
		expect(image.className).toBe("lazy-image");
		expect(image.getAttribute("src")).toBe("/assets/shared/placeholder.png");
		expect(image.getAttribute("alt")).toBe("Dusk hero");
		expect(image.getAttribute("loading")).toBe("lazy");
		expect(image.getAttribute("decoding")).toBe("async");
		expect(image.getAttribute("data-lazy-src")).toBe("/assets/dusk/hero.webp");
		expect(image.hasAttribute("data-lazy-srcset")).toBe(false);
		expect(image.hasAttribute("data-lazy-sizes")).toBe(false);
	});

	test("supports srcset/sizes and ignores reserved attrs overrides", () => {
		const image = new LazyImage({
			src: "/assets/dawn/hero.webp",
			alt: "Dawn hero",
			className: "hero-image",
			srcset: "/assets/dawn/hero.webp 1x, /assets/dawn/hero@2x.webp 2x",
			sizes: "100vw",
			width: 1280,
			height: 720,
			attrs: {
				title: "Dawn",
				src: "/assets/override.webp",
				loading: "eager",
			},
		}).renderToNode();

		expect(image.className).toBe("lazy-image hero-image");
		expect(image.getAttribute("src")).toBe("/assets/shared/placeholder.png");
		expect(image.getAttribute("title")).toBe("Dawn");
		expect(image.getAttribute("loading")).toBe("lazy");
		expect(image.getAttribute("width")).toBe("1280");
		expect(image.getAttribute("height")).toBe("720");
		expect(image.getAttribute("data-lazy-src")).toBe("/assets/dawn/hero.webp");
		expect(image.getAttribute("data-lazy-srcset")).toBe(
			"/assets/dawn/hero.webp 1x, /assets/dawn/hero@2x.webp 2x",
		);
		expect(image.getAttribute("data-lazy-sizes")).toBe("100vw");
	});
});
