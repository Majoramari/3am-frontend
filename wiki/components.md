# Components

Components are reusable UI parts in `src/components`. They can be used in any section or page.
In this repo, all components are `View` subclasses.
Use `renderMode: "once"` in a component constructor when the markup is static.

**Where It Fits**
- Use components for things you will reuse (buttons, cards, nav).
- For prebuilt, ready-to-use components, see [Ready Components](ready-components.md).
- For page-only blocks, see [Sections](sections.md).
- For full pages, see [Pages](pages.md).

## Create a `View` component

1. Make a file in `src/components`, for example `src/components/footer.ts`.
2. Extend `View` with the HTML tag you need.
3. Write `render()` with `this.tpl` or `html` from `@lib/template`.
4. Render it from a parent `View`.

```ts
import { html } from "@lib/template";
import { View } from "@lib/view";

export class Footer extends View<"footer"> {
	constructor() {
		super("footer", { className: "site-footer" });
	}

	render(): DocumentFragment {
		return html`
			<p>(c) 3AM</p>
		`;
	}
}
```

## Use a `View` component

Inside another `View`, render it with `this.tpl`:

```ts
render(): DocumentFragment {
	return this.tpl`
		<section class="layout">
			${new Footer()}
		</section>
	`;
}
```

`this.tpl` handles rendering and lifecycle cleanup for nested `View` instances.

## Use a ready component

Ready components are usually class-based and can be used directly inside `this.tpl`.

```ts
import { Button } from "@components/button";

render(): DocumentFragment {
	return this.tpl`
		<section class="actions">
			${new Button({
				label: "Demo Drive",
				variant: "cta",
				href: "/demo",
			})}
		</section>
	`;
}
```

## Put a list of components in a template

Both patterns work in lists:

```ts
import { MediaCard } from "@components/media-card";

render(): DocumentFragment {
	return this.tpl`
		<ul>
			${cards.map((card) => new MediaCard(card))}
		</ul>
	`;
}
```

And for `View` subclasses:

```ts
render(): DocumentFragment {
	return this.tpl`
		<section class="cards">
			${items.map((item) => new ProductCard(item))}
		</section>
	`;
}
```

`this.tpl` handles arrays, DOM nodes, and nested `View` instances.

## Register events with cleanup

Always add listeners with `this.cleanup.on` so they go away on re-render or destroy.

```ts
import { html } from "@lib/template";
import { View } from "@lib/view";

export class Counter extends View<"div"> {
	private count = 0;

	constructor() {
		super("div", { className: "counter" });
	}

	render(): DocumentFragment {
		const view = html`
			<p>Clicks: ${this.count}</p>
			<button type="button">Add</button>
		`;

		this.cleanup.on(this.element, "click", (event) => {
			const target = event.target as HTMLElement | null;
			if (!target?.matches("button")) return;
			this.count += 1;
			this.rerender();
		});

		return view;
	}
}
```

- `cleanup.on` adds the listener and remembers how to remove it.
- Call `rerender()` after state changes; it runs cleanup and replaces children.
- Re-register listeners inside `render()` (or a helper you call from `render()`), since they are cleared on each rerender.
- When the view is destroyed, `cleanup.run()` removes old handlers and prevents leaks.

## Notes
- `View` constructor accepts `className`, `id`, `attrs`, and `dataset`.

**Navigation**
- Back to [Index](index.md)
- Next: [Ready Components](ready-components.md)
- Related: [Templates](templates.md)
- Related: [Styling Guide](styles.md)
- Related: [Guidelines](guidelines.md)
