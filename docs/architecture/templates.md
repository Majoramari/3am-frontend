# Templates

3AM uses two template helpers: `this.tpl` from `View`, and `html` from `@lib/template`.

Most of the time, if you are inside a `View` class, you should use `this.tpl`.

## Why `this.tpl` is the default in views

`this.tpl` understands nested view instances. If you pass a child component, it is mounted and registered for cleanup through the parent lifecycle.

That means composition is safe by default.

```ts
render(): DocumentFragment {
	return this.tpl`
		<section>
			${new Button({ label: "Demo Drive", variant: "cta", href: "/demo" })}
		</section>
	`;
}
```

## When to use plain `html`

Use `html` when you want a simple `DocumentFragment` outside of a `View` class or for small template helpers that do not manage child view lifecycle.

```ts
import { html } from "@lib/template";

export const badge = (text: string): DocumentFragment => html`
	<span class="badge">${text}</span>
`;
```

## Safety note

The template utility escapes string values by default. That reduces accidental HTML injection when values are dynamic.

If you need raw HTML behavior, stop and review the data source first. In most frontend cases in this project, escaped text is the correct default.
