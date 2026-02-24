# View Lifecycle

This page explains how `View` works in 3AM, based on `src/lib/view.ts`.

Understanding this class will help you avoid most rendering and cleanup bugs.

## Mount flow

When a view is mounted, `renderToNode()` prepares the root element and calls `render()`.

After the element is attached to the DOM, a microtask checks connection state. If connected for the first time, `onMount()` runs once.

That means DOM-dependent setup belongs in `onMount()`, not in constructor and not in `render()`.

### Problematic Example (setup in constructor)

```ts
constructor() {
	super("section");
	this.$<HTMLButtonElement>(".cta");
}
```

This fails because constructor runs before template content exists.

### Recommended Example (setup in `onMount`)

```ts
protected override onMount(): void {
	const cta = this.$<HTMLButtonElement>(".cta");
	this.cleanup.on(cta, "click", this.handleClick);
}
```

::: tip Good default
If code needs real DOM nodes from your template, put it in `onMount()`.
:::

## Rerender flow

When `rerender()` runs:

Existing cleanup tasks are executed first.

`render()` output replaces current children.

Mount connection check is queued again.

Because cleanup runs first, listeners registered with `this.cleanup.on(...)` do not stack across rerenders.

### Problematic Example (listener stacking)

```ts
render(): DocumentFragment {
	window.addEventListener("resize", this.handleResize);
	return this.tpl`<div>...</div>`;
}
```

### Recommended Example (cleanup-safe rerender)

```ts
protected override onMount(): void {
	this.cleanup.on(window, "resize", this.handleResize, { passive: true });
}

private readonly handleResize = (): void => {
	this.rerender();
};
```

::: warning Common bug
If you attach listeners inside `render()`, rerenders can create duplicates and memory leaks.
:::

## Destroy flow

When `destroy()` runs:

If mounted, `onDestroy()` runs.

Cleanup tasks run.

Root element is removed.

Internal render flags reset.

This is why child views passed through `this.tpl` are safely destroyed when parent is destroyed.

### Problematic Example (manual timer leak)

```ts
private timerId: number | null = null;

protected override onMount(): void {
	this.timerId = window.setInterval(() => {
		// poll
	}, 1000);
}
```

### Recommended Example (explicit teardown)

```ts
private timerId: number | null = null;

protected override onMount(): void {
	this.timerId = window.setInterval(() => {
		// poll
	}, 1000);
}

protected override onDestroy(): void {
	if (this.timerId !== null) {
		window.clearInterval(this.timerId);
		this.timerId = null;
	}
}
```

## `renderMode` behavior

`renderMode: "always"` means each `renderToNode()` call re-renders content.

`renderMode: "once"` means content is rendered once and node is reused afterward.

Use `once` only for static components. If content depends on runtime state changes, keep `always`.

### Static example using `renderMode: "once"`

```ts
export class BrandMark extends View<"span"> {
	constructor() {
		super("span", { className: "brand", renderMode: "once" });
	}

	render(): DocumentFragment {
		return this.tpl`3AM`;
	}
}
```

### Dynamic example using `renderMode: "always"`

```ts
export class CounterView extends View<"p"> {
	private count = 0;

	constructor() {
		super("p", { className: "counter", renderMode: "always" });
	}

	increment(): void {
		this.count += 1;
		this.rerender();
	}

	render(): DocumentFragment {
		return this.tpl`Count: ${this.count}`;
	}
}
```

## Practical helper methods

`this.tpl` is the template helper that supports nested views safely.

`this.cleanup` stores event/disposal callbacks.

`this.$<T>(selector)` is a typed query helper that throws early when selector is missing.

`this.rerender()` refreshes current view content.

### Example using all helpers together

```ts
export class ProfileCard extends View<"section"> {
	private expanded = false;

	constructor() {
		super("section", { className: "profile-card" });
	}

	protected override onMount(): void {
		const button = this.$<HTMLButtonElement>(".profile-toggle");
		this.cleanup.on(button, "click", () => {
			this.expanded = !this.expanded;
			this.rerender();
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<h2>Profile</h2>
			<button class="profile-toggle" type="button">Toggle</button>
			${this.expanded ? this.tpl`<p>Extra details</p>` : ""}
		`;
	}
}
```

## lifecycle-safe setup

### Problematic Example

```ts
render(): DocumentFragment {
	document.addEventListener("visibilitychange", this.handleVisibility);
	return this.tpl`...`;
}
```

### Recommended Example

```ts
protected override onMount(): void {
	this.cleanup.on(document, "visibilitychange", this.handleVisibility);
}

render(): DocumentFragment {
	return this.tpl`...`;
}
```

This is the key pattern to keep components predictable.
