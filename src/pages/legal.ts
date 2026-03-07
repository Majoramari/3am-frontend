import { html } from "@lib/template";
import { View } from "@lib/view";

export class LegalPage extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "legal-page"] });
	}

	render(): DocumentFragment {
		return html`
			<div class="legal-page__shell">
				<h1 class="legal-page__title">Legal</h1>
				<p class="legal-page__body">
					This page is reserved for legal notices and disclosures for 3AM. Replace this placeholder with finalized
					legal copy.
				</p>
			</div>
		`;
	}
}
