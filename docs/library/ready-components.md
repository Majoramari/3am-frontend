# Ready Components

This page shows the reusable components that are already available in 3AM and when to use each one.

You should prefer these components before creating a new one, because they already match project behavior, styles, and test patterns.

## Button

`Button` gives one API for both links and native button elements.

```ts
new Button({
	label: "Demo Drive",
	variant: "cta",
	href: "/demo",
});
```

For native element mode:

```ts
new Button({
	as: "button",
	label: "Save",
	variant: "solid",
});
```

If link target is `_blank`, required `rel` tokens are handled safely.

## MediaCard

Use `MediaCard` when you need a clickable visual tile with background image and text anchor options.

```ts
new MediaCard({
	label: "Services",
	href: "/gears/services",
	backgroundImage: "/assets/shared/placeholder.png",
	deferBackgroundLoad: true,
	textAnchor: "bottom-left",
});
```

## LazyImage

Use `LazyImage` for single-source image loading with deferred hydration.

```ts
new LazyImage({
	src: "/assets/dusk/dusk_transparent.webp",
	alt: "Dusk",
	className: "hero-image",
});
```

## LazyPicture

Use `LazyPicture` when each device breakpoint has a different file.

```ts
new LazyPicture({
	src: {
		phone: "/assets/hero/slide-1-520.png",
		tablet: "/assets/hero/slide-1-1024.png",
		pc: "/assets/hero/slide-1-1440.png",
	},
	alt: "Hero slide",
	pictureClassName: "hero-slide-picture",
	className: "hero-slide-image",
	sizes: "100vw",
});
```

## LazyVideo

Use `LazyVideo` to defer heavy video loading.

```ts
new LazyVideo({
	src: "/assets/dusk/hero_video.webm",
	type: "video/webm",
	poster: "/assets/dusk/hero_endframe.webp",
	controls: true,
	muted: true,
	playsInline: true,
});
```

## Navbar

`Navbar` is mounted globally from `startApp()` and handles desktop mega menu behavior, mobile menu behavior, active route link state, and deferred media in nav panels.

If your task changes global navigation behavior, start from `src/components/navbar.ts` and run navbar tests before PR.

## Visual before/after: plain media vs lazy media

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

The second version uses the project lazy media pipeline and avoids eager loading heavy images.
