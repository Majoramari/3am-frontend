import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";
import { setupFeaturedGrid } from "./featuredGridController";

export type FeaturedGridItem = {
	id: string;
	name: string;
	price: string;
	imageSrc: string;
	imageAlt?: string;
};

export type FeaturedGridCategory = {
	label: string;
	topRow: ReadonlyArray<FeaturedGridItem>;
	bottomRow: ReadonlyArray<FeaturedGridItem>;
};

export type FeaturedGridConfig = {
	categories: ReadonlyArray<FeaturedGridCategory>;
	viewAllLabel?: string;
	onViewAll?: () => void;
	onNavigate?: (id: string) => void;
};

export class FeaturedGrid extends View<"section"> {
	private readonly config: FeaturedGridConfig;

	constructor(config: FeaturedGridConfig) {
		super("section", { className: "feat-grid", renderMode: "once" });
		this.config = config;
	}

	protected override onMount(): void {
		setupFeaturedGrid(this.element, this.cleanup, this.config.onViewAll, this.config.onNavigate);
	}

	private renderItem(item: FeaturedGridItem, size: "large" | "small"): DocumentFragment {
		return this.tpl`
			<div class="feat-grid__item">
				<button
					class="feat-grid__card feat-grid__card--${size}"
					data-product-id="${item.id}"
					aria-label="View ${item.name}"
				>
					${new LazyImage({
						src: item.imageSrc,
						alt: item.imageAlt ?? item.name,
						className: "feat-grid__card-image",
					})}
				</button>
				<h3 class="feat-grid__item-name">${item.name}</h3>
				<p class="feat-grid__item-price">${item.price}</p>
			</div>
		`;
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="feat-grid__header">
				<div class="feat-grid__pills" role="tablist">
					${this.config.categories.map((cat, i) => this.tpl`
						<button
							class="feat-grid__pill${i === 0 ? " feat-grid__pill--active" : ""}"
							role="tab"
							aria-selected="${i === 0 ? "true" : "false"}"
							data-group="${cat.label.toLowerCase()}"
						>${cat.label}</button>
					`)}
				</div>
				<button class="feat-grid__view-all">
					${this.config.viewAllLabel ?? "View all"}
				</button>
			</div>

			<div class="feat-grid__body">
				${this.config.categories.map((cat, i) => this.tpl`
					<div
						class="feat-grid__group${i === 0 ? "" : " feat-grid__group--hidden"}"
						role="tabpanel"
						data-group="${cat.label.toLowerCase()}"
					>
						<div class="feat-grid__row feat-grid__row--top">
							${cat.topRow.map((item) => this.renderItem(item, "large"))}
						</div>
						<div class="feat-grid__row feat-grid__row--bottom">
							${cat.bottomRow.map((item) => this.renderItem(item, "small"))}
						</div>
					</div>
				`)}
			</div>
		`;
	}
}