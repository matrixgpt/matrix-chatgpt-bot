import OpenAI from 'openai';
import Markdown from 'markdown-it';
import { LogService, MatrixClient } from "matrix-bot-sdk";
import { MessageEvent, StoredConversation } from "./interfaces.js";
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
 * @param {boolean} thread reply as a thread
 * @param {boolean} rich should the plain text be rendered to html using markdown?
 */
export async function sendReply(client: MatrixClient, roomId: string, rootEventId: string, text: string, thread: boolean = false, rich:boolean = false): Promise<void> {

  const contentCommon = {
    body: text,
    msgtype: "m.text",
  }

  const contentThreadOnly = {
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
  const finalContent = thread ? { ...content, ...contentThreadOnly } : content

  await client.sendEvent(roomId, "m.room.message", finalContent);
}

/**
 * The OpenAI Assistance API queues tasks in runs. While these runs are running, we have to check if they already finished.
 * @param {OpenAI} client the open-ai client to be used
 * @param {string} runId the id of the current run to wait for
 * @param {string} threadId the id of the current thread we're using
 */
async function waitForRun(client: OpenAI, runId: string, threadId: string) {
  let run = await client.beta.threads.runs.retrieve(threadId, runId);
  if (run.status === "in_progress") {
    await new Promise((resolve) => setTimeout(resolve, 250));
    return waitForRun(client, runId, threadId);
  } else if (run.status !== "completed") {
    LogService.error(`Failed while getting the response from OpenAI API. Details: ${run}`);
    throw "Failed getting response from OpenAI";
  }
  return;
}

/**
 * Schedule a run in order to retrive a response from the API
 * @param {OpenAI} client the open-ai client to be used
 * @param {string} threadId the id of the current thread we're using
 * @param {OpenAI.Beta.Assistant} assistant the assistant to use
 */
export async function getResponse(client: OpenAI, threadId: string, assistant: OpenAI.Beta.Assistant) {
  // check if our response finished generating
  LogService.debug("Checking if our response finished generating...");
  let run = await client.beta.threads.runs.create(threadId, {assistant_id: assistant.id});
  await waitForRun(client, run.id, threadId);
  const message = await client.beta.threads.messages.list(threadId);
  LogService.debug(`Finished generating response and got message: ${message}`);
  return message;
}

/**
 * Send a question to the OpenAI API and get its reponse
 * @param {OpenAI} client the open-ai client to be used
 * @param {OpenAI.Beta.Assistant} assistant the assistant to use
 * @param {string} question the question to be asked
* @param {StoredConversation} storedConversation holds the threadId for context
 */
export async function sendChatGPTMessage(client: OpenAI, assistant: OpenAI.Beta.Assistant, question: string, storedConversation?: StoredConversation) {
  let threadId = "";
  if (storedConversation !== undefined) {
    // use existing threadId if we already have one
    threadId = storedConversation.threadId;
  } else {
    // if no threadId exists, create a new thread
    const thread = await client.beta.threads.create();
    threadId = thread.id;
  }
  // add our question to the current thread
  const message = await client.beta.threads.messages.create(threadId, {
    role: "user",
    content: question
  });
  const response = await getResponse(client, threadId, assistant);
  return response;
}

export function wrapPrompt(wrapped: string) {
  const currentDateString = new Date().toLocaleDateString('en-us', { year: 'numeric', month: 'long', day: 'numeric' },);
  return `<|im_sep|>${wrapped}\nCurrent date: ${currentDateString}<|im_sep|>\n\n`
}
