# Components

Components are reusable UI parts in `src/components`. They can be used in any section or page.

**Where It Fits**
- Use components for things you will reuse (buttons, cards, nav).
- For page-only blocks, see [Sections](sections.md).
- For full pages, see [Pages](pages.md).

## Create a component

1. Make a file in `src/components`, for example `src/components/footer.ts`.
2. Extend `View` with the HTML tag you need.
3. Write `render()` with the `html` helper from `@lib/template`.
4. Mount it from a parent view.

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

## Use a component

Mount it and let the parent clean it up:

```ts
this.mountChild(new Footer());
```

## Put a component in a template

Inside a `View`, use `this.tpl` so the component is rendered and cleaned up for you:

```ts
render(): DocumentFragment {
	return this.tpl`
		<section class="actions">
			${new Footer()}
		</section>
	`;
}
```

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
- Next: [Sections](sections.md)
- Related: [Templates](templates.md)
- Related: [Styling Guide](styles.md)
- Related: [Guidelines](guidelines.md)
