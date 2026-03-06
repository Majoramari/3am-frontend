import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";

export class ServiceCentersSection extends View<"section"> {
	constructor() {
		super("section", { className: "gs-service" });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h2 class="gs-service__headline">Available to install at Rivian<br>Service Centers</h2>
			<div class="gs-service__img-wrap">
				${new LazyImage({
					src: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c",
					alt: "Service Center",
					className: "gs-service__bg-image",
				})}
				<div class="gs-service__overlay-card">
					${new LazyImage({
						src: "/assets/gear-shop/download.jfif",
						alt: "Spare Tire",
						className: "gs-service__card-image",
					})}
					<p class="gs-service__card-name">Spare Tire</p>
					<span class="gs-service__card-price">$700</span>
				</div>
			</div>
		`;
	}
}