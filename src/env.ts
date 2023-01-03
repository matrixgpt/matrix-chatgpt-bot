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
  MATRIX_THREADS,
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX,
  MATRIX_DEFAULT_PREFIX_REPLY,
  MATRIX_DEFAULT_REQUIRE_MENTION,
  MATRIX_DEFAULT_REQUIRE_MENTION_IN_DM,
  MATRIX_DEFAULT_REQUIRE_MENTION_IN_REPLY,
  /** ChatGPT Settings */
  OPENAI_EMAIL,
  OPENAI_PASSWORD,
  OPENAI_LOGIN_TYPE,
  CHATGPT_TIMEOUT
} = parseEnv(process.env, {
  DATA_PATH: {schema: z.string().default("./storage"),    description: "Set to /storage/ if using docker, ./storage if running without"},
  /** Matrix Bot Settings */
  MATRIX_HOMESERVER_URL: {schema: z.string().default("https://matrix.org")},
  MATRIX_ACCESS_TOKEN:   {schema: z.string().optional(),  description: "Set MATRIX_BOT_USERNAME & MATRIX_BOT_PASSWORD to print ACCESS_TOKEN or follow https://webapps.stackexchange.com/questions/131056/how-to-get-an-access-token-for-element-riot-matrix"},
  MATRIX_BOT_USERNAME:   {schema: z.string().min(3),      description: "Set full username: eg @bot:server.com"},
  MATRIX_BOT_PASSWORD:   {schema: z.string().optional(),  description: "Set AccessToken which supersedes MATRIX_BOT_PASSWORD"},
  /** Matrix Bot Features */
  MATRIX_AUTOJOIN:                          {schema: z.boolean().default(true)},
  MATRIX_ENCRYPTION:                        {schema: z.boolean().default(true)},
  MATRIX_THREADS:                           {schema: z.boolean().default(true)},
  /** Matrix Bot Runtime Config */
  MATRIX_DEFAULT_PREFIX: {schema: z.string().default(""), description: "Set this to empty string if you don't want to use it. Trailing space matters."},
  MATRIX_DEFAULT_PREFIX_REPLY:              {schema: z.boolean().default(false)},
  MATRIX_DEFAULT_REQUIRE_MENTION:           {schema: z.boolean().default(false)},
  MATRIX_DEFAULT_REQUIRE_MENTION_IN_DM:     {schema: z.boolean().default(false)},
  MATRIX_DEFAULT_REQUIRE_MENTION_IN_REPLY:  {schema: z.boolean().default(false)},
  /** ChatGPT Settings */
  OPENAI_EMAIL: {schema:      z.string().min(3)},
  OPENAI_PASSWORD: {schema:   z.string().min(1)},
  OPENAI_LOGIN_TYPE: {schema: z.enum(["google", "openai", "microsoft"]).default("google")},
  CHATGPT_TIMEOUT: {schema:   z.number().default(2 * 60 * 1000)}
});
