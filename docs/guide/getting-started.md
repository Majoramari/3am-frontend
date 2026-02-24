# Getting Started

This guide takes you from zero to your first safe contribution in the 3AM project.

> [!WARNING]
> This project is built for the Egyptian government initiative **DEPI**. It is a training/learning project and **not** a real commercial company product.

## Install the required tools

Before cloning the project, install these tools on your machine.

1. Git
2. Bun `1.3+`
3. Node.js (used by some ecosystem tooling)

You can verify quickly:

```bash
git --version
bun --version
node --version
```

## Clone and run the project

Clone the repository, move into it, and install dependencies:

```bash
git clone https://github.com/Majoramari/3am-frontend.git
cd 3am-frontend
bun install
```

Start local development server:

```bash
bun run dev
```

Vite prints a local URL in the terminal (usually `http://localhost:5173`). Open it in your browser (I'm a Firefox guy, so Firefox is my default choice).

## Run the baseline checks

Before you edit anything, run the same checks used in normal review flow:

```bash
bun test
bun run build
bun run docs:build
```

If these pass, your environment is ready.

## Understand startup flow first

A lot of confusion in this project comes from editing the right code in the wrong place. This is the startup chain you should remember:

1. `src/main.ts` loads global CSS and calls `bootstrapApp()`.
2. `src/app/bootstrap.ts` runs `startApp()` and then boot-loader teardown.
3. `src/app/start.ts` mounts the navbar, creates router, intercepts internal links, and triggers lazy media scanning.

If routing, nav behavior, or startup rendering is broken, these files are the first place to inspect.

If you want deeper routing details, continue with [Pages and Routing](/architecture/pages).

## Know where to put your changes

When you work on a feature, use this rule-of-thumb map:

`src/app/routes.ts` for registering routes.

`src/pages/*` for route-level page views.

`src/sections/*` for page-specific sections.

`src/components/*` for reusable UI pieces.

`src/lib/*` for cross-cutting framework utilities and internal helpers.

`src/styles/*` for all styling work.

## First contribution checklist

Keep each PR focused on **one concern**. If your work includes two concerns, split them into **two PRs**.

Run checks again before opening PR:

```bash
bun test
bun run build
bun run docs:build
```

In the PR description, explain what changed, why it changed, and how you validated it.

## What to read next

[Guidelines](/guide/guidelines) for coding standards and safe lifecycle patterns.

[Building Components](/library/components) for reusable component workflow with before/after examples.

[Styles](/architecture/styles) for where CSS should live and how to structure it.
