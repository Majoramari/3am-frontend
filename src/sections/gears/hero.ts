import { View } from "@lib/view";

export class GearsHeroSection extends View<"section"> {
	constructor() {
		super("section", { className: ["page-section", "gears-hero"] });
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="gears-hero__content">
				<h1 class="gears-hero__title">GEARS</h1>
				<p class="gears-hero__subtitle">
					Official 3AM Performance Collection
				</p>
				<p class="gears-hero__description">
					Premium upgrades, essentials, and accessories curated by 3AM for Dusk
					and Dawn owners. Built for clean fitment, reliable quality, and
					confident everyday driving.
				</p>
			</div>
			<div class="gears-hero__media">
				<div class="gears-hero__image-wrapper">
					<div class="gears-hero__image-placeholder"></div>
				</div>
			</div>
			<div class="gears-hero__overlay" aria-hidden="true"></div>
		`;
	}
}
