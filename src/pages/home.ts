import { View } from "@lib/view";
import { HomeAdventureMediaSection } from "@sections/home/adventureMedia";
import { HomeHeroSection } from "@sections/home/hero";
import { HomeNewsletterSection } from "@sections/home/newsletter";
import { HomeShowcaseSection } from "@sections/home/showcase";

export class HomePage extends View<"section"> {
	constructor() {
		super("section", { className: "home-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
			${new HomeHeroSection()}
			${new HomeShowcaseSection()}
			${new HomeAdventureMediaSection()}
			${new HomeNewsletterSection()}
		`;
	}
}
