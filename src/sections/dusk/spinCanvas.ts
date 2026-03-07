import { View } from "@lib/view";
import { setupVehicleSpinCanvas } from "./spinCanvasBehavior";

export type VehicleSpinCanvasSectionOptions = {
	modelName?: string;
	framePath?: string;
	frameCount?: number;
};

export class VehicleSpinCanvasSection extends View<"section"> {
	private readonly modelName: string;
	private readonly framePath: string;
	private readonly frameCount: number;

	constructor(options: VehicleSpinCanvasSectionOptions = {}) {
		super("section", {
			className: ["page-section", "dusk-spin"],
			dataset: { gaSection: "dusk-spin-canvas" },
		});
		this.modelName = options.modelName ?? "Dusk";
		this.framePath = options.framePath ?? "/assets/cars/dusk/360";
		this.frameCount = options.frameCount ?? 120;
	}

	protected override onMount(): void {
		setupVehicleSpinCanvas(this.element, this.cleanup);
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dusk-spin-shell">
				<div class="dusk-spin-stage">
					<div class="dusk-spin-facts" aria-label="Dusk key specs">
						<ul class="dusk-spin-facts__list">
							<li class="dusk-spin-facts__item">
								<p class="dusk-spin-facts__label">Est. range<sup>1</sup></p>
								<p class="dusk-spin-facts__value">660 km</p>
							</li>
							<li class="dusk-spin-facts__item">
								<p class="dusk-spin-facts__label">0-100 km/h in under<sup>1</sup></p>
								<p class="dusk-spin-facts__value">2.6 sec</p>
							</li>
							<li class="dusk-spin-facts__item">
								<p class="dusk-spin-facts__label">Capacity<sup>1</sup></p>
								<p class="dusk-spin-facts__value">4 seats</p>
							</li>
							<li class="dusk-spin-facts__item">
								<p class="dusk-spin-facts__label">Drivetrain<sup>1</sup></p>
								<p class="dusk-spin-facts__value">AWD</p>
							</li>
						</ul>
					</div>
					<canvas
						class="dusk-spin-canvas"
						data-dusk-spin-canvas
						data-dusk-spin-frame-path="${this.framePath}"
						data-dusk-spin-frame-count="${this.frameCount}"
						tabindex="0"
						role="img"
						aria-label="Interactive ${this.modelName} spin preview"
					></canvas>
				</div>
			</div>
		`;
	}
}

// Backward-compatible aliases for existing imports.
export type DuskSpinCanvasSectionOptions = VehicleSpinCanvasSectionOptions;
export { VehicleSpinCanvasSection as DuskSpinCanvasSection };
