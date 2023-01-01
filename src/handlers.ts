import { ChatGPTAPIBrowser, ChatResponse } from "chatgpt";
import { MatrixClient } from "matrix-bot-sdk";
import { CHATGPT_TIMEOUT, MATRIX_BOT_USERNAME, MATRIX_DEFAULT_PREFIX_REPLY, MATRIX_DEFAULT_PREFIX} from "./env.js";
import { RelatesTo, StoredConversation } from "./interfaces.js";
import { isEventAMessage, sendError, sendThreadReply } from "./utils.js";

/**
 * Run when *any* room event is received. The bot only sends a message if needed.
 * @param client 
 * @returns Room event handler, which itself returnings nothing
 */
export async function handleRoomEvent(client: MatrixClient, chatGPT: ChatGPTAPIBrowser): Promise<(roomId: string, event: any) => Promise<void>> {
  return async (roomId: string, event: any) => {
    if (isEventAMessage(event)) {
      try {
        const relatesTo: RelatesTo | undefined = event.content["m.relates_to"];
        const rootEventId: string = (relatesTo !== undefined && relatesTo.event_id !== undefined) ? relatesTo.event_id : event.event_id;
        const storedValue: string = await client.storageProvider.readValue('gpt-' + rootEventId)
        const storedConversation: StoredConversation = (storedValue !== undefined) ? JSON.parse(storedValue) : undefined;
        const config = (storedConversation !== undefined && storedConversation.config !== undefined) ? storedConversation.config : undefined;

        const MATRIX_PREFIX_REPLY = (config === undefined) ? MATRIX_DEFAULT_PREFIX_REPLY : config.MATRIX_PREFIX_REPLY
        const shouldBePrefixed: boolean = ((Boolean(MATRIX_DEFAULT_PREFIX)) && (MATRIX_PREFIX_REPLY || (relatesTo === undefined)));

        if (event.sender === MATRIX_BOT_USERNAME) return;                                       // Don't reply to ourself
        if (Date.now() - event.origin_server_ts > 10000) return;                                // Don't reply to old messages
        if (shouldBePrefixed && !event.content.body.startsWith(MATRIX_DEFAULT_PREFIX)) return;  // Don't reply without prefix if prefixed

        await Promise.all([client.sendReadReceipt(roomId, event.event_id), client.setTyping(roomId, true, 10000)]);
        
        const trimLength: number = shouldBePrefixed ? MATRIX_DEFAULT_PREFIX.length : 0
        const question: string = event.content.body.slice(trimLength).trimStart();
        if ((question === undefined) || !question) {
          await sendError(client, "Error with question: " + question, roomId, event.event_id);
          return;
        }

        let result: ChatResponse
        if (storedConversation !== undefined) {
          result = await chatGPT.sendMessage(question, {
            timeoutMs: CHATGPT_TIMEOUT,
            conversationId: storedConversation.conversationId,
            parentMessageId: storedConversation.messageId
          });
        } else {
          result = await chatGPT.sendMessage(question, {timeoutMs: CHATGPT_TIMEOUT});
        }

        await Promise.all([client.setTyping(roomId, false, 500), sendThreadReply(client, `${result.response}`, roomId, rootEventId)]);

        await client.storageProvider.storeValue('gpt-' + rootEventId, JSON.stringify({
          conversationId: result.conversationId,
          messageId: result.messageId,
          config: ((storedConversation !== undefined && storedConversation.config !== undefined) ? storedConversation.config : {}),  
        }));
      } catch (e) {
        console.error(e);
        await sendError(client, "Bot error, terminating.", roomId, event.event_id);
      }
    }
  }
}
