Matrix ChatGPT Bot
==================

Talk to ChatGPT via your favourite Matrix client!

![Screenshot of Element iOS app showing conversation with bot](img/matrix-chatgpt.png)

A Matrix bot that uses [transitive-bullshit/chatgpt-api](https://github.com/transitive-bullshit/chatgpt-api) to access the unofficial ChatGPT API.

# Usage
1. Create a room
2. Add the bot
3. Start chatting away!

# Features
- Shows typing indicator as ChatGPT is thinking!
- Supports encryption
- Stores context for ChatGPT conversations

# Configure

## Bot

```
cp .env.example .env
```

You must adjust the settings in the `.env` file according to your needs. See below for help.

## Matrix
You need a Matrix account on Matrix.org (or any other server).

The bot outputs MATRIX_ACCESS_TOKEN to the console if it is not already set but MATRIX_BOT_USERNAME & MATRIX_BOT_PASSWORD are.

You must set MATRIX_ACCESS_TOKEN to use this token. Do not use it with any other client.

You no longer need to use the MATRIX_BOT_PASSWORD field but you can leave it set if you want.

## OpenAI / ChatGPT

You must read the [authentication instructions](https://www.npmjs.com/package/chatgpt#usage) for chatgpt-api if you get stuck.

Using the same account at [chat.openai.com](https://chat.openai.com) may refresh tokens invalidating the bot's session. 

Ensure your OpenAI account uses Google and set `OPENAI_LOGIN_TYPE` to `google`.

**If the Google account uses 2FA it will fail** but there is [a workaround](https://github.com/transitive-bullshit/chatgpt-api/issues/169#issuecomment-1362206780)

# Run

## with Docker

This is the recommended way to run this project.

```
docker build . -t matrix-chatgpt-bot
docker run -it -v storage:/storage --env-file=./.env --name matrix-chatgpt-bot matrix-chatgpt-bot
```

Note: Without -it flags in the command above you won't be able to stop the container using Ctrl-C

## without Docker

It is strongly recommended you run this package under Docker.

- `yarn`
- `yarn build`
- `yarn start`

## in Development

You only need to do this if you want to contribute code to this package.

- Run `yarn`
- Run `yarn build`

# Discussion

Join [#matrix-chatgpt-bot:matrix.org](https://matrix.to/#/#matrix-chatgpt-bot:matrix.org) with any Matrix chat client or on the web!

If you've never set up a Matrix client before you can follow the prompts to get started.

# License
GNU AGPLv3. See LICENSE
