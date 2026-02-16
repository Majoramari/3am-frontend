export type Cleanup = () => void;

export class CleanupBag {
	private tasks: Cleanup[] = [];

	add(task: Cleanup): void {
		this.tasks.push(task);
	}

	on<K extends keyof GlobalEventHandlersEventMap>(
		target: Window | Document | HTMLElement,
		type: K,
		listener: (event: GlobalEventHandlersEventMap[K]) => void,
		options?: AddEventListenerOptions,
	): void;
	on(
		target: EventTarget,
		type: string,
		listener: EventListenerOrEventListenerObject,
		options?: AddEventListenerOptions,
	): void {
		target.addEventListener(type, listener, options);
		this.add(() => target.removeEventListener(type, listener, options));
	}

	run(): void {
		for (const task of this.tasks.splice(0)) {
			task();
		}
	}
}
