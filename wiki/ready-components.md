# Ready Components

Ready components are prebuilt UI pieces in `src/components` that you can use directly.

**Where It Fits**
- Use this page when you want to drop in existing components quickly.
- For building your own reusable `View` classes, see [Components](components.md).
- For template behavior, see [Templates](templates.md).

## Available now

1. `Button` from `src/components/button.ts`
2. `MediaCard` from `src/components/media-card.ts`

## Button

The button component is a class used as `new Button(config)`.

```ts
import { Button } from "@components/button";
```

### Quick start (anchor mode, default)

```ts
render(): DocumentFragment {
	return this.tpl`
		<div class="actions">
			${new Button({
				label: "Demo Drive",
				variant: "cta",
				href: "/demo",
			})}
		</div>
	`;
}
```

### Native button mode

```ts
const saveButton = new Button({
	as: "button",
	type: "submit",
	label: "Save",
	variant: "solid",
});
```

### Config reference

Common fields for both modes:
- `label: string` visible text.
- `variant: "solid" | "outline" | "text" | "cta"` style variant.
- `inverted?: boolean` flips variant colors for opposite surface.
- `className?: string` extra classes.
- `attrs?: Record<string, string | number | boolean | null | undefined>` generic attributes.
- `aria?: Record<string, string | number | boolean | null | undefined>` ARIA attributes (with or without `aria-` prefix).
- `dataset?: Record<string, string | number | boolean | null | undefined>` data attributes (with or without `data-` prefix).

Anchor mode fields:
- `href: string` required.
- `as?: "a"` optional, anchor is default.

Native button mode fields:
- `as: "button"` required.
- `type?: "button" | "submit" | "reset"` optional, defaults to `"button"`.

### Variants

- `solid`: filled style.
- `outline`: bordered transparent style.
- `text`: text-first style.
- `cta`: primary call-to-action style.

### Attributes, ARIA, and data

```ts
const button = new Button({
	label: "Open menu",
	variant: "text",
	href: "/menu",
	attrs: { title: "Open menu", target: "_self" },
	aria: { label: "Open main menu", expanded: false },
	dataset: { trackingId: "nav-open-menu" },
});
```

### Active page state

If you need route-active styling, add `is-active-page`:

```ts
const link = new Button({
	label: "Home",
	variant: "text",
	href: "/",
});

link.renderToNode().classList.add("is-active-page");
```

### Styling hooks

- Base class: `.ui-button`
- Variant classes: `.ui-button--solid`, `.ui-button--outline`, `.ui-button--text`, `.ui-button--cta`
- State classes: `.is-inverted`, `.is-active-page`
- Label class: `.ui-button__label`
- Styles live in `src/styles/components/button.css`

### Usage notes

- `Button` extends `View` and can be used directly inside `this.tpl`.
- `Button` uses `renderMode: "once"` internally because its markup is static.
- In a `View`, register listeners with `this.cleanup.on(...)` if you attach events.

## MediaCard

The media card component is a class used as `new MediaCard(config)`.

```ts
import { MediaCard } from "@components/media-card";
```

```ts
${new MediaCard({
	label: "Services",
	href: "/gears/services",
	backgroundImage: "/assets/shared/placeholder.png",
})}
```

**Navigation**
- Back to [Index](index.md)
- Next: [Sections](sections.md)
- Related: [Components](components.md)
- Related: [Templates](templates.md)
- Related: [Styling Guide](styles.md)
