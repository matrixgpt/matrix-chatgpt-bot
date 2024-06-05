import { parseEnv } from "znv";
import { z } from "zod";
import * as dotenv from "dotenv";
dotenv.config();

export const {
	DATA_PATH,
	KEYV_BACKEND,
	KEYV_URL,
	KEYV_BOT_STORAGE,
	/** Matrix Bot Settings */
	MATRIX_HOMESERVER_URL,
	BOT_CLIENT_ID,
	BOT_CLIENT_SECRET,
	BOT_DEVICE_ID,
	/** Matrix Bot Features */
	MATRIX_AUTOJOIN,
	MATRIX_ENCRYPTION,
	MATRIX_THREADS,
	MATRIX_PREFIX_DM,
	MATRIX_RICH_TEXT,
	MATRIX_WELCOME,
	/** Matrix Access Control */
	MATRIX_BLACKLIST,
	MATRIX_WHITELIST,
	MATRIX_ROOM_BLACKLIST,
	MATRIX_ROOM_WHITELIST,
	/** Matrix Bot Runtime Config */
	MATRIX_DEFAULT_PREFIX,
	MATRIX_DEFAULT_PREFIX_REPLY,
	/** ChatGPT Settings */
	OPENAI_API_KEY,
	OPENAI_ASSISTANT_ID,
	CHATGPT_CONTEXT,
	CHATGPT_TIMEOUT,
	CHATGPT_PROMPT_PREFIX,
	CHATGPT_IGNORE_MEDIA,
	/**  Mixpanel */
	MIXPANEL_PROJECT_TOKEN,
	API_URL,
} = parseEnv(process.env, {
	DATA_PATH: {
		schema: z.string().default("/storage/"),
		description:
			"Set to /storage/ if using docker, ./storage if running without",
	},
	KEYV_BACKEND: {
		schema: z.enum(["file", "other"]).default("file"),
		description:
			"Set the Keyv backend to 'file' or 'other' if other set KEYV_URL",
	},
	KEYV_URL: {
		schema: z.string().default(""),
		description:
			"Set Keyv backend for storage, in-memory if blank, ignored if KEYV_BACKEND set to `file`",
	},
	KEYV_BOT_STORAGE: {
		schema: z.boolean().default(false),
		description:
			"Set to true to use a Keyv backend to store bot data. Uses a file if false.",
	},
	/** Matrix Bot Settings */
	MATRIX_HOMESERVER_URL: {
		schema: z.string().default("https://matrix.org"),
		description: "Set matrix homeserver with 'https://' prefix",
	},
	BOT_CLIENT_ID: {
		schema: z.string().optional(),
		description: "Set client id generated in GlobaliD Admin Panel",
	},
	BOT_CLIENT_SECRET: {
		schema: z.string().optional(),
		description: "Set client secret generated in GlobaliD Admin Panel",
	},
	BOT_DEVICE_ID: {
		schema: z.string().optional(),
		description:
			"Set device id that you should generate for persistant matrix device",
	},
	/** Matrix Bot Features */
	MATRIX_AUTOJOIN: {
		schema: z.boolean().default(true),
		description: "Set to true if you want the bot to autojoin when invited",
	},
	MATRIX_ENCRYPTION: {
		schema: z.boolean().default(true),
		description:
			"Set to true if you want the bot to support encrypted channels",
	},
	MATRIX_THREADS: {
		schema: z.boolean().default(true),
		description:
			"Set to true if you want the bot to answer always in a new thread/conversation",
	},
	MATRIX_PREFIX_DM: {
		schema: z.boolean().default(false),
		description:
			"Set to false if you want the bot to answer to all messages in a one-to-one room",
	},
	MATRIX_RICH_TEXT: {
		schema: z.boolean().default(true),
		description: "Set to true if you want the bot to answer with enriched text",
	},
	MATRIX_WELCOME: {
		schema: z.boolean().default(true),
		description:
			"Set to true if you want the bot to post a message when it joins a new chat.",
	},
	/** Matrix Access Control */
	MATRIX_BLACKLIST: {
		schema: z.string().optional(),
		description:
			"Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to blacklist users or domains",
	},
	MATRIX_WHITELIST: {
		schema: z.string().optional(),
		description:
			"Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to whitelist users or domains",
	},
	MATRIX_ROOM_BLACKLIST: {
		schema: z.string().optional(),
		description:
			"Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to blacklist rooms or domains",
	},
	MATRIX_ROOM_WHITELIST: {
		schema: z.string().optional(),
		description:
			"Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to whitelist rooms or domains",
	},
	/** Matrix Bot Runtime Config */
	MATRIX_DEFAULT_PREFIX: {
		schema: z.string().default(""),
		description:
			"Set to a string if you want the bot to respond only when messages start with this prefix. Trailing space matters. Empty for no prefix.",
	},
	MATRIX_DEFAULT_PREFIX_REPLY: {
		schema: z.boolean().default(false),
		description:
			"Set to false if you want the bot to answer to all messages in a thread/conversation",
	},
	/** ChatGPT Settings */
	OPENAI_API_KEY: {
		schema: z.string().default(""),
		description:
			"Set to the API key from https://platform.openai.com/account/api-keys",
	},
	OPENAI_ASSISTANT_ID: {
		schema: z.string().default(""),
		description:
			"Set to the assistant ID from https://platform.openai.com/assistants",
	},
	CHATGPT_TIMEOUT: {
		schema: z.number().default(2 * 60 * 1000),
		description: "Set number of milliseconds to wait for ChatGPT responses",
	},
	CHATGPT_CONTEXT: {
		schema: z.enum(["thread", "room", "both"]).default("thread"),
		description:
			"Set the ChatGPT conversation context to 'thread', 'room' or 'both'",
	},
	CHATGPT_PROMPT_PREFIX: {
		schema: z
			.string()
			.default(
				"Instructions:\nYou are ChatGPT, a large language model trained by OpenAI.",
			),
		description: "Instructions to feed to ChatGPT on startup",
	},
	CHATGPT_IGNORE_MEDIA: {
		schema: z.boolean().default(false),
		description: "Wether or not the bot should react to non-text messages",
	},
	/** Mixpanel settings */
	MIXPANEL_PROJECT_TOKEN: {
		schema: z.string().default(""),
		description: "Set to a string to activate mixpanel tracking",
	},
	API_URL: {
		schema: z.string().default(""),
		description: "Set to a string for the API URL user directory",
	},
});
