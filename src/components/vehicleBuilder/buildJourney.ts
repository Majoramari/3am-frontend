import { View } from "@lib/view";
import { setupVehicleBuildJourney } from "./buildJourneyBehavior";
import type { VehicleBuildConfig, VehicleBuildStepId } from "./types";
import { VehicleUpgradeCards } from "./upgradeCards";

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

const toSlugSegment = (value: string): string =>
	value
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "") || "model";

const getById = <T extends { id: string }>(
	items: ReadonlyArray<T>,
	id: string | undefined,
): T | undefined => items.find((item) => item.id === id);

export class VehicleBuildJourneySection extends View<"section"> {
	private readonly config: VehicleBuildConfig;

	constructor(config: VehicleBuildConfig) {
		super("section", {
			id: config.id,
			className: ["page-section", config.sectionClassName],
			dataset: { gaSection: `${config.sectionClassName}-journey` },
		});
		this.config = config;
	}

	protected override onMount(): void {
		setupVehicleBuildJourney(this.element, this.cleanup, this.config);
	}

	render(): DocumentFragment {
		const defaultPaint =
			getById(this.config.paints, this.config.defaultPaintId) ??
			this.config.paints[0];
		const defaultWheel =
			getById(this.config.wheels, this.config.defaultWheelId) ??
			this.config.wheels[0];
		const defaultInterior =
			getById(this.config.interiors, this.config.defaultInteriorId) ??
			this.config.interiors[0];
		const defaultSelectedUpgradeIds = new Set(
			this.config.defaultSelectedUpgradeIds ?? [],
		);
		for (const upgrade of this.config.upgrades) {
			if (upgrade.included) {
				defaultSelectedUpgradeIds.add(upgrade.id);
			}
		}
		const defaultUpgradesPrice = this.config.upgrades
			.filter(
				(upgrade) =>
					!upgrade.included && defaultSelectedUpgradeIds.has(upgrade.id),
			)
			.reduce((sum, upgrade) => sum + upgrade.price, 0);
		const defaultAccessoriesPrice = this.config.accessories
			.filter((accessory) =>
				(this.config.defaultSelectedAccessoryIds ?? []).includes(accessory.id),
			)
			.reduce((sum, accessory) => sum + accessory.price, 0);
		const defaultTotal =
			this.config.basePrice +
			defaultPaint.price +
			defaultWheel.price +
			defaultInterior.price +
			defaultUpgradesPrice +
			defaultAccessoriesPrice;
		const nextStepId =
			(this.config.steps[1]?.id as VehicleBuildStepId | undefined) ??
			"accessories";
		const finalizeStepId =
			(this.config.steps[2]?.id as VehicleBuildStepId | undefined) ??
			"finalize";
		const normalizedRootSegment = toSlugSegment(
			this.config.progressRootSegment,
		);
		const modelWithoutRootPrefix = this.config.model
			.toLowerCase()
			.startsWith(`${normalizedRootSegment} `)
			? this.config.model.slice(normalizedRootSegment.length).trim()
			: this.config.model;
		const modelProgressSegment =
			this.config.progressModelSegment ??
			toSlugSegment(modelWithoutRootPrefix || this.config.model);

		return this.tpl`
			<div class="dusk-build__shell">
				<header class="dusk-build__header">
					<p class="dusk-build__eyebrow">${this.config.eyebrow}</p>
					<h1 class="dusk-build__title" data-vehicle-build-step-title>
						${this.config.steps[0]?.title ?? "Build your vehicle"}
					</h1>
					<p class="dusk-build__progress-path" aria-label="Build progress path">
						<span class="dusk-build__progress-segment">${normalizedRootSegment}</span>
						<span class="dusk-build__progress-divider" aria-hidden="true">/</span>
						<span class="dusk-build__progress-segment">${modelProgressSegment}</span>
						<span class="dusk-build__progress-divider" aria-hidden="true">/</span>
						${this.config.steps.map(
							(step, index) => this.tpl`
								<span
									class="dusk-build__progress-segment ${index === 0 ? "is-active" : ""}"
									data-vehicle-build-step-crumb="${step.id}"
								>
									${step.id}
								</span>
								${
									index < this.config.steps.length - 1
										? this
												.tpl`<span class="dusk-build__progress-divider" aria-hidden="true">/</span>`
										: ""
								}
							`,
						)}
					</p>
				</header>

				<div class="dusk-build__layout">
					<div class="dusk-build__stage">
							<div class="dusk-build__viewer">
								<img
									class="dusk-build__main-image is-active"
									data-vehicle-build-main-image
									data-vehicle-build-main-image-layer="0"
									src="${defaultPaint.previewImage}"
									alt="${defaultPaint.label} ${this.config.model} preview"
								/>
								<img
									class="dusk-build__main-image"
									data-vehicle-build-main-image-layer="1"
									src="${defaultPaint.previewImage}"
									alt="${defaultPaint.label} ${this.config.model} preview"
									aria-hidden="true"
								/>
							<div
								class="dusk-build__gallery-controls"
								data-vehicle-build-gallery-controls
								hidden
							>
								<button
									type="button"
									class="dusk-build__gallery-nav"
									data-vehicle-build-gallery-prev
									aria-label="Previous image"
								>
									<svg viewBox="0 0 16 16" aria-hidden="true">
										<path d="M7.3 13.2 2.1 8l5.2-5.2M2.1 8h11.8" />
									</svg>
								</button>
								<div class="dusk-build__gallery-dots" data-vehicle-build-gallery-dots></div>
								<button
									type="button"
									class="dusk-build__gallery-nav"
									data-vehicle-build-gallery-next
									aria-label="Next image"
								>
									<svg viewBox="0 0 16 16" aria-hidden="true">
										<path d="M8.7 13.2 13.9 8 8.7 2.8M2.1 8h11.8" />
									</svg>
								</button>
							</div>
						</div>
					</div>

					<aside class="dusk-build__panel" aria-label="Vehicle build options">
						<section class="dusk-build__panel-step is-active" data-vehicle-build-step-panel="build">
							<header class="dusk-build__panel-head">
								<h2 class="dusk-build__panel-title" data-vehicle-build-model>
									${this.config.model}
								</h2>
								<p class="dusk-build__panel-specs">
									${this.config.drivetrain}
									<span aria-hidden="true">|</span>
									<span data-vehicle-build-accel>
										${`0-100 in ${toZeroToHundredTime(defaultWheel.zeroToSixtySec)}`}
									</span>
									<span aria-hidden="true">|</span>
									${this.config.horsepower} hp
								</p>
								<p class="dusk-build__panel-price-line">
									Range
									<strong data-vehicle-build-range>
										${toRangeKilometers(defaultWheel.rangeMiles)} km range (est.)
									</strong>
								</p>
							</header>

							<section class="dusk-build__group" data-vehicle-build-focus-area="paint">
								<div class="dusk-build__group-head">
									<h3>Paint</h3>
									<span data-vehicle-build-paint-price>
										${defaultPaint.price > 0 ? toUsdWhole(defaultPaint.price) : "Included"}
									</span>
								</div>
								<p class="dusk-build__group-selected" data-vehicle-build-paint-name>
									${defaultPaint.label}
								</p>
								<div class="dusk-build__paint-list" role="listbox" aria-label="Paint options">
									${this.config.paints.map(
										(option) => this.tpl`
											<button
												type="button"
												class="dusk-build__swatch ${option.id === defaultPaint.id ? "is-active" : ""}"
												data-vehicle-build-paint="${option.id}"
												aria-label="${option.label}"
												aria-pressed="${option.id === defaultPaint.id ? "true" : "false"}"
												style="--dusk-swatch-fill: ${option.swatch};"
											>
												<span class="dusk-build__swatch-core" aria-hidden="true"></span>
											</button>
										`,
									)}
								</div>
							</section>

							<section class="dusk-build__group" data-vehicle-build-focus-area="wheels">
								<div class="dusk-build__group-head">
									<h3>Wheel packages</h3>
									<span data-vehicle-build-wheel-price>
										${defaultWheel.price > 0 ? toUsdWhole(defaultWheel.price) : "Included"}
									</span>
								</div>
								<p
									class="dusk-build__group-selected dusk-build__group-selected--wheel"
									data-vehicle-build-wheel-name
								>
									${defaultWheel.label}
								</p>
								<p
									class="dusk-build__wheel-description"
									data-vehicle-build-wheel-description
								>
									${defaultWheel.description}
								</p>
								<div class="dusk-build__wheel-picker" role="listbox" aria-label="Wheel packages">
									${this.config.wheels.map(
										(option) => this.tpl`
											<button
												type="button"
												class="dusk-build__wheel-swatch ${option.id === defaultWheel.id ? "is-active" : ""}"
												data-vehicle-build-wheel="${option.id}"
												aria-label="${option.label}"
												aria-pressed="${option.id === defaultWheel.id ? "true" : "false"}"
											>
												<span class="dusk-build__wheel-swatch-core">
													<img src="${option.image}" alt="${option.label}" loading="lazy" />
												</span>
											</button>
										`,
									)}
								</div>
								<p class="dusk-build__wheel-range-row">
									<span>Estimated range</span>
									<span data-vehicle-build-range-miles>
										${toRangeKilometers(defaultWheel.rangeMiles)} km
									</span>
								</p>
							</section>

							${
								this.config.hideInteriorSection
									? ""
									: this.tpl`
										<section class="dusk-build__group" data-vehicle-build-focus-area="interior">
											<div class="dusk-build__group-head">
												<h3>Interior</h3>
												<span data-vehicle-build-interior-price>
													${defaultInterior.price > 0 ? toUsdWhole(defaultInterior.price) : "Included"}
												</span>
											</div>
											<p class="dusk-build__group-selected" data-vehicle-build-interior-name>
												${defaultInterior.label}
											</p>
											<p
												class="dusk-build__interior-description"
												data-vehicle-build-interior-description
											>
												${defaultInterior.description}
											</p>
											<div class="dusk-build__interior-list" role="listbox" aria-label="Interior options">
												${this.config.interiors.map(
													(option) => this.tpl`
														<button
															type="button"
															class="dusk-build__interior-swatch ${
																option.id === defaultInterior.id
																	? "is-active"
																	: ""
															}"
															data-vehicle-build-interior="${option.id}"
															aria-label="${option.label}"
															aria-pressed="${option.id === defaultInterior.id ? "true" : "false"}"
															style="--dusk-interior-swatch-fill: ${option.swatch};"
														>
															<span class="dusk-build__interior-swatch-core" aria-hidden="true"></span>
														</button>
													`,
												)}
											</div>
										</section>
									`
							}

							<section class="dusk-build__group" data-vehicle-build-focus-area="upgrades">
								<div class="dusk-build__group-head">
									<h3>Upgrades</h3>
									<span data-vehicle-build-upgrades-price>
										${defaultUpgradesPrice > 0 ? toUsdWhole(defaultUpgradesPrice) : "Included"}
									</span>
								</div>
								${new VehicleUpgradeCards({
									upgrades: this.config.upgrades,
									defaultSelectedIds: defaultSelectedUpgradeIds,
									hideImages: this.config.hideUpgradeImages,
								})}
							</section>

							<div class="dusk-build__step-actions">
								<button
									type="button"
									class="dusk-build__step-cta"
									data-vehicle-build-step-next="${nextStepId}"
								>
									Next - ${this.config.steps[1]?.label ?? "Accessories"}
								</button>
							</div>
						</section>

						<section class="dusk-build__panel-step" data-vehicle-build-step-panel="${nextStepId}" hidden>
							<header class="dusk-build__panel-head">
								<h2 class="dusk-build__panel-title">${this.config.steps[1]?.label ?? "Accessories"}</h2>
								<p class="dusk-build__panel-specs">
									Customize your setup with charging, storage and adventure gear.
								</p>
							</header>

							<section class="dusk-build__group" data-vehicle-build-focus-area="accessories">
								<div class="dusk-build__group-head">
									<h3>Available accessories</h3>
									<span data-vehicle-build-accessories-price>
										${defaultAccessoriesPrice > 0 ? toUsdWhole(defaultAccessoriesPrice) : "Included"}
									</span>
								</div>
								<div class="dusk-build__option-list">
									${this.config.accessories.map(
										(accessory) => this.tpl`
											<button
												type="button"
												class="dusk-build__option-card ${
													(
														this.config.defaultSelectedAccessoryIds ?? []
													).includes(accessory.id)
														? "is-selected"
														: ""
												}"
												data-vehicle-build-accessory="${accessory.id}"
												aria-pressed="${
													(
														this.config.defaultSelectedAccessoryIds ?? []
													).includes(accessory.id)
														? "true"
														: "false"
												}"
											>
												<img src="${accessory.image}" alt="${accessory.label}" loading="lazy" />
												<span class="dusk-build__option-copy">
													<span class="dusk-build__option-title">${accessory.label}</span>
													<span class="dusk-build__option-description">${accessory.description}</span>
												</span>
												<span class="dusk-build__option-price">${toUsdWhole(accessory.price)}</span>
											</button>
										`,
									)}
								</div>
							</section>

							<div class="dusk-build__step-actions is-split">
								<button
									type="button"
									class="dusk-build__step-ghost"
									data-vehicle-build-step-prev="build"
								>
									Back
								</button>
								<button
									type="button"
									class="dusk-build__step-cta"
									data-vehicle-build-step-next="${finalizeStepId}"
								>
									Next - ${this.config.steps[2]?.label ?? "Summary"}
								</button>
							</div>
						</section>

						<section class="dusk-build__panel-step" data-vehicle-build-step-panel="${finalizeStepId}" hidden>
							<header class="dusk-build__panel-head">
								<h2 class="dusk-build__panel-title">Checkout</h2>
								<p class="dusk-build__panel-specs">
									Already have a deposit?
									<a href="/signin">Sign in</a>
								</p>
							</header>

								<section class="dusk-build__checkout-block">
									<h3>Summary</h3>
								<div class="dusk-build__summary-row">
									<span>Vehicle price</span>
									<span>${toUsdWhole(this.config.basePrice)}</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Paint</span>
									<span data-vehicle-build-paint-price>
										${defaultPaint.price > 0 ? toUsdWhole(defaultPaint.price) : "Included"}
									</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Wheels</span>
									<span data-vehicle-build-wheel-price>
										${defaultWheel.price > 0 ? toUsdWhole(defaultWheel.price) : "Included"}
									</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Interior</span>
									<span data-vehicle-build-interior-price>
										${
											defaultInterior.price > 0
												? toUsdWhole(defaultInterior.price)
												: "Included"
										}
									</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Upgrades</span>
									<span data-vehicle-build-upgrades-price>
										${defaultUpgradesPrice > 0 ? toUsdWhole(defaultUpgradesPrice) : "Included"}
									</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Accessories</span>
									<span data-vehicle-build-accessories-price>
										${defaultAccessoriesPrice > 0 ? toUsdWhole(defaultAccessoriesPrice) : "Included"}
									</span>
								</div>
								<div class="dusk-build__summary-row is-strong">
									<span>Order price</span>
									<span data-vehicle-build-total-price>${toUsdWhole(defaultTotal)}</span>
								</div>
								<div class="dusk-build__summary-row">
									<span>Est. payment</span>
									<span data-vehicle-build-monthly-price>${toLeaseEstimate(defaultTotal)}</span>
								</div>
							</section>

							<section class="dusk-build__checkout-block">
								<div class="dusk-build__summary-row is-strong">
									<span>Non-refundable deposit</span>
									<span data-vehicle-build-deposit>
										${toUsdWhole(this.config.checkoutDeposit)}
									</span>
								</div>
								<label class="dusk-build__checkbox-row">
									<input type="checkbox" data-vehicle-build-deposit-consent />
									<span>I understand my deposit is non-refundable.</span>
								</label>
								<button
									type="button"
									class="dusk-build__checkout-cta"
									data-vehicle-build-checkout-cta
								>
									Checkout -
									<span data-vehicle-build-deposit>
										${toUsdWhole(this.config.checkoutDeposit)}
									</span>
									deposit
								</button>
							</section>

							<div class="dusk-build__step-actions">
								<button
									type="button"
									class="dusk-build__step-ghost"
									data-vehicle-build-step-prev="${nextStepId}"
								>
									Back to ${this.config.steps[1]?.label ?? "accessories"}
								</button>
							</div>
						</section>
					</aside>
				</div>

				<div class="dusk-build__dock" aria-hidden="true">
					<div class="dusk-build__dock-main">
						<p class="dusk-build__dock-model" data-vehicle-build-model>
							${this.config.model}
						</p>
						<p class="dusk-build__dock-specs">
							${this.config.drivetrain}
							<span aria-hidden="true">|</span>
							<span data-vehicle-build-range>
								${toRangeKilometers(defaultWheel.rangeMiles)} km range (est.)
							</span>
							<span aria-hidden="true">|</span>
							<span data-vehicle-build-accel>
								${`0-100 in ${toZeroToHundredTime(defaultWheel.zeroToSixtySec)}`}
							</span>
						</p>
					</div>
					<p class="dusk-build__dock-price">
						<span data-vehicle-build-monthly-price>${toLeaseEstimate(defaultTotal)}</span>
						<span aria-hidden="true">·</span>
						<span data-vehicle-build-total-price>${toUsdWhole(defaultTotal)}</span>
					</p>
				</div>
			</div>
		`;
	}
}
