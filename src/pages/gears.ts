import { Button } from "@components/button";
import { View } from "@lib/view";

export class GearsPage extends View<"div"> {
	constructor() {
		super("div", { className: "gears-page" });
	}

	render(): DocumentFragment {
		return this.tpl`
		<section>
			${new Button({ label: "Click here", variant: "outline", href: "https://google.com" })}
		</section>
	`;
	}
}
