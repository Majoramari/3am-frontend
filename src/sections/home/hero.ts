import { html } from "@lib/template";
import { View } from "@lib/view";

export class HomeHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "hero"] });
	}

	render(): DocumentFragment {
		return html`
		`;
	}
}
