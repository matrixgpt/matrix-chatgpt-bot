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
	type MatrixEvent,
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
	MATRIX_WELCOME,
	BOT_CLIENT_ID,
	BOT_CLIENT_SECRET,
	BOT_DEVICE_ID,
} from "./env.js";
import CommandHandler from "./handlers.js";
import { KeyvStorageProvider } from "./storage.js";
import { parseMatrixUsernamePretty, wrapPrompt } from "./utils.js";
import { clientCredentialsLogin } from "./auth.js";
import OpenAI, { type ClientOptions } from "openai";

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG); // Shows the Matrix sync loop details - not needed most of the time
//LogService.setLevel(LogLevel.INFO);
LogService.muteModule("Metrics");
// LogService.trace = LogService.debug;
if (KEYV_URL && KEYV_BACKEND === "file")
	LogService.warn(
		"config",
		"KEYV_URL is ignored when KEYV_BACKEND is set to `file`",
	);

let storage: IStorageProvider;
if (KEYV_BOT_STORAGE) {
	storage = new KeyvStorageProvider(BOT_DEVICE_ID, "chatgpt-bot-storage");
} else {
	storage = new SimpleFsStorageProvider(path.join(DATA_PATH, "bot.json")); // /storage/bot.json
}

let cryptoStore: ICryptoStorageProvider;
if (MATRIX_ENCRYPTION)
	cryptoStore = new RustSdkCryptoStorageProvider(
		path.join(DATA_PATH, BOT_DEVICE_ID, "encrypted"),
		1,
	); // /storage/encrypted

async function main() {
	console.log("Starting ChatGPT Matrix bot", BOT_CLIENT_ID, BOT_CLIENT_SECRET);
	const botUsernameWithoutDomain = parseMatrixUsernamePretty(BOT_CLIENT_ID);
	const auth = await clientCredentialsLogin(
		MATRIX_HOMESERVER_URL,
		botUsernameWithoutDomain,
		BOT_CLIENT_SECRET,
		BOT_DEVICE_ID,
	);
	LogService.info("index", `Logged in as ${auth.device_id}`, BOT_DEVICE_ID);
	const accessToken = auth.access_token;

	if (!MATRIX_THREADS && CHATGPT_CONTEXT !== "room")
		throw Error(
			"You must set CHATGPT_CONTEXT to 'room' if you set MATRIX_THREADS to false",
		);

	const client: MatrixClient = new MatrixClient(
		MATRIX_HOMESERVER_URL,
		accessToken,
		storage,
		cryptoStore,
	);

	const clientOptions: ClientOptions = {
		apiKey: OPENAI_API_KEY,
	};

	const openai = new OpenAI(clientOptions);

	// Automatically join rooms the bot is invited to
	if (MATRIX_AUTOJOIN) AutojoinRoomsMixin.setupOnClient(client);

	client.on("room.failed_decryption", async (roomId, event, error) => {
		// handle `m.room.encrypted` event that could not be decrypted
		LogService.error(
			"index",
			`Failed decryption event!\n${{ roomId, event, error }}`,
		);
		await client.sendText(roomId, "Something went wrong please try again.");
	});

	client.on("room.join", async (roomId: string, _event: MatrixEvent) => {
		LogService.info("index", `Bot joined room ${roomId}`);
		if (MATRIX_WELCOME) {
			await client.sendMessage(roomId, {
				msgtype: "m.notice",
				body: `👋 Hello, I'm your Trust Assistant! Ask me a question and I'll see how I can help!`,
			});
		}
	});

	// Prepare the command handler
	const commands = new CommandHandler(client, openai, OPENAI_ASSISTANT_ID);
	await commands.start();
	await client.start();

	LogService.info("index", "Bot started!");
}

main();
