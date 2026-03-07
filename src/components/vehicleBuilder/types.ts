export type VehicleBuildStepId = "build" | "accessories" | "finalize";

export type VehicleBuildStep = {
	id: VehicleBuildStepId;
	label: string;
	title: string;
};

export type VehiclePaintOption = {
	id: string;
	label: string;
	price: number;
	swatch: string;
	previewImage: string;
};

export type VehicleWheelOption = {
	id: string;
	label: string;
	description: string;
	price: number;
	rangeMiles: number;
	zeroToSixtySec: number;
	image: string;
};

export type VehicleInteriorOption = {
	id: string;
	label: string;
	description: string;
	price: number;
	swatch: string;
};

export type VehicleUpgradeOption = {
	id: string;
	label: string;
	description: string;
	price: number;
	included: boolean;
	image: string;
};

export type VehicleAccessoryOption = {
	id: string;
	label: string;
	description: string;
	price: number;
	image: string;
};

export type VehicleBuildDetailImage = {
	image: string;
	caption: string;
};

export type VehicleBuildConfig = {
	id: string;
	sectionClassName: string;
	eyebrow: string;
	progressRootSegment: string;
	progressModelSegment?: string;
	steps: ReadonlyArray<VehicleBuildStep>;
	model: string;
	drivetrain: string;
	horsepower: number;
	basePrice: number;
	checkoutDeposit: number;
	paints: ReadonlyArray<VehiclePaintOption>;
	wheels: ReadonlyArray<VehicleWheelOption>;
	interiors: ReadonlyArray<VehicleInteriorOption>;
	upgrades: ReadonlyArray<VehicleUpgradeOption>;
	accessories: ReadonlyArray<VehicleAccessoryOption>;
	detailImages: {
		build: ReadonlyArray<VehicleBuildDetailImage>;
	};
	defaultPaintId?: string;
	defaultWheelId?: string;
	defaultInteriorId?: string;
	defaultSelectedUpgradeIds?: ReadonlyArray<string>;
	defaultSelectedAccessoryIds?: ReadonlyArray<string>;
};

export type VehicleLineupModel = {
	id: string;
	name: string;
	fromLabel: string;
	description: string;
	rangeLabel: string;
	performanceLabel: string;
	image: string;
	specs?: ReadonlyArray<{
		label: string;
		value: string;
	}>;
};
