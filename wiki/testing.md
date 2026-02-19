# Testing Guide

Use this guide when you add or update tests.

**Where It Fits**
- Read this after [Guidelines](guidelines.md) and before opening a PR in [Contributing](contributing.md).
- Current test stack: `bun test` + `happy-dom`.

## When to add tests

Please add tests when possible, especially for:
- Behavior changes in components (`Button`, `MediaCard`, `Navbar`, etc.).
- Logic changes that can break routing, active states, attributes, or accessibility.
- Bug fixes (add a test that would fail before the fix).

You can skip tests for:
- Pure content copy changes.
- Visual-only tweaks that have no stable behavior to assert.

## Commands

Run tests:

```bash
bun test
```

Run one test file:

```bash
bun test tests/button.test.ts
```

Run checks before PR:

```bash
bun test
npm run build
npm run lint
```

## Test layout

- Keep tests in `tests/`.
- Use one file per feature/component when practical:
  - `tests/button.test.ts`
  - `tests/media-card.test.ts`
  - `tests/navbar.test.ts`
- Reuse DOM setup from `tests/helpers/dom.ts`.

## Writing component tests

Pattern:

1. Set up DOM in `beforeEach`.
2. Reset DOM in `afterEach`.
3. Render component and assert stable behavior (not implementation noise).

Example:

```ts
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

	test("adds rel security tokens for target _blank", () => {
		const node = new Button({
			label: "Docs",
			variant: "text",
			href: "/docs",
			attrs: { target: "_blank" },
		}).renderToNode();

		expect(node.getAttribute("rel")).toBe("noopener noreferrer");
	});
});
```

## What to assert

Prefer assertions on:
- Element type and critical attributes.
- Accessibility attributes (`aria-*`, `aria-current`).
- Active/inactive classes from route/menu logic.
- Config-to-output mapping (for example, style tokens or dataset values).

Avoid:
- Reasserting every DOM detail.
- Tests that only check that a method was called.

## Navigation
- Back to [Index](index.md)
- Related: [Guidelines](guidelines.md)
- Related: [Contributing](contributing.md)
