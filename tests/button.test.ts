import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { Button } from "../src/components/button";
import { installDom, resetDom } from "./helpers/dom";

describe("Button", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	test("renders anchor buttons with variant classes and label node", () => {
		const node = new Button({
			label: "Demo Drive",
			variant: "cta",
			className: "hero-cta",
			href: "/demo",
		}).renderToNode();

		expect(node.tagName.toLowerCase()).toBe("a");
		expect(node.className).toBe("ui-button ui-button--cta hero-cta");
		expect(node.getAttribute("href")).toBe("/demo");
		expect(node.children).toHaveLength(1);
		expect(node.children.item(0)?.className).toBe("ui-button__label");
		expect(node.children.item(0)?.textContent).toBe("Demo Drive");
	});

	test("renders native button mode and defaults type to button", () => {
		const defaultTypeNode = new Button({
			as: "button",
			label: "Save",
			variant: "solid",
		}).renderToNode();
		const submitTypeNode = new Button({
			as: "button",
			type: "submit",
			label: "Submit",
			variant: "solid",
		}).renderToNode();

		expect(defaultTypeNode.tagName.toLowerCase()).toBe("button");
		expect(defaultTypeNode.getAttribute("type")).toBe("button");
		expect(submitTypeNode.getAttribute("type")).toBe("submit");
	});

	test("applies attrs, aria, and data while ignoring reserved attrs", () => {
		const node = new Button({
			label: "Open menu",
			variant: "text",
			href: "/menu",
			attrs: {
				title: "Open menu",
				class: "ignored",
				className: "ignored",
				href: "/should-not-override",
				type: "submit",
			},
			aria: {
				label: "Open main menu",
				expanded: false,
				"aria-controls": "menu-panel",
			},
			dataset: {
				trackingId: 42,
				"data-state": "active",
			},
		}).renderToNode();

		expect(node.className).toBe("ui-button ui-button--text");
		expect(node.getAttribute("href")).toBe("/menu");
		expect(node.getAttribute("title")).toBe("Open menu");
		expect(node.getAttribute("aria-label")).toBe("Open main menu");
		expect(node.getAttribute("aria-expanded")).toBe("false");
		expect(node.getAttribute("aria-controls")).toBe("menu-panel");
		expect(node.getAttribute("data-tracking-id")).toBe("42");
		expect(node.getAttribute("data-state")).toBe("active");
		expect(node.hasAttribute("type")).toBe(false);
	});

	test("adds noopener and noreferrer when target is _blank", () => {
		const node = new Button({
			label: "Docs",
			variant: "text",
			href: "/docs",
			attrs: { target: "_blank" },
		}).renderToNode();

		expect(node.getAttribute("target")).toBe("_blank");
		expect(node.getAttribute("rel")).toBe("noopener noreferrer");
	});

	test("preserves existing rel tokens and appends only missing security tokens", () => {
		const nodeWithPartialRel = new Button({
			label: "Docs",
			variant: "text",
			href: "/docs",
			attrs: { target: "_blank", rel: "nofollow noopener" },
		}).renderToNode();
		const nodeWithFullRel = new Button({
			label: "Docs",
			variant: "text",
			href: "/docs",
			attrs: { target: " _BLANK ", rel: "noopener noreferrer" },
		}).renderToNode();

		expect(nodeWithPartialRel.getAttribute("rel")).toBe(
			"nofollow noopener noreferrer",
		);
		expect(nodeWithFullRel.getAttribute("rel")).toBe("noopener noreferrer");
	});
});
