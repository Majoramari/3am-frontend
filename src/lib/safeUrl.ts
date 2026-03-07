const SAFE_MEDIA_PROTOCOLS = new Set(["http:", "https:"]);
const SRCSET_DESCRIPTOR_PATTERN = /^\d+(\.\d+)?[wx]$/;

const hasControlChars = (value: string): boolean => {
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code < 32 || code === 127) {
			return true;
		}
	}

	return false;
};

const resolveBaseUrl = (): string => {
	if (typeof window !== "undefined") {
		return window.location.origin;
	}

	return "https://example.com";
};

export const sanitizeMediaUrl = (
	value: string | null | undefined,
): string | null => {
	if (!value) {
		return null;
	}

	const trimmed = value.trim();
	if (!trimmed || hasControlChars(trimmed)) {
		return null;
	}

	try {
		const resolved = new URL(trimmed, resolveBaseUrl());
		if (!SAFE_MEDIA_PROTOCOLS.has(resolved.protocol)) {
			return null;
		}
		return resolved.href;
	} catch {
		return null;
	}
};

export const sanitizeSrcset = (
	value: string | null | undefined,
): string | null => {
	if (!value) {
		return null;
	}

	const candidates = value
		.split(",")
		.map((entry) => entry.trim())
		.filter(Boolean);

	if (candidates.length === 0) {
		return null;
	}

	const safeCandidates: string[] = [];
	for (const candidate of candidates) {
		const parts = candidate.split(/\s+/);
		const src = parts.shift();
		if (!src) {
			return null;
		}

		const safeSrc = sanitizeMediaUrl(src);
		if (!safeSrc) {
			return null;
		}

		if (parts.length === 0) {
			safeCandidates.push(safeSrc);
			continue;
		}

		const descriptor = parts.join(" ");
		if (!SRCSET_DESCRIPTOR_PATTERN.test(descriptor)) {
			return null;
		}

		safeCandidates.push(`${safeSrc} ${descriptor}`);
	}

	return safeCandidates.join(", ");
};

export const toSafeCssUrlValue = (
	value: string | null | undefined,
): string | null => {
	const safeUrl = sanitizeMediaUrl(value);
	if (!safeUrl) {
		return null;
	}

	const escaped = safeUrl.replace(/"/g, "%22");
	return `url("${escaped}")`;
};
