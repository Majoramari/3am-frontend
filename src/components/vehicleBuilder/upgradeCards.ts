import { View } from "@lib/view";
import type { VehicleUpgradeOption } from "./types";

type VehicleUpgradeCardsOptions = {
	upgrades: ReadonlyArray<VehicleUpgradeOption>;
	defaultSelectedIds: ReadonlySet<string>;
	hideImages?: boolean;
};

const usdWholeFormatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
	minimumFractionDigits: 0,
	maximumFractionDigits: 0,
});

const toUsdWhole = (value: number): string => usdWholeFormatter.format(value);

export class VehicleUpgradeCards extends View<"div"> {
	private readonly upgrades: ReadonlyArray<VehicleUpgradeOption>;
	private readonly defaultSelectedIds: ReadonlySet<string>;
	private readonly hideImages: boolean;

	constructor(options: VehicleUpgradeCardsOptions) {
		super("div", { className: "dusk-build__option-list" });
		this.upgrades = options.upgrades;
		this.defaultSelectedIds = options.defaultSelectedIds;
		this.hideImages = options.hideImages ?? false;
	}

	render(): DocumentFragment {
		return this.tpl`
			${this.upgrades.map((upgrade) => {
				const isDefaultSelected =
					upgrade.included || this.defaultSelectedIds.has(upgrade.id);
				return this.tpl`
					<button
						type="button"
						class="dusk-build__option-card ${this.hideImages ? "is-no-media" : ""} ${
							isDefaultSelected ? "is-selected" : ""
						}"
						data-vehicle-build-upgrade="${upgrade.id}"
						aria-pressed="${isDefaultSelected ? "true" : "false"}"
						${upgrade.included ? "disabled" : ""}
					>
						${
							this.hideImages
								? ""
								: this.tpl`<img src="${upgrade.image}" alt="${upgrade.label}" loading="lazy" />`
						}
						<span class="dusk-build__option-copy">
							<span class="dusk-build__option-title">${upgrade.label}</span>
							<span class="dusk-build__option-description">${upgrade.description}</span>
						</span>
						<span
							class="dusk-build__option-price"
							data-vehicle-build-upgrade-price-label="${upgrade.id}"
						>
							${
								upgrade.included
									? "Included"
									: isDefaultSelected
										? "Added"
										: toUsdWhole(upgrade.price)
							}
						</span>
					</button>
				`;
			})}
		`;
	}
}
