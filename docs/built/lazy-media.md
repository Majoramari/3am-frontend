# Lazy Media System

This page explains how lazy media works in 3AM as an implementation system, not just a component API.

Core files:

- `src/lib/lazyMedia.ts`
- `src/lib/lazyMediaHydration.ts`
- `src/components/lazyImage.ts`
- `src/components/lazyPicture.ts`
- `src/components/lazyVideo.ts`

## System model

The app creates one lazy-media controller during startup.

That controller scans for deferred media attributes and hydrates them when targets intersect viewport thresholds.

It scans once at startup and again after each route change.

## Attributes the system hydrates

- `data-lazy-src`
- `data-lazy-srcset`
- `data-lazy-sizes`
- `data-lazy-poster`
- `data-lazy-bg-src`

## Pattern Comparison

### Problematic Example (eager media)

```html
<img src="/assets/dusk/dusk_transparent.webp" alt="Dusk" />
```

### Recommended Example (deferred media)

```html
<img
	src="/assets/shared/placeholder.png"
	data-lazy-src="/assets/dusk/dusk_transparent.webp"
	alt="Dusk"
/>
```

::: tip Preferred usage
Use `LazyImage`, `LazyPicture`, and `LazyVideo` so attribute wiring is generated correctly.
:::

## Why this system exists

Better first paint behavior for heavy pages.

Lower chance of loading off-screen media too early.

Consistent hydration logic across images, picture sources, videos, and deferred backgrounds.

## Common mistakes

Using plain heavy `<img>` where `LazyImage` should be used.

Using custom deferred attributes that the controller does not scan.

Forgetting route-change rescans when custom DOM insertion bypasses normal route flow.

Related docs: [Performance](/guide/performance), [Ready Components](/library/ready-components), [Building Components](/library/components).

::: warning Keep one strategy
Do not mix multiple custom lazy-loading strategies in the same feature unless there is a strong reason.
Prefer the project controller for consistency.
:::

## MDN references

- [`IntersectionObserver` (MDN)](https://developer.mozilla.org/docs/Web/API/IntersectionObserver)
- [`HTMLElement.dataset` (MDN)](https://developer.mozilla.org/docs/Web/API/HTMLElement/dataset)
- [`<source>` element (MDN)](https://developer.mozilla.org/docs/Web/HTML/Element/source)
- [`HTMLMediaElement.load()` (MDN)](https://developer.mozilla.org/docs/Web/API/HTMLMediaElement/load)
