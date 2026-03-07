import { View } from "@lib/view";

export class DawnHeroSection extends View<"section"> {
	constructor() {
		super("section", {
			className: ["page-section", "dawn-hero"],
			dataset: { gaSection: "dawn-hero" },
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dawn-hero__content">
				<h2 class="dawn-hero__title">DAWN</h2>
				<p class="dawn-hero__subtitle">Adventure, reimagined for every day</p>
				<p class="dawn-hero__description">
					Bold electric capability with all-weather confidence, premium comfort, and a silhouette built for daily roads and long getaways.
				</p>
			</div>
			<div class="dawn-hero__media" aria-hidden="true">
				<img
					class="dawn-hero__profile-image"
					src="/assets/cars/dawn/profile/white.webp"
					alt=""
					loading="lazy"
				/>
			</div>
			<div class="dawn-hero__overlay" aria-hidden="true"></div>
			<div class="dawn-hero__noise" aria-hidden="true"></div>
			<div class="dawn-hero__vignette" aria-hidden="true"></div>
		`;
	}
}
