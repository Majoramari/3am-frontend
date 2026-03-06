import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";

export type ProductCardConfig = {
	id: string;
	name: string;
	price: string;
	imageSrc: string;
	imageAlt?: string;
	className?: string;
	onNavigate?: (id: string) => void;
};

export class ProductCard extends View<"div"> {
	private readonly config: ProductCardConfig;

	constructor(config: ProductCardConfig) {
		super("div", {
			className: ["prod-card", config.className ?? ""].filter(Boolean).join(" "),
			renderMode: "once",
		});
		this.config = config;
	}

	protected override onMount(): void {
		const btn = this.element.querySelector<HTMLButtonElement>(".prod-card__btn");
		if (!btn || !this.config.onNavigate) return;
		this.cleanup.on(btn, "click", () => this.config.onNavigate!(this.config.id));
	}

	render(): DocumentFragment {
		return this.tpl`
			<button class="prod-card__btn" aria-label="View ${this.config.name}">
				${new LazyImage({
					src: this.config.imageSrc,
					alt: this.config.imageAlt ?? this.config.name,
					className: "prod-card__image",
				})}
			</button>
			<h3 class="prod-card__name">${this.config.name}</h3>
			<p class="prod-card__price">${this.config.price}</p>
		`;
	}
}