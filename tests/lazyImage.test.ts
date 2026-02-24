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

	test("builds a lazy picture with media sources", () => {
		const picture = LazyImage.picture({
			className: "hero-picture",
			image: {
				src: "/assets/hero/slide-1-1440.png",
				alt: "Hero slide",
				className: "hero-slide-image",
				sizes: "100vw",
			},
			sources: [
				{
					media: "(max-width: 743px)",
					src: "/assets/hero/slide-1-520.png",
					type: "image/png",
				},
				{
					media: "(max-width: 1099px)",
					src: "/assets/hero/slide-1-1024.png",
					type: "image/png",
				},
			],
		});

		expect(picture.tagName.toLowerCase()).toBe("picture");
		expect(picture.className).toBe("hero-picture");
		expect(picture.children).toHaveLength(3);

		const firstSource = picture.children.item(0);
		if (!firstSource || firstSource.tagName.toLowerCase() !== "source") {
			throw new Error("Expected first child to be a source element");
		}
		expect(firstSource.getAttribute("media")).toBe("(max-width: 743px)");
		expect(firstSource.getAttribute("type")).toBe("image/png");
		expect(firstSource.getAttribute("sizes")).toBe("100vw");
		expect(firstSource.getAttribute("data-lazy-srcset")).toBe(
			"/assets/hero/slide-1-520.png",
		);

		const image = picture.children.item(2);
		if (!(image instanceof HTMLImageElement)) {
			throw new Error("Expected final child to be an image element");
		}
		expect(image.className).toBe("lazy-image hero-slide-image");
		expect(image.getAttribute("data-lazy-src")).toBe(
			"/assets/hero/slide-1-1440.png",
		);
	});

	test("builds a lazy picture from src tuple defaults", () => {
		const picture = LazyImage.picture({
			image: {
				src: [
					"/assets/hero/slide-1-520.png",
					"/assets/hero/slide-1-1024.png",
					"/assets/hero/slide-1-1440.png",
				],
				alt: "Hero slide",
				sizes: "100vw",
			},
		});

		expect(picture.children).toHaveLength(4);

		const firstSource = picture.children.item(0);
		if (!firstSource || firstSource.tagName.toLowerCase() !== "source") {
			throw new Error("Expected first child to be a source element");
		}
		expect(firstSource.getAttribute("media")).toBe("(max-width: 743px)");
		expect(firstSource.getAttribute("data-lazy-srcset")).toBe(
			"/assets/hero/slide-1-520.png",
		);

		const secondSource = picture.children.item(1);
		if (!secondSource || secondSource.tagName.toLowerCase() !== "source") {
			throw new Error("Expected second child to be a source element");
		}
		expect(secondSource.getAttribute("media")).toBe("(max-width: 1099px)");
		expect(secondSource.getAttribute("data-lazy-srcset")).toBe(
			"/assets/hero/slide-1-1024.png",
		);

		const image = picture.children.item(3);
		if (!(image instanceof HTMLImageElement)) {
			throw new Error("Expected final child to be an image element");
		}
		expect(image.getAttribute("data-lazy-src")).toBe(
			"/assets/hero/slide-1-1440.png",
		);
	});
});
