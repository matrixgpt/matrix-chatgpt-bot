import { ChatGPTAPIBrowser, ChatResponse } from "chatgpt";
import { LogService, MatrixClient, UserID } from "matrix-bot-sdk";
import { CHATGPT_TIMEOUT, MATRIX_DEFAULT_PREFIX_REPLY, MATRIX_DEFAULT_PREFIX} from "./env.js";
import { RelatesTo, StoredConversation, StoredConversationConfig } from "./interfaces.js";
import { sendError, sendThreadReply } from "./utils.js";

export default class CommandHandler {

  // Variables so we can cache the bot's display name and ID for command matching later.
  private displayName: string;
  private userId: string;
  private localpart: string;

  constructor(private client: MatrixClient, private chatGPT:ChatGPTAPIBrowser) {}

  public async start() {
    await this.prepareProfile();  // Populate the variables above (async)
    this.client.on("room.message", this.onMessage.bind(this)); // Set up the event handler
  }

  private async prepareProfile() {
    this.userId = await this.client.getUserId();
    this.localpart = new UserID(this.userId).localpart;
    try {
        const profile = await this.client.getUserProfile(this.userId);
        if (profile && profile['displayname']) this.displayName = profile['displayname'];
    } catch (e) {
        // Non-fatal error - we'll just log it and move on.
        LogService.warn("CommandHandler", e);
    }
  }

  /**
   * Run when `message` room event is received. The bot only sends a message if needed.
   * @returns Room event handler, which itself returnings nothing
   */
  private async onMessage(roomId: string, event: any) {
    try {
      if (event.sender === this.userId) return;                                         // Ignore ourselves
      if (Date.now() - event.origin_server_ts > 10000) return;                          // Ignore old messages
      const relatesTo: RelatesTo | undefined = event.content["m.relates_to"];
      if ((relatesTo !== undefined) && (relatesTo["rel_type"] === "m.replace")) return; // Ignore edits

      const rootEventId: string = (relatesTo !== undefined && relatesTo.event_id !== undefined) ? relatesTo.event_id : event.event_id;
      const storedValue: string = await this.client.storageProvider.readValue('gpt-' + rootEventId)
      const storedConversation: StoredConversation = (storedValue !== undefined) ? JSON.parse(storedValue) : undefined;
      const config: StoredConversationConfig = (storedConversation !== undefined && storedConversation.config !== undefined) ? storedConversation.config : {};
      const MATRIX_PREFIX: string = (config.MATRIX_PREFIX === undefined) ? MATRIX_DEFAULT_PREFIX : config.MATRIX_PREFIX
      const MATRIX_PREFIX_REPLY:boolean = (config.MATRIX_PREFIX_REPLY === undefined) ? MATRIX_DEFAULT_PREFIX_REPLY : config.MATRIX_PREFIX_REPLY

      const shouldBePrefixed: boolean = ((MATRIX_PREFIX) && (relatesTo === undefined)) || (MATRIX_PREFIX_REPLY && (relatesTo !== undefined));
      const prefixes = [MATRIX_PREFIX, `${this.localpart}:`, `${this.displayName}:`, `${this.userId}:`];
      const prefixUsed = prefixes.find(p => event.content.body.startsWith(p));
      if (shouldBePrefixed && !prefixUsed) return;                                      // Ignore without prefix if prefixed
      await Promise.all([this.client.sendReadReceipt(roomId, event.event_id), this.client.setTyping(roomId, true, 10000)]);

      const trimLength: number = shouldBePrefixed ? prefixUsed.length : 0
      const question: string = event.content.body.slice(trimLength).trimStart();

      if ((question === undefined) || !question) {
        await sendError(this.client, "Error with question: " + question, roomId, event.event_id);
        return;
      }

      let result: ChatResponse
      if (storedConversation !== undefined) {
        result = await this.chatGPT.sendMessage(question, {
          timeoutMs: CHATGPT_TIMEOUT,
          conversationId: storedConversation.conversationId,
          parentMessageId: storedConversation.messageId
        });
      } else {
        result = await this.chatGPT.sendMessage(question, {timeoutMs: CHATGPT_TIMEOUT});
      }

      await Promise.all([this.client.setTyping(roomId, false, 500), sendThreadReply(this.client, `${result.response}`, roomId, rootEventId)]);

      await this.client.storageProvider.storeValue('gpt-' + rootEventId, JSON.stringify({
        conversationId: result.conversationId,
        messageId: result.messageId,
        config: ((storedConversation !== undefined && storedConversation.config !== undefined) ? storedConversation.config : {}),  
      }));
    } catch (e) {
      console.error(e);
      await sendError(this.client, "Bot error, terminating.", roomId, event.event_id);
    }
  }
}
