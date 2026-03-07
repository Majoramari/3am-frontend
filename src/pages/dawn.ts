import { View } from "@lib/view";
import { DAWN_BUILD_LINEUP_MODELS } from "@sections/dawn/buildJourneyConfig";
import { DawnHeroSection } from "@sections/dawn/hero";
import { VehicleLineupSection } from "@sections/dusk/buildJourney";
import { VehicleHeroMediaSection } from "@sections/dusk/heroMedia";
import { VehicleSizeUpSection } from "@sections/dusk/sizeUp";
import { VehicleSpinCanvasSection } from "@sections/dusk/spinCanvas";

export class DawnPage extends View<"section"> {
	constructor() {
		super("section", { className: ["dawn-page", "model-page"] });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h1 class="visually-hidden">Model Dawn</h1>
			${new DawnHeroSection()}
			${new VehicleHeroMediaSection({
				showcaseItems: [
					{
						kind: "video",
						src: "/assets/shared/design.webm",
						label: "Design",
					},
					{
						kind: "image",
						src: "/assets/cars/dawn/gallery.webp",
						alt: "Dawn gallery preview",
						label: "Gallery",
					},
				],
			})}
			${new VehicleSpinCanvasSection({
				modelName: "Dawn",
				framePath: "/assets/cars/dawn/360",
				frameCount: 120,
			})}
			${new VehicleSizeUpSection({
				drawingsAriaLabel: "Dawn dimensions diagrams",
				frontImageSrc: "/assets/cars/dawn/360/0090.webp",
				frontImageAlt: "Front blueprint-style view of Dawn",
				sideImageSrc: "/assets/cars/dawn/360/0003.webp",
				sideImageAlt: "Side blueprint-style view of Dawn",
			})}
			${new VehicleLineupSection({
				title: "Choose your DAWN build",
				buildHref: "/dawn/build",
				models: DAWN_BUILD_LINEUP_MODELS,
			})}
		`;
	}
}
