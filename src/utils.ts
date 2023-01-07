import { MatrixClient } from "matrix-bot-sdk";
import { MessageEvent } from "./interfaces.js";

export function parseMatrixUsernamePretty(matrix_username: string): string {
  if (matrix_username.includes(":") === false || matrix_username.includes("@") === false) {
    return matrix_username;
  }
  const withoutUrl = matrix_username.split(':')[0];
  return withoutUrl.split('@')[1]
}

export async function sendError(client: MatrixClient, text: string, roomId: string, eventId: string): Promise<void> {
  Promise.all([client.setTyping(roomId, false, 500), client.sendText(roomId, text), client.sendReadReceipt(roomId, eventId)]);
}

/**
 * Send a thread reply.
 * @param client Matrix client
 * @param param1 Object containing text, root_event_id and roomId. root_event_id is the event_id
 * of the message the thread "replying" to.
 */
export async function sendThreadReply(client: MatrixClient, text: string, roomId: string, root_event_id: string): Promise<void> {
  const content = {
    body: text,
    msgtype: "m.text",
    "org.matrix.msc1767.text": text,
    "m.relates_to": {
      event_id: root_event_id,
      is_falling_back: true,
      "m.in_reply_to": {
        "event_id": root_event_id
      },
      rel_type: "m.thread"
    }
  }
  await client.sendEvent(roomId, "m.room.message", content);
}
