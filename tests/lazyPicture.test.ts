import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { LazyPicture } from "../src/components/lazyPicture";
import { installDom, resetDom } from "./helpers/dom";

describe("LazyPicture", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	test("renders with device src object defaults", () => {
		const picture = new LazyPicture({
			pictureClassName: "hero-picture",
			src: {
				phone: "/assets/hero/slide-1-520.png",
				tablet: "/assets/hero/slide-1-1024.png",
				pc: "/assets/hero/slide-1-1440.png",
			},
			alt: "Hero slide",
			className: "hero-slide-image",
			sizes: "100vw",
		}).renderToNode();

		expect(picture.tagName.toLowerCase()).toBe("picture");
		expect(picture.className).toBe("hero-picture");
		expect(picture.children).toHaveLength(4);

		const firstSource = picture.children.item(0);
		if (!firstSource || firstSource.tagName.toLowerCase() !== "source") {
			throw new Error("Expected first child to be a source element");
		}
		expect(firstSource.getAttribute("media")).toBe("(max-width: 743px)");
		expect(firstSource.getAttribute("data-lazy-srcset")).toBe(
			"/assets/hero/slide-1-520.png",
		);

		const image = picture.children.item(3);
		if (!(image instanceof HTMLImageElement)) {
			throw new Error("Expected final child to be an image element");
		}
		expect(image.className).toBe("lazy-image hero-slide-image");
		expect(image.getAttribute("data-lazy-src")).toBe(
			"/assets/hero/slide-1-1440.png",
		);
	});

	test("supports explicit sources", () => {
		const picture = new LazyPicture({
			src: "/assets/hero/slide-1-1440.png",
			alt: "Hero slide",
			sources: [
				{
					media: "(max-width: 700px)",
					src: "/assets/hero/slide-1-520.png",
					type: "image/png",
				},
			],
		}).renderToNode();

		expect(picture.children).toHaveLength(2);

		const source = picture.children.item(0);
		if (!source || source.tagName.toLowerCase() !== "source") {
			throw new Error("Expected first child to be a source element");
		}
		expect(source.getAttribute("media")).toBe("(max-width: 700px)");
		expect(source.getAttribute("type")).toBe("image/png");
		expect(source.getAttribute("data-lazy-srcset")).toBe(
			"/assets/hero/slide-1-520.png",
		);
	});
});
