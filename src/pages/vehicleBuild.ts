import { VehicleBuildJourneySection } from "@components/vehicleBuilder/buildJourney";
import type { VehicleBuildConfig } from "@components/vehicleBuilder/types";
import { View } from "@lib/view";

export class VehicleBuildPage extends View<"section"> {
	private readonly config: VehicleBuildConfig;

	constructor(config: VehicleBuildConfig) {
		super("section", { className: "dusk-build-page" });
		this.config = config;
	}

	render(): DocumentFragment {
		return this.tpl`
			${new VehicleBuildJourneySection(this.config)}
		`;
	}
}
