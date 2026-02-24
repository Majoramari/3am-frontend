# Core System

This page explains the **core architecture** of 3AM: startup, routing, views, and composition.

## Startup flow

The runtime starts with this order:

```text
src/main.ts
  -> bootstrapApp()
    -> startApp()
      -> mount Navbar + create router + set SPA link interception
    -> runBootLoader()
```

::: info Why this matters
If the app boots but the route content or nav behaves incorrectly, start debugging from this chain.
:::

## Router flow (what happens on navigation)

`createRouter()` resolves the path, destroys previous view, mounts next view, and updates document title.

It also uses a **render token** to avoid stale async route results.

### Problematic Example (mental model that causes bugs)

```text
"Route create is instant and always finishes in order."
```

### Recommended Example (real project behavior)

```text
Route create can be async.
A newer navigation can happen before the previous one resolves.
Render token prevents stale page mount.
```

Related docs: [Pages and Routing](/architecture/pages), [View Lifecycle](/reference/view-lifecycle).

## View lifecycle role in architecture

Every page/section/component extends `View`.

`render()` describes UI.

`onMount()` handles DOM-dependent setup.

`cleanup` handles listener disposal and teardown safety.

### Problematic Example (unsafe setup)

```ts
render(): DocumentFragment {
	document.addEventListener("click", this.handleClick);
	return this.tpl`...`;
}
```

### Recommended Example (safe setup)

```ts
protected override onMount(): void {
	this.cleanup.on(document, "click", this.handleClick);
}

render(): DocumentFragment {
	return this.tpl`...`;
}
```

## Composition path

The current composition direction is:

`routes` -> `pages` -> `sections` -> `components` -> `styles`

This direction keeps responsibilities clear and avoids feature logic leaking into global framework code.

## Where to extend the core system

Add routes in `src/app/routes.ts`.

Adjust startup wiring in `src/app/start.ts`.

Adjust fallback/lifecycle-safe navigation in `src/lib/router.ts`.

Adjust base view behavior in `src/lib/view.ts`.

::: warning Keep core changes narrow
Core-system changes can affect every route. Keep them isolated and open a dedicated PR for that concern.
:::

## MDN references

- [`History.pushState()` (MDN)](https://developer.mozilla.org/docs/Web/API/History/pushState)
- [`popstate` event (MDN)](https://developer.mozilla.org/docs/Web/API/Window/popstate_event)
- [`queueMicrotask()` (MDN)](https://developer.mozilla.org/docs/Web/API/queueMicrotask)
