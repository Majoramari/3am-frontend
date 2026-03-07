import { View } from "@lib/view";

type DawnHighlight = {
	label: string;
	value: string;
};

const HIGHLIGHTS: ReadonlyArray<DawnHighlight> = [
	{ label: "EPA est. range", value: "Up to 405 mi" },
	{ label: "0-60 mph", value: "As fast as 3.0 sec" },
	{ label: "Drivetrain", value: "Dual / Tri Motor AWD" },
	{ label: "Seating", value: "Up to 7" },
];

export class DawnHighlightsSection extends View<"section"> {
	constructor() {
		super("section", {
			className: ["page-section", "dawn-highlights"],
			dataset: { gaSection: "dawn-highlights" },
		});
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="dawn-highlights__shell">
				<header class="dawn-highlights__header">
					<p class="dawn-highlights__eyebrow">Why Dawn</p>
					<h3 class="dawn-highlights__title">Built for long roads and short errands.</h3>
				</header>

				<ul class="dawn-highlights__grid">
					${HIGHLIGHTS.map(
						(item) => this.tpl`
							<li class="dawn-highlights__card">
								<p class="dawn-highlights__label">${item.label}</p>
								<p class="dawn-highlights__value">${item.value}</p>
							</li>
						`,
					)}
				</ul>
			</div>
		`;
	}
}
