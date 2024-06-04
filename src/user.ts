import { fetch } from "undici";
import { BOT_DEVICE_ID, KEYV_BOT_STORAGE } from "./env";
import { KeyvStorageProvider } from "./storage";

export interface UserResponse {
	gid_uuid: string;
	name: string;
	display_name: string;
	profile_photo: string;
	created_at: string;
	public_key: string;
	country_code: string;
	type: string;
}

let storage = null;

/**
 * Retrieves user details from the GlobalID API or cache based on the provided GlobalID UUID.
 * @param gid_uuid - The GlobalID UUID of the user.
 * @returns A promise that resolves to the user details.
 */
export async function userDetailsResponse(gid_uuid: string) {
	if (KEYV_BOT_STORAGE) {
		storage = new KeyvStorageProvider(BOT_DEVICE_ID, "chatgpt-user-storage");
	}
	const cachedUser = await storage.readValue(`user-${gid_uuid}`);
	if (cachedUser !== undefined) {
		return Promise.resolve(JSON.parse(cachedUser)) as Promise<UserResponse>;
	}
	const base_url = "https://api.globalid.dev/v1";
	const response = await fetch(`${base_url}/directory/${gid_uuid}`, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
	await storage.storeValue(
		`user-${gid_uuid}`,
		JSON.stringify(await response.json()),
	);
	return response.json() as Promise<UserResponse>;
}
