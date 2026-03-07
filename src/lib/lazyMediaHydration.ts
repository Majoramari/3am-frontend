import { sanitizeMediaUrl, sanitizeSrcset } from "@lib/safeUrl";

export const hydrateDeferredImage = (image: HTMLImageElement): void => {
	const lazySrcset = image.dataset.lazySrcset;
	if (lazySrcset) {
		const safeSrcset = sanitizeSrcset(lazySrcset);
		if (safeSrcset) {
			image.srcset = safeSrcset;
		}
		delete image.dataset.lazySrcset;
	}

	const lazySizes = image.dataset.lazySizes;
	if (lazySizes) {
		image.sizes = lazySizes;
		delete image.dataset.lazySizes;
	}

	const lazySrc = image.dataset.lazySrc;
	if (lazySrc) {
		const safeSrc = sanitizeMediaUrl(lazySrc);
		if (safeSrc) {
			image.src = safeSrc;
		}
		delete image.dataset.lazySrc;
	}
};

export const hydrateDeferredSource = (source: HTMLSourceElement): boolean => {
	let changed = false;

	const lazySrcset = source.dataset.lazySrcset;
	if (lazySrcset) {
		const safeSrcset = sanitizeSrcset(lazySrcset);
		if (safeSrcset) {
			source.srcset = safeSrcset;
			changed = true;
		}
		delete source.dataset.lazySrcset;
	}

	const lazySrc = source.dataset.lazySrc;
	if (lazySrc) {
		const safeSrc = sanitizeMediaUrl(lazySrc);
		if (safeSrc) {
			source.src = safeSrc;
			changed = true;
		}
		delete source.dataset.lazySrc;
	}

	return changed;
};
