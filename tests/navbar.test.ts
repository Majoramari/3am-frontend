import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import Navbar from "../src/components/navbar";
import { installDom, resetDom } from "./helpers/dom";

const queryRequired = <T extends Element>(
	root: ParentNode,
	selector: string,
): T => {
	const element = root.querySelector<T>(selector);
	if (!element) {
		throw new Error(`Missing element for selector: ${selector}`);
	}
	return element;
};

describe("Navbar", () => {
	beforeEach(() => {
		installDom("https://example.com/");
	});

	afterEach(() => {
		resetDom();
	});

	test("marks top-level nav link as active for exact route", () => {
		const navbar = new Navbar();
		const node = navbar.renderToNode();

		navbar.setCurrentPath("/dusk");

		const duskTrigger = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-menu-trigger[href="/dusk"]',
		);
		const dawnTrigger = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-menu-trigger[href="/dawn"]',
		);

		expect(duskTrigger.classList.contains("is-active-page")).toBe(true);
		expect(duskTrigger.getAttribute("aria-current")).toBe("page");
		expect(dawnTrigger.classList.contains("is-active-page")).toBe(false);
		expect(dawnTrigger.hasAttribute("aria-current")).toBe(false);
	});

	test("marks parent and nested links as active for deep route", () => {
		const navbar = new Navbar();
		const node = navbar.renderToNode();

		navbar.setCurrentPath("/gears/services/setup");

		const gearsTrigger = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-menu-trigger[href="/gears"]',
		);
		const servicesLink = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-mega-link[href="/gears/services"]',
		);
		const chargersLink = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-mega-link[href="/gears/chargers"]',
		);

		expect(gearsTrigger.classList.contains("is-active-page")).toBe(true);
		expect(servicesLink.classList.contains("is-active-page")).toBe(true);
		expect(chargersLink.classList.contains("is-active-page")).toBe(false);
	});

	test("normalizes query/hash paths and external paths", () => {
		const navbar = new Navbar();
		const node = navbar.renderToNode();
		const dawnTrigger = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-menu-trigger[href="/dawn"]',
		);

		navbar.setCurrentPath("/dawn/?tab=specs#top");
		expect(dawnTrigger.classList.contains("is-active-page")).toBe(true);

		navbar.setCurrentPath("https://other.example.com/dawn");
		expect(node.querySelectorAll(".is-active-page")).toHaveLength(0);
	});
});
