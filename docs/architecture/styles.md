# Styles

This page explains how styling is organized in 3AM and how to add new styles without creating CSS conflicts.

## How the style system is loaded

All CSS is imported from `src/styles/index.css`, in this order:

```css
@import "./reset.css";
@import "./base.css";
@import "./layout.css";
@import "./components/button.css";
@import "./components/mediaCard.css";
@import "./components/navbar.css";
@import "./sections/home.css";
@import "./utilities.css";

@layer reset, base, layout, components, sections, utilities;
```

Order and layers matter. Base tokens should not override component styles, and component styles should not accidentally override section-specific rules.

## Where to put new CSS

If the style belongs to a reusable component, create `src/styles/components/<name>.css`.

If the style belongs to a single page feature, create or update `src/styles/sections/<page>/<feature>.css`.

If the change is global layout behavior, use `src/styles/layout.css`.

If the change is a token/default, use `src/styles/base.css`.

## Build and style a new component (real workflow)

Assume you create `src/components/tagPill.ts`.

### 1) Add class names in TypeScript

```ts
import { View } from "@lib/view";

export class TagPill extends View<"span"> {
	constructor() {
		super("span", { className: "tag-pill", renderMode: "once" });
	}

	render(): DocumentFragment {
		return this.tpl`New`;
	}
}
```

### 2) Create CSS file

`src/styles/components/tagPill.css`

```css
@layer components {
	.tag-pill {
		display: inline-flex;
		align-items: center;
		padding: 0.4rem 0.8rem;
		border-radius: var(--radius-pill);
		background: rgb(32 32 32);
		color: rgb(255 255 255);
		font-size: 1.2rem;
	}
}
```

### 3) Import this file in `src/styles/index.css`

```css
@import "./components/tagPill.css";
```

### 4) Validate

```bash
bun run build
bun test
```

## inline style vs project style pattern

### Problematic Example (hard to scale)

```ts
super("span", {
	attrs: { style: "padding:4px 8px; background:#222; color:#fff" },
});
```

### Recommended Example (maintainable)

```ts
super("span", { className: "tag-pill" });
```

With this pattern, design changes happen in CSS files, not inside TypeScript strings.

## heavy image in section

### Problematic Example

```ts
return this.tpl`<img src="/assets/hero/slide-1-1440.png" alt="Hero" />`;
```

### Recommended Example

```ts
return this.tpl`
	${new LazyPicture({
		src: {
			phone: "/assets/hero/slide-1-520.png",
			tablet: "/assets/hero/slide-1-1024.png",
			pc: "/assets/hero/slide-1-1440.png",
		},
		alt: "Hero",
		sizes: "100vw",
		className: "hero-slide-image",
		pictureClassName: "hero-slide-picture",
	})}
`;
```

This aligns with the lazy media controller and reduces first-load cost for large assets.

## Animation and accessibility

When you add transitions or animation, include reduced-motion support:

```css
@media (prefers-reduced-motion: reduce) {
	.tag-pill {
		transition: none;
	}
}
```

The codebase already uses this pattern in multiple places. Keep it consistent.
