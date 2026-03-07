import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { ToastStack } from "../src/components/toastStack";
import { emitToast } from "../src/lib/toastBus";
import { installDom, resetDom } from "./helpers/dom";

describe("ToastStack", () => {
	let stack: ToastStack | null = null;

	beforeEach(async () => {
		installDom("https://example.com/");
		stack = new ToastStack();
		stack.mount(document.body);
		await Promise.resolve();
	});

	afterEach(() => {
		stack?.destroy();
		stack = null;
		resetDom();
	});

	test("keeps receiving toasts after rerenders", () => {
		emitToast({ level: "error", message: "First error" });
		emitToast({ level: "error", message: "Second error" });

		const toasts = document.querySelectorAll(".toast");
		expect(toasts).toHaveLength(2);
	});

	test("does not cap toast count", () => {
		for (let i = 1; i <= 8; i += 1) {
			emitToast({ level: "error", message: `Error ${i}` });
		}

		expect(document.querySelectorAll(".toast")).toHaveLength(8);
	});

	test("dismisses with exit animation before removing toast node", () => {
		emitToast({ level: "error", message: "Dismiss me" });

		const toast = document.querySelector<HTMLElement>(".toast");
		expect(toast).not.toBeNull();

		const dismissButton = toast?.querySelector<HTMLButtonElement>(
			"[data-toast-dismiss]",
		);
		expect(dismissButton).not.toBeNull();
		dismissButton?.dispatchEvent(
			new window.MouseEvent("click", { bubbles: true }),
		);

		expect(toast?.classList.contains("is-leaving")).toBe(true);

		toast?.dispatchEvent(new window.Event("animationend", { bubbles: true }));
		expect(document.querySelectorAll(".toast")).toHaveLength(0);
	});
});
