import { View } from "@lib/view";
import { DemoDriveBookingSection } from "@sections/demoDrive/book";

export class DemoDrivePage extends View<"section"> {
	constructor() {
		super("section", { className: "demo-drive-page" });
	}

	render(): DocumentFragment {
		return this.tpl`${new DemoDriveBookingSection()}`;
	}
}
