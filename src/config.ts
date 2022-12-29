import * as dotenv from 'dotenv';
// Support .env file
dotenv.config();

/**
 * How to get access token:
 * https://webapps.stackexchange.com/questions/131056/how-to-get-an-access-token-for-element-riot-matrix
 */
export const accessToken = process.env.MATRIX_ACCESS_TOKEN as string;
export const homeserverUrl = process.env.MATRIX_HOMESERVER_URL as string;

/** The full username: eg @bot:server.com */
export const matrixBotUsername = process.env.MATRIX_BOT_USERNAME as string;
export const matrixBotPassword = process.env.MATRIX_BOT_PASSWORD as string;
export const matrixAutojoin = process.env.MATRIX_AUTO_JOIN && process.env.MATRIX_AUTO_JOIN.toLowerCase() === "true" as string;
export const matrixEncryption = process.env.MATRIX_ENCRYPTION && process.env.MATRIX_ENCRYPTION.toLowerCase() === "true" as string;

export const dataPath = process.env.DATA_PATH as string;
export const matrixPrefix = process.env.MATRIX_PREFIX as string;

/** ChatGPT specific stuff */
export const openAiEmail = process.env.OPENAI_EMAIL as string;
export const openAiPassword = process.env.OPENAI_PASSWORD as string;
export const isGoogleLogin = process.env.IS_GOOGLE_LOGIN && process.env.IS_GOOGLE_LOGIN.toLowerCase() === "true" as string;

if(dataPath === undefined) {
  console.error("DATA_PATH env variable is undefined");
  process.exit(1);
}
if(homeserverUrl === undefined) {
  console.error("MATRIX_HOMESERVER_URL env variable is undefined");
  process.exit(1);
}
if(accessToken === undefined) {
  console.error("MATRIX_ACCESS_TOKEN env variable is undefined, set it to empty string to use username and password");
  process.exit(1);
  if(matrixBotUsername === undefined) {
    console.error("MATRIX_BOT_USERNAME env variable is undefined, set it to empty string to use access token");
    process.exit(1);
  }
  if(matrixBotPassword === undefined) {
    console.error("MATRIX_BOT_PASSWORD env variable is undefined, set it to empty string to use access token");
    process.exit(1);
  }
}
if(matrixAutojoin === undefined) {
  console.error("MATRIX_AUTO_JOIN env variable is undefined");
  process.exit(1);
}
if(matrixEncryption === undefined) {
  console.error("MATRIX_ENCRYPTION env variable is undefined");
  process.exit(1);
}
if(matrixPrefix === undefined) {
  console.error("MATRIX_PREFIX env variable is undefined");
  process.exit(1);
}
if(openAiEmail === undefined) {
  console.error("OPENAI_EMAIL env variable is undefined");
  process.exit(1);
}
if(openAiPassword === undefined) {
  console.error("OPENAI_PASSWORD env variable is undefined");
  process.exit(1);
}
if(isGoogleLogin === undefined) {
  console.error("IS_GOOGLE_LOGIN env variable is undefined");
  process.exit(1);
}
