# Contributing to 3AM

Thanks for contributing to **3AM**.

This file is the quick GitHub version.  
For the full guide, read:
- [Contribution Guide](https://majoramari.github.io/3am-frontend/guide/contributing)
- [Getting Started](https://majoramari.github.io/3am-frontend/guide/getting-started)
- [Guidelines](https://majoramari.github.io/3am-frontend/guide/guidelines)

## Basic workflow

1. Clone the repo.
2. Create a branch from `main`.
3. Make one focused change.
4. Run checks.
5. Open a PR.

## PR scope rule

One PR should be about **one concern**.

If you changed 2 different concerns, split into 2 PRs.

## Branch naming

Use:

`<type>/<scope>-<short-description>`

Examples:
- `feat/hero-add-slide-5`
- `fix/navbar-close-mobile-on-link`
- `docs/rewrite-guidelines-b2`

## Commit naming

Use Conventional Commits:

`<type>(<scope>): <summary>`

Examples:
- `feat(hero): add fifth hero slide with responsive assets`
- `fix(navbar): close mobile panel after internal navigation`
- `docs(styles): add clearer styling examples`

## Before opening a PR

Run:

```bash
bun test
bun run build
bun run docs:build
```

If your change can affect bundle size, also run:

```bash
bun run build:bundle
bun run budget
```

## PR title format

Use the same style as commits:

`<type>(<scope>): <short summary>`

## Suggested PR template

```md
## What changed

## Why this change was needed

## How it was implemented

## Validation
- bun test
- bun run build
- bun run docs:build

## Screenshots (if UI changed)
```
