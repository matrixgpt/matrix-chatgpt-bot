import { ChatGPTAPIBrowser, ChatResponse } from "chatgpt";
import { MatrixClient } from "matrix-bot-sdk";
import { MATRIX_BOT_USERNAME, MATRIX_PREFIX } from "./env.js";
import { StoredConversation } from "./interfaces.js";
import { isEventAMessage, sendThreadReply } from "./utils.js";

/**
 * Run when *any* room event is received. The bot only sends a message if needed.
 * @param client 
 * @returns Room event handler, which itself returnings nothing
 */
export async function handleRoomEvent(client: MatrixClient, chatGPT: ChatGPTAPIBrowser): Promise<(roomId: string, event: any) => Promise<void>> {
  return async (roomId: string, event: any) => {
    if (event.sender === MATRIX_BOT_USERNAME) return; // The bot shouldn't reply to it's own messages.
    if (Date.now() - event.origin_server_ts > 10000) return; // Don't send notifications for old events from before run.
    if (isEventAMessage(event)) {
      if (!event.content.body.startsWith(MATRIX_PREFIX)) return;
      const question: string = event.content.body.slice(MATRIX_PREFIX.length).trimStart();
      if ((question === undefined) || !question) {
        await client.sendText(roomId,`Error with question: ` + question);
        await client.sendReadReceipt(roomId, event.event_id);
        return;
      }
      await Promise.all([client.sendReadReceipt(roomId, event.event_id), client.setTyping(roomId, true, 10000)]);
      const relatesTo = event.content["m.relates_to"]; // could be undefined
      const storageKey: string = (relatesTo !== undefined && relatesTo.event_id !== undefined) ? relatesTo.event_id : event.event_id;
      const storedValue: string = await client.storageProvider.readValue('gpt-' + storageKey)
      const storedConversation: StoredConversation = (storedValue !== undefined) ? JSON.parse(storedValue) : undefined;
      let result: ChatResponse
      if (storedConversation !== undefined) {
        result = await chatGPT.sendMessage(question, {timeoutMs: CHATGPT_TIMEOUT, conversationId: storedConversation.conversationId, parentMessageId: storedConversation.messageId});
      } else {
        result = await chatGPT.sendMessage(question, {timeoutMs: CHATGPT_TIMEOUT});
      }
      try {
        await client.setTyping(roomId, false, 500);
        await sendThreadReply(client, {text: `${result.response}`, roomId:roomId, root_event_id: storageKey});
        await client.sendReadReceipt(roomId, event.event_id);
        const dataToStore:StoredConversation = {
          conversationId: result.conversationId,
          messageId: result.messageId,
          config: ((storedConversation !== undefined && storedConversation.config !== undefined) ? storedConversation.config : {}),
        }
        await client.storageProvider.storeValue('gpt-' + storageKey, JSON.stringify(dataToStore));
      } catch (e) {
        await client.setTyping(roomId, false, 500);
        await client.sendText(roomId, `ChatGPT returned an error :(`);
        await client.sendReadReceipt(roomId, event.event_id);
        console.error("ChatGPT returned an error:");
        console.error(e);
      }
    }
  }
}
