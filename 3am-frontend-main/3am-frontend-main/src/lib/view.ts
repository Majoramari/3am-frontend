import { CleanupBag } from "./cleanup";
import { html, type TemplateValue } from "./template";

export type ViewOptions = {
	className?: string | string[];
	id?: string;
	attrs?: Record<string, string | number | boolean | null | undefined>;
	dataset?: Record<string, string | number | boolean | null | undefined>;
};

export abstract class View<K extends keyof HTMLElementTagNameMap> {
	protected readonly element: HTMLElementTagNameMap[K];
	protected readonly cleanup = new CleanupBag();

	protected constructor(tag: K, options?: ViewOptions) {
		this.element = document.createElement(tag);

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
		this.renderIntoElement();
		parent.appendChild(this.element);
	}

	protected tpl(
		strings: TemplateStringsArray,
		...values: Array<TemplateValue | ViewInstance>
	): DocumentFragment {
		const normalized = values.map((value) => this.normalizeTemplateValue(value));
		return html(strings, ...normalized);
	}

	renderToNode(): HTMLElementTagNameMap[K] {
		this.renderIntoElement();
		return this.element;
	}

	protected rerender(): void {
		this.renderIntoElement();
	}

	protected mountChild<T extends ViewInstance>(
		child: T,
		parent: HTMLElement = this.element,
	): T {
		child.mount(parent);
		this.cleanup.add(() => child.destroy());
		return child;
	}

	protected slot<T extends ViewInstance & { renderToNode(): Node }>(child: T): Node {
		const node = child.renderToNode();
		this.cleanup.add(() => child.destroy());
		return node;
	}

	private normalizeTemplateValue(value: TemplateValue | ViewInstance): TemplateValue {
		if (Array.isArray(value)) {
			return value.map((entry) =>
				this.normalizeTemplateValue(entry as TemplateValue | ViewInstance),
			);
		}

		if (this.isViewLike(value)) {
			return this.slot(value);
		}

		return value as TemplateValue;
	}

	private isViewLike(
		value: unknown,
	): value is ViewInstance & { renderToNode(): Node } {
		return (
			typeof value === "object" &&
			value !== null &&
			"renderToNode" in value &&
			"destroy" in value &&
			typeof (value as { renderToNode?: unknown }).renderToNode === "function" &&
			typeof (value as { destroy?: unknown }).destroy === "function"
		);
	}

	private renderIntoElement(): void {
		this.cleanup.run();
		this.element.replaceChildren(this.render());
	}

	destroy(): void {
		this.cleanup.run();
		this.element.remove();
	}
}

export type ViewInstance = {
	mount(parent: HTMLElement): void;
	destroy(): void;
};
