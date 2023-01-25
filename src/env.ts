import { parseEnv } from "znv";
import { z } from "zod";
import * as dotenv from 'dotenv';
dotenv.config();

export const {
  DATA_PATH,
  /** Matrix Bot Settings */
  MATRIX_HOMESERVER_URL,
  MATRIX_ACCESS_TOKEN,
  MATRIX_BOT_USERNAME,
  MATRIX_BOT_PASSWORD,
  /** Matrix Bot Features */
  MATRIX_AUTOJOIN,
  MATRIX_ENCRYPTION,
  MATRIX_PREFIX_DM,
  MATRIX_RICH_TEXT,
  /** Matrix Access Control */
  MATRIX_BLACKLIST,
  MATRIX_WHITELIST,
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX,
  MATRIX_DEFAULT_PREFIX_REPLY,
  /** ChatGPT Settings */
  OPENAI_EMAIL,
  OPENAI_PASSWORD,
  OPENAI_LOGIN_TYPE,
  OPENAI_PRO,
  CHATGPT_TIMEOUT
} = parseEnv(process.env, {
  DATA_PATH:                   { schema: z.string().default("./storage"),          description: "Set to /storage/ if using docker, ./storage if running without" },
  /** Matrix Bot Settings */
  MATRIX_HOMESERVER_URL:       { schema: z.string().default("https://matrix.org"), description: "Set matrix homeserver with 'https://' prefix" },
  MATRIX_ACCESS_TOKEN:         { schema: z.string().optional(),                    description: "Set MATRIX_BOT_USERNAME & MATRIX_BOT_PASSWORD to print MATRIX_ACCESS_TOKEN or follow https://webapps.stackexchange.com/questions/131056/how-to-get-an-access-token-for-element-riot-matrix" },
  MATRIX_BOT_USERNAME:         { schema: z.string().optional(),                    description: "Set full username: eg @bot:server.com (superseded by MATRIX_ACCESS_TOKEN if set)" },
  MATRIX_BOT_PASSWORD:         { schema: z.string().optional(),                    description: "Set password (superseded by MATRIX_ACCESS_TOKEN if set)" },
  /** Matrix Bot Features */
  MATRIX_AUTOJOIN:             { schema: z.boolean().default(true),                description: "Set to true if you want the bot to autojoin when invited" },
  MATRIX_ENCRYPTION:           { schema: z.boolean().default(true),                description: "Set to true if you want the bot to support encrypted channels" },
  MATRIX_PREFIX_DM:            { schema: z.boolean().default(false),               description: "Set to false if you want the bot to answer to all messages in a one-to-one room" },
  MATRIX_RICH_TEXT:            { schema: z.boolean().default(true),                description: "Set to true if you want the bot to answer with enriched text" },
  /** Matrix Access Control */
  MATRIX_BLACKLIST:            { schema: z.string().optional(),                    description: "Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to blacklist users or domains" },
  MATRIX_WHITELIST:            { schema: z.string().optional(),                    description: "Set to a spaces separated string of 'user:homeserver' or a wildcard like ':anotherhomeserver.example' to whitelist users or domains" },
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX:       { schema: z.string().default(""),                   description: "Set to a string if you want the bot to respond only when messages start with this prefix. Trailing space matters. Empty for no prefix." },
  MATRIX_DEFAULT_PREFIX_REPLY: { schema: z.boolean().default(false),               description: "Set to false if you want the bot to answer to all messages in a thread/conversation" },
  /** ChatGPT Settings */
  OPENAI_EMAIL:                { schema: z.string().min(3),                        description: "Set full username of OpenAI's account" },
  OPENAI_PASSWORD:             { schema: z.string().min(1),                        description: "Set password of OpenAI's account" },
  OPENAI_LOGIN_TYPE:           { schema: z.enum(["google", "openai", "microsoft"]).default("google"), description: "Set authentication provider to 'google', 'openai' or 'microsoft'" },
  OPENAI_PRO:                  { schema: z.boolean().default(false),               description: "Set to true if you have a paid ChatGPT subscription." },
  CHATGPT_TIMEOUT:             { schema: z.number().default(2 * 60 * 1000),        description: "Set number of milliseconds to wait for CHATGPT responses" }
});
