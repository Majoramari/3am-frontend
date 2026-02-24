# Performance

This page explains how performance is handled in 3AM and what you should do before adding heavy UI.

The project already has strong lazy-loading infrastructure. Most performance regressions happen when contributors bypass it.

For API-level component usage, pair this page with [Ready Components](/library/ready-components) and [Building Components](/library/components).

## Default strategy: lazy media components

For images and video, prefer project components first:

`LazyImage` for a single source image.

`LazyPicture` for responsive phone/tablet/desktop assets.

`LazyVideo` for deferred poster/source hydration.

These are connected to `src/lib/lazyMedia.ts`, which scans the page and hydrates deferred media with `IntersectionObserver`.

## What lazy media controller looks for

The controller hydrates elements with attributes like:

`data-lazy-src`, `data-lazy-srcset`, `data-lazy-sizes`, `data-lazy-poster`, and `data-lazy-bg-src`.

Initial scan runs at app startup. Another scan runs after every route change. That is why route-level media can stay lazy even in SPA navigation.

## plain image vs project lazy image

### Problematic Example

```ts
render(): DocumentFragment {
	return this.tpl`<img src="/assets/dusk/dusk_transparent.webp" alt="Dusk" />`;
}
```

### Recommended Example

```ts
render(): DocumentFragment {
	return this.tpl`
		${new LazyImage({
			src: "/assets/dusk/dusk_transparent.webp",
			alt: "Dusk",
			className: "hero-image",
		})}
	`;
}
```

## responsive hero image

### Problematic Example

```ts
<img src="/assets/hero/slide-1-1440.png" alt="Hero" />
```

### Recommended Example

```ts
${new LazyPicture({
	src: {
		phone: "/assets/hero/slide-1-520.png",
		tablet: "/assets/hero/slide-1-1024.png",
		pc: "/assets/hero/slide-1-1440.png",
	},
	alt: "Hero slide",
	sizes: "100vw",
	pictureClassName: "hero-slide-picture",
	className: "hero-slide-image",
})}
```

## Boot loader and perceived performance

`src/app/bootloader.ts` keeps the loader visible until critical conditions are met:

1. minimum visible time
2. page load event
3. critical image decode
4. critical font readiness

It also respects reduced-motion and skips fade transition in that mode.

## Bundle budget checks

When your change can affect payload size, run:

```bash
bun run build:bundle
bun run budget
```

Budget limits are defined in `package.json` (`size-limit`). Increase limits only with a clear reason and mention it in PR.

## Common mistakes that hurt performance

Mounting heavy media without lazy strategy.

Adding expensive work inside frequently called paths.

Registering repeated listeners because setup is done in `render()` instead of lifecycle.

Adding rich motion without reduced-motion fallback.

## MDN references

- [`IntersectionObserver` (MDN)](https://developer.mozilla.org/docs/Web/API/IntersectionObserver)
- [`HTMLImageElement.decode()` (MDN)](https://developer.mozilla.org/docs/Web/API/HTMLImageElement/decode)
- [`FontFaceSet.ready` (MDN)](https://developer.mozilla.org/docs/Web/API/FontFaceSet/ready)
- [`Lazy loading` (MDN)](https://developer.mozilla.org/docs/Web/Performance/Lazy_loading)
- [`<picture>` element (MDN)](https://developer.mozilla.org/docs/Web/HTML/Element/picture)
