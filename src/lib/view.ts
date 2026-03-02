import { CleanupBag } from "./cleanup";
import { html, type TemplateValue } from "./template";

type ViewOptions = {
	className?: string | string[];
	id?: string;
	attrs?: Record<string, string | number | boolean | null | undefined>;
	dataset?: Record<string, string | number | boolean | null | undefined>;
	renderMode?: "always" | "once";
};

type SlotRenderable = {
	renderToNode(): Node;
	destroy(): void;
};

type TemplateInput = TemplateValue | SlotRenderable | TemplateInput[];

export abstract class View<K extends keyof HTMLElementTagNameMap> {
	protected readonly element: HTMLElementTagNameMap[K];
	private cleanupBag: CleanupBag | null = null;
	private readonly renderMode: "always" | "once";
	private hasRendered = false;

	protected get cleanup(): CleanupBag {
		if (!this.cleanupBag) {
			this.cleanupBag = new CleanupBag();
		}
		return this.cleanupBag;
	}

	protected constructor(tag: K, options?: ViewOptions) {
		this.element = document.createElement(tag);
		this.renderMode = options?.renderMode ?? "always";

		if (!options) {
			return;
		}

		const { className, id, attrs, dataset } = options;

		if (className) {
			this.element.className = Array.isArray(className)
				? className.join(" ")
				: className;
		}

		if (id) {
			this.element.id = id;
		}

		if (attrs) {
			for (const [key, value] of Object.entries(attrs)) {
				if (value === null || value === undefined || value === false) {
					continue;
				}
				this.element.setAttribute(key, value === true ? "" : String(value));
			}
		}

		if (dataset) {
			for (const [key, value] of Object.entries(dataset)) {
				if (value === null || value === undefined) {
					continue;
				}
				this.element.dataset[key] = String(value);
			}
		}
	}

	abstract render(): Node | DocumentFragment;

	mount(parent: HTMLElement): void {
		parent.appendChild(this.renderToNode());
	}

	protected tpl(
		strings: TemplateStringsArray,
		...values: TemplateInput[]
	): DocumentFragment {
		const normalized = values.map((value) =>
			this.normalizeTemplateValue(value),
		);
		return html(strings, ...normalized);
	}

	renderToNode(): HTMLElementTagNameMap[K] {
		if (this.renderMode === "once" && this.hasRendered) {
			return this.element;
		}

		this.renderIntoElement();
		this.hasRendered = true;
		return this.element;
	}

	protected rerender(): void {
		this.renderIntoElement();
		this.hasRendered = true;
	}

	protected slot(child: SlotRenderable): Node {
		const node = child.renderToNode();
		this.cleanup.add(() => child.destroy());
		return node;
	}

	private normalizeTemplateValue(value: TemplateInput): TemplateValue {
		if (Array.isArray(value)) {
			return value.map((entry) => this.normalizeTemplateValue(entry));
		}

		if (this.isViewLike(value)) {
			return this.slot(value);
		}

		return value;
	}

	private isViewLike(value: unknown): value is SlotRenderable {
		return (
			typeof value === "object" &&
			value !== null &&
			"renderToNode" in value &&
			"destroy" in value &&
			typeof (value as { renderToNode?: unknown }).renderToNode ===
				"function" &&
			typeof (value as { destroy?: unknown }).destroy === "function"
		);
	}

	private renderIntoElement(): void {
		this.cleanupBag?.run();
		this.element.replaceChildren(this.render());
	}

	destroy(): void {
		this.cleanupBag?.run();
		this.element.remove();
		this.hasRendered = false;
	}
}

export type ViewInstance = {
	mount(parent: HTMLElement): void;
	destroy(): void;
};
