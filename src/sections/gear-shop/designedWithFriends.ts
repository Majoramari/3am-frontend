import { View } from "@lib/view";
import { LazyImage } from "@components/lazyImage";
import { ScrollBar } from "@components/scrollBar";

type DesignedCard = {
	brand: string;
	description: string;
	imageSrc: string;
};

const cards: ReadonlyArray<DesignedCard> = [
	{
		brand: "XPEL x Rivian",
		description: "Help protect your vehicle from the elements and get exclusive rates on services like STEALTH™.",
		imageSrc: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64",
	},
	{
		brand: "iKamper Skycamp Mini",
		description: "Level up your weekend getaways or lounge after long hikes with this set.",
		imageSrc: "https://images.unsplash.com/photo-1486006920555-c77dcf18193c",
	},
	{
		brand: "HEST Foamy for R1S",
		description: "Feel at home on the road with a custom-fit, portable mattress.",
		imageSrc: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
	},
	{
		brand: "DECKED System for R1T",
		description: "A lifted frame that always has your back — and every adventure it takes you on.",
		imageSrc: "https://images.unsplash.com/photo-1606813907291-d86efa9b94db",
	},
];

export class DesignedWithFriendsSection extends View<"section"> {
	constructor() {
		super("section", { className: "gs-designed" });
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="gs-designed__header">
				<h2 class="gs-designed__headline">Designed with friends</h2>
				<p class="gs-designed__desc">Explore exclusive collaborations made for the way you adventure — from tents to trail gear to mud-resistant wraps.</p>
			</div>

			<div class="gs-designed__scroll" id="gsDesignedScroll">
				${cards.map((card) => this.tpl`
					<div class="gs-designed__card">
						<div class="gs-designed__card-info">
							<h3 class="gs-designed__card-brand">${card.brand}</h3>
							<p class="gs-designed__card-desc">${card.description}</p>
							<button class="gs-designed__card-btn">Learn more</button>
						</div>
						${new LazyImage({
							src: card.imageSrc,
							alt: card.brand,
							className: "gs-designed__card-image",
						})}
					</div>
				`)}
			</div>

			${new ScrollBar({ targetId: "gsDesignedScroll", className: "gs-designed__scrollbar" })}
		`;
	}
}