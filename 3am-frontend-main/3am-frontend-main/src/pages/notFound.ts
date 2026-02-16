import { html } from "@lib/template";
import { View } from "@lib/view";

export class NotFoundPage extends View<"section"> {
	constructor() {
		super("section");
	}

	render(): DocumentFragment {
		return html`
			<h1>404</h1>
		`;
	}
}
