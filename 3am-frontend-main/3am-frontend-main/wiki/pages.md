# Pages

Pages are routed views in `src/pages`, registered in `src/app/routes.ts`.

**Where It Fits**
- Pages put sections and components together.
- For building blocks, see [Components](components.md) and [Sections](sections.md).
- For templates, see [Templates](templates.md).

## Create a page

1. Make a file in `src/pages`, for example `src/pages/about.ts`.
2. Extend `View<"div">` (or another tag if needed).
3. In `render()`, clear the root and mount sections or components.
4. Add the route in `src/app/routes.ts`.

```ts
import { View } from "@lib/view";
import { AboutHeroSection } from "@sections/about/hero";

export class AboutPage extends View<"div"> {
	constructor() {
		super("div");
	}

	render(): DocumentFragment {
		return this.tpl`
			${new AboutHeroSection()}
		`;
	}
}
```

```ts
import { AboutPage } from "@pages/about";
import { NotFoundPage } from "@pages/notFound";

export const routes = {
	"/about": { title: "About", create: () => new AboutPage() },
	"/404": { title: "Not found", create: () => new NotFoundPage() },
};
```

## Page lifecycle

The router creates the page when its route is active and destroys it when you leave. Add listeners with `cleanup` so they are removed on destroy.

## Step-by-step: Counter page

Build a simple page that increments a counter and stays clean on rerender.

### Step 1: Create `src/pages/counter.ts`

```ts
import { View } from "@lib/view";
import { html } from "@lib/template";

export class CounterPage extends View<"div"> {
	private count = 0;

	constructor() {
		super("div", { className: "counter-page" });
	}

	render(): DocumentFragment {
		const view = html`
			<h1>Counter</h1>
			<p>Count: ${this.count}</p>
			<button type="button" class="counter-add">Add</button>
		`;

		this.cleanup.on(this.element, "click", (event) => {
			const target = event.target as HTMLElement | null;
			if (!target?.matches(".counter-add")) return;
			this.count += 1;
			this.rerender();
		});

		return view;
	}
}
```

Why this works:
- The page owns its state (`count`).
- `rerender()` rebuilds the DOM and clears old listeners via `cleanup`.
- Listeners are attached with `cleanup.on`, so they are removed on destroy.

### Step 2: Register the route

```ts
import { CounterPage } from "@pages/counter";

export const routes = {
	"/counter": { title: "Counter", create: () => new CounterPage() },
};
```

### Step 3: Add a navbar link

In `src/components/navbar.ts`:

```ts
<li><a class="nav-link" href="/counter">Counter</a></li>
```

### Step 4: Test

Run the app, go to `/counter`, click “Add”, navigate away, and return. The count resets unless you add storage.

**Navigation**
- Back to [Index](index.md)
- Next: [Templates](templates.md)
- Related: [Styling Guide](styles.md)
- Related: [Guidelines](guidelines.md)
