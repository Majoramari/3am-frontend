const WEBP_MIME_TYPE = "image/webp";
const QUALITY_SEARCH_STEPS = 9;
const SCALE_DOWN_RATIO = 0.86;

export const PRODUCT_IMAGE_TARGET_BYTES = 100 * 1024;

type OptimizeImageOptions = {
	targetBytes?: number;
	minQuality?: number;
	maxQuality?: number;
	minDimension?: number;
	maxDimensionPasses?: number;
};

type EncodeSearchResult = {
	bestWithinTarget: Blob | null;
	smallestCandidate: Blob;
};

const clamp = (value: number, min: number, max: number): number =>
	Math.min(max, Math.max(min, value));

const toWebpFileName = (fileName: string): string => {
	const trimmed = fileName.trim();
	if (!trimmed) {
		return "image.webp";
	}

	const baseName = trimmed.replace(/\.[^.]+$/, "").trim() || "image";
	return `${baseName}.webp`;
};

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const imageUrl = URL.createObjectURL(file);
		const image = new Image();

		const cleanup = (): void => {
			URL.revokeObjectURL(imageUrl);
		};

		image.onload = async () => {
			try {
				if (typeof image.decode === "function") {
					await image.decode();
				}
				resolve(image);
			} catch {
				reject(new Error("Could not decode image file."));
			} finally {
				cleanup();
			}
		};

		image.onerror = () => {
			cleanup();
			reject(new Error("Could not read image file."));
		};

		image.src = imageUrl;
	});

const canvasToWebpBlob = async (
	canvas: HTMLCanvasElement,
	quality: number,
): Promise<Blob> => {
	if (typeof canvas.toBlob === "function") {
		const blob = await new Promise<Blob | null>((resolve) => {
			canvas.toBlob(
				(result) => {
					resolve(result);
				},
				WEBP_MIME_TYPE,
				quality,
			);
		});

		if (blob) {
			return blob;
		}
	}

	const dataUrl = canvas.toDataURL(WEBP_MIME_TYPE, quality);
	const response = await fetch(dataUrl);
	return response.blob();
};

const findBestBlobForTarget = async (
	canvas: HTMLCanvasElement,
	targetBytes: number,
	minQuality: number,
	maxQuality: number,
): Promise<EncodeSearchResult> => {
	let low = minQuality;
	let high = maxQuality;
	let bestWithinTarget: Blob | null = null;
	let smallestCandidate: Blob | null = null;

	for (let step = 0; step < QUALITY_SEARCH_STEPS; step += 1) {
		const quality = (low + high) / 2;
		const candidate = await canvasToWebpBlob(canvas, quality);

		if (!smallestCandidate || candidate.size < smallestCandidate.size) {
			smallestCandidate = candidate;
		}

		if (candidate.size <= targetBytes) {
			bestWithinTarget = candidate;
			low = quality;
		} else {
			high = quality;
		}
	}

	if (!smallestCandidate) {
		smallestCandidate = await canvasToWebpBlob(canvas, minQuality);
	}

	return {
		bestWithinTarget,
		smallestCandidate,
	};
};

export const optimizeImageToWebp = async (
	file: File,
	options: OptimizeImageOptions = {},
): Promise<File> => {
	if (!file.type.startsWith("image/")) {
		throw new Error("Selected file is not an image.");
	}

	const targetBytes = Math.max(
		1,
		Math.floor(options.targetBytes ?? PRODUCT_IMAGE_TARGET_BYTES),
	);

	if (file.type === WEBP_MIME_TYPE && file.size <= targetBytes) {
		return file;
	}

	const minQuality = clamp(options.minQuality ?? 0.45, 0.05, 1);
	const maxQuality = clamp(options.maxQuality ?? 0.95, minQuality, 1);
	const minDimension = Math.max(64, Math.floor(options.minDimension ?? 360));
	const maxDimensionPasses = Math.max(
		1,
		Math.floor(options.maxDimensionPasses ?? 8),
	);

	const image = await loadImageFromFile(file);
	let width = Math.max(1, image.naturalWidth || image.width);
	let height = Math.max(1, image.naturalHeight || image.height);
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d");

	if (!context) {
		throw new Error("Could not optimize image in this browser.");
	}

	let smallestBlob: Blob | null = null;

	for (let pass = 0; pass < maxDimensionPasses; pass += 1) {
		canvas.width = width;
		canvas.height = height;
		context.clearRect(0, 0, width, height);
		context.drawImage(image, 0, 0, width, height);

		const { bestWithinTarget, smallestCandidate } = await findBestBlobForTarget(
			canvas,
			targetBytes,
			minQuality,
			maxQuality,
		);

		if (!smallestBlob || smallestCandidate.size < smallestBlob.size) {
			smallestBlob = smallestCandidate;
		}

		if (bestWithinTarget) {
			return new File([bestWithinTarget], toWebpFileName(file.name), {
				type: WEBP_MIME_TYPE,
				lastModified: Date.now(),
			});
		}

		if (width <= minDimension || height <= minDimension) {
			break;
		}

		width = Math.max(minDimension, Math.round(width * SCALE_DOWN_RATIO));
		height = Math.max(minDimension, Math.round(height * SCALE_DOWN_RATIO));
	}

	if (smallestBlob && smallestBlob.size <= targetBytes) {
		return new File([smallestBlob], toWebpFileName(file.name), {
			type: WEBP_MIME_TYPE,
			lastModified: Date.now(),
		});
	}

	throw new Error(
		`Image is too large. Please use an image that can be optimized to ${Math.round(targetBytes / 1024)}KB or less.`,
	);
};
