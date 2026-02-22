# Ready Components

Ready components are prebuilt UI pieces in `src/components` that you can use directly.

**Where It Fits**
- Use this page when you want to drop in existing components quickly.
- For building your own reusable `View` classes, see [Components](components.md).
- For template behavior, see [Templates](templates.md).

## Available now

1. `Button` from `src/components/button.ts`
2. `MediaCard` from `src/components/mediaCard.ts`
3. `LazyImage` from `src/components/lazyImage.ts`
4. `LazyVideo` from `src/components/lazyVideo.ts`

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
import { MediaCard } from "@components/mediaCard";
```

```ts
${new MediaCard({
	label: "Services",
	href: "/gears/services",
	backgroundImage: "/assets/shared/placeholder.png",
})}
```

## LazyImage

Use this for heavy images below the fold without manually writing `data-lazy-*`.
Config is fully typed, so your editor should autocomplete fields like `src`, `alt`, `srcset`, and `sizes`.

```ts
import { LazyImage } from "@components/lazyImage";
import duskHeroImageSrc from "@assets/dusk/dusk_transparent.webp";
```

```ts
render(): DocumentFragment {
	return this.tpl`
			<section class="page-section">
				${new LazyImage({
					src: duskHeroImageSrc,
					alt: "Dusk hero",
					className: "hero-image",
				})}
			</section>
	`;
}
```

Useful fields:
- `src` real image URL (required).
- `alt` alt text (required).
- `className` optional extra classes.
- `placeholderSrc` optional placeholder image.
- `srcset` and `sizes` optional responsive image values.
- `width` and `height` optional dimensions.

## LazyVideo

Use this for below-the-fold videos. It writes lazy source attributes for you.
Config is fully typed, so your editor should autocomplete `src`, `type`, `poster`, and playback flags.

```ts
import { LazyVideo } from "@components/lazyVideo";
import dawnVideoSrc from "@assets/dusk/hero_video.webm";
import dawnPosterSrc from "@assets/dusk/hero_endframe.webp";
```

```ts
render(): DocumentFragment {
	return this.tpl`
			<section class="page-section">
				${new LazyVideo({
					src: dawnVideoSrc,
					type: "video/webm",
					poster: dawnPosterSrc,
					controls: true,
					muted: true,
					playsInline: true,
				})}
			</section>
	`;
}
```

Useful fields:
- `src` direct single-source video URL (recommended default).
- `type` optional MIME type for single-source mode.
- `sources` optional array for multi-source mode.
- `poster` optional real poster URL.
- `placeholderPoster` optional placeholder poster.
- `preload` optional preload mode (`"none"` default).
- `controls`, `muted`, `loop`, `autoPlay`, `playsInline` optional flags.

Path autocomplete tip:
- Importing assets gives better editor autocomplete and safer refactors than hardcoded `"/assets/..."` strings.
- Use the project alias for shorter imports: `@assets/...`.

## Advanced lazyMedia guide

For direct module-level lazy attributes (without components), see:

- [Performance (Advanced lazyMedia Module Guide)](performance.md)

**Navigation**
- Back to [Index](index.md)
- Next: [Sections](sections.md)
- Related: [Components](components.md)
- Related: [Templates](templates.md)
- Related: [Styling Guide](styles.md)
