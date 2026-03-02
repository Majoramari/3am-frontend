# Templates

Templates use the `html` helper from `@lib/template`. It returns a `DocumentFragment` you can put into your view.

**Where It Fits**
- Use templates in components, sections, and pages.
- To embed another `View`, use `this.tpl`.

## What is a `DocumentFragment`?

A `DocumentFragment` is a light, in-memory container for DOM nodes. It is a standard browser feature, not specific to this project. It is not in the page yet, so building inside it does not trigger layout or paint. When you insert it, the browser moves all its children into the live DOM in one step. This is fast and prevents half-drawn UI.

Examples:
- Build off-screen, then append:
	```ts
	const frag = document.createDocumentFragment();
	const card = document.createElement("div");
	card.textContent = "Hello";
	frag.appendChild(card);
	document.querySelector("#list")?.appendChild(frag); // All children move in once.
	```
- With the `html` helper (what we use):
	```ts
	const fragment = html`<li>Item ${n}</li>`;
	this.element.replaceChildren(fragment); // Children move in a single operation.
	```

## `html` vs `this.tpl`

- Use `this.tpl` inside a `View` when the template may contain nested `View` instances. It handles their render/cleanup lifecycle.
- Use `html` when you are outside a `View`, or when you only need text/numbers/DOM nodes.

```ts
// Inside a View
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

```ts
// Utility outside a View
export const badge = (text: string) => html`
	<span class="badge">${text}</span>
`;
```

Rule: if a template holds a `View`, use `this.tpl`. Otherwise `html` is enough.

## Rendering lists

You can map directly to arrays of component instances:

```ts
${items.map((item) =>
	new Button({
		label: item.label,
		variant: "text",
		href: item.href,
	}),
)}
```

You can also map to arrays of `View` instances:

```ts
${cards.map((card) =>
	this.tpl`
		<li>${new ProductCard(card)}</li>
	`,
)}
```

`this.tpl` normalizes arrays and nested `View` values for you.

## Basic use

```ts
import { html } from "@lib/template";

const name = "Alex";
render(): DocumentFragment {
	return html`
		<h2>Hello ${name}</h2>
		<p>Welcome to 3AM.</p>
	`;
}
```

You can pass DOM nodes too:

```ts
const badge = document.createElement("span");
badge.className = "badge";
badge.textContent = "New";

render(): DocumentFragment {
	return html`
		<h2>Releases ${badge}</h2>
	`;
}
```

## What happens under the hood

The `html` helper does these steps:

1) Build a string  
```ts
const name = "Ada";
// Creates markup string "<p>Hello Ada</p>"
const fragment = html`<p>Hello ${name}</p>`;
```

2) Escape text so it is safe  
```ts
const user = "<img src=x onerror=alert(1)>";
const fragment = html`<p>${user}</p>`; // Renders literal text, not a real image tag.
```

3) Handle real nodes with slots  
```ts
const badge = document.createElement("span");
badge.textContent = "New";
const fragment = html`<h2>Releases ${badge}</h2>`;
// Internally inserts a placeholder <!--slot:0--> then swaps it with badge.
```

4) Parse with `<template>`  
The markup string is set on a hidden `<template>` element to get a `DocumentFragment`.

5) Replace slots  
Slot comments (`<!--slot:0-->`) are replaced by the stored nodes.

6) Return the fragment  
You insert it with `replaceChildren(fragment)` or by returning it from `render()`.

Practical notes:
- `null`, `undefined`, and `false` render as empty strings.
- Arrays are flattened; any `Node` inside becomes real DOM, not text.
- To inject raw HTML, create a `Node` yourself and pass it. Plain strings are always escaped.

## Navigation
- Back to [Index](index.md)
- Next: [Styling Guide](styles.md)
- Related: [Components](components.md)
- Related: [Guidelines](guidelines.md)
