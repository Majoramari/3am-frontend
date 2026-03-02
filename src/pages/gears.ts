import { View } from "@lib/view";

export class HomePage extends View<"section"> {
	constructor() {
		super("section", { className: "home-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
      <h1>Hello World</h1>
		`;
	}
}
