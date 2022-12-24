import {
  MatrixAuth, MatrixClient, SimpleFsStorageProvider, AutojoinRoomsMixin,
  LogService, LogLevel,
  RichConsoleLogger,
  // RustSdkCryptoStorageProvider,
} from "matrix-bot-sdk";
import { openAiEmail, openAiPassword, isGoogleLogin, homeserverUrl, matrixBotPassword, matrixBotUsername } from './config.js'
import { parseMatrixUsernamePretty } from './utils.js';
import { handleRoomEvent } from './handlers.js';
import { ChatGPTAPIBrowser } from 'chatgpt'

LogService.setLogger(new RichConsoleLogger());

// Shows the Matrix sync loop details - not needed most of the time
// LogService.setLevel(LogLevel.DEBUG);

LogService.setLevel(LogLevel.INFO);

// LogService.muteModule("Metrics");
LogService.trace = LogService.debug;

const storage = new SimpleFsStorageProvider("./storage/bot.json");

// Still fails to decrypt sometimes
// const cryptoProvider = new RustSdkCryptoStorageProvider("./crypto/");

async function main() {
  const botUsernameWithoutDomain = parseMatrixUsernamePretty(matrixBotUsername);
  const authedClient = await (new MatrixAuth(homeserverUrl)).passwordLogin(botUsernameWithoutDomain, matrixBotPassword);
  const client = new MatrixClient(authedClient.homeserverUrl, authedClient.accessToken, storage);

  // use puppeteer to bypass cloudflare (headful because of captchas)  
  const chatGPT = new ChatGPTAPIBrowser({
    email: openAiEmail,
    password: openAiPassword,
    isGoogleLogin: isGoogleLogin
  })
  await chatGPT.initSession()

  // Automatically join rooms the bot is invited to
  AutojoinRoomsMixin.setupOnClient(client);

  client.on("room.failed_decryption", async (roomId, event, error) => {
    // handle `m.room.encrypted` event that could not be decrypted
    LogService.error("index", `Failed decryption event!\n${{ roomId, event, error }}`);
    await client.sendText(roomId, `I couldn't decrypt the message :( Please add me to an unencrypted room.`);
  });

  client.on("room.join", async (roomId: string, _event: any) => {
    LogService.info("index", `Bot joined room ${roomId}`);

    await client.sendMessage(roomId, {
      "msgtype": "m.notice",
      "body": `👋 Hello, I'm the ChatGPT bot! I only work in unencrypted rooms at the moment.`,
    });
  });

  client.on("room.event", await handleRoomEvent(client, chatGPT));

  LogService.info("index", "Starting bot...");
  await client.start()
  LogService.info("index", "Bot started!");
}

main();
