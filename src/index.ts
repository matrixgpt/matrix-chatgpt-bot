import {
  MatrixAuth, MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin,
  LogService, LogLevel,
  RichConsoleLogger,
  ICryptoStorageProvider,
  RustSdkCryptoStorageProvider,
} from "matrix-bot-sdk";

import * as path from "path";
import { DATA_PATH, OPENAI_EMAIL, OPENAI_PASSWORD, OPENAI_LOGIN_TYPE, OPENAI_PRO, MATRIX_HOMESERVER_URL, MATRIX_ACCESS_TOKEN, MATRIX_AUTOJOIN, MATRIX_BOT_PASSWORD, MATRIX_BOT_USERNAME, MATRIX_ENCRYPTION, MATRIX_THREADS, CHATGPT_CONTEXT } from './env.js'
import { parseMatrixUsernamePretty } from './utils.js';
import CommandHandler from "./handlers.js"
import { ChatGPTAPIBrowser } from 'chatgpt'

LogService.setLogger(new RichConsoleLogger());

// Shows the Matrix sync loop details - not needed most of the time
// LogService.setLevel(LogLevel.DEBUG);

LogService.setLevel(LogLevel.INFO);

// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;

const storage = new SimpleFsStorageProvider(path.join(DATA_PATH, "bot.json")); // /storage/bot.json

// Prepare a crypto store if we need that
let cryptoStore: ICryptoStorageProvider;
if (MATRIX_ENCRYPTION) {
  cryptoStore = new RustSdkCryptoStorageProvider(path.join(DATA_PATH, "encrypted")); // /storage/encrypted
}

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

  // use puppeteer to bypass cloudflare (headful because of captchas)  
  const chatGPT: ChatGPTAPIBrowser = new ChatGPTAPIBrowser({
    email: OPENAI_EMAIL,
    password: OPENAI_PASSWORD,
    isGoogleLogin: (OPENAI_LOGIN_TYPE == "google"), 
    isMicrosoftLogin: (OPENAI_LOGIN_TYPE == "microsoft"),
    isProAccount: OPENAI_PRO
  })

  chatGPT.initSession().then(() => {
    LogService.info('ChatGPT session initialized');
  });

  // call `api.refreshSession()` every hour to refresh the session
  setInterval(() => {
    chatGPT.refreshSession().then(() => {
      LogService.info('ChatGPT session reset');
    });
  }, 60 * 60 * 1000);

  // call `api.resetSession()` every 24 hours to reset the session
  setInterval(() => {
    chatGPT.resetSession().then(() => {
      LogService.info('ChatGPT session reset');
    });
  }, 24 * 60 * 60 * 1000);

  // Automatically join rooms the bot is invited to
  if (MATRIX_AUTOJOIN) {
    AutojoinRoomsMixin.setupOnClient(client);
  }

  client.on("room.failed_decryption", async (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error("index", `Failed decryption event!\n${{ roomId, event, error }}`);
    await client.sendText(roomId, `I couldn't decrypt the message :( Please add me to an unencrypted room.`);
  });

  client.on("room.join", async (roomId: string, _event: any) => {
    LogService.info("index", `Bot joined room ${roomId}`);
    await client.sendMessage(roomId, {
      "msgtype": "m.notice",
      "body": `👋 Hello, I'm the ChatGPT bot! Encrypted message support: ${MATRIX_ENCRYPTION}`,
    });
  });

  // Prepare the command handler
  const commands = new CommandHandler(client, chatGPT);
  await commands.start();

  LogService.info("index", "Starting bot...");
  await client.start()
  LogService.info("index", "Bot started!");
}

main();
