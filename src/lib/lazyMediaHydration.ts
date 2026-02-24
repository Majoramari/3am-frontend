export const hydrateDeferredImage = (image: HTMLImageElement): void => {
	const lazySrcset = image.dataset.lazySrcset;
	if (lazySrcset) {
		image.srcset = lazySrcset;
		delete image.dataset.lazySrcset;
	}

	const lazySizes = image.dataset.lazySizes;
	if (lazySizes) {
		image.sizes = lazySizes;
		delete image.dataset.lazySizes;
	}

	const lazySrc = image.dataset.lazySrc;
	if (lazySrc) {
		image.src = lazySrc;
		delete image.dataset.lazySrc;
	}
};

export const hydrateDeferredSource = (source: HTMLSourceElement): boolean => {
	let changed = false;

	const lazySrcset = source.dataset.lazySrcset;
	if (lazySrcset) {
		source.srcset = lazySrcset;
		delete source.dataset.lazySrcset;
		changed = true;
	}

	const lazySrc = source.dataset.lazySrc;
	if (lazySrc) {
		source.src = lazySrc;
		delete source.dataset.lazySrc;
		changed = true;
	}

	return changed;
};
