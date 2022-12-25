import { ChatGPTAPIBrowser, ChatResponse } from "chatgpt";
import { MatrixClient } from "matrix-bot-sdk";
import { matrixBotUsername } from "./config.js";
import { isEventAMessage } from "./utils.js";

/**
 * Send a thread reply.
 * @param client Matrix client
 * @param param1 Object containing text, root_event_id and roomId. root_event_id is the event_id
 * of the message the thread "replying" to.
 */
 export async function sendThreadReply(client: MatrixClient, { text, root_event_id, roomId }: { text: string, root_event_id: string, roomId: string }): Promise<void> {
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
      const question: string = event.content.body;
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

      let chatGPTconversation: string[]
      if (event.content["m.relates_to"] !== undefined) {
        let storedValue = (client.storageProvider.readValue('gpt-' + event.content["m.relates_to"].event_id) as string)
        if (storedValue !== undefined){
          chatGPTconversation = storedValue.split(',')
        } else {
          console.log("Something went wrong with stored value, we couldn't split it ok.")
        }
      }

      let storageKey = event.event_id // store event.event_id if we start a new thread.
      console.log('Using event_id unless we find better.')
      if (event.content["m.relates_to"] !== undefined) {
        console.log('Using m.relates_to.event_id instead.')
        if (event.content["m.relates_to"].event_id !== undefined){
          storageKey = event.content["m.relates_to"].event_id // store m.relates_to.event_id if thread exists 
        }
      }
  
      let result: ChatResponse
      if (chatGPTconversation !== undefined) {
        result = await chatGPT.sendMessage(question, {
          timeoutMs: 2 * 60 * 1000,
          conversationId: chatGPTconversation[0],
          parentMessageId: chatGPTconversation[1]
        })
      } else {
        result = await chatGPT.sendMessage(question, {
          timeoutMs: 2 * 60 * 1000,
        })
      }

      try {
        await client.setTyping(roomId, false, 500)
        const sentMessage = await sendThreadReply(client, {text: `${result.response}`, roomId:roomId, root_event_id: storageKey})
        await client.sendReadReceipt(roomId, event.event_id);
        // TODO: check result actually has conversationId and messageId or else something has gone wrong.
        client.storageProvider.storeValue('gpt-' + storageKey, result.conversationId + ',' + result.messageId + ',' + Date.now())
      } catch (e) {
        await client.setTyping(roomId, false, 500)
        await client.sendText(roomId, `ChatGPT returned an error :(`);
        await client.sendReadReceipt(roomId, event.event_id);
        console.error("ChatGPT returned an error:");
        console.error(e);
      }
    }
  }
}
