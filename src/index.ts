import ChatGPTClient from '@waylaidwanderer/chatgpt-api';
import Keyv from 'keyv'
import { KeyvFile } from 'keyv-file';
import {
  MatrixAuth, MatrixClient, AutojoinRoomsMixin,
  LogService, LogLevel, RichConsoleLogger,
  RustSdkCryptoStorageProvider, IStorageProvider, SimpleFsStorageProvider,
} from "matrix-bot-sdk";

import * as path from "path";
import { DATA_PATH, KEYV_URL, OPENAI_API_KEY, MATRIX_HOMESERVER_URL, MATRIX_ACCESS_TOKEN, MATRIX_AUTOJOIN, MATRIX_BOT_PASSWORD, MATRIX_BOT_USERNAME, MATRIX_ENCRYPTION, MATRIX_THREADS, CHATGPT_CONTEXT, CHATGPT_MODEL, KEYV_BOT_STORAGE, KEYV_BACKEND } from './env.js'
import CommandHandler from "./handlers.js"
import { KeyvStorageProvider } from './storage.js'
import { parseMatrixUsernamePretty } from './utils.js';

LogService.setLogger(new RichConsoleLogger());
// LogService.setLevel(LogLevel.DEBUG);  // Shows the Matrix sync loop details - not needed most of the time
LogService.setLevel(LogLevel.INFO);
// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;
if (KEYV_URL && KEYV_BACKEND === 'file') LogService.warn('config', 'KEYV_URL is ignored when KEYV_BACKEND is set to `file`')

let chatgptStore:Keyv
if (KEYV_BACKEND === 'file'){
  chatgptStore = new Keyv({store: new KeyvFile({ filename: path.join(DATA_PATH, `chatgpt-bot-api.json`),})})
} else {
  chatgptStore = new Keyv(KEYV_URL, { namespace: 'chatgpt-bot-api' });
}

let storage: IStorageProvider
if (KEYV_BOT_STORAGE) {
  storage = new KeyvStorageProvider('chatgpt-bot-storage');
} else {
  storage = new SimpleFsStorageProvider(path.join(DATA_PATH, "bot.json")); // /storage/bot.json
}

const cryptoStore = MATRIX_ENCRYPTION ? new RustSdkCryptoStorageProvider(path.join(DATA_PATH, "encrypted")) : undefined; // /storage/encrypted

async function main() {
  if (!MATRIX_ACCESS_TOKEN){
    const botUsernameWithoutDomain = parseMatrixUsernamePretty(MATRIX_BOT_USERNAME);
    const authedClient = await (new MatrixAuth(MATRIX_HOMESERVER_URL)).passwordLogin(botUsernameWithoutDomain, MATRIX_BOT_PASSWORD);
    console.log(authedClient.homeserverUrl + " token: \n" + authedClient.accessToken)
    console.log("Set MATRIX_ACCESS_TOKEN to above token, MATRIX_BOT_PASSWORD can now be blank")
    return;
  }
  if (!MATRIX_THREADS && CHATGPT_CONTEXT !== "room") throw Error("You must set CHATGPT_CONTEXT to 'room' if you set MATRIX_THREADS to false")
  const client: MatrixClient = new MatrixClient(MATRIX_HOMESERVER_URL, MATRIX_ACCESS_TOKEN, storage, cryptoStore);

  const clientOptions = {  // (Optional) Parameters as described in https://platform.openai.com/docs/api-reference/completions
    modelOptions: {
      model: CHATGPT_MODEL,  // The model is set to text-chat-davinci-002-20221122 by default
    },
    // (Optional) Set custom instructions instead of "You are ChatGPT...".
    // promptPrefix: 'You are Bob, a cowboy in Western times...',
    // (Optional) Set a custom name for the user
    // userLabel: 'User',
    // (Optional) Set a custom name for ChatGPT
    // chatGptLabel: 'ChatGPT',
    // (Optional) Set to true to enable `console.debug()` logging
    debug: false,
  };
  const cacheOptions = {  // Options for the Keyv cache, see https://www.npmjs.com/package/keyv
    store: chatgptStore,
  };
  const chatgpt = new ChatGPTClient(OPENAI_API_KEY, clientOptions, cacheOptions);

  // Automatically join rooms the bot is invited to
  if (MATRIX_AUTOJOIN) AutojoinRoomsMixin.setupOnClient(client);

  client.on("room.failed_decryption", async (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error("index", `Failed decryption event!\n${{ roomId, event, error }}`);
    await client.sendText(roomId, `I couldn't decrypt the message :( Please add me to an unencrypted room.`);
  });

  client.on("room.join", async (roomId: string, _event: any) => {
    LogService.info("index", `Bot joined room ${roomId}`);
    await client.sendMessage(roomId, {
      "msgtype": "m.notice",
      "body": `👋 Hello, I'm ChatGPT bot! Matrix E2EE: ${MATRIX_ENCRYPTION}`,
    });
  });

  // Prepare the command handler
  const commands = new CommandHandler(client, chatgpt);
  await commands.start();

  LogService.info("index", `Starting bot using ChatGPT model: ${CHATGPT_MODEL}`);
  await client.start()
  LogService.info("index", "Bot started!");
}

main();
