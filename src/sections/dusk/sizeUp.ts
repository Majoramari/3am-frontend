import { View } from "@lib/view";

type SizeSpec = {
	label: string;
	value: string;
};

export type VehicleSizeUpOptions = {
	drawingsAriaLabel?: string;
	frontImageSrc?: string;
	frontImageAlt?: string;
	sideImageSrc?: string;
	sideImageAlt?: string;
	specs?: ReadonlyArray<SizeSpec>;
};

const DEFAULT_SIZE_SPECS: ReadonlyArray<SizeSpec> = [
	{ label: "Max height (with antenna)", value: "77.3 in" },
	{ label: "Width (side mirrors folded)", value: "82 in" },
	{ label: "Wheelbase", value: "121.1 in" },
	{ label: "Length", value: "200.8 in" },
	{ label: "Approach angle", value: "35.8°" },
	{ label: "Departure angle", value: "34.4°" },
];

export class VehicleSizeUpSection extends View<"section"> {
	private readonly drawingsAriaLabel: string;
	private readonly frontImageSrc: string;
	private readonly frontImageAlt: string;
	private readonly sideImageSrc: string;
	private readonly sideImageAlt: string;
	private readonly specs: ReadonlyArray<SizeSpec>;

	constructor(options: VehicleSizeUpOptions = {}) {
		super("section", {
			className: ["page-section", "dusk-sizeup"],
			dataset: { gaSection: "dusk-size-up" },
		});
		this.drawingsAriaLabel =
			options.drawingsAriaLabel ?? "Dusk dimensions diagrams";
		this.frontImageSrc =
			options.frontImageSrc ?? "/assets/dusk/blueprint/front.png";
		this.frontImageAlt =
			options.frontImageAlt ?? "Front view technical blueprint of Dusk";
		this.sideImageSrc =
			options.sideImageSrc ?? "/assets/dusk/blueprint/side.png";
		this.sideImageAlt =
			options.sideImageAlt ?? "Side view technical blueprint of Dusk";
		this.specs = options.specs ?? DEFAULT_SIZE_SPECS;
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dusk-sizeup__shell">
				<header class="dusk-sizeup__header">
					<h2 class="dusk-sizeup__title">Size it up</h2>
				</header>

				<div class="dusk-sizeup__drawings" aria-label="${this.drawingsAriaLabel}">
					<figure class="dusk-sizeup__drawing dusk-sizeup__drawing--front">
						<img
							class="dusk-sizeup__car-image"
							src="${this.frontImageSrc}"
							alt="${this.frontImageAlt}"
							loading="lazy"
						/>
					</figure>

					<figure class="dusk-sizeup__drawing dusk-sizeup__drawing--side">
						<img
							class="dusk-sizeup__car-image"
							src="${this.sideImageSrc}"
							alt="${this.sideImageAlt}"
							loading="lazy"
						/>
					</figure>
				</div>

				<ul class="dusk-sizeup__spec-list">
					${this.specs.map(
						(spec) => this.tpl`
							<li class="dusk-sizeup__spec-item">
								<span class="dusk-sizeup__spec-label">${spec.label}</span>
								<span class="dusk-sizeup__spec-value">${spec.value}</span>
							</li>
						`,
					)}
				</ul>
			</div>
		`;
	}
}

// Backward-compatible aliases for existing imports.
export type DuskSizeUpOptions = VehicleSizeUpOptions;
export { VehicleSizeUpSection as DuskSizeUpSection };
