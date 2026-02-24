# Guidelines

This page explains how to write code in 3AM so other contributors can read it quickly and extend it safely.

The main rule is simple: keep behavior predictable.

## Think in project layers

In this codebase, each folder has a clear role. Reusable UI belongs in `src/components`. Page-specific UI belongs in `src/sections`. Route-level composition belongs in `src/pages`. Shared behavior belongs in `src/lib`.

When a block is reused in multiple places, move it to a component. When it is only for one page, keep it in the section.

::: tip Quick decision rule
If a block appears on two pages, treat it as a component candidate.
:::

## Keep `render()` deterministic and side-effect light

`render()` should only describe UI from current state. It should not register global listeners, timers, or long-running effects.

### Problematic Example (unsafe pattern)

```ts
render(): DocumentFragment {
	window.addEventListener("scroll", this.handleScroll);
	return this.tpl`<div>...</div>`;
}
```

This code can register duplicate listeners whenever rendering happens again.

### Recommended Example (project pattern)

```ts
protected override onMount(): void {
	this.cleanup.on(window, "scroll", this.handleScroll, { passive: true });
}

render(): DocumentFragment {
	return this.tpl`<div>...</div>`;
}
```

In this version, setup happens in lifecycle, and cleanup is automatic.

::: warning Anti-pattern to avoid
Never attach global listeners directly in `render()`.
:::

## Use lifecycle and cleanup intentionally

Use `onMount()` for DOM-dependent setup.

Use `this.cleanup.on(...)` for listeners and `this.cleanup.add(...)` for manual disposal callbacks.

Use `onDestroy()` only when you need explicit teardown logic before normal cleanup runs.

### Custom teardown with `cleanup.add`

```ts
protected override onMount(): void {
	const observer = new ResizeObserver(() => {
		this.rerender();
	});
	observer.observe(this.element);

	this.cleanup.add(() => observer.disconnect());
}
```

For lifecycle internals, see [View Lifecycle](/reference/view-lifecycle).

## Keep styling in CSS, not in TS strings

For reusable UI, prefer classes plus `src/styles/components/*.css`.

### Problematic Example

```ts
super("span", {
	attrs: { style: "padding:4px 8px; background:#222; color:#fff" },
});
```

### Recommended Example

```ts
super("span", { className: "promo-badge", renderMode: "once" });
```

```css
@layer components {
	.promo-badge {
		padding: 0.4rem 0.8rem;
		background: #222;
		color: #fff;
	}
}
```

This split keeps behavior in TypeScript and design in CSS.

For full styling flow, see [Styles](/architecture/styles).

## Keep selectors and class names disciplined

Component and section styles should use class selectors, not raw element selectors.

Use modern CSS and BAM naming with module prefixes (for example, navbar classes start with `nav-`).

For the required selector, modern CSS, and BAM rules with examples, follow [Styles](/architecture/styles).

## Prefer lazy media for heavy assets

The project already has lazy media infrastructure. Use it.

### Problematic Example

```ts
render(): DocumentFragment {
	return this.tpl`<img src="/assets/dusk/dusk_transparent.webp" alt="Dusk" />`;
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
			className: "hero-image",
		})}
	`;
}
```

Use `LazyPicture` when each breakpoint has a different file. Use `LazyVideo` for deferred poster and video source loading.

::: tip Performance habit
For hero images, always ask: "Can this be lazy + responsive with `LazyPicture`?"
:::

For component APIs and performance context, see [Ready Components](/library/ready-components) and [Performance](/guide/performance).

## Build small internal utilities when logic is reused

If helper logic repeats in two or more places, extract it into `src/lib` with a focused name.

A good current example is `wait(ms)` in `src/lib/async.ts`, used by boot-loader timing logic. Keep these helpers small, typed, and framework-agnostic when possible.

### Problematic Example (duplicated timing logic)

```ts
await new Promise((resolve) => window.setTimeout(resolve, 300));
```

### Recommended Example (shared utility)

```ts
import { wait } from "@lib/async";

await wait(300);
```

If you want to see how the existing app is wired today, check [Core System](/built/core-system) and [Hero Carousel](/built/hero-carousel).

## MDN references

- [`addEventListener` (MDN)](https://developer.mozilla.org/docs/Web/API/EventTarget/addEventListener)
- [`prefers-reduced-motion` (MDN)](https://developer.mozilla.org/docs/Web/CSS/@media/prefers-reduced-motion)
- [`data-*` attributes (MDN)](https://developer.mozilla.org/docs/Web/HTML/Global_attributes/data-*)
- [`IntersectionObserver` (MDN)](https://developer.mozilla.org/docs/Web/API/IntersectionObserver)

## Validation before PR

```bash
bun test
bun run build
bun run docs:build
```

If bundle size may change:

```bash
bun run build:bundle
bun run budget
```
