const ROLE_CLAIM_KEYS = [
	"role",
	"roles",
	"http://schemas.microsoft.com/ws/2008/06/identity/claims/role",
	"http://schemas.xmlsoap.org/ws/2005/05/identity/claims/role",
] as const;

export type JwtPayload = Record<string, unknown>;

const toArray = (value: unknown): unknown[] => {
	if (Array.isArray(value)) {
		return value;
	}
	return [value];
};

export const decodeJwtPayload = (token: string): JwtPayload | null => {
	const parts = token.split(".");
	if (parts.length < 2) {
		return null;
	}

	const payloadPart = parts[1];
	const decoder =
		typeof globalThis.atob === "function" ? globalThis.atob : null;
	if (!decoder) {
		return null;
	}

	const base64 = payloadPart
		.replace(/-/g, "+")
		.replace(/_/g, "/")
		.padEnd(Math.ceil(payloadPart.length / 4) * 4, "=");

	try {
		const decoded = decoder(base64);
		return JSON.parse(decoded) as JwtPayload;
	} catch {
		return null;
	}
};

export const collectJwtRoles = (payload: JwtPayload): Set<string> => {
	const roles = new Set<string>();

	for (const key of ROLE_CLAIM_KEYS) {
		if (!(key in payload)) {
			continue;
		}

		const claimValues = toArray(payload[key]);
		for (const claim of claimValues) {
			if (typeof claim !== "string") {
				continue;
			}
			const normalized = claim.trim().toLowerCase();
			if (normalized) {
				roles.add(normalized);
			}
		}
	}

	return roles;
};

export const tokenHasRole = (
	token: string | null | undefined,
	role: string,
): boolean => {
	if (!token) {
		return false;
	}

	const normalizedRole = role.trim().toLowerCase();
	if (!normalizedRole) {
		return false;
	}

	const payload = decodeJwtPayload(token);
	if (!payload) {
		return false;
	}

	return collectJwtRoles(payload).has(normalizedRole);
};
