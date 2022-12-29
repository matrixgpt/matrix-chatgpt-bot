import {
  MatrixAuth, MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin,
  LogService, LogLevel,
  RichConsoleLogger,
  ICryptoStorageProvider,
  RustSdkCryptoStorageProvider,
} from "matrix-bot-sdk";

import * as path from "path";
import { dataPath, openAiEmail, openAiPassword, isGoogleLogin, homeserverUrl, accessToken, matrixAutojoin, matrixBotPassword, matrixBotUsername, matrixEncryption } from './config.js'
import { parseMatrixUsernamePretty } from './utils.js';
import { handleRoomEvent } from './handlers.js';
import { ChatGPTAPIBrowser } from 'chatgpt'

LogService.setLogger(new RichConsoleLogger());

// Shows the Matrix sync loop details - not needed most of the time
// LogService.setLevel(LogLevel.DEBUG);

LogService.setLevel(LogLevel.INFO);

// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;

const storage = new SimpleFsStorageProvider(path.join(dataPath, "bot.json")); // /storage/bot.json

// Prepare a crypto store if we need that
let cryptoStore: ICryptoStorageProvider;
if (matrixEncryption) {
  cryptoStore = new RustSdkCryptoStorageProvider(path.join(dataPath, "encrypted")); // /storage/encrypted
}

async function main() {
  const botUsernameWithoutDomain = parseMatrixUsernamePretty(matrixBotUsername);
  if (!accessToken){
    const authedClient = await (new MatrixAuth(homeserverUrl)).passwordLogin(botUsernameWithoutDomain, matrixBotPassword);
    console.log(authedClient.homeserverUrl + " token: \n" + authedClient.accessToken)
    console.log("Set MATRIX_ACCESS_TOKEN to above token, MATRIX_ACCESS_USERNAME and MATRIX_ACCESS_PASSWORD can now be blank")
    return;
  }
  const client = new MatrixClient(homeserverUrl, accessToken, storage, cryptoStore);

  // use puppeteer to bypass cloudflare (headful because of captchas)  
  const chatGPT = new ChatGPTAPIBrowser({
    email: openAiEmail,
    password: openAiPassword,
    isGoogleLogin: isGoogleLogin
  })
  await chatGPT.initSession()

  // Automatically join rooms the bot is invited to
  if (matrixAutojoin) {
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
      "body": `👋 Hello, I'm the ChatGPT bot! Encrypted message support: ${ matrixEncryption }`,
    });
  });

  client.on("room.event", await handleRoomEvent(client, chatGPT));

  LogService.info("index", "Starting bot...");
  await client.start()
  LogService.info("index", "Bot started!");
}

main();
