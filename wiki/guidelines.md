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

1. Use `loading="lazy"` and `decoding="async"` for images below the fold.
2. Keep heavy work out of `render()` if it can run once in the constructor.
3. Keep `render()` idempotent to avoid duplicate listeners or leaks.

## Navigation
- Back to [Index](index.md)
- Related: [Styling Guide](styles.md)
