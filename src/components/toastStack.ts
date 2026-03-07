import {
	subscribeToToasts,
	type ToastLevel,
	type ToastPayload,
} from "@lib/toastBus";
import { View } from "@lib/view";

type ToastItem = {
	id: number;
	message: string;
	level: ToastLevel;
	durationMs: number;
};

const DEFAULT_DURATION_MS = 4200;
const MIN_DURATION_MS = 1200;
const EXIT_ANIMATION_MS = 180;

export class ToastStack extends View<"div"> {
	private toasts: ToastItem[] = [];
	private nextId = 1;
	private readonly timers = new Map<number, number>();
	private readonly exitTimers = new Map<number, number>();
	private unsubscribeToasts: (() => void) | null = null;

	constructor() {
		super("div", {
			className: "toast-stack",
			attrs: {
				"aria-live": "polite",
				"aria-atomic": "false",
			},
		});
	}

	protected override onMount(): void {
		this.unsubscribeToasts = subscribeToToasts((payload) => {
			this.pushToast(payload);
		});
		this.element.addEventListener("click", this.handleDismissClick);
	}

	protected override onDestroy(): void {
		this.unsubscribeToasts?.();
		this.unsubscribeToasts = null;
		this.element.removeEventListener("click", this.handleDismissClick);

		for (const timerId of this.timers.values()) {
			window.clearTimeout(timerId);
		}
		this.timers.clear();

		for (const timerId of this.exitTimers.values()) {
			window.clearTimeout(timerId);
		}
		this.exitTimers.clear();
	}

	render(): DocumentFragment {
		return this.tpl`
			<div class="toast-stack__list"></div>
		`;
	}

	private pushToast(payload: ToastPayload): void {
		const message = payload.message.trim();
		if (!message) {
			return;
		}

		const level = payload.level ?? "error";
		const durationMs = this.normalizeDuration(payload.durationMs);
		const toast: ToastItem = {
			id: this.nextId++,
			message,
			level,
			durationMs,
		};

		this.toasts = [toast, ...this.toasts];
		this.renderToastNode(toast);
		this.startTimer(toast.id, durationMs);
	}

	private dismissToast(id: number): void {
		this.clearTimer(id);

		const index = this.toasts.findIndex((toast) => toast.id === id);
		if (index < 0) {
			return;
		}

		this.toasts.splice(index, 1);
		this.removeToastNode(id);
	}

	private clearTimer(id: number): void {
		const timerId = this.timers.get(id);
		if (!timerId) {
			return;
		}

		window.clearTimeout(timerId);
		this.timers.delete(id);
	}

	private startTimer(id: number, durationMs: number): void {
		this.clearTimer(id);
		const timerId = window.setTimeout(() => {
			this.dismissToast(id);
		}, durationMs);
		this.timers.set(id, timerId);
	}

	private normalizeDuration(durationMs: number | undefined): number {
		if (typeof durationMs !== "number" || !Number.isFinite(durationMs)) {
			return DEFAULT_DURATION_MS;
		}
		return Math.max(MIN_DURATION_MS, Math.floor(durationMs));
	}

	private readonly handleDismissClick = (event: Event): void => {
		const target = event.target;
		if (!(target instanceof Element)) {
			return;
		}

		const dismissButton = target.closest<HTMLElement>("[data-toast-dismiss]");
		if (!dismissButton) {
			return;
		}

		const id = Number(dismissButton.dataset.toastDismiss);
		if (!Number.isFinite(id)) {
			return;
		}

		this.dismissToast(id);
	};

	private renderToastNode(toast: ToastItem): void {
		const list = this.element.querySelector<HTMLElement>(".toast-stack__list");
		if (!list) {
			return;
		}

		const liveRole =
			toast.level === "error" || toast.level === "warning" ? "alert" : "status";
		const fragment = this.tpl`
			<article
				class="toast toast--${toast.level}"
				role="${liveRole}"
				data-toast-id="${toast.id}"
				style="--toast-duration-ms: ${toast.durationMs}ms"
			>
				<span class="toast__icon" aria-hidden="true">
					${this.renderToastIcon(toast.level)}
				</span>
				<div class="toast__body">
					<p class="toast__message">${toast.message}</p>
				</div>
				<button
					type="button"
					class="toast__close"
					data-toast-dismiss="${toast.id}"
					aria-label="Dismiss notification"
				>
					<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
						<path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
					</svg>
				</button>
				<span class="toast__progress" aria-hidden="true"></span>
			</article>
		`;

		const node = fragment.firstElementChild;
		if (!(node instanceof HTMLElement)) {
			return;
		}

		list.prepend(node);
	}

	private removeToastNode(id: number): void {
		const node = this.element.querySelector<HTMLElement>(
			`[data-toast-id="${id}"]`,
		);
		if (!node || node.classList.contains("is-leaving")) {
			return;
		}

		node.classList.add("is-leaving");

		const finalize = (): void => {
			const fallbackId = this.exitTimers.get(id);
			if (fallbackId) {
				window.clearTimeout(fallbackId);
				this.exitTimers.delete(id);
			}
			node.removeEventListener("animationend", handleAnimationEnd);
			node.remove();
		};

		const handleAnimationEnd = (event: Event): void => {
			if (event.target !== node) {
				return;
			}
			finalize();
		};

		node.addEventListener("animationend", handleAnimationEnd);
		const fallbackId = window.setTimeout(finalize, EXIT_ANIMATION_MS + 40);
		this.exitTimers.set(id, fallbackId);
	}

	private renderToastIcon(level: ToastLevel): DocumentFragment {
		if (level === "success") {
			return this.tpl`
				<svg viewBox="0 0 24 24" width="18" height="18">
					<circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.2"></circle>
					<path
						d="M16.8 8.5L10.8 15.2 7.4 11.8"
						fill="none"
						stroke="currentColor"
						stroke-width="2.2"
						stroke-linecap="round"
						stroke-linejoin="round"
					></path>
				</svg>
			`;
		}

		if (level === "error") {
			return this.tpl`
				<svg viewBox="0 0 24 24" width="18" height="18">
					<circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.2"></circle>
					<line x1="12" y1="7.5" x2="12" y2="13" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>
					<circle cx="12" cy="16.6" r="1.2" fill="currentColor"></circle>
				</svg>
			`;
		}

		if (level === "warning") {
			return this.tpl`
				<svg viewBox="0 0 24 24" width="18" height="18">
					<path
						d="M12 3.6l9.2 16.2H2.8L12 3.6z"
						fill="currentColor"
						fill-opacity="0.22"
						stroke="currentColor"
						stroke-width="1.4"
						stroke-linejoin="round"
					></path>
					<line x1="12" y1="9" x2="12" y2="14" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>
					<circle cx="12" cy="17.2" r="1.1" fill="currentColor"></circle>
				</svg>
			`;
		}

		return this.tpl`
			<svg viewBox="0 0 24 24" width="18" height="18">
				<circle cx="12" cy="12" r="10" fill="currentColor" fill-opacity="0.2"></circle>
				<line x1="12" y1="10" x2="12" y2="15.5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"></line>
				<circle cx="12" cy="7.2" r="1.2" fill="currentColor"></circle>
			</svg>
		`;
	}
}
