import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";

export type ProductViewConfig = {
	backLabel?: string;
	onBack?: () => void;
	imageSrc: string;
	imageAlt: string;
	name: string;
	price: string;
	description: string;
	features: ReadonlyArray<string>;
	onAddToCart?: () => void;
};

export class ProductView extends View<"div"> {
	private readonly config: ProductViewConfig;

	constructor(config: ProductViewConfig) {
		super("div", { className: "prod-view" });
		this.config = config;
	}

	protected override onMount(): void {
		const backBtn = this.element.querySelector<HTMLButtonElement>(".prod-view__back");
		const addBtn  = this.element.querySelector<HTMLButtonElement>(".prod-view__add-btn");

		if (backBtn && this.config.onBack) {
			this.cleanup.on(backBtn, "click", this.config.onBack);
		}

		if (addBtn && this.config.onAddToCart) {
			this.cleanup.on(addBtn, "click", this.config.onAddToCart);
		}
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="prod-view__layout">

				<div class="prod-view__gallery">
					${new LazyImage({
						src: this.config.imageSrc,
						alt: this.config.imageAlt,
						className: "prod-view__image",
					})}
				</div>

				<div class="prod-view__info">
					<button class="prod-view__back" aria-label="Go back">
						← ${this.config.backLabel ?? "Back"}
					</button>

					<h1 class="prod-view__name">${this.config.name}</h1>
					<p class="prod-view__price">${this.config.price}</p>
					<p class="prod-view__description">${this.config.description}</p>

					<ul class="prod-view__features">
						${this.config.features.map((f) => this.tpl`
							<li class="prod-view__feature">${f}</li>
						`)}
					</ul>

					<button class="prod-view__add-btn">Add to cart</button>
				</div>

			</div>
		`;
	}
}