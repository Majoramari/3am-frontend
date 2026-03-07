import { cartStore } from "@app/cart/cartStore";
import { cartApi, type Product, productsApi } from "@lib/api";
import { authStore } from "@lib/authStore";
import type { CleanupBag } from "@lib/cleanup";
import { getRouter } from "@lib/router";
import { emitToast } from "@lib/toastBus";
import type {
	VehicleAccessoryOption,
	VehicleBuildConfig,
	VehicleBuildStepId,
	VehicleInteriorOption,
	VehiclePaintOption,
	VehicleUpgradeOption,
	VehicleWheelOption,
} from "./types";

type VehicleBuildState = {
	stepId: VehicleBuildStepId;
	paintId: string;
	wheelId: string;
	interiorId: string;
	selectedUpgradeIds: Set<string>;
	selectedAccessoryIds: Set<string>;
};

type VehicleBuildFocusArea =
	| "paint"
	| "wheels"
	| "interior"
	| "upgrades"
	| "accessories"
	| "finalize";

type ShowcaseItem = {
	image: string;
	caption: string;
};

type ShowcaseContent = {
	main: ShowcaseItem;
	details: ShowcaseItem[];
	hideDetails?: boolean;
};

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const toUsdWhole = (value: number): string => usdWholeFormatter.format(value);

const toLeaseEstimate = (totalPrice: number): string =>
	`${toUsdWhole(Math.round(totalPrice / 96))}/mo`;

const KM_PER_MILE = 1.609344;
const KPH_100_IN_MPH = 62.13712;
const toRangeKilometers = (miles: number): number =>
	Math.round(miles * KM_PER_MILE);
const toZeroToHundredTime = (zeroToSixtySec: number): string =>
	`${(zeroToSixtySec * (KPH_100_IN_MPH / 60)).toFixed(1)} sec`;

const getNodeList = (root: ParentNode, selector: string): HTMLElement[] =>
	Array.from(root.querySelectorAll<HTMLElement>(selector));

const normalizeProductName = (value: string): string =>
	value.trim().toLowerCase();

const DEFAULT_DEPOSIT_PRODUCT_ID = 17;
const DEPOSIT_PRODUCT_ID = (() => {
	const parsed = Number.parseInt(
		import.meta.env.VITE_DEPOSIT_PRODUCT_ID ?? "",
		10,
	);
	return Number.isFinite(parsed) && parsed > 0
		? parsed
		: DEFAULT_DEPOSIT_PRODUCT_ID;
})();

const findDepositProduct = async (): Promise<Product | null> => {
	try {
		const productById = await productsApi.getById(DEPOSIT_PRODUCT_ID);
		if (productById.id > 0) {
			return productById;
		}
	} catch {
		// Fall through to name matching.
	}

	const products = await productsApi.getAll();
	const exactMatch = products.find(
		(product) => normalizeProductName(product.name) === "deposit",
	);
	if (exactMatch) {
		return exactMatch;
	}

	return (
		products.find((product) =>
			normalizeProductName(product.name).includes("deposit"),
		) ?? null
	);
};

const clearCartItemsForDeposit = async (): Promise<void> => {
	const cart = await cartApi.getCart();
	for (const item of cart.cartItems) {
		await cartApi.removeFromCart(item.id);
	}

	const verificationCart = await cartApi.getCart();
	if (verificationCart.cartItems.length > 0) {
		throw new Error("Could not empty cart before adding deposit.");
	}
};

const setText = (nodes: HTMLElement[], value: string): void => {
	for (const node of nodes) {
		node.textContent = value;
	}
};

const isFocusArea = (
	value: string | undefined,
): value is VehicleBuildFocusArea =>
	value === "paint" ||
	value === "wheels" ||
	value === "interior" ||
	value === "upgrades" ||
	value === "accessories" ||
	value === "finalize";

const escapeXml = (value: string): string =>
	value
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&apos;");

const toSwatchPreviewImage = (
	swatch: string,
	label: string,
	subtitle: string,
): string => {
	const colorTokens = Array.from(
		swatch.matchAll(/rgb\(\s*(\d+)\s+(\d+)\s+(\d+)/g),
	).map((match) => [
		Number.parseInt(match[1] ?? "0", 10),
		Number.parseInt(match[2] ?? "0", 10),
		Number.parseInt(match[3] ?? "0", 10),
	]);
	const colors =
		colorTokens.length > 0
			? colorTokens
			: [
					[82, 88, 102],
					[42, 47, 58],
					[20, 24, 32],
				];

	const gradientStops = colors
		.map((rgb, index) => {
			const offset =
				colors.length === 1
					? 0
					: Math.round((index / (colors.length - 1)) * 100);
			return `<stop offset="${offset}%" stop-color="rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})" />`;
		})
		.join("");

	const safeSubtitle = escapeXml(subtitle);
	const safeLabel = escapeXml(label);
	const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720"><defs><linearGradient id="interiorGradient" x1="0%" y1="0%" x2="100%" y2="100%">${gradientStops}</linearGradient></defs><rect width="1200" height="720" fill="rgb(10 16 24)" /><rect x="120" y="120" width="960" height="420" rx="34" fill="url(#interiorGradient)" stroke="rgba(230, 238, 252, 0.45)" stroke-width="3" /><text x="120" y="610" fill="rgb(210 224 246)" font-size="44" font-family="system-ui, sans-serif">${safeSubtitle}</text><text x="120" y="666" fill="white" font-size="66" font-weight="700" font-family="system-ui, sans-serif">${safeLabel}</text></svg>`;

	return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const loadImageAsset = (src: string): Promise<void> =>
	new Promise((resolve) => {
		if (typeof Image !== "function") {
			resolve();
			return;
		}

		const preloader = new Image();
		preloader.decoding = "async";
		preloader.src = src;

		if (preloader.complete) {
			resolve();
			return;
		}

		const handleDone = (): void => {
			resolve();
		};

		preloader.addEventListener("load", handleDone, { once: true });
		preloader.addEventListener("error", handleDone, { once: true });
	});

const toStepFallbackFocusArea = (
	stepId: VehicleBuildStepId,
): VehicleBuildFocusArea => {
	if (stepId === "accessories") {
		return "accessories";
	}
	if (stepId === "finalize") {
		return "finalize";
	}
	return "paint";
};

const describeShowcase = (
	stepId: VehicleBuildStepId,
	focusArea: VehicleBuildFocusArea,
	paint: VehiclePaintOption,
	wheel: VehicleWheelOption,
	interior: VehicleInteriorOption,
	selectedUpgrades: VehicleUpgradeOption[],
	selectedAccessories: VehicleAccessoryOption[],
	config: VehicleBuildConfig,
): ShowcaseContent => {
	const defaultMain: ShowcaseItem = {
		image: paint.previewImage,
		caption: `${paint.label} ${config.model}`,
	};

	if (stepId === "finalize" || focusArea === "finalize") {
		return { main: defaultMain, details: [], hideDetails: true };
	}

	if (stepId === "accessories" || focusArea === "accessories") {
		const orderedAccessories = [
			...selectedAccessories,
			...config.accessories.filter(
				(accessory) =>
					!selectedAccessories.some((selected) => selected.id === accessory.id),
			),
		];
		const primaryAccessory = orderedAccessories[0];
		return {
			main: primaryAccessory
				? {
						image: primaryAccessory.image,
						caption: primaryAccessory.label,
					}
				: defaultMain,
			details: orderedAccessories.slice(1).map((accessory) => ({
				image: accessory.image,
				caption: accessory.label,
			})),
		};
	}

	if (focusArea === "wheels") {
		const alternateWheel =
			config.wheels.find((option) => option.id !== wheel.id) ?? wheel;
		return {
			main: { image: wheel.image, caption: wheel.label },
			details: [
				{ image: wheel.image, caption: wheel.label },
				{ image: alternateWheel.image, caption: alternateWheel.label },
			],
		};
	}

	if (focusArea === "interior") {
		const alternateInterior =
			config.interiors.find((option) => option.id !== interior.id) ?? interior;
		return {
			main: {
				image: toSwatchPreviewImage(
					interior.swatch,
					interior.label,
					"Selected interior",
				),
				caption: interior.label,
			},
			details: [
				{
					image: toSwatchPreviewImage(
						interior.swatch,
						interior.label,
						"Current",
					),
					caption: interior.label,
				},
				{
					image: toSwatchPreviewImage(
						alternateInterior.swatch,
						alternateInterior.label,
						"Alternative",
					),
					caption: alternateInterior.label,
				},
			],
		};
	}

	if (focusArea === "upgrades") {
		const orderedUpgrades = [
			...selectedUpgrades,
			...config.upgrades.filter(
				(upgrade) =>
					!selectedUpgrades.some((selected) => selected.id === upgrade.id),
			),
		];
		const primaryUpgrade = orderedUpgrades[0];
		return {
			main: primaryUpgrade?.image
				? { image: primaryUpgrade.image, caption: primaryUpgrade.label }
				: defaultMain,
			details: orderedUpgrades
				.slice(1)
				.filter((upgrade) => upgrade.image)
				.map((upgrade) => ({
					image: upgrade.image!,
					caption: upgrade.label,
				})),
		};
	}

	if (focusArea === "paint") {
		return {
			main: defaultMain,
			details: [],
			hideDetails: true,
		};
	}

	const alternatePaint =
		config.paints.find((option) => option.id !== paint.id) ?? paint;
	const highlightedUpgrade =
		selectedUpgrades[0] ?? config.upgrades.find((upgrade) => upgrade.included);
	return {
		main: defaultMain,
		details: [
			{ image: wheel.image, caption: wheel.label },
			highlightedUpgrade?.image
				? {
						image: highlightedUpgrade.image,
						caption: highlightedUpgrade.label,
					}
				: {
						image: alternatePaint.previewImage,
						caption: alternatePaint.label,
					},
		],
	};
};

export const setupVehicleBuildJourney = (
	root: ParentNode,
	cleanup: CleanupBag,
	config: VehicleBuildConfig,
): void => {
	const mainImageLayerNodes = Array.from(
		root.querySelectorAll<HTMLImageElement>(
			"[data-vehicle-build-main-image-layer]",
		),
	);
	const legacyMainImage = root.querySelector<HTMLImageElement>(
		"[data-vehicle-build-main-image]",
	);
	const mainImages =
		mainImageLayerNodes.length >= 2
			? mainImageLayerNodes.slice(0, 2)
			: legacyMainImage
				? [legacyMainImage]
				: [];
	const hasLayeredMainImages = mainImages.length > 1;
	const galleryControls = root.querySelector<HTMLElement>(
		"[data-vehicle-build-gallery-controls]",
	);
	const galleryPrevButton = root.querySelector<HTMLButtonElement>(
		"[data-vehicle-build-gallery-prev]",
	);
	const galleryNextButton = root.querySelector<HTMLButtonElement>(
		"[data-vehicle-build-gallery-next]",
	);
	const galleryDots = root.querySelector<HTMLElement>(
		"[data-vehicle-build-gallery-dots]",
	);

	const stepButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>(
			"[data-vehicle-build-step-button]",
		),
	);
	const stepCrumbNodes = Array.from(
		root.querySelectorAll<HTMLElement>("[data-vehicle-build-step-crumb]"),
	);
	const stepPanels = Array.from(
		root.querySelectorAll<HTMLElement>("[data-vehicle-build-step-panel]"),
	);
	const panelScrollHost = root.querySelector<HTMLElement>(".dusk-build__panel");
	const nextButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-step-next]"),
	);
	const prevButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-step-prev]"),
	);

	const paintButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-paint]"),
	);
	const wheelButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-wheel]"),
	);
	const interiorButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-interior]"),
	);
	const upgradeButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-upgrade]"),
	);
	const accessoryButtons = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-vehicle-build-accessory]"),
	);
	const upgradePriceLabels = Array.from(
		root.querySelectorAll<HTMLElement>(
			"[data-vehicle-build-upgrade-price-label]",
		),
	);

	if (
		mainImages.length === 0 ||
		stepPanels.length === 0 ||
		paintButtons.length === 0 ||
		wheelButtons.length === 0 ||
		upgradeButtons.length === 0 ||
		accessoryButtons.length === 0
	) {
		return;
	}

	const stepTitleNodes = getNodeList(root, "[data-vehicle-build-step-title]");
	const modelNodes = getNodeList(root, "[data-vehicle-build-model]");
	const rangeNodes = getNodeList(root, "[data-vehicle-build-range]");
	const accelNodes = getNodeList(root, "[data-vehicle-build-accel]");
	const paintNameNodes = getNodeList(root, "[data-vehicle-build-paint-name]");
	const wheelNameNodes = getNodeList(root, "[data-vehicle-build-wheel-name]");
	const wheelDescriptionNodes = getNodeList(
		root,
		"[data-vehicle-build-wheel-description]",
	);
	const interiorNameNodes = getNodeList(
		root,
		"[data-vehicle-build-interior-name]",
	);
	const interiorDescriptionNodes = getNodeList(
		root,
		"[data-vehicle-build-interior-description]",
	);
	const paintPriceNodes = getNodeList(root, "[data-vehicle-build-paint-price]");
	const wheelPriceNodes = getNodeList(root, "[data-vehicle-build-wheel-price]");
	const interiorPriceNodes = getNodeList(
		root,
		"[data-vehicle-build-interior-price]",
	);
	const rangeMilesNodes = getNodeList(root, "[data-vehicle-build-range-miles]");
	const upgradesPriceNodes = getNodeList(
		root,
		"[data-vehicle-build-upgrades-price]",
	);
	const accessoriesPriceNodes = getNodeList(
		root,
		"[data-vehicle-build-accessories-price]",
	);
	const totalPriceNodes = getNodeList(root, "[data-vehicle-build-total-price]");
	const monthlyPriceNodes = getNodeList(
		root,
		"[data-vehicle-build-monthly-price]",
	);
	const depositNodes = getNodeList(root, "[data-vehicle-build-deposit]");
	const depositConsentField = root.querySelector<HTMLInputElement>(
		"[data-vehicle-build-deposit-consent]",
	);
	const checkoutCta = root.querySelector<HTMLButtonElement>(
		"[data-vehicle-build-checkout-cta]",
	);

	const stepOrder = config.steps.map((step) => step.id);
	const getStepIndex = (stepId: VehicleBuildStepId): number =>
		Math.max(stepOrder.indexOf(stepId), 0);

	const findPaint = (id: string | undefined): VehiclePaintOption =>
		config.paints.find((paint) => paint.id === id) ?? config.paints[0];
	const findWheel = (id: string | undefined): VehicleWheelOption =>
		config.wheels.find((wheel) => wheel.id === id) ?? config.wheels[0];
	const findInterior = (id: string | undefined) =>
		config.interiors.find((interior) => interior.id === id) ??
		config.interiors[0];
	const findUpgrade = (id: string | undefined): VehicleUpgradeOption | null =>
		config.upgrades.find((upgrade) => upgrade.id === id) ?? null;
	const findAccessory = (
		id: string | undefined,
	): VehicleAccessoryOption | null =>
		config.accessories.find((accessory) => accessory.id === id) ?? null;
	const buildStepPanel = root.querySelector<HTMLElement>(
		`[data-vehicle-build-step-panel="build"]`,
	);
	const buildFocusSections = buildStepPanel
		? Array.from(
				buildStepPanel.querySelectorAll<HTMLElement>(
					"[data-vehicle-build-focus-area]",
				),
			)
		: [];
	const buildFocusAreaIndexes = new Map<VehicleBuildFocusArea, number>();
	for (let index = 0; index < buildFocusSections.length; index += 1) {
		const area = buildFocusSections[index].dataset.vehicleBuildFocusArea;
		if (!isFocusArea(area)) {
			continue;
		}
		buildFocusAreaIndexes.set(area, index);
	}

	const defaultSelectedUpgradeIds = new Set<string>(
		config.defaultSelectedUpgradeIds ?? [],
	);
	for (const upgrade of config.upgrades) {
		if (upgrade.included) {
			defaultSelectedUpgradeIds.add(upgrade.id);
		}
	}

	const state: VehicleBuildState = {
		stepId: config.steps[0]?.id ?? "build",
		paintId: config.defaultPaintId ?? config.paints[0]?.id,
		wheelId: config.defaultWheelId ?? config.wheels[0]?.id,
		interiorId: config.defaultInteriorId ?? config.interiors[0]?.id,
		selectedUpgradeIds: new Set(defaultSelectedUpgradeIds),
		selectedAccessoryIds: new Set(config.defaultSelectedAccessoryIds ?? []),
	};
	let activeFocusArea: VehicleBuildFocusArea = toStepFallbackFocusArea(
		state.stepId,
	);
	let maxRevealedBuildFocusIndex = 0;
	let galleryItems: ShowcaseItem[] = [];
	let gallerySignature = "";
	let galleryIndex = 0;
	let activeMainImageLayerIndex = 0;
	let mainImageSwapToken = 0;
	const prefersReducedMotion =
		typeof window.matchMedia === "function" &&
		window.matchMedia("(prefers-reduced-motion: reduce)").matches;

	if (hasLayeredMainImages) {
		const activeLayerIndex = mainImages.findIndex((image) =>
			image.classList.contains("is-active"),
		);
		activeMainImageLayerIndex = activeLayerIndex >= 0 ? activeLayerIndex : 0;
		mainImages.forEach((image, index) => {
			image.classList.toggle("is-active", index === activeMainImageLayerIndex);
			if (index === activeMainImageLayerIndex) {
				image.removeAttribute("aria-hidden");
				return;
			}
			image.setAttribute("aria-hidden", "true");
		});
	}

	for (const image of mainImages) {
		image.dataset.vehicleBuildImageSrc = image.getAttribute("src") ?? "";
	}

	const revealBuildFocusThrough = (focusArea: VehicleBuildFocusArea): void => {
		const index = buildFocusAreaIndexes.get(focusArea);
		if (typeof index === "number") {
			maxRevealedBuildFocusIndex = Math.max(maxRevealedBuildFocusIndex, index);
		}
	};

	const getMaxVisibleBuildFocusIndex = (): number => {
		if (
			state.stepId !== "build" ||
			!panelScrollHost ||
			buildFocusSections.length === 0
		) {
			return -1;
		}

		const panelRect = panelScrollHost.getBoundingClientRect();
		let maxVisibleIndex = -1;

		for (let index = 0; index < buildFocusSections.length; index += 1) {
			const section = buildFocusSections[index];
			const rect = section.getBoundingClientRect();
			const visiblePixels =
				Math.min(rect.bottom, panelRect.bottom) -
				Math.max(rect.top, panelRect.top);
			if (visiblePixels > 0) {
				maxVisibleIndex = index;
			}
		}

		return maxVisibleIndex;
	};

	const syncBuildFocusSections = (): void => {
		for (let index = 0; index < buildFocusSections.length; index += 1) {
			const section = buildFocusSections[index];
			const area = section.dataset.vehicleBuildFocusArea;
			const isActiveFocus = isFocusArea(area) && area === activeFocusArea;
			const shouldReveal =
				state.stepId === "build" && index <= maxRevealedBuildFocusIndex;

			section.classList.toggle("is-active-focus", isActiveFocus);
			section.classList.toggle("is-revealed", shouldReveal);
		}
	};

	const getVisibleFocusArea = (): VehicleBuildFocusArea => {
		const fallbackArea = toStepFallbackFocusArea(state.stepId);
		if (!panelScrollHost) {
			return fallbackArea;
		}

		const activePanel = panelScrollHost.querySelector<HTMLElement>(
			`[data-vehicle-build-step-panel="${state.stepId}"]`,
		);
		if (!activePanel) {
			return fallbackArea;
		}

		const focusSections = Array.from(
			activePanel.querySelectorAll<HTMLElement>(
				"[data-vehicle-build-focus-area]",
			),
		);
		if (focusSections.length === 0) {
			return fallbackArea;
		}

		const panelRect = panelScrollHost.getBoundingClientRect();
		const focusTargetY = panelRect.top + panelRect.height * 0.34;
		let bestArea = fallbackArea;
		let bestScore = Number.NEGATIVE_INFINITY;

		for (const section of focusSections) {
			const area = section.dataset.vehicleBuildFocusArea;
			if (!isFocusArea(area)) {
				continue;
			}

			const rect = section.getBoundingClientRect();
			const visiblePixels =
				Math.min(rect.bottom, panelRect.bottom) -
				Math.max(rect.top, panelRect.top);
			if (visiblePixels <= 0) {
				continue;
			}

			const distanceScore = Math.abs(rect.top - focusTargetY);
			const sectionScore = visiblePixels - distanceScore * 0.35;
			if (sectionScore > bestScore) {
				bestScore = sectionScore;
				bestArea = area;
			}
		}

		return bestArea;
	};

	const toGalleryItems = (showcase: ShowcaseContent): ShowcaseItem[] => {
		const candidates = [showcase.main, ...showcase.details];
		const uniqueItems: ShowcaseItem[] = [];
		const seen = new Set<string>();

		for (const item of candidates) {
			const key = `${item.image}::${item.caption}`;
			if (seen.has(key)) {
				continue;
			}
			seen.add(key);
			uniqueItems.push(item);
		}

		return uniqueItems.length > 0 ? uniqueItems : [showcase.main];
	};

	const renderGalleryControls = (): void => {
		if (!galleryControls || !galleryDots) {
			return;
		}

		const showControls = galleryItems.length > 1;
		galleryControls.hidden = !showControls;
		if (!showControls) {
			galleryDots.replaceChildren();
			return;
		}

		const dots = galleryItems.map((_, index) => {
			const dot = document.createElement("button");
			dot.type = "button";
			dot.className = `dusk-build__gallery-dot ${index === galleryIndex ? "is-active" : ""}`;
			dot.dataset.vehicleBuildGalleryIndex = String(index);
			dot.setAttribute("aria-label", `Show image ${index + 1}`);
			dot.setAttribute("aria-pressed", String(index === galleryIndex));
			return dot;
		});
		galleryDots.replaceChildren(...dots);

		if (galleryPrevButton) {
			galleryPrevButton.disabled = !showControls;
		}
		if (galleryNextButton) {
			galleryNextButton.disabled = !showControls;
		}
	};

	const renderGalleryImage = (): void => {
		const activeItem = galleryItems[galleryIndex];
		if (!activeItem) {
			return;
		}
		const nextAlt = `${activeItem.caption} preview`;

		if (!hasLayeredMainImages || prefersReducedMotion) {
			const primaryImage = mainImages[0];
			if (!primaryImage) {
				return;
			}
			if (primaryImage.dataset.vehicleBuildImageSrc !== activeItem.image) {
				primaryImage.src = activeItem.image;
				primaryImage.dataset.vehicleBuildImageSrc = activeItem.image;
			}
			primaryImage.alt = nextAlt;
			primaryImage.removeAttribute("aria-hidden");
			renderGalleryControls();
			return;
		}

		const currentImage = mainImages[activeMainImageLayerIndex];
		if (!currentImage) {
			return;
		}
		if (currentImage.dataset.vehicleBuildImageSrc === activeItem.image) {
			currentImage.alt = nextAlt;
			renderGalleryControls();
			return;
		}

		const nextImageLayerIndex =
			(activeMainImageLayerIndex + 1) % mainImages.length;
		const nextImage = mainImages[nextImageLayerIndex];
		if (!nextImage) {
			return;
		}

		const swapToken = ++mainImageSwapToken;
		void loadImageAsset(activeItem.image).then(() => {
			if (swapToken !== mainImageSwapToken) {
				return;
			}

			nextImage.src = activeItem.image;
			nextImage.dataset.vehicleBuildImageSrc = activeItem.image;
			nextImage.alt = nextAlt;
			nextImage.classList.add("is-active");
			nextImage.removeAttribute("aria-hidden");
			currentImage.classList.remove("is-active");
			currentImage.setAttribute("aria-hidden", "true");
			activeMainImageLayerIndex = nextImageLayerIndex;
		});
		renderGalleryControls();
	};

	const render = (): void => {
		if (state.stepId === "build") {
			revealBuildFocusThrough(activeFocusArea);
		}

		const paint = findPaint(state.paintId);
		const wheel = findWheel(state.wheelId);
		const interior = findInterior(state.interiorId);
		const selectedUpgrades = config.upgrades.filter(
			(upgrade) => upgrade.included || state.selectedUpgradeIds.has(upgrade.id),
		);
		const selectedOptionalUpgrades = selectedUpgrades.filter(
			(upgrade) => !upgrade.included,
		);
		const selectedAccessories = config.accessories.filter((accessory) =>
			state.selectedAccessoryIds.has(accessory.id),
		);

		const upgradesSubtotal = selectedOptionalUpgrades.reduce(
			(sum, upgrade) => sum + upgrade.price,
			0,
		);
		const accessoriesSubtotal = selectedAccessories.reduce(
			(sum, accessory) => sum + accessory.price,
			0,
		);
		const totalPrice =
			config.basePrice +
			paint.price +
			wheel.price +
			interior.price +
			upgradesSubtotal +
			accessoriesSubtotal;

		for (const step of config.steps) {
			const isActiveStep = step.id === state.stepId;
			for (const button of stepButtons) {
				if (button.dataset.vehicleBuildStepButton !== step.id) {
					continue;
				}
				button.classList.toggle("is-active", isActiveStep);
				button.setAttribute("aria-pressed", String(isActiveStep));
			}
			for (const panel of stepPanels) {
				if (panel.dataset.vehicleBuildStepPanel !== step.id) {
					continue;
				}
				panel.classList.toggle("is-active", isActiveStep);
				panel.hidden = !isActiveStep;
			}
			for (const crumb of stepCrumbNodes) {
				if (crumb.dataset.vehicleBuildStepCrumb !== step.id) {
					continue;
				}
				crumb.classList.toggle("is-active", isActiveStep);
				if (isActiveStep) {
					crumb.setAttribute("aria-current", "step");
					continue;
				}
				crumb.removeAttribute("aria-current");
			}
		}

		for (const button of paintButtons) {
			const isActive = button.dataset.vehicleBuildPaint === paint.id;
			button.classList.toggle("is-active", isActive);
			button.setAttribute("aria-pressed", String(isActive));
		}

		for (const button of wheelButtons) {
			const isActive = button.dataset.vehicleBuildWheel === wheel.id;
			button.classList.toggle("is-active", isActive);
			button.setAttribute("aria-pressed", String(isActive));
		}

		for (const button of interiorButtons) {
			const isActive = button.dataset.vehicleBuildInterior === interior.id;
			button.classList.toggle("is-active", isActive);
			button.setAttribute("aria-pressed", String(isActive));
		}

		for (const button of upgradeButtons) {
			const upgrade = findUpgrade(button.dataset.vehicleBuildUpgrade);
			if (!upgrade) {
				continue;
			}

			const isSelected =
				upgrade.included || state.selectedUpgradeIds.has(upgrade.id);
			button.classList.toggle("is-selected", isSelected);
			button.setAttribute("aria-pressed", String(isSelected));
		}

		for (const node of upgradePriceLabels) {
			const upgrade = findUpgrade(node.dataset.vehicleBuildUpgradePriceLabel);
			if (!upgrade) {
				continue;
			}

			const isSelected =
				upgrade.included || state.selectedUpgradeIds.has(upgrade.id);
			node.textContent = upgrade.included
				? "Included"
				: isSelected
					? "Added"
					: toUsdWhole(upgrade.price);
		}

		for (const button of accessoryButtons) {
			const accessory = findAccessory(button.dataset.vehicleBuildAccessory);
			if (!accessory) {
				continue;
			}
			const isSelected = state.selectedAccessoryIds.has(accessory.id);
			button.classList.toggle("is-selected", isSelected);
			button.setAttribute("aria-pressed", String(isSelected));
		}

		const showcase = describeShowcase(
			state.stepId,
			activeFocusArea,
			paint,
			wheel,
			interior,
			selectedUpgrades,
			selectedAccessories,
			config,
		);
		const nextGalleryItems = toGalleryItems(showcase);
		const nextGallerySignature = nextGalleryItems
			.map((item) => item.image)
			.join("|");
		if (nextGallerySignature !== gallerySignature) {
			gallerySignature = nextGallerySignature;
			galleryIndex = 0;
		}
		galleryItems = nextGalleryItems;
		if (galleryIndex >= galleryItems.length) {
			galleryIndex = Math.max(0, galleryItems.length - 1);
		}
		renderGalleryImage();

		setText(stepTitleNodes, config.steps[getStepIndex(state.stepId)].title);
		setText(modelNodes, config.model);
		setText(
			rangeNodes,
			`${toRangeKilometers(wheel.rangeMiles)} km range (est.)`,
		);
		setText(
			accelNodes,
			`0-100 in ${toZeroToHundredTime(wheel.zeroToSixtySec)}`,
		);
		setText(paintNameNodes, paint.label);
		setText(wheelNameNodes, wheel.label);
		setText(wheelDescriptionNodes, wheel.description);
		setText(interiorNameNodes, interior.label);
		setText(interiorDescriptionNodes, interior.description);
		setText(
			paintPriceNodes,
			paint.price > 0 ? toUsdWhole(paint.price) : "Included",
		);
		setText(
			wheelPriceNodes,
			wheel.price > 0 ? toUsdWhole(wheel.price) : "Included",
		);
		setText(
			interiorPriceNodes,
			interior.price > 0 ? toUsdWhole(interior.price) : "Included",
		);
		setText(rangeMilesNodes, `${toRangeKilometers(wheel.rangeMiles)} km`);
		setText(
			upgradesPriceNodes,
			upgradesSubtotal > 0 ? toUsdWhole(upgradesSubtotal) : "Included",
		);
		setText(
			accessoriesPriceNodes,
			accessoriesSubtotal > 0 ? toUsdWhole(accessoriesSubtotal) : "Included",
		);
		setText(totalPriceNodes, toUsdWhole(totalPrice));
		setText(monthlyPriceNodes, toLeaseEstimate(totalPrice));
		setText(depositNodes, toUsdWhole(config.checkoutDeposit));
		syncBuildFocusSections();
	};

	const scrollPanelToTop = (): void => {
		if (!panelScrollHost) {
			return;
		}
		panelScrollHost.scrollTo({ top: 0, behavior: "auto" });
	};

	const isPageAtBottom = (): boolean => {
		const scrollingElement = document.scrollingElement;
		if (!scrollingElement) {
			return false;
		}

		const remainingScroll =
			scrollingElement.scrollHeight -
			(scrollingElement.scrollTop + window.innerHeight);
		return remainingScroll <= 2;
	};

	for (const button of stepButtons) {
		cleanup.on(button, "click", () => {
			const stepId = button.dataset.vehicleBuildStepButton as
				| VehicleBuildStepId
				| undefined;
			if (!stepId || !stepOrder.includes(stepId)) {
				return;
			}
			state.stepId = stepId;
			activeFocusArea = toStepFallbackFocusArea(stepId);
			render();
		});
	}

	for (const button of nextButtons) {
		cleanup.on(button, "click", () => {
			const stepId = button.dataset.vehicleBuildStepNext as
				| VehicleBuildStepId
				| undefined;
			if (!stepId || !stepOrder.includes(stepId)) {
				return;
			}
			state.stepId = stepId;
			activeFocusArea = toStepFallbackFocusArea(stepId);
			render();
			scrollPanelToTop();
		});
	}

	for (const button of prevButtons) {
		cleanup.on(button, "click", () => {
			const stepId = button.dataset.vehicleBuildStepPrev as
				| VehicleBuildStepId
				| undefined;
			if (!stepId || !stepOrder.includes(stepId)) {
				return;
			}
			state.stepId = stepId;
			activeFocusArea = toStepFallbackFocusArea(stepId);
			render();
			scrollPanelToTop();
		});
	}

	if (galleryPrevButton) {
		cleanup.on(galleryPrevButton, "click", () => {
			if (galleryItems.length <= 1) {
				return;
			}
			galleryIndex =
				(galleryIndex - 1 + galleryItems.length) % galleryItems.length;
			renderGalleryImage();
		});
	}

	if (galleryNextButton) {
		cleanup.on(galleryNextButton, "click", () => {
			if (galleryItems.length <= 1) {
				return;
			}
			galleryIndex = (galleryIndex + 1) % galleryItems.length;
			renderGalleryImage();
		});
	}

	if (galleryDots) {
		cleanup.on(galleryDots, "click", (event) => {
			const target = (event.target as HTMLElement).closest<HTMLElement>(
				"[data-vehicle-build-gallery-index]",
			);
			if (!target) {
				return;
			}

			const index = Number.parseInt(
				target.dataset.vehicleBuildGalleryIndex ?? "",
				10,
			);
			if (
				!Number.isFinite(index) ||
				index < 0 ||
				index >= galleryItems.length
			) {
				return;
			}

			galleryIndex = index;
			renderGalleryImage();
		});
	}

	if (panelScrollHost) {
		cleanup.on(
			panelScrollHost,
			"scroll",
			() => {
				const focusArea = getVisibleFocusArea();
				const maxVisibleIndex = getMaxVisibleBuildFocusIndex();
				const shouldRevealMore = maxVisibleIndex > maxRevealedBuildFocusIndex;
				if (focusArea === activeFocusArea && !shouldRevealMore) {
					return;
				}
				activeFocusArea = focusArea;
				if (shouldRevealMore) {
					maxRevealedBuildFocusIndex = maxVisibleIndex;
				}
				render();
			},
			{ passive: true },
		);
	}

	if (panelScrollHost && root instanceof HTMLElement) {
		cleanup.on(
			root,
			"wheel",
			(event) => {
				if (!window.matchMedia("(min-width: 1181px)").matches) {
					return;
				}

				if (panelScrollHost.scrollHeight <= panelScrollHost.clientHeight + 1) {
					return;
				}

				const deltaY = event.deltaY;
				if (Math.abs(deltaY) < 0.1) {
					return;
				}

				const maxScrollTop =
					panelScrollHost.scrollHeight - panelScrollHost.clientHeight;
				const currentScrollTop = panelScrollHost.scrollTop;
				const canScrollDown =
					deltaY > 0 && currentScrollTop < maxScrollTop - 0.5;
				const canScrollUp = deltaY < 0 && currentScrollTop > 0.5;

				if (!canScrollDown && !canScrollUp) {
					return;
				}

				if (!isPageAtBottom()) {
					return;
				}

				event.preventDefault();
				panelScrollHost.scrollBy({ top: deltaY, behavior: "auto" });
			},
			{ passive: false },
		);
	}

	for (const button of paintButtons) {
		cleanup.on(button, "click", () => {
			const paintId = button.dataset.vehicleBuildPaint;
			if (!paintId || paintId === state.paintId) {
				return;
			}
			state.paintId = paintId;
			activeFocusArea = "paint";
			render();
		});
	}

	for (const button of wheelButtons) {
		cleanup.on(button, "click", () => {
			const wheelId = button.dataset.vehicleBuildWheel;
			if (!wheelId || wheelId === state.wheelId) {
				return;
			}
			state.wheelId = wheelId;
			activeFocusArea = "wheels";
			render();
		});
	}

	for (const button of interiorButtons) {
		cleanup.on(button, "click", () => {
			const interiorId = button.dataset.vehicleBuildInterior;
			if (!interiorId || interiorId === state.interiorId) {
				return;
			}
			state.interiorId = interiorId;
			activeFocusArea = "interior";
			render();
		});
	}

	for (const button of upgradeButtons) {
		cleanup.on(button, "click", () => {
			const upgrade = findUpgrade(button.dataset.vehicleBuildUpgrade);
			if (!upgrade || upgrade.included) {
				return;
			}

			if (state.selectedUpgradeIds.has(upgrade.id)) {
				state.selectedUpgradeIds.delete(upgrade.id);
			} else {
				state.selectedUpgradeIds.add(upgrade.id);
			}

			activeFocusArea = "upgrades";
			render();
		});
	}

	for (const button of accessoryButtons) {
		cleanup.on(button, "click", () => {
			const accessory = findAccessory(button.dataset.vehicleBuildAccessory);
			if (!accessory) {
				return;
			}

			if (state.selectedAccessoryIds.has(accessory.id)) {
				state.selectedAccessoryIds.delete(accessory.id);
			} else {
				state.selectedAccessoryIds.add(accessory.id);
			}
			activeFocusArea = "accessories";
			render();
		});
	}

	if (checkoutCta) {
		let isSubmittingCheckout = false;

		cleanup.on(checkoutCta, "click", async () => {
			if (isSubmittingCheckout) {
				return;
			}

			if (!authStore.getState().isAuthenticated) {
				emitToast({
					level: "warning",
					title: "Sign in required",
					message: "Please sign in before continuing to checkout.",
				});
				getRouter().navigate("/signin");
				return;
			}

			if (depositConsentField && !depositConsentField.checked) {
				emitToast({
					level: "warning",
					message: "Please confirm the non-refundable deposit to continue.",
				});
				return;
			}

			isSubmittingCheckout = true;
			checkoutCta.disabled = true;
			checkoutCta.setAttribute("aria-busy", "true");

			try {
				const depositProduct = await findDepositProduct();
				if (!depositProduct) {
					throw new Error(
						"Could not find a product named deposit. Please add it in products first.",
					);
				}
				if (depositProduct.quantity <= 0) {
					throw new Error(
						`Deposit product (id ${depositProduct.id}) is out of stock. Increase its quantity in dashboard.`,
					);
				}

				await clearCartItemsForDeposit();
				await cartApi.addToCart(depositProduct.id, 1);
				await cartStore.loadCart();

				getRouter().navigate("/checkout");
			} catch (error) {
				emitToast({
					level: "error",
					message:
						error instanceof Error
							? error.message
							: "Unable to continue to checkout.",
				});
			} finally {
				isSubmittingCheckout = false;
				checkoutCta.disabled = false;
				checkoutCta.removeAttribute("aria-busy");
			}
		});
	}

	cleanup.add(() => {
		mainImageSwapToken += 1;
	});

	render();
};
