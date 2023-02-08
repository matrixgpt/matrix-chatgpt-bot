import { parseEnv } from "znv";
import { z } from "zod";
import * as dotenv from 'dotenv';
dotenv.config();

export const {
  DATA_PATH,
  KEYV_BACKEND,
  KEYV_URL,
  KEYV_BOT_STORAGE,
  /** Matrix Bot Settings */
  MATRIX_HOMESERVER_URL,
  MATRIX_ACCESS_TOKEN,
  MATRIX_BOT_USERNAME,
  MATRIX_BOT_PASSWORD,
  /** Matrix Bot Features */
  MATRIX_AUTOJOIN,
  MATRIX_ENCRYPTION,
  MATRIX_THREADS,
  MATRIX_PREFIX_DM,
  MATRIX_RICH_TEXT,
  /** Matrix Access Control */
  MATRIX_BLACKLIST,
  MATRIX_WHITELIST,
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX,
  MATRIX_DEFAULT_PREFIX_REPLY,
  /** ChatGPT Settings */
  OPENAI_API_KEY,
  CHATGPT_CONTEXT,
  CHATGPT_TIMEOUT,
  CHATGPT_MODEL,
  CHATGPT_PROMPT_PREFIX,
  CHATGPT_IGNORE_MEDIA,
} = parseEnv(process.env, {
  DATA_PATH:                   { schema: z.string().default("./storage"),          description: "Set to /storage/ if using docker, ./storage if running without" },
  KEYV_BACKEND:                { schema: z.enum(["file", "other"]).default("file"),description: "Set the Keyv backend to 'file' or 'other' if other set KEYV_URL" },
  KEYV_URL:                    { schema: z.string().default(""),                   description: "Set Keyv backend for storage, in-memory if blank, ignored if KEYV_BACKEND set to `file`"},
  KEYV_BOT_STORAGE:            { schema: z.boolean().default(false),               description: "Set to true to use a Keyv backend to store bot data. Uses a file if false."},
  /** Matrix Bot Settings */
  MATRIX_HOMESERVER_URL:       { schema: z.string().default("https://matrix.org"), description: "Set matrix homeserver with 'https://' prefix" },
  MATRIX_ACCESS_TOKEN:         { schema: z.string().optional(),                    description: "Set MATRIX_BOT_USERNAME & MATRIX_BOT_PASSWORD to print MATRIX_ACCESS_TOKEN or follow https://webapps.stackexchange.com/questions/131056/how-to-get-an-access-token-for-element-riot-matrix" },
  MATRIX_BOT_USERNAME:         { schema: z.string().optional(),                    description: "Set full username: eg @bot:server.com (superseded by MATRIX_ACCESS_TOKEN if set)" },
  MATRIX_BOT_PASSWORD:         { schema: z.string().optional(),                    description: "Set password (superseded by MATRIX_ACCESS_TOKEN if set)" },
  /** Matrix Bot Features */
  MATRIX_AUTOJOIN:             { schema: z.boolean().default(true),                description: "Set to true if you want the bot to autojoin when invited" },
  MATRIX_ENCRYPTION:           { schema: z.boolean().default(true),                description: "Set to true if you want the bot to support encrypted channels" },
  MATRIX_THREADS:              { schema: z.boolean().default(true),                description: "Set to true if you want the bot to answer always in a new thread/conversation" },
  MATRIX_PREFIX_DM:            { schema: z.boolean().default(false),               description: "Set to false if you want the bot to answer to all messages in a one-to-one room" },
  MATRIX_RICH_TEXT:            { schema: z.boolean().default(true),                description: "Set to true if you want the bot to answer with enriched text" },
  /** Matrix Access Control */
  MATRIX_BLACKLIST:            { schema: z.string().optional(),                    description: "Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to blacklist users or domains" },
  MATRIX_WHITELIST:            { schema: z.string().optional(),                    description: "Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to whitelist users or domains" },
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX:       { schema: z.string().default(""),                   description: "Set to a string if you want the bot to respond only when messages start with this prefix. Trailing space matters. Empty for no prefix." },
  MATRIX_DEFAULT_PREFIX_REPLY: { schema: z.boolean().default(false),               description: "Set to false if you want the bot to answer to all messages in a thread/conversation" },
  /** ChatGPT Settings */
  OPENAI_API_KEY:              { schema: z.string().default(""),                   description: "Set to the API key from https://platform.openai.com/account/api-keys"},
  CHATGPT_TIMEOUT:             { schema: z.number().default(2 * 60 * 1000),        description: "Set number of milliseconds to wait for ChatGPT responses" },
  CHATGPT_CONTEXT:             { schema: z.enum(["thread", "room", "both"]).default("thread"), description: "Set the ChatGPT conversation context to 'thread', 'room' or 'both'" },
  CHATGPT_MODEL:               { schema: z.string().default("text-chat-davinci-002-20221122"), description: "The model for the ChatGPT-API to use" },
  CHATGPT_PROMPT_PREFIX:       { schema: z.string().default('Instructions:\nYou are ChatGPT, a large language model trained by OpenAI.'), description: "Instructions to feed to ChatGPT on startup"},
  CHATGPT_IGNORE_MEDIA:        { schema: z.boolean().default(false),               description: "Wether or not the bot should react to non-text messages"},
});
