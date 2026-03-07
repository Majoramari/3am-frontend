import type { CleanupBag } from "@lib/cleanup";

const PROGRAMMATIC_SCROLL_SETTLE_MS = 150;
const ACTIVE_INDEX_HYSTERESIS_PX = 20;
const VIDEO_END_RESTART_BUFFER_SECONDS = 0.2;

const parseIndex = (value: string | undefined): number | null => {
	const parsed = Number.parseInt(value ?? "", 10);
	if (Number.isNaN(parsed) || parsed < 0) {
		return null;
	}
	return parsed;
};

export const setupHomeAdventureMedia = (
	root: ParentNode,
	cleanup: CleanupBag,
): void => {
	const rail = root.querySelector<HTMLElement>(".adventure-media__rail");
	const pills = Array.from(
		root.querySelectorAll<HTMLButtonElement>("[data-adventure-pill-index]"),
	);
	const cards = Array.from(
		root.querySelectorAll<HTMLElement>("[data-adventure-card-index]"),
	);
	const cardVideos = cards.map((card) =>
		card.querySelector<HTMLVideoElement>(".adventure-media__video"),
	);

	if (!rail || pills.length === 0 || cards.length === 0) {
		return;
	}

	let activeIndex = 0;
	let rafId = 0;
	let settleTimerId = 0;
	let pendingProgrammaticIndex: number | null = null;

	const getVideoSourceKey = (video: HTMLVideoElement): string => {
		const source = video.querySelector<HTMLSourceElement>("source");
		return (
			video.currentSrc ||
			video.getAttribute("src") ||
			source?.getAttribute("src") ||
			source?.dataset.lazySrc ||
			""
		);
	};

	const seekVideo = (video: HTMLVideoElement, timeSeconds: number): void => {
		const applySeek = (): void => {
			const duration = Number.isFinite(video.duration) ? video.duration : 0;
			const maxTime = duration > 0 ? Math.max(0, duration - 0.05) : timeSeconds;
			const nextTime = Math.min(Math.max(0, timeSeconds), maxTime);
			video.currentTime = nextTime;
		};

		if (video.readyState >= 1) {
			applySeek();
			return;
		}

		video.addEventListener(
			"loadedmetadata",
			() => {
				applySeek();
			},
			{ once: true },
		);
	};

	const syncActiveVideo = (
		previousIndex: number | null = null,
		forcePlayActive: boolean = false,
	): void => {
		const activeVideo = cardVideos[activeIndex];
		if (!activeVideo) {
			return;
		}

		const previousVideo =
			previousIndex === null ? null : (cardVideos[previousIndex] ?? null);
		const previousTime =
			previousVideo && Number.isFinite(previousVideo.currentTime)
				? previousVideo.currentTime
				: 0;

		for (const [index, video] of cardVideos.entries()) {
			if (!video || index === activeIndex) {
				continue;
			}
			video.pause();
		}

		if (
			previousVideo &&
			previousVideo !== activeVideo &&
			previousTime > 0 &&
			getVideoSourceKey(previousVideo) === getVideoSourceKey(activeVideo)
		) {
			const previousDuration = Number.isFinite(previousVideo.duration)
				? previousVideo.duration
				: 0;
			const shouldRestart =
				previousVideo.ended ||
				(previousDuration > 0 &&
					previousTime >= previousDuration - VIDEO_END_RESTART_BUFFER_SECONDS);

			seekVideo(activeVideo, shouldRestart ? 0 : previousTime);
		}

		if (forcePlayActive || !activeVideo.paused) {
			if (activeVideo.ended) {
				activeVideo.currentTime = 0;
			}
			const playPromise = activeVideo.play();
			if (playPromise instanceof Promise) {
				void playPromise.catch(() => {
					// Ignore autoplay/playback-blocking errors.
				});
			}
		}
	};

	const setActivePill = (targetIndex: number): void => {
		if (targetIndex === activeIndex) {
			return;
		}
		const previousIndex = activeIndex;
		activeIndex = targetIndex;

		for (const [index, pill] of pills.entries()) {
			const isActive = index === targetIndex;
			pill.classList.toggle("is-active", isActive);
			pill.setAttribute("aria-pressed", String(isActive));
		}

		syncActiveVideo(previousIndex, true);
	};

	const scheduleScrollSettle = (): void => {
		if (settleTimerId !== 0) {
			window.clearTimeout(settleTimerId);
		}

		settleTimerId = window.setTimeout(() => {
			settleTimerId = 0;
			pendingProgrammaticIndex = null;
			if (rafId !== 0) {
				return;
			}
			rafId = window.requestAnimationFrame(syncActiveFromScroll);
		}, PROGRAMMATIC_SCROLL_SETTLE_MS);
	};

	const scrollToCard = (
		targetIndex: number,
		behavior: ScrollBehavior = "smooth",
	): void => {
		const target = cards[targetIndex];
		if (!target) {
			return;
		}

		const railRect = rail.getBoundingClientRect();
		const targetRect = target.getBoundingClientRect();
		const deltaToCenter =
			targetRect.left +
			targetRect.width / 2 -
			(railRect.left + railRect.width / 2);
		const centeredLeft = rail.scrollLeft + deltaToCenter;
		const maxScrollLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
		const nextLeft = Math.min(Math.max(0, centeredLeft), maxScrollLeft);
		pendingProgrammaticIndex = behavior === "smooth" ? targetIndex : null;
		rail.scrollTo({ left: nextLeft, behavior });
		setActivePill(targetIndex);
		scheduleScrollSettle();
	};

	const syncActiveFromScroll = (): void => {
		rafId = 0;
		const railCenterX = rail.scrollLeft + rail.clientWidth / 2;
		let nearestIndex = activeIndex;
		let nearestDistance = Number.POSITIVE_INFINITY;
		let activeDistance = Number.POSITIVE_INFINITY;

		for (const [index, card] of cards.entries()) {
			const centerX = card.offsetLeft + card.offsetWidth / 2;
			const distance = Math.abs(centerX - railCenterX);
			if (distance < nearestDistance) {
				nearestDistance = distance;
				nearestIndex = index;
			}
			if (index === activeIndex) {
				activeDistance = distance;
			}
		}

		if (
			nearestIndex !== activeIndex &&
			nearestDistance + ACTIVE_INDEX_HYSTERESIS_PX >= activeDistance
		) {
			return;
		}

		setActivePill(nearestIndex);
	};

	for (const pill of pills) {
		cleanup.on(pill, "click", () => {
			const targetIndex = parseIndex(pill.dataset.adventurePillIndex);
			if (targetIndex === null) {
				return;
			}
			scrollToCard(targetIndex);
		});
	}

	cleanup.on(
		rail,
		"scroll",
		() => {
			scheduleScrollSettle();
			if (pendingProgrammaticIndex !== null) {
				setActivePill(pendingProgrammaticIndex);
				return;
			}

			if (rafId !== 0) {
				return;
			}
			rafId = window.requestAnimationFrame(syncActiveFromScroll);
		},
		{ passive: true },
	);

	scrollToCard(0, "auto");
	syncActiveVideo(null, true);

	cleanup.add(() => {
		if (rafId !== 0) {
			window.cancelAnimationFrame(rafId);
		}
		if (settleTimerId !== 0) {
			window.clearTimeout(settleTimerId);
		}
	});
};
