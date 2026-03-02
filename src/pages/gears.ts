import { View } from "@lib/view";

export class GearsPage extends View<"section"> {
	constructor() {
		super("section", { className: "gears-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
      <h1>Hello world</h1>
		`;
	}
}
