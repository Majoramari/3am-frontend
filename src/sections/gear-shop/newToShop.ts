import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";

type NewItem = {
	description: string;
	label: string;
	imageSrc: string;
};

const items: ReadonlyArray<NewItem> = [
	{
		description: "Turn the back seats into a mini movie theater with a hands-free mount.",
		label: "Seatback Device Holder",
		imageSrc: "https://images.unsplash.com/photo-1503376780353-7e6692767b70",
	},
	{
		description: "Gear up for the adventure ahead and always choose to take the long way.",
		label: "Long Way Home Collection",
		imageSrc: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
	},
];

export class NewToShopSection extends View<"section"> {
	constructor() {
		super("section", { className: "gs-new" });
	}

	render(): DocumentFragment {
		return this.tpl`
			<h2 class="gs-new__headline">New to Gear Shop</h2>
			<div class="gs-new__grid">
				${items.map((item) => this.tpl`
					<div class="gs-new__item">
						<p class="gs-new__item-desc">${item.description}</p>
						<div class="gs-new__item-card">
							${new LazyImage({ src: item.imageSrc, alt: item.label, className: "gs-new__item-image" })}
							<span class="gs-new__item-label">${item.label}</span>
						</div>
					</div>
				`)}
			</div>
		`;
	}
}