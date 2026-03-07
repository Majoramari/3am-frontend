import type {
	VehicleBuildConfig,
	VehicleLineupModel,
} from "@components/vehicleBuilder/types";
import {
	DUSK_BUILD_CONFIG,
} from "@sections/dusk/buildJourneyConfig";

export const DAWN_BUILD_CONFIG: VehicleBuildConfig = {
	...DUSK_BUILD_CONFIG,
	id: "dawn-build",
	eyebrow: "Build & Buy",
	progressRootSegment: "dawn",
	progressModelSegment: "dual-standard",
	model: "Dual Standard",
	steps: [
		{ id: "build", label: "Build", title: "Build your DAWN" },
		{ id: "accessories", label: "Accessories", title: "Add accessories" },
		{ id: "finalize", label: "Finalize", title: "Finalize checkout" },
	],
};

export const DAWN_BUILD_LINEUP_MODELS: ReadonlyArray<VehicleLineupModel> = [
	{
		id: "standard",
		name: "Dual Standard",
		fromLabel: "From $76,990",
		description: "Rugged electric SUV for trails, towing, and daily comfort.",
		rangeLabel: "510 km est.",
		performanceLabel: "Dual-Motor AWD · 4.9 sec 0-100 km/h",
		image: "/assets/dusk/build/lineup/dual-standard.png",
		specs: [
			{ label: "Range", value: "510 km est." },
			{ label: "Ground clearance", value: "268 mm" },
			{ label: "0-100 km/h", value: "4.9 sec" },
			{ label: "Wading depth", value: "760 mm" },
			{ label: "Cargo volume", value: "1,150 L" },
			{ label: "Drive", value: "Dual-Motor AWD" },
		],
	},
	{
		id: "quad",
		name: "Quad",
		fromLabel: "From $121,990",
		description:
			"Off-road flagship with torque-vectoring for technical terrain.",
		rangeLabel: "560 km est.",
		performanceLabel: "Quad-Motor AWD · 3.8 sec 0-100 km/h",
		image: "/assets/dusk/build/lineup/quad.png",
		specs: [
			{ label: "Range", value: "560 km est." },
			{ label: "Ground clearance", value: "295 mm" },
			{ label: "0-100 km/h", value: "3.8 sec" },
			{ label: "Wading depth", value: "860 mm" },
			{ label: "Cargo volume", value: "1,240 L" },
			{ label: "Drive", value: "Quad-Motor AWD" },
		],
	},
];
