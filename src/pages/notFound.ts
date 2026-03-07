import { html } from "@lib/template";
import { View } from "@lib/view";

export class NotFoundPage extends View<"section"> {
	constructor() {
		super("section");
	}

	render(): DocumentFragment {
		return html`
			 
  <div class="hero">
    <div class="txt">
      <h2>Being lost can be an adventure</h2>
      <p>But not right now.</p>
      <button class="returnhome">Return Home</button>
    </div>

    <div class="box">
      <div>
        <h2>Never miss an adventure — get updates, offers and invites.</h2>
      </div>
      <div class="right-inputs">
        <input type="email" id="email" placeholder="Email*" required>
        <input type="text" id="code" placeholder="Postal Code*" required>
        <div  class="checkbox">
          <label>
            <input type="checkbox" required>
          </label>
          <p class="legal">By submitting, I agree to receive future communications and I have read and agree to Rivian's <a href="#">Terms</a> and <a href="#">Data Privacy Notice</a>.</p>
        </div>
        <button type="submit">Subscribe</button>
      </div>
    </div>


  </div>
		`;
	}
}
