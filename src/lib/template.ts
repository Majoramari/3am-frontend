export type TemplateValue =
	| Node
	| string
	| number
	| boolean
	| null
	| undefined
	| TemplateValue[];

const escapeHtml = (value: string): string =>
	value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");

const containsNode = (value: TemplateValue): boolean => {
	if (value instanceof Node) {
		return true;
	}

	if (Array.isArray(value)) {
		return value.some(containsNode);
	}

	return false;
};

const toText = (value: TemplateValue): string => {
	if (value == null || value === false) {
		return "";
	}

	if (Array.isArray(value)) {
		return value.map(toText).join("");
	}

	return String(value);
};

const toNode = (value: TemplateValue): Node | null => {
	if (value == null || value === false) {
		return null;
	}

	if (value instanceof Node) {
		return value;
	}

	if (Array.isArray(value)) {
		const fragment = document.createDocumentFragment();
		for (const entry of value) {
			const child = containsNode(entry)
				? toNode(entry)
				: document.createTextNode(toText(entry));
			if (child) {
				fragment.appendChild(child);
			}
		}
		return fragment;
	}

	return document.createTextNode(String(value));
};

const replaceSlots = (fragment: DocumentFragment, slots: Node[]): void => {
	const walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
	const slotComments: Comment[] = [];

	// Collect first, then replace.
	// Replacing nodes while a TreeWalker is actively traversing can cause
	// subsequent comment nodes to be skipped in some runtimes.
	let current = walker.nextNode() as Comment | null;
	while (current) {
		if (current.data.startsWith("slot:")) {
			slotComments.push(current);
		}
		current = walker.nextNode() as Comment | null;
	}

	for (const comment of slotComments) {
		const index = Number(comment.data.slice(5));
		const replacement = slots[index];
		if (replacement) {
			comment.replaceWith(replacement);
			continue;
		}
		comment.remove();
	}
};

export const html = (
	strings: TemplateStringsArray,
	...values: TemplateValue[]
): DocumentFragment => {
	let markup = "";
	const slots: Node[] = [];

	for (let index = 0; index < strings.length; index += 1) {
		markup += strings[index];

		if (index >= values.length) {
			continue;
		}

		const value = values[index];

		if (containsNode(value)) {
			const node = toNode(value);
			const slotIndex = slots.length;
			if (node) {
				slots.push(node);
			}
			markup += `<!--slot:${slotIndex}-->`;
			continue;
		}

		markup += escapeHtml(toText(value));
	}

	const template = document.createElement("template");
	template.innerHTML = markup;

	const fragment = template.content;
	if (slots.length > 0) {
		replaceSlots(fragment, slots);
	}

	return fragment;
};
