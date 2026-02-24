# Testing

3AM uses `bun test` with `happy-dom`.

The goal is behavior safety. Tests should protect user-visible outcomes and integration contracts, not implementation details.

## Run tests

Run the full suite:

```bash
bun test
```

Run one file while working:

```bash
bun test tests/navbar.test.ts
```

## Existing coverage

Current tests include button, navbar, bootloader, media card, lazy media components, and lazy media controller behavior.

Use these files as examples when adding new tests.

## Project test pattern

Most test files follow the same shape:

```ts
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { installDom, resetDom } from "./helpers/dom";

describe("example", () => {
	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		resetDom();
	});

	it("does something visible", () => {
		// render component/page
		// assert DOM output and behavior
	});
});
```

Focus assertions on output, accessibility attributes, and interaction results.

## When tests are required

Add or update tests when you change route behavior, navigation behavior, UI state logic, ARIA behavior, lazy media hydration, or boot-loader timing/flow.

## Before PR

```bash
bun test
bun run build
bun run docs:build
```

If performance-sensitive code changed:

```bash
bun run build:bundle
bun run budget
```
