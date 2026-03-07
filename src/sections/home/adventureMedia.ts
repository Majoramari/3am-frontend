import { LazyVideo } from "@components/lazyVideo";
import { View } from "@lib/view";
import { setupHomeAdventureMedia } from "./adventureMediaBehavior";

type AdventureItem = {
	pill: string;
	description: string;
	mediaSrc: string;
	posterSrc: string;
};

const adventureItems: AdventureItem[] = [
	{
		pill: "Performance",
		description:
			"Powerful, efficient and tuned for every surface with up to 9 drive modes built for changing terrain.",
		mediaSrc: "/assets/shared/performance.webm",
		posterSrc: "/assets/shared/placeholder.webp",
	},
	{
		pill: "Design",
		description:
			"Durable proportions, clean interior architecture and purposeful details designed for long days outside.",
		mediaSrc: "/assets/shared/design.webm",
		posterSrc: "/assets/shared/placeholder.webp",
	},
];

export class HomeAdventureMediaSection extends View<"section"> {
	constructor() {
		super("section", {
			className: ["page-section", "adventure-media"],
			dataset: { gaSection: "adventure-media" },
		});
	}

	protected override onMount(): void {
		setupHomeAdventureMedia(this.element, this.cleanup);
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="adventure-media__shell">
				<header class="adventure-media__header">
					<h2 class="adventure-media__title">Designed for adventure</h2>
					<div class="adventure-media__pillbar" role="tablist" aria-label="Adventure categories">
						${adventureItems.map(
							(item, index) =>
								this.tpl`
								<button
									type="button"
									class="adventure-media__pill ${index === 0 ? "is-active" : ""}"
									data-adventure-pill-index="${index}"
									aria-pressed="${index === 0 ? "true" : "false"}"
								>
									${item.pill}
								</button>
							`,
						)}
					</div>
				</header>

				<div class="adventure-media__rail" aria-label="Adventure feature videos">
					${adventureItems.map((item, index) => this.renderCard(item, index))}
				</div>
			</div>
		`;
	}

	private renderCard(item: AdventureItem, index: number): DocumentFragment {
		return this.tpl`
			<article class="adventure-media__card" data-adventure-card-index="${index}">
				<div class="adventure-media__video-wrap">
					${new LazyVideo({
						src: item.mediaSrc,
						type: "video/webm",
						poster: item.posterSrc,
						className: "adventure-media__video",
						autoPlay: true,
						muted: true,
						playsInline: true,
						preload: "none",
					})}
				</div>
				<p class="adventure-media__description">${item.description}</p>
			</article>
		`;
	}
}
