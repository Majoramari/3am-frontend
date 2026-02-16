# Sections

Sections are blocks that belong to one page. They live in `src/sections/<page>`.

**Where It Fits**
- Pages put sections together.
- If a block repeats across pages, make it a [Component](components.md) instead.

## Create a section

1. Add a file such as `src/sections/home/hero.ts`.
2. Extend `View<"section">` and add the shared `page-section` class.
3. Render with the `html` helper.

```ts
import { html } from "@lib/template";
import { View } from "@lib/view";

export class HomeHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "hero"] });
	}

	render(): DocumentFragment {
		return html`
			<h1>Hello World</h1>
		`;
	}
}
```

## Use a section in a page

Mount it and let the page handle cleanup:

```ts
render(): void {
	return this.tpl`
		${new HomeHeroSection()}
	`;
}
```

## Tips
- Keep sections scoped to one page.
- Move shared blocks to `src/components`.

**Navigation**
- Back to [Index](index.md)
- Next: [Pages](pages.md)
- Related: [Components](components.md)
- Related: [Styling Guide](styles.md)
- Related: [Guidelines](guidelines.md)
