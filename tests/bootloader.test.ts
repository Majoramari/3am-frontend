import { afterEach, beforeEach, describe, expect, test } from "bun:test";

import { runBootLoader } from "../src/app/bootloader";
import { installDom, resetDom } from "./helpers/dom";

const BOOT_LOADER_SELECTOR = "#boot-loader";
const FONT_LOADS_EXPECTED = ['1em "Adventure"', '1em "Model"'];

type MockFontFaceSet = {
	load: (font: string) => Promise<unknown[]>;
	ready: Promise<unknown>;
};

const setDocumentReadyState = (value: DocumentReadyState): void => {
	Object.defineProperty(document, "readyState", {
		configurable: true,
		value,
	});
};

const installMockFontSet = (): string[] => {
	const loadedFonts: string[] = [];
	const fontSet: MockFontFaceSet = {
		load: async (font: string): Promise<unknown[]> => {
			loadedFonts.push(font);
			return [];
		},
		ready: Promise.resolve({}),
	};

	Object.defineProperty(document, "fonts", {
		configurable: true,
		value: fontSet,
	});

	return loadedFonts;
};

const setReducedMotion = (matches: boolean): void => {
	Object.defineProperty(window, "matchMedia", {
		configurable: true,
		value: (query: string): MediaQueryList =>
			({
				matches,
				media: query,
				onchange: null,
				addListener: () => {},
				removeListener: () => {},
				addEventListener: () => {},
				removeEventListener: () => {},
				dispatchEvent: () => false,
			}) as MediaQueryList,
	});
};

const installInstantImage = (): (() => void) => {
	const globalWithImage = globalThis as typeof globalThis & {
		Image?: typeof Image;
	};
	const originalImage = globalWithImage.Image;

	class InstantImage {
		decoding = "async";
		onload: (() => void) | null = null;
		onerror: (() => void) | null = null;
		complete = true;
		naturalWidth = 1;
		#src = "";

		get src(): string {
			return this.#src;
		}

		set src(value: string) {
			this.#src = value;
		}

		decode(): Promise<void> {
			return Promise.resolve();
		}
	}

	globalWithImage.Image = InstantImage as unknown as typeof Image;

	return () => {
		if (originalImage) {
			globalWithImage.Image = originalImage;
			return;
		}
		delete globalWithImage.Image;
	};
};

const createBootLoader = (): HTMLElement => {
	const loader = document.createElement("div");
	loader.id = "boot-loader";
	document.body.append(loader);
	return loader;
};

describe("runBootLoader", () => {
	let restoreImage: (() => void) | null = null;

	beforeEach(() => {
		installDom();
	});

	afterEach(() => {
		restoreImage?.();
		restoreImage = null;
		resetDom();
	});

	test("returns early when loader is missing", async () => {
		setDocumentReadyState("complete");
		setReducedMotion(false);
		installMockFontSet();
		restoreImage = installInstantImage();

		await runBootLoader();

		expect(document.querySelector(BOOT_LOADER_SELECTOR)).toBeNull();
	});

	test("adds leaving class then removes loader in normal motion", async () => {
		setDocumentReadyState("complete");
		setReducedMotion(false);
		const loadedFonts = installMockFontSet();
		restoreImage = installInstantImage();
		const loader = createBootLoader();

		await runBootLoader();

		expect(loadedFonts).toEqual(FONT_LOADS_EXPECTED);
		expect(loader.classList.contains("is-leaving")).toBe(true);
		expect(document.body.contains(loader)).toBe(false);
	});

	test("removes loader without leaving class in reduced motion", async () => {
		setDocumentReadyState("complete");
		setReducedMotion(true);
		const loadedFonts = installMockFontSet();
		restoreImage = installInstantImage();
		const loader = createBootLoader();

		await runBootLoader();

		expect(loadedFonts).toEqual(FONT_LOADS_EXPECTED);
		expect(loader.classList.contains("is-leaving")).toBe(false);
		expect(document.body.contains(loader)).toBe(false);
	});
});
