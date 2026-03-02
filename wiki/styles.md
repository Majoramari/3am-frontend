# Styling Guide

This page shows where styles live, how to add them, and the rules to keep the UI consistent.

**Where It Fits**
- Style your component or section after you build it.
- For structure, see [Components](components.md), [Sections](sections.md), and [Pages](pages.md).

## Style files and layers

`src/styles/index.css` imports these layers:
- `reset.css` basic resets.
- `base.css` tokens and global defaults.
- `layout.css` layout helpers.
- `components.css` component styles.
- `utilities.css` small utility classes.

Layer order:
`@layer reset, base, layout, components, utilities;`

## How to add styles

1. Give the view a class in its constructor.
2. Add the CSS in the right layer.

Example:

```ts
export class CartPage extends View<"div"> {
	constructor() {
		super("div", { className: "cart-page" });
	}
}
```

`src/styles/components.css`:

```css
@layer components {
	.cart-page {
		padding: 4rem 2.4rem;
		color: #f2f2f2;
	}
}
```

## Rules to follow

1. Scope styles to classes, not tags.
2. Use `rem` for spacing and sizes.
3. Put layout rules in `layout.css`, visuals in `components.css`.
4. Use CSS variables for repeated values.
5. Name classes after the feature (`cart-page`, `cart-item`, `builder-step`).
6. Respect `prefers-reduced-motion` for animations.
7. Avoid extra global styles outside the reset layer.

## Local CSS variables

Define tokens at the smallest scope that makes sense. Use `:root` for app-wide tokens, or declare local variables inside a component class when only that component needs them.

Global example (`src/styles/base.css`):
```css
:root {
	--surface: #0d0f12;
	--text: #f5f7fa;
}
```

Component-scoped example (`src/styles/components.css`):
```css
@layer components {
	.card {
		--card-bg: #11141a;
		--card-radius: 16px;
		background: var(--card-bg);
		border-radius: var(--card-radius);
	}
	.card.highlighted {
		--card-bg: #162032;
	}
}
```

Only the `.card` subtree sees `--card-bg` and `--card-radius`; outside it, global or parent values apply.

## When to split files

If a component's CSS grows big, add a file under `src/styles/components/` and import it from `src/styles/components.css`:

```css
@import "./components/cart.css";
```

## Navigation
- Back to [Index](index.md)
- Next: [Guidelines](guidelines.md)
- Related: [Templates](templates.md)
