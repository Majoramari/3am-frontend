import type { CleanupBag } from "@lib/cleanup";

export function setupFeaturedGrid(
	root: HTMLElement,
	cleanup: CleanupBag,
	onViewAll?: () => void,
	onNavigate?: (id: string) => void,
): void {
	const pills   = root.querySelectorAll<HTMLButtonElement>(".feat-grid__pill");
	const groups  = root.querySelectorAll<HTMLElement>(".feat-grid__group");
	const viewAll = root.querySelector<HTMLButtonElement>(".feat-grid__view-all");

	if (pills.length === 0 || groups.length === 0) return;

	// ── Pills filter ─────────────────────────────────────────
	cleanup.on(root, "click", (e: Event) => {
		const pill = (e.target as HTMLElement).closest<HTMLButtonElement>(".feat-grid__pill");
		if (pill) {
			pills.forEach((p) => {
				p.classList.remove("feat-grid__pill--active");
				p.setAttribute("aria-selected", "false");
			});
			pill.classList.add("feat-grid__pill--active");
			pill.setAttribute("aria-selected", "true");

			const group = pill.dataset.group;
			groups.forEach((g) => {
				if (g.dataset.group === group) {
					g.classList.remove("feat-grid__group--hidden");
				} else {
					g.classList.add("feat-grid__group--hidden");
				}
			});
			return;
		}

		// ── Product card click ───────────────────────────────
		const card = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-product-id]");
		if (card && onNavigate) {
			const id = card.dataset.productId;
			if (id) onNavigate(id);
		}
	});

	if (viewAll && onViewAll) {
		cleanup.on(viewAll, "click", onViewAll);
	}
}