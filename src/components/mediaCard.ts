import { View } from "@lib/view";

type MediaCardTextAnchor =
	| "top-left"
	| "top-center"
	| "top-right"
	| "center-left"
	| "center"
	| "center-right"
	| "bottom-left"
	| "bottom-center"
	| "bottom-right";

export type MediaCardConfig = {
	label: string;
	href: string;
	className?: string;
	backgroundImage: string;
	deferBackgroundLoad?: boolean;
	backgroundPosition?: string;
	textAnchor?: MediaCardTextAnchor;
	textOffsetX?: string;
	textOffsetY?: string;
	textSize?: string;
	textColor?: string;
	textWeight?: string;
	withOverlay?: boolean;
};

export class MediaCard extends View<"a"> {
	private static readonly DEFAULT_TEXT_ANCHOR: MediaCardTextAnchor =
		"bottom-left";
	private static readonly DEFAULT_TEXT_SIZE = "1.6rem";
	private static readonly DEFAULT_TEXT_COLOR = "rgb(255 255 255)";
	private static readonly DEFAULT_TEXT_WEIGHT = "600";
	private static readonly DEFAULT_BG_POSITION = "center";
	private static readonly DEFAULT_OFFSET = "0px";

	private readonly labelText: string;
	private readonly labelAnchor: MediaCardTextAnchor;
	private readonly labelStyle: string;

	constructor(config: MediaCardConfig) {
		const deferredBackgroundImage = MediaCard.toDeferredBackgroundImage(config);

		super("a", {
			className: MediaCard.toMediaCardClassName(config),
			attrs: {
				href: config.href,
				style: MediaCard.toCardStyle(config, deferredBackgroundImage),
			},
			dataset: {
				overlay: MediaCard.toOverlayDatasetValue(config.withOverlay),
				deferredBgSrc: deferredBackgroundImage,
			},
			renderMode: "once",
		});
		this.labelText = config.label;
		this.labelAnchor = config.textAnchor ?? MediaCard.DEFAULT_TEXT_ANCHOR;
		this.labelStyle = MediaCard.toLabelStyle(config);
	}

	render(): HTMLSpanElement {
		return MediaCard.createLabelNode(
			this.labelText,
			this.labelAnchor,
			this.labelStyle,
		);
	}

	private static toOverlayDatasetValue(
		withOverlay: boolean | undefined,
	): "on" | "off" {
		return withOverlay === false ? "off" : "on";
	}

	private static toMediaCardClassName(config: MediaCardConfig): string {
		return ["media-card", config.className ?? ""].filter(Boolean).join(" ");
	}

	private static toDeferredBackgroundImage(
		config: MediaCardConfig,
	): string | undefined {
		return config.deferBackgroundLoad ? config.backgroundImage : undefined;
	}

	private static toCardStyle(
		config: MediaCardConfig,
		deferredBackgroundImage: string | undefined,
	): string {
		const styleRules = [
			deferredBackgroundImage
				? ""
				: `--media-card-bg-image: url("${config.backgroundImage}")`,
			`--media-card-bg-position: ${config.backgroundPosition ?? MediaCard.DEFAULT_BG_POSITION}`,
		];
		return styleRules.filter(Boolean).join("; ");
	}

	private static toLabelStyle(config: MediaCardConfig): string {
		return [
			`--media-card-text-size: ${config.textSize ?? MediaCard.DEFAULT_TEXT_SIZE}`,
			`--media-card-text-color: ${config.textColor ?? MediaCard.DEFAULT_TEXT_COLOR}`,
			`--media-card-text-weight: ${config.textWeight ?? MediaCard.DEFAULT_TEXT_WEIGHT}`,
			`--media-card-text-offset-x: ${config.textOffsetX ?? MediaCard.DEFAULT_OFFSET}`,
			`--media-card-text-offset-y: ${config.textOffsetY ?? MediaCard.DEFAULT_OFFSET}`,
		]
			.filter(Boolean)
			.join("; ");
	}

	private static createLabelNode(
		text: string,
		anchor: MediaCardTextAnchor,
		style: string,
	): HTMLSpanElement {
		const label = document.createElement("span");
		label.className = "media-card-label";
		label.dataset.anchor = anchor;
		label.setAttribute("style", style);
		label.textContent = text;
		return label;
	}
}
