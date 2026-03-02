# Guidelines

Rules to keep code consistent and safe.

## UI Structure

1. Components are reusable, sections belong to one page.
2. Pages assemble sections and are listed in `src/app/routes.ts`.
3. Use `this.tpl` when a template embeds components or sections.
4. Prefer ready components (for example `new Button(...)`) for simple stateless UI nodes.

## Styling

1. Styles live in `src/styles` and use `@layer`.
2. Put layout rules in `layout.css`, visuals in `components.css`, utilities in `utilities.css`.
3. Use `rem` for spacing and sizing.
4. Prefer CSS variables for repeated values.
5. Scope styles to classes; avoid global tags outside the reset layer.
6. Respect `prefers-reduced-motion` for animations.
7. Name classes after the component or section.

## Performance

1. For below-the-fold media, prefer `LazyImage` and `LazyVideo` from `src/components`.
2. Use direct `data-lazy-*` attributes only for advanced/custom cases (see `wiki/performance.md`).
3. Keep `loading="lazy"` and `decoding="async"` on deferred images.
4. Keep heavy work out of `render()` if it can run once in the constructor.
5. Keep `render()` idempotent to avoid duplicate listeners or leaks.
6. Run `bun run build:bundle && bun run budget` before opening a PR.
7. If budgets increase, update the `size-limit` section in `package.json` with a clear reason.

## Navigation
- Back to [Index](index.md)
- Related: [Styling Guide](styles.md)
- Related: [Performance](performance.md)
