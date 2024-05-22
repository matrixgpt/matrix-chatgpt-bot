import ChatGPTClient from "@waylaidwanderer/chatgpt-api";
import { KeyvFile } from "keyv-file";
import {
  MatrixClient,
  AutojoinRoomsMixin,
  LogService,
  LogLevel,
  RichConsoleLogger,
  RustSdkCryptoStorageProvider,
  IStorageProvider,
  SimpleFsStorageProvider,
  ICryptoStorageProvider,
} from "matrix-bot-sdk";

import * as path from "path";
import {
  DATA_PATH,
  KEYV_URL,
  OPENAI_AZURE,
  OPENAI_API_KEY,
  MATRIX_HOMESERVER_URL,
  MATRIX_AUTOJOIN,
  MATRIX_ENCRYPTION,
  MATRIX_THREADS,
  CHATGPT_CONTEXT,
  CHATGPT_API_MODEL,
  KEYV_BOT_STORAGE,
  KEYV_BACKEND,
  CHATGPT_PROMPT_PREFIX,
  MATRIX_WELCOME,
  CHATGPT_REVERSE_PROXY,
  CHATGPT_TEMPERATURE,
  CHATGPT_MAX_CONTEXT_TOKENS,
  CHATGPT_MAX_PROMPT_TOKENS,
  BOT_CLIENT_ID,
  BOT_CLIENT_SECRET,
  BOT_DEVICE_ID,
} from "./env.js";
import CommandHandler from "./handlers.js";
import { KeyvStorageProvider } from "./storage.js";
import { parseMatrixUsernamePretty, wrapPrompt } from "./utils.js";
import { clientCredentialsLogin } from "./auth.js";

LogService.setLogger(new RichConsoleLogger());
LogService.setLevel(LogLevel.DEBUG); // Shows the Matrix sync loop details - not needed most of the time
//LogService.setLevel(LogLevel.INFO);
LogService.muteModule("Metrics");
// LogService.trace = LogService.debug;
if (KEYV_URL && KEYV_BACKEND === "file")
  LogService.warn(
    "config",
    "KEYV_URL is ignored when KEYV_BACKEND is set to `file`"
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
    1
  ); // /storage/encrypted

let cacheOptions; // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
if (KEYV_BACKEND === "file") {
  cacheOptions = {
    store: new KeyvFile({
      filename: path.join(DATA_PATH, BOT_DEVICE_ID, `chatgpt-bot-api.json`),
    }),
  };
} else {
  cacheOptions = { uri: KEYV_URL };
}

async function main() {
  console.log("Starting ChatGPT Matrix bot", BOT_CLIENT_ID, BOT_CLIENT_SECRET);
  const botUsernameWithoutDomain = parseMatrixUsernamePretty(BOT_CLIENT_ID);
  const auth = await clientCredentialsLogin(
    MATRIX_HOMESERVER_URL,
    botUsernameWithoutDomain,
    BOT_CLIENT_SECRET,
    BOT_DEVICE_ID
  );
  LogService.info("index", "Logged in as " + auth.device_id, BOT_DEVICE_ID);
  const accessToken = auth.access_token;
  if (!MATRIX_THREADS && CHATGPT_CONTEXT !== "room")
    throw Error(
      "You must set CHATGPT_CONTEXT to 'room' if you set MATRIX_THREADS to false"
    );
  const client: MatrixClient = new MatrixClient(
    MATRIX_HOMESERVER_URL,
    accessToken,
    storage,
    cryptoStore
  );

  if (!CHATGPT_API_MODEL) {
    LogService.warn(
      "index",
      "This bot now uses the official API from ChatGPT. In order to migrate add the CHATGPT_API_MODEL variable to your .env"
    );
    LogService.warn(
      "index",
      "The official ChatGPT-model which should be used is 'gpt-3.5-turbo'. See the .env.example for details"
    );
    LogService.warn(
      "index",
      "Please note that the usage of the models charge your OpenAI account and are not free to use"
    );
    return;
  }

  const clientOptions = {
    // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
    modelOptions: {
      model: CHATGPT_API_MODEL, // The model is set to gpt-3.5-turbo by default
      temperature: CHATGPT_TEMPERATURE,
    },
    promptPrefix: wrapPrompt(CHATGPT_PROMPT_PREFIX),
    debug: false,
    azure: OPENAI_AZURE,
    reverseProxyUrl: CHATGPT_REVERSE_PROXY,
    maxContextTokens: CHATGPT_MAX_CONTEXT_TOKENS,
    maxPromptTokens: CHATGPT_MAX_PROMPT_TOKENS,
  };

  const chatgpt = new ChatGPTClient(
    OPENAI_API_KEY,
    clientOptions,
    cacheOptions
  );

  // Automatically join rooms the bot is invited to
  if (MATRIX_AUTOJOIN) AutojoinRoomsMixin.setupOnClient(client);

  client.on("room.failed_decryption", async (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error(
      "index",
      `Failed decryption event!\n${{ roomId, event, error }}`
    );
    await client.sendText(
      roomId,
      `Room key error. I will leave the room, please reinvite me!`
    );
    try {
      await client.leaveRoom(roomId);
    } catch (e) {
      LogService.error(
        "index",
        `Failed to leave room ${roomId} after failed decryption!`
      );
    }
  });

  client.on("room.join", async (roomId: string, _event: any) => {
    LogService.info("index", `Bot joined room ${roomId}`);
    if (MATRIX_WELCOME) {
      await client.sendMessage(roomId, {
        msgtype: "m.notice",
        body: `👋 Hello, I'm GlobaliD Bot! Ask me a question and I'll see how I can help!`,
      });
    }
  });

  // Prepare the command handler
  const commands = new CommandHandler(client, chatgpt);
  await commands.start();

  LogService.info(
    "index",
    `Starting bot using ChatGPT model: ${CHATGPT_API_MODEL}`
  );
  LogService.info(
    "index",
    `Using promptPrefix: ${wrapPrompt(CHATGPT_PROMPT_PREFIX)}`
  );

  let joinedRooms = await client.getJoinedRooms();

  Promise.all(
    joinedRooms.map(async (roomId) => {
      client.leaveRoom(roomId);
    })
  );

  joinedRooms = await client.getJoinedRooms();
  LogService.info("index", `Joined rooms: ${joinedRooms.length}`);
  await client.start();

  LogService.info("index", "Bot started!");
}

main();
