# Contributing

This guide explains how to contribute to 3AM in a way that is clear for reviewers and safe for future maintainers.

A strong contribution is **easy to review**, **easy to test**, and **focused on one concern**.

::: warning One PR = One Concern
A pull request should solve **one thing only**.

If you have **two concerns**, split into **two PRs**.
:::

## Standard workflow

Start from `main`, create a branch, implement one clear concern, run checks, and open a PR with context.

Project board: [3AM Project Board](https://github.com/users/Majoramari/projects/12/views/2)

## Scope rule

### Problematic Example (mixed PR, hard review)

```text
feat/navbar-and-hero-and-docs

- fix mobile nav close bug
- redesign hero copy
- rewrite guidelines docs
```

### Recommended Example (split by concern)

```text
PR 1: fix(navbar): close mobile menu after internal navigation
PR 2: docs(guidelines): rewrite lifecycle section with before-after examples
PR 3: feat(hero): update hero copy and CTA labels
```

::: tip Why this works
When each PR has one concern, review is faster, rollback is safer, and regressions are easier to isolate.
:::

## Branch naming style

Use lowercase kebab-case with this format:

`<type>/<scope>-<short-description>`

### Problematic Example (weak names)

```text
update
changes
work
fix-stuff
```

### Recommended Example (good names)

```text
feat/hero-add-slide-5
fix/navbar-close-mobile-on-link
docs/rewrite-guidelines-b2
refactor/lazy-media-hydration
test/router-fallback-paths
```

## Commit message style

Use Conventional Commits:

`<type>(<scope>): <summary>`

### Problematic Example (unclear)

```text
update files
fix issue
more changes
```

### Recommended Example (clear)

```text
feat(hero): add fifth hero slide with responsive assets
fix(navbar): close mobile panel after internal navigation
docs(styles): add before-after component styling examples
refactor(lazy-media): extract hydration helper utilities
test(bootloader): cover reduced-motion exit behavior
```

## Pull request style

Use a PR title that matches commit style:

`<type>(<scope>): <short summary>`

Then use this PR body template:

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

::: info Reviewer expectation
A reviewer should understand *what changed* and *why* without opening unrelated files.
:::

## Required checks before opening PR

```bash
bun test
bun run build
bun run docs:build
```

If bundle size can change:

```bash
bun run build:bundle
bun run budget
```

## Related docs

[Guidelines](/guide/guidelines)

[Testing](/guide/testing)

[Performance](/guide/performance)

[Core System](/built/core-system)

## Project links

Repo: [3AM Frontend Repository](https://github.com/Majoramari/3am-frontend)

Backend: [3AM Backend Repository](https://github.com/ali7510/3AM-Project)
