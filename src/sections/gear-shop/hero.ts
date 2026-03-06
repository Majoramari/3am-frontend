import { View } from "@lib/view";

export class GearShopHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: "gs-hero" });
	}

	render(): DocumentFragment {
		return this.tpl`
			<video autoplay muted loop playsinline class="gs-hero__video">
				<source src="/assets/gear-shop/header.mp4" type="video/mp4">
			</video>
			<div class="gs-hero__overlay"></div>
			<div class="gs-hero__content">
				<h1 class="gs-hero__headline">Powered by imagination</h1>
			</div>
		`;
	}
}