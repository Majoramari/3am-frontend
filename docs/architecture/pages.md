# Pages and Routing

In 3AM, a page is a route-level view class inside `src/pages`.

When you add a new URL, you normally create a page class, register it in `src/app/routes.ts`, and then compose sections/components inside that page.

If you want a real implemented system reference, see [Core System](/built/core-system).

## How routing actually works here

The app starts in `src/main.ts` and then moves to `bootstrapApp()`.

`startApp()` in `src/app/start.ts` creates the router and mounts a `main.page` outlet.

`createRouter()` in `src/lib/router.ts` resolves the current path, destroys the previous page view, mounts the next one, and updates the document title.

A render token is used to ignore stale async route results. This protects the app from race conditions when navigation happens quickly.

## Route definition example

```ts
"/": {
	title: "Home",
	create: async () => {
		const { HomePage } = await import("@pages/home");
		return new HomePage();
	},
}
```

The `create` function can be async, which keeps route chunks lazy.

## Add a page in this project

Create `src/pages/about.ts`:

```ts
import { View } from "@lib/view";

export class AboutPage extends View<"section"> {
	constructor() {
		super("section", { className: "about-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h1>About</h1>
			<p>Project information...</p>
		`;
	}
}
```

Then register it in `src/app/routes.ts`:

```ts
"/about": {
	title: "About",
	create: async () => {
		const { AboutPage } = await import("@pages/about");
		return new AboutPage();
	},
}
```

## Important behavior to remember

Unknown paths fall back to `/404` if that route exists.

The previous page is destroyed before the next page mounts.

After each navigation, `startApp()` triggers lazy media scanning for the new route content.

For section composition rules, continue with [Sections](/architecture/sections).
