# Hero Carousel

This page explains how the **home hero carousel** is implemented and why it is structured this way.

Main files:

- `src/sections/home/hero.ts`
- `src/sections/home/heroCarousel.ts`
- `src/styles/sections/home/hero.css`
- `src/styles/sections/home/hero-carousel.css`

## Why this feature is split

`hero.ts` owns content/markup.

`heroCarousel.ts` owns interaction logic.

Section CSS files own layout and visual behavior.

::: info Why this split matters
You can change copy, buttons, or images without touching interaction internals. You can tune interaction behavior without rewriting slide markup.
:::

## Architecture Comparison

### Problematic Example (hard to maintain)

```text
One huge file with content + behavior + style assumptions mixed together.
```

### Recommended Example (current project pattern)

```text
hero.ts            -> structure/content
heroCarousel.ts    -> autoplay, drag/swipe, keyboard, loop clones
hero.css           -> layout/typography/placement
hero-carousel.css  -> dot navigation visual behavior
```

## Interaction model

The carousel includes:

- autoplay with pause/resume rules
- pointer drag/swipe with threshold
- keyboard arrow navigation
- loop clones for seamless cycling
- reduced-motion handling

### Problematic Example (unsafe interaction)

```ts
render(): DocumentFragment {
	window.addEventListener("resize", () => this.rerender());
	return this.tpl`...`;
}
```

### Recommended Example (safe interaction)

```ts
protected override onMount(): void {
	setupHomeHeroCarousel(this.element, this.cleanup);
}
```

This keeps setup lifecycle-safe and cleanup-aware.

## Media strategy

Each slide uses `LazyPicture` with `phone/tablet/pc` sources.

### Problematic Example (eager single source)

```ts
<img src="/assets/hero/slide-1-1440.png" alt="Hero" />
```

### Recommended Example (responsive + lazy)

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

Related docs: [Sections](/architecture/sections), [Styles](/architecture/styles), [Performance](/guide/performance), [Lazy Media System](/built/lazy-media).

## MDN references

- [`Pointer Events` (MDN)](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [`KeyboardEvent.key` (MDN)](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key)
- [`aria-roledescription` (MDN)](https://developer.mozilla.org/docs/Web/Accessibility/ARIA/Reference/Attributes/aria-roledescription)
- [`<picture>` element (MDN)](https://developer.mozilla.org/docs/Web/HTML/Element/picture)
