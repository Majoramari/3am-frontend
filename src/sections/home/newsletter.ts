import { InputField } from "@components/inputField";
import { View } from "@lib/view";

type NewsletterTile = {
	label: string;
	href: string;
	themeClassName: string;
};

const newsletterTiles: NewsletterTile[] = [
	{
		label: "Shop",
		href: "/gears",
		themeClassName: "newsletter__tile--shop",
	},
	{
		label: "Demo Drive",
		href: "/demo",
		themeClassName: "newsletter__tile--updates",
	},
	{
		label: "Build Yours",
		href: "/dusk/build",
		themeClassName: "newsletter__tile--trade-in",
	},
];

export class HomeNewsletterSection extends View<"section"> {
	constructor() {
		super("section", {
			className: ["page-section", "newsletter"],
			dataset: { gaSection: "newsletter" },
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="newsletter__shell">
				<header class="newsletter__header">
					<h2 class="newsletter__title">Keep Exploring</h2>
				</header>

				<div class="newsletter__tiles">
					${newsletterTiles.map((tile) => this.renderTile(tile))}
				</div>

				<article class="newsletter__signup">
					<div class="newsletter__signup-copy">
						<h3 class="newsletter__signup-title">
							More all-electric adventures are coming soon.
							<br />
							Sign up to follow along.
						</h3>
					</div>

					<form class="newsletter__signup-form" action="#" method="post">
						${new InputField({
							label: "Email",
							name: "email",
							type: "email",
							className: "newsletter__field",
							inputClassName: "newsletter__input",
							placeholder: "Email *",
							attrs: {
								autocomplete: "email",
								required: true,
							},
						})}
						${new InputField({
							label: "Zip code",
							name: "zip",
							type: "text",
							className: "newsletter__field",
							inputClassName: "newsletter__input",
							placeholder: "Zip code *",
							attrs: {
								inputmode: "numeric",
								required: true,
							},
						})}
						<button type="submit" class="newsletter__submit">Subscribe</button>
						<p class="newsletter__legal">
							By submitting, I agree to receive future communications from 3AM and have read and agree to
							3AM's Terms and acknowledge the
							<a href="#">Data Privacy Notice</a>.
						</p>
					</form>
				</article>
			</div>
		`;
	}

	private renderTile(tile: NewsletterTile): DocumentFragment {
		return this.tpl`
			<a href="${tile.href}" class="newsletter__tile ${tile.themeClassName}">
				<span class="newsletter__tile-label">${tile.label}</span>
				<span class="newsletter__tile-icon" aria-hidden="true">
					<svg viewBox="0 0 20 20" focusable="false">
						<path d="M5.5 10h8" />
						<path d="M10.5 6l4 4-4 4" />
					</svg>
				</span>
			</a>
		`;
	}
}
