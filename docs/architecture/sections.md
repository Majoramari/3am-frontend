# Sections

A section is a page-specific UI block. In 3AM, sections live in `src/sections` and are composed by page classes in `src/pages`.

If you are not sure whether something should be a section or a component, ask one question: will this UI be reused on another page? If yes, make a component. If no, keep it as a section.

If you need a real section implementation reference, see [Hero Carousel](/built/hero-carousel).

## Real project example

`HomePage` mounts `HomeHeroSection` from `src/sections/home/hero.ts`.

The hero behavior logic is split into `src/sections/home/heroCarousel.ts`, while visual styles are in `src/styles/sections/home/hero.css` and `hero-carousel.css`.

This is a good pattern for complex page-specific features: keep markup/content in the section file and move behavior details to a helper module in the same feature folder.

## Basic section pattern

```ts
import { View } from "@lib/view";

export class ExampleSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "example"] });
	}

	render(): DocumentFragment {
		return this.tpl`<h2>Example</h2>`;
	}
}
```

If interaction is needed, attach it in `onMount()` and register listeners via `this.cleanup`.

```ts
protected override onMount(): void {
	this.cleanup.on(window, "resize", () => this.rerender(), { passive: true });
}
```

## Quality check before merge

A section should have feature-scoped class names.

A section should avoid unmanaged side effects in `render()`.

A section should keep shared UI extracted into components.

A section should keep its styles under `src/styles/sections/...`.

For reusable UI extraction patterns, read [Building Components](/library/components).
