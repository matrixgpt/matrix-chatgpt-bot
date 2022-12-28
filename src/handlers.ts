import { ChatGPTAPIBrowser } from "chatgpt";
import { MatrixClient } from "matrix-bot-sdk";
import { matrixBotUsername, matrixPrefix } from "./config.js";
import { isEventAMessage } from "./utils.js";

/**
 * Run when *any* room event is received. The bot only sends a message if needed.
 * @param client 
 * @returns Room event handler, which itself returnings nothing
 */
export async function handleRoomEvent(client: MatrixClient, chatGPT: ChatGPTAPIBrowser): Promise<(roomId: string, event: any) => Promise<void>> {
  return async (roomId: string, event: any) => {
    if (event.sender === matrixBotUsername) {
      return;
    }
    if (Date.now() - event.origin_server_ts > 10000) {
      // Don't send notifications for old events if the bot shuts down for some reason.
      return;
    }

    if (isEventAMessage(event)) {
      let question: string;
      if (matrixPrefix){
        if (!event.content.body.startsWith(matrixPrefix)){
          return;
        }
        question = event.content.body.slice(matrixPrefix.length).trimStart();
      } else {
        question = event.content.body;
      }
      if (question === undefined) {
        await client.sendReadReceipt(roomId, event.event_id);
        await client.sendText(roomId,
          `Question is undefined. I don't currently support encrypted chats, maybe that's the issue?
Please add me to an unencrypted chat.`);
        await client.sendReadReceipt(roomId, event.event_id);
        return;
      }
      await client.sendReadReceipt(roomId, event.event_id);
      await client.setTyping(roomId, true, 10000)
      try {
        // timeout after 2 minutes (which will also abort the underlying HTTP request)
        const result = await chatGPT.sendMessage(question, {
          timeoutMs: 2 * 60 * 1000
        })
        await client.setTyping(roomId, false, 500)

        await client.sendText(roomId, `${result.response}`);
        await client.sendReadReceipt(roomId, event.event_id);
      } catch (e) {
        await client.setTyping(roomId, false, 500)
        await client.sendText(roomId, `ChatGPT returned an error :(`);
        await client.sendReadReceipt(roomId, event.event_id);
        console.error("ChatGPS returned an error:");
        console.error(e);
      }
    }
  }
}
