import { View } from "@lib/view";
import { ProductCard, type ProductCardConfig } from "./productCard";

export type CrowdFavoritesConfig = {
	headline?: string;
	items: ReadonlyArray<ProductCardConfig>;
	onNavigate?: (id: string) => void;
};

export class CrowdFavorites extends View<"section"> {
	private readonly headline: string;
	private readonly items: ReadonlyArray<ProductCardConfig>;
	private readonly onNavigate?: (id: string) => void;

	constructor(config: CrowdFavoritesConfig) {
		super("section", { className: "crowd-favs", renderMode: "once" });
		this.headline = config.headline ?? "Crowd favorites";
		this.items = config.items;
		this.onNavigate = config.onNavigate;
	}

	render(): DocumentFragment {
		return this.tpl`
			<h2 class="crowd-favs__headline">${this.headline}</h2>
			<div class="crowd-favs__grid">
				${this.items.map((item) => this.tpl`
					${new ProductCard({
						...item,
						className: "crowd-favs__item",
						onNavigate: this.onNavigate,
					})}
				`)}
			</div>
		`;
	}
}