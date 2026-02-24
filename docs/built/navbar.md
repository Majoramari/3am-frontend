# Navbar

This page explains how the global navbar is currently implemented in 3AM.

Main implementation file: `src/components/navbar.ts`.

## What this navbar handles

Desktop mega menus (hover/focus open behavior).

Mobile menu open/close behavior under breakpoint.

Scroll-aware shell state (`is-scrolled`, `is-hidden`).

Active link sync with current route.

Deferred media loading inside mega panels.

## State model

Navbar keeps explicit internal state fields:

- `activeMenu`
- `isMobileMenuOpen`
- `isScrolled`
- `isHidden`
- `currentPath`

::: tip Why this is good
Explicit state fields make behavior easier to reason about than scattered DOM-only checks.
:::

## Interaction pattern

### Problematic Example (fragile)

```text
Attach events in many places with ad-hoc selectors.
No centralized state.
Difficult to debug focus and hover edge cases.
```

### Recommended Example (current project pattern)

```text
Centralized handlers + explicit state fields.
Lifecycle-safe listener registration via cleanup bag.
DOM classes/datasets are derived from state.
```

## Deferred media behavior in mega menus

Navbar lazily upgrades media inside mega panels when a menu opens for the first time.

This prevents loading all mega-menu media on initial page paint.

### Problematic Example (eager)

```html
<img src="/heavy-image.webp" />
```

### Recommended Example (deferred)

```html
<img src="/assets/shared/placeholder.png" data-deferred-src="/heavy-image.webp" />
```

## When to edit navbar vs elsewhere

Edit `navbar.ts` when behavior or structure changes.

Edit `src/styles/components/navbar.css` when visual behavior changes.

Edit `Button` or `MediaCard` components when shared API behavior changes across navbar and other features.

Related docs: [Ready Components](/library/ready-components), [Guidelines](/guide/guidelines), [Contributing](/guide/contributing).

::: warning High-impact area
Navbar is mounted globally. A bug here affects every route.
Always validate keyboard focus, mobile menu behavior, and active-link logic before PR.
:::

## MDN references

- [`Pointer Events` (MDN)](https://developer.mozilla.org/docs/Web/API/Pointer_events)
- [`focusin` event (MDN)](https://developer.mozilla.org/docs/Web/API/Element/focusin_event)
- [`Element.closest()` (MDN)](https://developer.mozilla.org/docs/Web/API/Element/closest)
- [`matchMedia()` (MDN)](https://developer.mozilla.org/docs/Web/API/Window/matchMedia)
