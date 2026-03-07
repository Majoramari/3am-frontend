import type { TemplateValue } from "@lib/template";
import { View } from "@lib/view";

export type FaqGridItem = {
	question: string;
	answer: TemplateValue;
	open?: boolean;
};

export type FaqGridConfig = {
	title?: string;
	items: ReadonlyArray<FaqGridItem>;
	columns?: 1 | 2;
	className?: string;
};

export class FaqGrid extends View<"section"> {
	private readonly config: FaqGridConfig;

	constructor(config: FaqGridConfig) {
		super("section", {
			className: ["ui-faq", config.className ?? ""].filter(Boolean).join(" "),
			attrs: { "data-columns": String(config.columns ?? 2) },
			renderMode: "once",
		});
		this.config = config;
	}

	protected override onMount(): void {
		const items = this.element.querySelectorAll<HTMLDetailsElement>(".ui-faq__item");

		items.forEach((item) => {
			this.bindAnimatedToggle(item);
		});
	}

	render(): DocumentFragment {
		const columns = this.config.columns ?? 2;
		const items = this.config.items;

		if (columns === 2) {
			const leftColumnItems = items.filter((_, index) => index % 2 === 0);
			const rightColumnItems = items.filter((_, index) => index % 2 === 1);

			return this.tpl`
				${this.config.title
					? this.tpl`<h2 class="ui-faq__title">${this.config.title}</h2>`
					: ""}
				<div class="ui-faq__columns">
					<div class="ui-faq__column">
						${leftColumnItems.map((item) => this.renderItem(item))}
					</div>
					<div class="ui-faq__column">
						${rightColumnItems.map((item) => this.renderItem(item))}
					</div>
				</div>
			`;
		}

		return this.tpl`
			${this.config.title
				? this.tpl`<h2 class="ui-faq__title">${this.config.title}</h2>`
				: ""}
			<div class="ui-faq__grid">
				${items.map((item) => this.renderItem(item))}
			</div>
		`;
	}

	private renderItem(item: FaqGridItem): DocumentFragment {
		return this.tpl`
			<details class="ui-faq__item" ${item.open ? "open" : ""}>
				<summary class="ui-faq__question">${item.question}</summary>
				<div class="ui-faq__answer">
					<div class="ui-faq__answer-inner">${item.answer}</div>
				</div>
			</details>
		`;
	}

	private bindAnimatedToggle(item: HTMLDetailsElement): void {
		const summary = this.$<HTMLElement>(".ui-faq__question", item);
		const answer = this.$<HTMLElement>(".ui-faq__answer", item);

		let isAnimating = false;
		let transitionFallbackId: number | null = null;
		let activeEndHandler: ((event: TransitionEvent) => void) | null = null;

		const clearAnimationCallbacks = (): void => {
			if (transitionFallbackId !== null) {
				window.clearTimeout(transitionFallbackId);
				transitionFallbackId = null;
			}

			if (activeEndHandler) {
				answer.removeEventListener("transitionend", activeEndHandler);
				activeEndHandler = null;
			}
		};

		const reducedMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const finishOpen = (): void => {
			answer.style.maxHeight = "none";
			answer.style.opacity = "1";
			isAnimating = false;
			clearAnimationCallbacks();
		};

		const finishClose = (): void => {
			item.open = false;
			answer.style.maxHeight = "0px";
			answer.style.opacity = "0";
			isAnimating = false;
			clearAnimationCallbacks();
		};

		if (item.open) {
			answer.style.maxHeight = "none";
			answer.style.opacity = "1";
		} else {
			answer.style.maxHeight = "0px";
			answer.style.opacity = "0";
		}

		const getTransitionTimeMs = (): number => {
			const style = window.getComputedStyle(answer);
			const toMs = (value: string): number => {
				const trimmed = value.trim();
				if (trimmed.endsWith("ms")) {
					return Number.parseFloat(trimmed);
				}
				if (trimmed.endsWith("s")) {
					return Number.parseFloat(trimmed) * 1000;
				}
				return 0;
			};

			const durations = style.transitionDuration.split(",");
			const delays = style.transitionDelay.split(",");

			const pairs = durations.map((duration, index) => {
				const delay = delays[index] ?? delays[0] ?? "0s";
				return toMs(duration) + toMs(delay);
			});

			return Math.max(...pairs, 0);
		};

		const runWithTransitionEnd = (onComplete: () => void): void => {
			const totalDuration = getTransitionTimeMs();

			if (reducedMotion || totalDuration <= 0) {
				onComplete();
				return;
			}

			activeEndHandler = (event: TransitionEvent): void => {
				if (event.propertyName !== "max-height") {
					return;
				}
				onComplete();
			};
			answer.addEventListener("transitionend", activeEndHandler);

			transitionFallbackId = window.setTimeout(
				onComplete,
				Math.ceil(totalDuration + 40),
			);
		};

		const openItem = (): void => {
			isAnimating = true;
			clearAnimationCallbacks();

			item.open = true;
			answer.style.maxHeight = "0px";
			answer.style.opacity = "0";

			answer.getBoundingClientRect();
			const targetHeight = answer.scrollHeight;
			answer.style.maxHeight = `${targetHeight}px`;
			answer.style.opacity = "1";

			runWithTransitionEnd(finishOpen);
		};

		const closeItem = (): void => {
			isAnimating = true;
			clearAnimationCallbacks();

			const currentHeight = answer.scrollHeight;
			answer.style.maxHeight = `${currentHeight}px`;
			answer.style.opacity = "1";

			answer.getBoundingClientRect();
			answer.style.maxHeight = "0px";
			answer.style.opacity = "0";

			runWithTransitionEnd(finishClose);
		};

		this.cleanup.add(clearAnimationCallbacks);
		this.cleanup.on(summary, "click", (event) => {
			event.preventDefault();

			if (isAnimating) {
				return;
			}

			if (item.open) {
				closeItem();
				return;
			}

			openItem();
		});
	}
}
