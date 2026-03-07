import type { VehicleLineupModel } from "@components/vehicleBuilder/types";
import { View } from "@lib/view";
import { DUSK_BUILD_LINEUP_MODELS } from "./buildJourneyConfig";

type VehicleLineupSectionOptions = {
	eyebrow?: string;
	title?: string;
	buildHref?: string;
	models?: ReadonlyArray<VehicleLineupModel>;
};

export class VehicleLineupSection extends View<"section"> {
	private readonly eyebrow: string;
	private readonly title: string;
	private readonly buildHref: string;
	private readonly models: ReadonlyArray<VehicleLineupModel>;

	constructor(options: VehicleLineupSectionOptions = {}) {
		super("section", {
			className: ["page-section", "dusk-lineup"],
			dataset: { gaSection: "dusk-lineup" },
		});
		this.eyebrow = options.eyebrow ?? "Build Comparison";
		this.title = options.title ?? "Choose your DUSK build";
		this.buildHref = options.buildHref ?? "/dusk/build";
		this.models = options.models ?? DUSK_BUILD_LINEUP_MODELS;
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dusk-lineup__shell">
				<header class="dusk-lineup__header">
					<p class="dusk-lineup__eyebrow">${this.eyebrow}</p>
					<h2 class="dusk-lineup__title">${this.title}</h2>
				</header>
				<div class="dusk-lineup__grid">
					${this.models.map((model) => {
						const [drivetrainLabel, accelerationLabel = "—"] =
							model.performanceLabel.split("·").map((part) => part.trim());
						const comparisonSpecs = model.specs ?? [
							{ label: "Range", value: model.rangeLabel },
							{ label: "Drivetrain", value: drivetrainLabel },
							{ label: "Acceleration", value: accelerationLabel },
						];

						return this.tpl`
							<article class="dusk-lineup__card">
								<div class="dusk-lineup__card-main">
									<header class="dusk-lineup__card-head">
										<h3>${model.name}</h3>
										<p>${model.fromLabel}</p>
									</header>
									<img src="${model.image}" alt="${model.name}" loading="lazy" />
									<p class="dusk-lineup__description">${model.description}</p>
									<dl class="dusk-lineup__spec-list">
										${comparisonSpecs.map(
											(spec) => this.tpl`
												<div>
													<dt>${spec.label}</dt>
													<dd>${spec.value}</dd>
												</div>
											`,
										)}
									</dl>
								</div>
								<a class="dusk-lineup__build-button" href="${this.buildHref}">Build</a>
							</article>
						`;
					})}
				</div>
			</div>
		`;
	}
}

// Backward-compatible alias for existing imports.
export { VehicleLineupSection as DuskLineupSection };
