import { View } from "@lib/view";

export type ButtonVariant = "solid" | "outline" | "text" | "cta";

type AttrValue = string | number | boolean | null | undefined;
type AttrMap = Record<string, AttrValue>;

type CommonButtonConfig = {
	label: string;
	variant: ButtonVariant;
	inverted?: boolean;
	className?: string;
	attrs?: AttrMap;
	aria?: AttrMap;
	dataset?: AttrMap;
};

type AnchorButtonConfig = CommonButtonConfig & {
	as?: "a";
	href: string;
};

type NativeButtonConfig = CommonButtonConfig & {
	as: "button";
	type?: "button" | "submit" | "reset";
};

export type ButtonConfig = AnchorButtonConfig | NativeButtonConfig;

export class Button extends View<"a" | "button"> {
	private readonly label: string;

	constructor(config: ButtonConfig) {
		const normalizedConfig = Button.normalizeConfig(config);

		super(normalizedConfig.as === "button" ? "button" : "a", {
			className: Button.toButtonClassName(normalizedConfig),
			attrs:
				normalizedConfig.as === "button"
					? { type: normalizedConfig.type ?? "button" }
					: { href: normalizedConfig.href },
			renderMode: "once",
		});
		this.label = normalizedConfig.label;
		Button.applyCommonAttributes(this.element, normalizedConfig);
	}

	render(): HTMLSpanElement {
		return Button.createLabelNode(this.label);
	}

	private static normalizeConfig(config: ButtonConfig): ButtonConfig {
		if (config.as === "button") {
			return config;
		}

		return {
			...config,
			attrs: Button.ensureSecureAnchorRel(config.attrs),
		};
	}

	private static ensureSecureAnchorRel(
		attrs: AttrMap | undefined,
	): AttrMap | undefined {
		if (!attrs) {
			return attrs;
		}

		const target = attrs.target;
		if (
			typeof target !== "string" ||
			target.trim().toLowerCase() !== "_blank"
		) {
			return attrs;
		}

		return {
			...attrs,
			rel: Button.withRequiredRelTokens(attrs.rel),
		};
	}

	private static withRequiredRelTokens(relValue: AttrValue): string {
		const tokens =
			typeof relValue === "string" ? relValue.split(/\s+/).filter(Boolean) : [];
		const normalizedTokens = new Set(
			tokens.map((token) => token.toLowerCase()),
		);

		if (!normalizedTokens.has("noopener")) {
			tokens.push("noopener");
		}

		if (!normalizedTokens.has("noreferrer")) {
			tokens.push("noreferrer");
		}

		return tokens.join(" ");
	}

	private static toButtonClassName(config: ButtonConfig): string {
		return [
			"ui-button",
			`ui-button--${config.variant}`,
			config.inverted ? "is-inverted" : "",
			config.className ?? "",
		]
			.filter(Boolean)
			.join(" ");
	}

	private static createLabelNode(label: string): HTMLSpanElement {
		const labelNode = document.createElement("span");
		labelNode.className = "ui-button__label";
		labelNode.textContent = label;
		return labelNode;
	}

	private static normalizeDataKey(key: string): string {
		return key
			.replace(/^data-/, "")
			.replace(/([A-Z])/g, "-$1")
			.toLowerCase();
	}

	private static applyAttributes(
		element: HTMLElement,
		attrs: AttrMap | undefined,
	): void {
		if (!attrs) {
			return;
		}

		for (const [key, value] of Object.entries(attrs)) {
			if (
				key === "class" ||
				key === "className" ||
				key === "href" ||
				key === "type"
			) {
				continue;
			}

			if (value === null || value === undefined || value === false) {
				continue;
			}

			element.setAttribute(key, value === true ? "" : String(value));
		}
	}

	private static applyAriaAttributes(
		element: HTMLElement,
		aria: AttrMap | undefined,
	): void {
		if (!aria) {
			return;
		}

		for (const [key, value] of Object.entries(aria)) {
			if (value === null || value === undefined) {
				continue;
			}

			const attributeName = key.startsWith("aria-") ? key : `aria-${key}`;
			element.setAttribute(attributeName, String(value));
		}
	}

	private static applyDataAttributes(
		element: HTMLElement,
		dataset: AttrMap | undefined,
	): void {
		if (!dataset) {
			return;
		}

		for (const [key, value] of Object.entries(dataset)) {
			if (value === null || value === undefined) {
				continue;
			}

			element.setAttribute(
				`data-${Button.normalizeDataKey(key)}`,
				String(value),
			);
		}
	}

	private static applyCommonAttributes(
		element: HTMLAnchorElement | HTMLButtonElement,
		config: CommonButtonConfig,
	): void {
		Button.applyAttributes(element, config.attrs);
		Button.applyAriaAttributes(element, config.aria);
		Button.applyDataAttributes(element, config.dataset);
	}
}
