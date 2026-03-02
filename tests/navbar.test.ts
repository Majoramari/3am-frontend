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
		const duskMobileLink = queryRequired<HTMLAnchorElement>(
			node,
			'.nav-mobile-link[href="/dusk"]',
		);

		expect(duskTrigger.classList.contains("is-active-page")).toBe(true);
		expect(duskTrigger.getAttribute("aria-current")).toBe("page");
		expect(dawnTrigger.classList.contains("is-active-page")).toBe(false);
		expect(dawnTrigger.hasAttribute("aria-current")).toBe(false);
		expect(duskMobileLink.classList.contains("is-active-page")).toBe(true);
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

	test("toggles mobile menu state and aria attributes from hamburger button", () => {
		window.innerWidth = 1024;
		const navbar = new Navbar();
		navbar.mount(document.body);

		const shell = queryRequired<HTMLElement>(document, ".nav-shell");
		const toggle = queryRequired<HTMLButtonElement>(
			document,
			".nav-mobile-toggle",
		);
		const toggleLines = toggle.querySelectorAll(".nav-mobile-toggle-line");
		const panel = queryRequired<HTMLElement>(document, ".nav-mobile-panel");

		expect(toggleLines).toHaveLength(2);
		expect(shell.classList.contains("is-mobile-open")).toBe(false);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(panel.getAttribute("aria-hidden")).toBe("true");

		toggle.click();

		expect(shell.classList.contains("is-mobile-open")).toBe(true);
		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(panel.getAttribute("aria-hidden")).toBe("false");

		toggle.click();

		expect(shell.classList.contains("is-mobile-open")).toBe(false);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(panel.getAttribute("aria-hidden")).toBe("true");
	});

	test("does not open mobile menu when viewport is desktop width", () => {
		window.innerWidth = 1300;
		const navbar = new Navbar();
		navbar.mount(document.body);

		const shell = queryRequired<HTMLElement>(document, ".nav-shell");
		const toggle = queryRequired<HTMLButtonElement>(
			document,
			".nav-mobile-toggle",
		);

		toggle.click();

		expect(shell.classList.contains("is-mobile-open")).toBe(false);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
	});

	test("closes mobile menu after selecting a mobile nav link", () => {
		window.innerWidth = 1024;
		const navbar = new Navbar();
		navbar.mount(document.body);

		const shell = queryRequired<HTMLElement>(document, ".nav-shell");
		const toggle = queryRequired<HTMLButtonElement>(
			document,
			".nav-mobile-toggle",
		);
		const dawnMobileLink = queryRequired<HTMLAnchorElement>(
			document,
			'.nav-mobile-link[href="/dawn"]',
		);

		toggle.click();
		expect(shell.classList.contains("is-mobile-open")).toBe(true);

		dawnMobileLink.dispatchEvent(
			new window.MouseEvent("click", { bubbles: true }),
		);

		expect(shell.classList.contains("is-mobile-open")).toBe(false);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
	});

	test("closes mobile menu after selecting top-right sign in", () => {
		window.innerWidth = 1024;
		const navbar = new Navbar();
		navbar.mount(document.body);

		const shell = queryRequired<HTMLElement>(document, ".nav-shell");
		const toggle = queryRequired<HTMLButtonElement>(
			document,
			".nav-mobile-toggle",
		);
		const signInButton = queryRequired<HTMLAnchorElement>(
			document,
			'.nav-mobile-top-sign-in[href="/signin"]',
		);
		expect(signInButton.classList.contains("ui-button--outline")).toBe(true);

		toggle.click();
		expect(shell.classList.contains("is-mobile-open")).toBe(true);

		signInButton.dispatchEvent(
			new window.MouseEvent("click", { bubbles: true }),
		);

		expect(shell.classList.contains("is-mobile-open")).toBe(false);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
	});

	test("blurs clicked desktop nav link so background can clear after mouse leaves", () => {
		window.innerWidth = 1300;
		const navbar = new Navbar();
		navbar.mount(document.body);

		const duskTrigger = queryRequired<HTMLAnchorElement>(
			document,
			'.nav-menu-trigger[href="/dusk"]',
		);

		duskTrigger.focus();
		expect(document.activeElement).toBe(duskTrigger);

		duskTrigger.dispatchEvent(
			new window.MouseEvent("click", { bubbles: true, detail: 1 }),
		);

		expect(document.activeElement).not.toBe(duskTrigger);
	});
});
