const BOOT_LOADER_SELECTOR = "#boot-loader";
const BOOT_LEAVING_CLASS = "is-leaving";
const BOOT_MIN_VISIBLE_MS = 320;
const BOOT_FADE_OUT_MS = 220;
const BOOT_MAX_WAIT_MS = 10000;
const CRITICAL_IMAGE_URLS = ["/assets/shared/placeholder.png"];
const CRITICAL_FONT_FAMILIES = ['"Adventure"', '"Model"'];

const wait = (ms: number): Promise<void> =>
	new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});

const waitForPageLoad = (): Promise<void> => {
	if (document.readyState === "complete") {
		return Promise.resolve();
	}

	return new Promise((resolve) => {
		window.addEventListener("load", () => resolve(), { once: true });
	});
};

const waitForImageDecode = (src: string): Promise<void> =>
	new Promise((resolve) => {
		const image = new Image();
		image.decoding = "async";

		const done = (): void => {
			if (typeof image.decode === "function") {
				void image
					.decode()
					.catch(() => {})
					.finally(resolve);
				return;
			}
			resolve();
		};

		image.onload = done;
		image.onerror = () => resolve();
		image.src = src;

		if (image.complete && image.naturalWidth > 0) {
			done();
		}
	});

const waitForCriticalImages = (): Promise<void> =>
	Promise.all(CRITICAL_IMAGE_URLS.map((src) => waitForImageDecode(src))).then(
		() => undefined,
	);

const waitForCriticalFonts = (): Promise<void> => {
	const fontSet = document.fonts;
	if (!fontSet) {
		return Promise.resolve();
	}

	const fontLoads = CRITICAL_FONT_FAMILIES.map((family) =>
		fontSet.load(`1em ${family}`).catch(() => []),
	);

	return Promise.all([...fontLoads, fontSet.ready.catch(() => fontSet)]).then(
		() => undefined,
	);
};

export const runBootLoader = async (): Promise<void> => {
	const loader = document.querySelector<HTMLElement>(BOOT_LOADER_SELECTOR);
	if (!loader) {
		return;
	}

	const readyToDismiss = Promise.all([
		waitForPageLoad(),
		waitForCriticalImages(),
		waitForCriticalFonts(),
	]);

	await Promise.all([
		wait(BOOT_MIN_VISIBLE_MS),
		Promise.race([readyToDismiss, wait(BOOT_MAX_WAIT_MS)]),
	]);

	const reducedMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;

	if (reducedMotion) {
		loader.remove();
		return;
	}

	loader.classList.add(BOOT_LEAVING_CLASS);
	await wait(BOOT_FADE_OUT_MS);
	loader.remove();
};
