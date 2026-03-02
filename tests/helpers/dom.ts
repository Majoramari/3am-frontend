import { GlobalWindow } from "happy-dom";

type DomGlobalKey =
	| "window"
	| "document"
	| "Node"
	| "Element"
	| "HTMLElement"
	| "HTMLAnchorElement"
	| "HTMLButtonElement"
	| "HTMLImageElement"
	| "DocumentFragment"
	| "NodeFilter"
	| "Comment";

const DOM_GLOBAL_KEYS: ReadonlyArray<DomGlobalKey> = [
	"window",
	"document",
	"Node",
	"Element",
	"HTMLElement",
	"HTMLAnchorElement",
	"HTMLButtonElement",
	"HTMLImageElement",
	"DocumentFragment",
	"NodeFilter",
	"Comment",
];

type Snapshot = {
	existed: boolean;
	value: unknown;
};

let snapshots: Partial<Record<DomGlobalKey, Snapshot>> = {};

export const installDom = (url = "https://example.com/"): GlobalWindow => {
	const windowInstance = new GlobalWindow();
	windowInstance.happyDOM.setURL(url);
	const globals = globalThis as Record<DomGlobalKey, unknown>;

	snapshots = {};
	for (const key of DOM_GLOBAL_KEYS) {
		snapshots[key] = {
			existed: key in globals,
			value: globals[key],
		};
	}

	globals.window = windowInstance as unknown as typeof window;
	globals.document = windowInstance.document as unknown as typeof document;
	globals.Node = windowInstance.Node as unknown as typeof Node;
	globals.Element = windowInstance.Element as unknown as typeof Element;
	globals.HTMLElement =
		windowInstance.HTMLElement as unknown as typeof HTMLElement;
	globals.HTMLAnchorElement =
		windowInstance.HTMLAnchorElement as unknown as typeof HTMLAnchorElement;
	globals.HTMLButtonElement =
		windowInstance.HTMLButtonElement as unknown as typeof HTMLButtonElement;
	globals.HTMLImageElement =
		windowInstance.HTMLImageElement as unknown as typeof HTMLImageElement;
	globals.DocumentFragment =
		windowInstance.DocumentFragment as unknown as typeof DocumentFragment;
	globals.NodeFilter =
		windowInstance.NodeFilter as unknown as typeof NodeFilter;
	globals.Comment = windowInstance.Comment as unknown as typeof Comment;

	return windowInstance;
};

export const resetDom = (): void => {
	const globals = globalThis as Record<DomGlobalKey, unknown>;

	for (const key of DOM_GLOBAL_KEYS) {
		const snapshot = snapshots[key];
		if (!snapshot) {
			continue;
		}

		if (snapshot.existed) {
			globals[key] = snapshot.value;
			continue;
		}

		delete globals[key];
	}

	snapshots = {};
};
