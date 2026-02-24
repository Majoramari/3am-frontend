# Building Components

This page explains how to build a reusable component in 3AM using the same patterns already used in the codebase.

The goal is not only to make something work, but to make it easy to reuse, easy to style, and safe to maintain.

If you need current production examples first, see [Core System](/built/core-system), [Navbar](/built/navbar), and [Hero Carousel](/built/hero-carousel).

## What a solid component looks like in 3AM

A good component has a typed config object, stable rendering behavior, class-based styling, and lifecycle-safe interactions.

It should also prefer existing project utilities (`View`, `this.tpl`, `this.cleanup`, lazy media components) instead of custom one-off patterns.

## Example: create a simple reusable component

```ts
import { View } from "@lib/view";

type TagPillConfig = {
	label: string;
	className?: string;
};

export class TagPill extends View<"span"> {
	private readonly label: string;

	constructor(config: TagPillConfig) {
		super("span", {
			className: ["tag-pill", config.className ?? ""].filter(Boolean).join(" "),
			renderMode: "once",
		});
		this.label = config.label;
	}

	render(): DocumentFragment {
		return this.tpl`${this.label}`;
	}
}
```

`renderMode: "once"` is correct here because the content does not change after mount.

## Styling a component correctly

### Problematic Example (hard to maintain)

```ts
export class PromoBadge extends View<"span"> {
	constructor() {
		super("span", {
			attrs: { style: "color: #fff; background: #222; padding: 4px 8px" },
		});
	}

	render(): DocumentFragment {
		return this.tpl`New`;
	}
}
```

Problems with this version:

Design is hidden in TypeScript strings.

Reusing style in another component becomes painful.

Design updates require touching logic files.

### Recommended Example (project standard)

Component file:

```ts
export class PromoBadge extends View<"span"> {
	constructor() {
		super("span", { className: "promo-badge", renderMode: "once" });
	}

	render(): DocumentFragment {
		return this.tpl`New`;
	}
}
```

Style file `src/styles/components/promoBadge.css`:

```css
@layer components {
	.promo-badge {
		display: inline-block;
		padding: 0.4rem 0.8rem;
		border-radius: 999rem;
		background: rgb(34 34 34);
		color: rgb(255 255 255);
		font-size: 1.2rem;
	}
}
```

Import style in `src/styles/index.css`:

```css
@import "./components/promoBadge.css";
```

## Interaction safety

### Problematic Example (unsafe)

```ts
render(): DocumentFragment {
	window.addEventListener("resize", () => {
		this.rerender();
	});

	return this.tpl`<div>...</div>`;
}
```

This can add duplicate listeners when rendering repeats.

### Recommended Example (safe)

```ts
protected override onMount(): void {
	this.cleanup.on(window, "resize", () => {
		this.rerender();
	});
}

render(): DocumentFragment {
	return this.tpl`<div>...</div>`;
}
```

This uses lifecycle correctly and cleanup is automatic on destroy/rerender.

For lifecycle details, see [View Lifecycle](/reference/view-lifecycle).

## Lazy media usage in components

When a component renders heavy media, prefer lazy components.

### Problematic Example

```ts
render(): DocumentFragment {
	return this.tpl`
		<img src="/assets/dusk/dusk_transparent.webp" alt="Dusk" />
	`;
}
```

### Recommended Example

```ts
import { LazyImage } from "@components/lazyImage";

render(): DocumentFragment {
	return this.tpl`
		${new LazyImage({
			src: "/assets/dusk/dusk_transparent.webp",
			alt: "Dusk",
			className: "card-image",
		})}
	`;
}
```

If you need responsive sources, use `LazyPicture`.

If you need deferred video source/poster, use `LazyVideo`.

For lazy media behavior details, see [Performance](/guide/performance).

## Component vs section decision

Choose a component when UI is shared or likely to be shared.

Choose a section when UI is specific to one page only.

In current project terms: shared UI in `src/components`, page-only UI in `src/sections`.

## Final check before PR

```bash
bun test
bun run build
bun run docs:build
```

## MDN references

- [`DocumentFragment` (MDN)](https://developer.mozilla.org/docs/Web/API/DocumentFragment)
- [`addEventListener` (MDN)](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
- [`<picture>` element (MDN)](https://developer.mozilla.org/docs/Web/HTML/Element/picture)
