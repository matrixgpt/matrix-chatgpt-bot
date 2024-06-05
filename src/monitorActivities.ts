import { init } from "mixpanel";
import { MIXPANEL_PROJECT_TOKEN } from "./env.js";

export default class MonitorActivities {
	private mixpanel = null;
	constructor() {
		this.mixpanel = init(MIXPANEL_PROJECT_TOKEN, {
			keepAlive: false,
		});
	}
	/**
	 * Tracks the send message event using mixpanel.
	 *
	 * @param message - The message content.
	 * @param userId - The user ID.
	 * @param uns_name - The user's name.
	 */
	trackSendMessageEvent(message: string, userId: string, uns_name: string) {
		if (!message || !userId || !uns_name) return;
		// set new user we can add as many as we want distinct user
		this.mixpanel.people.set(userId, {
			name: uns_name,
		});
		// we just track msg event using user id
		this.mixpanel.track("Msg | bot trustcompanion message sent", {
			distinct_id: userId,
			uns_name: uns_name,
			raw_input: message,
		});
	}
}
