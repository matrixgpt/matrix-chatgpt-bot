import { LogService } from "matrix-bot-sdk";
import { jwtDecode } from "jwt-decode";
import { parseMatrixUsernamePretty } from "./utils.js";
import { clientCredentialsLogin } from "./auth.js";

export class TokenManager {
	private accessToken: string;
	LEEWAY_MS = 300000 as const;
	REFRESH_RATE = 60000 as const;

	constructor(
		private homeserverUrl: string,
		private clientId: string,
		private clientSecret: string,
		private deviceId: string,
		private onTokenRefresh: (newToken: string) => void,
	) {}

	async initialize() {
		this.accessToken = await this.fetchAccessToken();
		this.checkAccessTokenExpiry();
	}

	getAccessToken() {
		return this.accessToken;
	}

	private async fetchAccessToken() {
		LogService.info("token", "Requesting access token");
		const auth = await clientCredentialsLogin(
			this.homeserverUrl,
			parseMatrixUsernamePretty(this.clientId),
			this.clientSecret,
			this.deviceId,
		);
		LogService.info("token", "Access token received");
		return auth.access_token;
	}

	private checkAccessTokenExpiry() {
		LogService.info("token", "Checking access token expiry");
		const expiryTime = jwtDecode(this.accessToken).exp;
		if (!expiryTime) {
			LogService.error("token", "No expiry time found in access token");
			return;
		}
		const interval = setInterval(async () => {
			if (expiryTime * 1000 - Date.now() < this.LEEWAY_MS) {
				this.accessToken = await this.fetchAccessToken();
				this.onTokenRefresh(this.accessToken);
				clearInterval(interval);
				this.checkAccessTokenExpiry();
			}
		}, this.REFRESH_RATE);
	}
}
