import {
	MatrixClient,
	AutojoinRoomsMixin,
	LogService,
	LogLevel,
	RichConsoleLogger,
	RustSdkCryptoStorageProvider,
	type IStorageProvider,
	SimpleFsStorageProvider,
	type ICryptoStorageProvider,
} from "matrix-bot-sdk";

import * as path from "node:path";
import {
	DATA_PATH,
	KEYV_URL,
	OPENAI_API_KEY,
	OPENAI_ASSISTANT_ID,
	MATRIX_HOMESERVER_URL,
	MATRIX_AUTOJOIN,
	MATRIX_ENCRYPTION,
	MATRIX_THREADS,
	CHATGPT_CONTEXT,
	KEYV_BOT_STORAGE,
	KEYV_BACKEND,
	BOT_CLIENT_ID,
	BOT_CLIENT_SECRET,
	BOT_DEVICE_ID,
} from "./env.js";
import CommandHandler from "./handlers.js";
import { KeyvStorageProvider } from "./storage.js";
import { parseMatrixUsernamePretty } from "./utils.js";
import OpenAI from "openai";
import { TokenManager } from "./token.js";

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG); // Shows the Matrix sync loop details - not needed most of the time
//LogService.setLevel(LogLevel.INFO);
LogService.muteModule("Metrics");
// LogService.trace = LogService.debug;

async function runService() {
	if (KEYV_URL && KEYV_BACKEND === "file")
		LogService.warn(
			"config",
			"KEYV_URL is ignored when KEYV_BACKEND is set to `file`",
		);

	let storage: IStorageProvider;
	if (KEYV_BOT_STORAGE) {
		storage = new KeyvStorageProvider(BOT_DEVICE_ID, "chatgpt-bot-storage");
	} else {
		storage = new SimpleFsStorageProvider(path.join(DATA_PATH, "bot.json"));
	}
	let cryptoStore: ICryptoStorageProvider;
	if (MATRIX_ENCRYPTION)
		cryptoStore = new RustSdkCryptoStorageProvider(
			path.join(DATA_PATH, BOT_DEVICE_ID, "encrypted"),
			1,
		);
	const botUsernameWithoutDomain = parseMatrixUsernamePretty(BOT_CLIENT_ID);

	LogService.info(
		"index",
		"Starting ChatGPT Matrix bot",
		botUsernameWithoutDomain,
	);

	const tokenManager = new TokenManager(
		MATRIX_HOMESERVER_URL,
		BOT_CLIENT_ID,
		BOT_CLIENT_SECRET,
		BOT_DEVICE_ID,
		(newToken) => {
			Object.assign(client, { accessToken: newToken });
		},
	);
	await tokenManager.initialize();

	if (!MATRIX_THREADS && CHATGPT_CONTEXT !== "room")
		throw Error(
			"You must set CHATGPT_CONTEXT to 'room' if you set MATRIX_THREADS to false",
		);

	const client: MatrixClient = new MatrixClient(
		MATRIX_HOMESERVER_URL,
		tokenManager.getAccessToken(),
		storage,
		cryptoStore,
	);

	// Automatically join rooms the bot is invited to
	if (MATRIX_AUTOJOIN) AutojoinRoomsMixin.setupOnClient(client);

	const openai = new OpenAI({
		apiKey: OPENAI_API_KEY,
	});

	// Prepare the command handler
	const commands = new CommandHandler(client, openai, OPENAI_ASSISTANT_ID);
	await commands.start();
	await client.start();

	LogService.info("index", "Bot started!");
}

runService();
