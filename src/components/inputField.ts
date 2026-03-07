import { View } from "@lib/view";

type AttrValue = string | number | boolean | null | undefined;
type AttrMap = Record<string, AttrValue>;

type InputType =
	| "text"
	| "email"
	| "password"
	| "search"
	| "tel"
	| "url"
	| "number";

export type InputFieldConfig = {
	label: string;
	name: string;
	placeholder?: string;
	type?: InputType;
	className?: string;
	inputClassName?: string;
	attrs?: AttrMap;
	dataset?: AttrMap;
};

const normalizeDataKey = (key: string): string =>
	key
		.replace(/^data-/, "")
		.replace(/([A-Z])/g, "-$1")
		.toLowerCase();

const applyAttributes = (node: HTMLElement, attrs: AttrMap | undefined): void => {
	if (!attrs) {
		return;
	}

	for (const [key, value] of Object.entries(attrs)) {
		if (
			key === "class" ||
			key === "className" ||
			key === "type" ||
			key === "name" ||
			key === "placeholder"
		) {
			continue;
		}

		if (value === null || value === undefined || value === false) {
			continue;
		}

		node.setAttribute(key, value === true ? "" : String(value));
	}
};

const applyDataset = (node: HTMLElement, dataset: AttrMap | undefined): void => {
	if (!dataset) {
		return;
	}

	for (const [key, value] of Object.entries(dataset)) {
		if (value === null || value === undefined) {
			continue;
		}

		node.setAttribute(`data-${normalizeDataKey(key)}`, String(value));
	}
};

export class InputField extends View<"label"> {
	private readonly config: InputFieldConfig;

	constructor(config: InputFieldConfig) {
		super("label", {
			className: ["ui-input-field", config.className ?? ""]
				.filter(Boolean)
				.join(" "),
			renderMode: "once",
		});
		this.config = config;
	}

	render(): DocumentFragment {
		const input = document.createElement("input");
		input.className = ["ui-input", this.config.inputClassName ?? ""]
			.filter(Boolean)
			.join(" ");
		input.type = this.config.type ?? "text";
		input.name = this.config.name;

		if (this.config.placeholder) {
			input.placeholder = this.config.placeholder;
		}

		applyAttributes(input, this.config.attrs);
		applyDataset(input, this.config.dataset);

		const label = document.createElement("span");
		label.className = "visually-hidden";
		label.textContent = this.config.label;

		const fragment = document.createDocumentFragment();
		fragment.append(label, input);
		return fragment;
	}
}
