import { ChatGPTAPIBrowser, ChatResponse } from "chatgpt";
import Markdown from 'markdown-it';
import { MatrixClient } from "matrix-bot-sdk";
import { MessageEvent, StoredConversation } from "./interfaces.js";
import { CHATGPT_TIMEOUT } from "./env.js";

const md = Markdown();

export function parseMatrixUsernamePretty(matrix_username: string): string {
  if (matrix_username.includes(":") === false || matrix_username.includes("@") === false) {
    return matrix_username;
  }
  const withoutUrl = matrix_username.split(':')[0];
  return withoutUrl.split('@')[1]
}

export function isEventAMessage(event: any): event is MessageEvent {
  return event.type === 'm.room.message'
}

export async function sendError(client: MatrixClient, text: string, roomId: string, eventId: string): Promise<void> {
  Promise.all([client.setTyping(roomId, false, 500), client.sendText(roomId, text), client.sendReadReceipt(roomId, eventId)]);
}

/**
 * Send a thread reply.
 * @param {MatrixClient} client Matrix client
 * @param {string} roomId the room ID the event being replied to resides in
 * @param {string} rootEventId the root event of the thread
 * @param {string} text the plain text to reply with
 * @param {boolean} rich should the plain text be rendered to html using markdown?
 */
export async function sendThreadReply(client: MatrixClient, roomId: string, rootEventId: string, text: string, rich:boolean = false): Promise<void> {

  const contentCommon = {
    body: text,
    msgtype: "m.text",
    "m.relates_to": {
      event_id: rootEventId,
      is_falling_back: true,
      "m.in_reply_to": {
        "event_id": rootEventId
      },
      rel_type: "m.thread"
    }
  }

  const contentTextOnly = {
    "org.matrix.msc1767.text": text,
  }

  const renderedText = md.render(text)

  const contentRichOnly = {
    format: "org.matrix.custom.html",
    formatted_body: renderedText,
    "org.matrix.msc1767.message": [
      {
        "body": text,
        "mimetype": "text/plain"
      },
      {
        "body": renderedText,
        "mimetype": "text/html"
      }
    ]
  }

  const content = rich ? { ...contentCommon, ...contentRichOnly } : { ...contentCommon, ...contentTextOnly };

  await client.sendEvent(roomId, "m.room.message", content);
}

export async function sendChatGPTMessage(chatGPT: ChatGPTAPIBrowser, question: string, storedConversation: StoredConversation) {
  let result: ChatResponse
  if (storedConversation !== undefined) {
    result = await chatGPT.sendMessage(question, {
      timeoutMs: CHATGPT_TIMEOUT,
      conversationId: storedConversation.conversationId,
      parentMessageId: storedConversation.messageId
    });
  } else {
    result = await chatGPT.sendMessage(question, { timeoutMs: CHATGPT_TIMEOUT });
  }
  return result
}
