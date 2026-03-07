import { html } from "@lib/template";
import { View } from "@lib/view";

export class NotFoundPage extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "not-found-page"] });
	}

	render(): DocumentFragment {
		return html`
			<div class="not-found">
				<p class="not-found__code">404</p>
				<h1 class="not-found__title">Being lost can be an adventure</h1>
				<p class="not-found__subtitle">But not today.</p>
				<div class="not-found__actions">
					<a class="not-found__action not-found__action--primary" href="/">
						Return Home, Solider
					</a>
				</div>
			</div>
		`;
	}
}
