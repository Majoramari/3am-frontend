import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { MediaCard } from "../src/components/mediaCard";
import { installDom, resetDom } from "./helpers/dom";

describe("MediaCard", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	test("renders default anchor structure with baseline styles", () => {
		const card = new MediaCard({
			label: "Services",
			href: "/gears/services",
			backgroundImage: "/assets/shared/placeholder.png",
		}).renderToNode();

		expect(card.tagName.toLowerCase()).toBe("a");
		expect(card.className).toBe("media-card");
		expect(card.getAttribute("href")).toBe("/gears/services");
		expect(card.dataset.overlay).toBe("on");
		expect(card.getAttribute("style")).toContain(
			'--media-card-bg-image: url("/assets/shared/placeholder.png")',
		);
		expect(card.getAttribute("style")).toContain(
			"--media-card-bg-position: center",
		);

		const label = card.querySelector<HTMLSpanElement>(".media-card-label");
		expect(label).not.toBeNull();
		expect(label?.dataset.anchor).toBe("bottom-left");
		expect(label?.textContent).toBe("Services");
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-size: 1.6rem",
		);
	});

	test("applies custom card and label configuration", () => {
		const card = new MediaCard({
			label: "Autonomous",
			href: "/gears/autonomous",
			className: "hero-card",
			backgroundImage: "/autonomous.png",
			backgroundPosition: "right 20% center",
			textAnchor: "top-center",
			textOffsetX: "10px",
			textOffsetY: "20px",
			textSize: "2rem",
			textColor: "rgb(0 0 0)",
			textWeight: "700",
			withOverlay: false,
		}).renderToNode();

		expect(card.className).toBe("media-card hero-card");
		expect(card.dataset.overlay).toBe("off");
		expect(card.getAttribute("style")).toContain(
			"--media-card-bg-position: right 20% center",
		);

		const label = card.querySelector<HTMLSpanElement>(".media-card-label");
		expect(label?.dataset.anchor).toBe("top-center");
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-size: 2rem",
		);
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-color: rgb(0 0 0)",
		);
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-weight: 700",
		);
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-offset-x: 10px",
		);
		expect(label?.getAttribute("style")).toContain(
			"--media-card-text-offset-y: 20px",
		);
	});
});
