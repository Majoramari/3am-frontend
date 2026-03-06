import { View } from "@lib/view";
import { setupScrollBar } from "./scrollBarController";

export type ScrollBarConfig = {
	targetId: string;
	className?: string;
};

export class ScrollBar extends View<"div"> {
	private readonly targetId: string;

	constructor(config: ScrollBarConfig) {
		super("div", {
			className: ["scrollbar", config.className ?? ""].filter(Boolean).join(" "),
			renderMode: "once",
		});
		this.targetId = config.targetId;
	}

	protected override onMount(): void {
		const target = document.getElementById(this.targetId);
		if (!target) return;
		setupScrollBar(target, this.element, this.cleanup);
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="scrollbar__track">
				<div class="scrollbar__thumb"></div>
			</div>
		`;
	}
}