import { View } from "@lib/view";
import { GearsHeroSection } from "@sections/gears/hero";
import { GearsProductGridSection } from "@sections/gears/productGrid";

export class GearsPage extends View<"section"> {
	constructor() {
		super("section", { className: "gears-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
			${new GearsHeroSection()}
			${new GearsProductGridSection()}
		`;
	}
}
