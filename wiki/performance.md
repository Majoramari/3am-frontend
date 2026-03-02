# Performance (Advanced lazyMedia Module Guide)

Use this page when you need direct control of the `lazyMedia` module.  
Default usage should be `LazyImage` and `LazyVideo` from [Ready Components](ready-components.md).

## Direct lazyMedia attributes

### Image

```html
<img
	src="/assets/shared/placeholder.png"
	data-lazy-src="/assets/dusk/hero.webp"
	loading="lazy"
	decoding="async"
	alt="Dusk hero"
/>
```

### Responsive image (`picture`)

```html
<picture>
	<source
		type="image/avif"
		data-lazy-srcset="/assets/dawn/hero.avif 1x, /assets/dawn/hero@2x.avif 2x"
	/>
	<img
		src="/assets/shared/placeholder.png"
		data-lazy-src="/assets/dawn/hero.webp"
		alt="Dawn hero"
	/>
</picture>
```

### Video

```html
<video
	controls
	muted
	playsinline
	preload="none"
	data-lazy-poster="/assets/dusk/video-poster.webp"
>
	<source data-lazy-src="/assets/dusk/hero_video.webm" type="video/webm" />
</video>
```

### Background image

```html
<div
	class="my-card"
	data-lazy-bg-src="/assets/gears/card.webp"
	data-lazy-bg-css-var="--media-card-bg-image"
></div>
```

If your CSS does not use a variable, remove `data-lazy-bg-css-var` and keep only `data-lazy-bg-src`.

## Performance budgets in code

Budgets are configured in the `size-limit` section of `package.json`.

Run locally before PR:

```bash
bun run build:bundle
bun run budget
```

### Add/Edit budget entries

Add a new object under `size-limit` in `package.json`:

```json
{
	"name": "Dawn Route",
	"path": "dist/assets/dawn-*.js",
	"limit": "12 KB"
}
```

### Typical workflow

1. Add feature code.
2. Run `bun run build:bundle`.
3. Run `bun run budget`.
4. If needed, update matching `size-limit` entries in `package.json`.
5. Push; CI runs the same budget command.

## Navigation

- Back to [Index](index.md)
- Related: [Ready Components](ready-components.md)
- Related: [Pages](pages.md)
- Related: [Sections](sections.md)
- Related: [Guidelines](guidelines.md)
- Related: [Testing](testing.md)
