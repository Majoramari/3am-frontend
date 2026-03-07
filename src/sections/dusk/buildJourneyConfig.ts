import type {
	VehicleBuildConfig,
	VehicleLineupModel,
} from "@components/vehicleBuilder/types";

export const DUSK_BUILD_CONFIG: VehicleBuildConfig = {
	id: "dusk-build",
	sectionClassName: "dusk-build",
	eyebrow: "Build & Buy",
	progressRootSegment: "dusk",
	progressModelSegment: "standard",
	steps: [
		{ id: "build", label: "Build", title: "Build your DUSK" },
		{ id: "accessories", label: "Accessories", title: "Add accessories" },
		{ id: "finalize", label: "Finalize", title: "Finalize checkout" },
	],
	model: "Standard",
	drivetrain: "Dual-motor AWD",
	horsepower: 533,
	basePrice: 83_240,
	checkoutDeposit: 500,
	hideInteriorSection: true,
	hideUpgradeImages: true,
	defaultPaintId: "gold",
	defaultWheelId: "sport-bright-22",
	defaultInteriorId: "adventure-black",
	defaultSelectedUpgradeIds: ["autonomy-plus"],
	paints: [
		{
			id: "gold",
			label: "Gold",
			price: 0,
			swatch: "#AC9670",
			previewImage: "/assets/cars/dusk/profile/gold.webp",
		},
		{
			id: "cyan",
			label: "Cyan",
			price: 2_500,
			swatch: "#59E1FF",
			previewImage: "/assets/cars/dusk/profile/cyan.webp",
		},
		{
			id: "white",
			label: "White",
			price: 2_000,
			swatch: "#FFFFFF",
			previewImage: "/assets/cars/dusk/profile/white.webp",
		},
	],
	wheels: [
		{
			id: "all-season-20",
			label: '20" All-season',
			description: "Efficient in all kinds of conditions.",
			price: 0,
			rangeMiles: 270,
			zeroToSixtySec: 4.5,
			image: "/assets/dusk/build/wheels/all-season-20.png",
		},
		{
			id: "sport-bright-22",
			label: '22" Sport Bright',
			description: "On-road quiet",
			price: 2_000,
			rangeMiles: 258,
			zeroToSixtySec: 4.2,
			image: "/assets/dusk/build/wheels/sport-bright-22.png",
		},
	],
	interiors: [
		{
			id: "adventure-black",
			label: "Adventure interior",
			description: "Durable all-black cabin with high-contrast utility trim.",
			price: 0,
			swatch:
				"linear-gradient(160deg, rgb(72 77 86) 0%, rgb(31 35 42) 48%, rgb(15 18 24) 100%)",
		},
		{
			id: "adventure-light",
			label: "Adventure interior (light)",
			description: "Light two-tone cabin for an airy, open interior feel.",
			price: 2_000,
			swatch:
				"linear-gradient(160deg, rgb(242 242 236) 0%, rgb(201 205 202) 52%, rgb(142 149 154) 100%)",
		},
		{
			id: "ascend-ocean",
			label: "Ascend interior",
			description: "Premium two-tone interior with warmer accent materials.",
			price: 3_500,
			swatch:
				"linear-gradient(160deg, rgb(176 165 145) 0%, rgb(124 128 133) 50%, rgb(76 82 91) 100%)",
		},
	],
	upgrades: [
		{
			id: "autonomy-plus",
			label: "Autonomy+",
			description: "Advanced driver assistance package for supported highways.",
			price: 2_500,
			included: false,
		},
		{
			id: "premium-audio",
			label: "Premium Cabin Audio",
			description: "Immersive premium sound system tuned for the cabin.",
			price: 0,
			included: true,
			image: "/assets/dusk/build/upgrades/premium-audio.png",
		},
		{
			id: "air-compressor",
			label: "Air compressor",
			description: "Integrated compressor for quick tire pressure adjustments.",
			price: 0,
			included: true,
			image: "/assets/dusk/build/upgrades/air-compressor.png",
		},
	],
	accessories: [
		{
			id: "wall-charger",
			label: "Wall Charger",
			description: "Delivering up to 40 km of range every hour of charging.",
			price: 800,
			image: "/assets/dusk/build/accessories/wall-charger.png",
		},
		{
			id: "portable-charger",
			label: "Portable Charger",
			description:
				"Portable charging setup that stores in your garage or vehicle.",
			price: 400,
			image: "/assets/dusk/build/accessories/portable-charger.png",
		},
		{
			id: "cargo-crossbars",
			label: "Cargo Crossbars",
			description:
				"Lockable cargo crossbars that snap into your vehicle's accessory ports.",
			price: 700,
			image: "/assets/dusk/build/accessories/cargo-crossbars.png",
		},
		{
			id: "all-weather-floor-mats",
			label: "All-Weather Floor Mats",
			description: "Integrated floor mats designed to protect your interior.",
			price: 250,
			image: "/assets/dusk/build/accessories/floor-mats.png",
		},
		{
			id: "center-console-organizer",
			label: "Center Console Organizer",
			description: "2-tiered custom-fit tray to keep smaller gear sorted.",
			price: 50,
			image: "/assets/dusk/build/accessories/console-organizer.png",
		},
		{
			id: "crosswing-awning",
			label: "Kammok Crosswing Awning",
			description: "Deployable shade solution for overlanding and camp setups.",
			price: 1_300,
			image: "/assets/dusk/build/accessories/crosswing-awning.png",
		},
	],
	detailImages: {
		build: [
			{
				image: "/assets/dusk/build/detail/badge-closeup.png",
				caption: "Exterior badge detail",
			},
			{
				image: "/assets/dusk/build/detail/window-closeup.png",
				caption: "Body and trim finish",
			},
		],
	},
};

export const DUSK_BUILD_LINEUP_MODELS: ReadonlyArray<VehicleLineupModel> = [
	{
		id: "standard",
		name: "Street GT",
		fromLabel: "From $76,990",
		description: "Electric muscle fastback tuned for quick street response.",
		rangeLabel: "435 km est.",
		performanceLabel: "Dual-Motor AWD · 4.5 sec 0-100 km/h",
		image: "/assets/cars/dusk/profile/white.webp",
		specs: [
			{ label: "Range", value: "435 km est." },
			{ label: "Power", value: "397 kW" },
			{ label: "0-100 km/h", value: "4.5 sec" },
			{ label: "Battery", value: "98 kWh" },
			{ label: "Top speed", value: "210 km/h" },
			{ label: "Drive", value: "Dual-Motor AWD" },
		],
	},
	{
		id: "quad",
		name: "Track RS",
		fromLabel: "From $121,990",
		description: "Track-focused flagship built for grip, launch, and high-speed control.",
		rangeLabel: "602 km est.",
		performanceLabel: "Quad-Motor AWD · 2.6 sec 0-100 km/h",
		image: "/assets/cars/dusk/profile/cyan.webp",
		specs: [
			{ label: "Range", value: "602 km est." },
			{ label: "Power", value: "615 kW" },
			{ label: "0-100 km/h", value: "2.6 sec" },
			{ label: "Battery", value: "131 kWh" },
			{ label: "Top speed", value: "225 km/h" },
			{ label: "Drive", value: "Quad-Motor AWD" },
		],
	},
];
