import { APP_TITLE } from "@content/constants";
import { html } from "@lib/template";
import { View } from "@lib/view";

export class Navbar extends View<"nav"> {
	constructor() {
		super("nav", { className: "nav-shell" });
	}

	render(): DocumentFragment {
		return html`
			<div class="nav-inner">
				<a class="nav-logo" href="/">${APP_TITLE}</a>
				<ul class="nav-links" aria-label="Primary">
					<li><a class="nav-link" href="/">Dawn</a></li>
					<li><a class="nav-link" href="/dusk">Dusk</a></li>
				</ul>
			</div>
		`;
	}

	setActive(routeKey: string): void {
		this.element.querySelectorAll<HTMLAnchorElement>(".nav-link").forEach((link) => {
			const href = link.getAttribute("href") ?? "";
			link.classList.toggle("active", href === routeKey);
		});
	}
}
