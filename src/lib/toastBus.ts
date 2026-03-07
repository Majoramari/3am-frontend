export type ToastLevel = "info" | "success" | "error" | "warning";

export type ToastPayload = {
	title?: string;
	message: string;
	level?: ToastLevel;
	durationMs?: number;
};

const TOAST_EVENT_NAME = "app:toast";

export function emitToast(payload: ToastPayload): void {
	if (typeof window === "undefined") {
		return;
	}
	window.dispatchEvent(new CustomEvent<ToastPayload>(TOAST_EVENT_NAME, { detail: payload }));
}

export function subscribeToToasts(handler: (payload: ToastPayload) => void): () => void {
	if (typeof window === "undefined") {
		return () => {};
	}

	const listener: EventListener = (event) => {
		if (!(event instanceof CustomEvent)) {
			return;
		}

		const payload = event.detail as ToastPayload | undefined;
		if (!payload || typeof payload.message !== "string" || payload.message.trim() === "") {
			return;
		}

		handler(payload);
	};

	window.addEventListener(TOAST_EVENT_NAME, listener);
	return () => {
		window.removeEventListener(TOAST_EVENT_NAME, listener);
	};
}
