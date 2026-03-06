import type { CleanupBag } from "@lib/cleanup";

function initScrollBar(
	scrollEl: HTMLElement,
	track: HTMLElement,
	thumb: HTMLElement,
	cleanup: CleanupBag,
): void {
	// ── Sync thumb on scroll ─────────────────────────────────
	function syncThumb(): void {
		const maxLeft = track.offsetWidth - thumb.offsetWidth;
		const ratio = scrollEl.scrollLeft / (scrollEl.scrollWidth - scrollEl.clientWidth);
		thumb.style.left = `${ratio * maxLeft}px`;
	}

	cleanup.on(scrollEl, "scroll", syncThumb, { passive: true });

	// ── Drag thumb ───────────────────────────────────────────
	let isDragging = false;
	let dragStartX = 0;
	let dragStartLeft = 0;

	cleanup.on(thumb, "pointerdown", (e: Event) => {
		isDragging = true;
		dragStartX = (e as PointerEvent).clientX;
		dragStartLeft = parseFloat(thumb.style.left) || 0;
		thumb.setPointerCapture((e as PointerEvent).pointerId);
		e.preventDefault();
	});

	cleanup.on(thumb, "pointermove", (e: Event) => {
		if (!isDragging) return;
		const maxLeft = track.offsetWidth - thumb.offsetWidth;
		const delta = (e as PointerEvent).clientX - dragStartX;
		const newLeft = Math.min(Math.max(dragStartLeft + delta, 0), maxLeft);
		thumb.style.left = `${newLeft}px`;
		scrollEl.scrollLeft = (newLeft / maxLeft) * (scrollEl.scrollWidth - scrollEl.clientWidth);
	});

	cleanup.on(thumb, "pointerup", () => {
		isDragging = false;
	});

	// ── Drag scroll area ─────────────────────────────────────
	let isScrollDragging = false;
	let scrollStartX = 0;
	let scrollStartLeft = 0;

	cleanup.on(scrollEl, "pointerdown", (e: Event) => {
		isScrollDragging = true;
		scrollStartX = (e as PointerEvent).clientX;
		scrollStartLeft = scrollEl.scrollLeft;
		scrollEl.setPointerCapture((e as PointerEvent).pointerId);
	});

	cleanup.on(scrollEl, "pointermove", (e: Event) => {
		if (!isScrollDragging) return;
		scrollEl.scrollLeft = scrollStartLeft - ((e as PointerEvent).clientX - scrollStartX) * 1.5;
	});

	cleanup.on(scrollEl, "pointerup", () => {
		isScrollDragging = false;
	});
}

export function setupScrollBar(
	scrollEl: HTMLElement,
	barEl: HTMLElement,
	cleanup: CleanupBag,
): void {
	const track = barEl.querySelector<HTMLElement>(".scrollbar__track");
	const thumb = barEl.querySelector<HTMLElement>(".scrollbar__thumb");

	if (!track || !thumb) return;

	initScrollBar(scrollEl, track, thumb, cleanup);
}