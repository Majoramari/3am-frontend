import { View } from "@lib/view";
import { VehicleLineupSection } from "@sections/dusk/buildJourney";
import { VehicleHeroMediaSection } from "@sections/dusk/heroMedia";
import { VehicleSizeUpSection } from "@sections/dusk/sizeUp";
import { VehicleSpinCanvasSection } from "@sections/dusk/spinCanvas";

export class DuskPage extends View<"section"> {
	constructor() {
		super("section", { className: ["dusk-page", "model-page"] });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h1 class="visually-hidden">Model Dusk</h1>
			${new VehicleHeroMediaSection({
				showcaseItems: [
					{
						kind: "video",
						src: "/assets/shared/performance.webm",
						poster: "/assets/cars/dusk/gallery.webp",
						label: "Performance",
					},
					{
						kind: "image",
						src: "/assets/cars/dusk/gallery.webp",
						alt: "Dusk gallery preview",
						label: "Gallery",
					},
				],
			})}
			${new VehicleSpinCanvasSection({
				modelName: "Dusk",
				framePath: "/assets/cars/dusk/360",
				frameCount: 120,
			})}
			${new VehicleSizeUpSection()}
			${new VehicleLineupSection()}
		`;
	}
}
