import { html } from "@lib/template";
import { View } from "@lib/view";

export class PrivacyPage extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "legal-page"] });
	}

	render(): DocumentFragment {
		return html`
			<div class="legal-page__shell">
				<h1 class="legal-page__title">Privacy</h1>
				<p class="legal-page__body">
					This page explains how 3AM handles and protects personal data. Full privacy policy text can be placed here.
				</p>
			</div>
		`;
	}
}
