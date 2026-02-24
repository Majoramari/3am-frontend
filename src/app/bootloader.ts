import { wait } from "@lib/async";

const BOOT_MIN_VISIBLE_MS = 320;
const BOOT_FADE_OUT_MS = 220;
const BOOT_MAX_WAIT_MS = 10000;
const CRITICAL_IMAGE_URLS = ["/assets/shared/placeholder.png"];

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

const waitForCriticalFonts = async (): Promise<void> => {
	const fontSet = document.fonts;
	if (!fontSet) {
		return Promise.resolve();
	}

	const fontLoads = ['"Adventure"', '"Model"'].map((family) =>
		fontSet.load(`1em ${family}`).catch(() => []),
	);

	await Promise.all([...fontLoads, fontSet.ready.catch(() => fontSet)]);
	return undefined;
};

export const runBootLoader = async (): Promise<void> => {
	const loader = document.querySelector<HTMLElement>("#boot-loader");
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

	loader.classList.add("is-leaving");
	await wait(BOOT_FADE_OUT_MS);
	loader.remove();
};
