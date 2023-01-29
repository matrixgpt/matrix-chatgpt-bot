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

```
cp .env.example .env
```

You must adjust the settings in the `.env` file according to your needs.

## Matrix
You need a Matrix account on Matrix.org (or any other server).

The bot outputs `MATRIX_ACCESS_TOKEN` to the console if it is not already set but `MATRIX_BOT_USERNAME` & `MATRIX_BOT_PASSWORD` are.

You must set `MATRIX_ACCESS_TOKEN` to use this token. Do not use it with any other client.

You no longer need `MATRIX_BOT_PASSWORD` set but you can leave it if you want.

## OpenAI / ChatGPT

You must read the [authentication instructions](https://www.npmjs.com/package/chatgpt#usage) for chatgpt-api if you get stuck.

Using the same account at [chat.openai.com](https://chat.openai.com) may refresh tokens invalidating the bot's session. 

Ensure your OpenAI account uses Google and set `OPENAI_LOGIN_TYPE` to `google`.

**If the Google account uses 2FA it will fail** but there is [a workaround](https://github.com/transitive-bullshit/chatgpt-api/issues/169#issuecomment-1362206780)

# Run

## with Docker

This is the recommended way to run this project. It will use the latest stable release.

```
docker run -it -v storage:/storage --env-file=./.env --name matrix-chatgpt-bot ghcr.io/matrixgpt/matrix-chatgpt-bot:latest
```

or to build locally from the latest unstable release (only do this if you have a good reason):

```
docker build . -t matrix-chatgpt-bot
docker run -it -v storage:/storage --env-file=./.env --name matrix-chatgpt-bot matrix-chatgpt-bot
```

Note: Without -it flags in the command above you won't be able to stop the container using Ctrl-C

You can also simply use a docker-compose file. Either with a self-build image (run `docker build . -t matrix-chatgpt-bot`) or the pre-build package from this repo.
```
  version: '3.7'
  services:
    matrix-chatgpt-bot:
      container_name: matrix-chatgpt-bot 
      image: matrix-chatgpt-bot # change to ghcr.io/matrixgpt/matrix-chatgpt-bot if you want to use the pre-build package
      volumes:
        - ./storage:/storage
      env_file: 
        - ./.env
````

## without Docker

It is strongly recommended you run this package under Docker.

- `yarn`
- `yarn build`
- `yarn start`

## in Development

You only need to do this if you want to contribute code to this package.

- Run `yarn`
- Run `yarn build`

# Reporting issues

You must report issues via Github if you want support. The chat room is for discussion not first line tech support.

# Discussion

Join [#matrix-chatgpt-bot:matrix.org](https://matrix.to/#/#matrix-chatgpt-bot:matrix.org) with any Matrix chat client or on the web!

If you've never set up a Matrix client before you can follow the prompts to get started.

Please use the search on Github and Matrix before asking for support. 


# Good to know

- The "storage"-folder contains all your encryption keys. If you delete it, you will loose access to all your encrypted messages.
- The bot will reply in a thread. If you want to keep the context you need to reply to this thread otherwise the bot will think its a new conversation. "Threads" are still an experimental feature so you would need to activate it in your clients settings (e.g. in Element in the "lab"-section).

# FAQ

## What do I do if a login fails?
- Its strongly suggested to use google as the prefererred login method to avoid being not abled to solve the required captchas
- Make sure that 2FA is deactivated (E.g. use the above mentioned workaroud or create a fresh google account

## How do I handle "[Error: decryption failed because the room key is missing]" 
Encryption works great with this package but can sometimes be a bit sensitive. Following steps can help to solve the "encryption" error

- Don't use a `MATRIX_ACCESS_TOKEN` extracted via Element-App, use the generated token from this package based on your `MATRIX_BOT_USERNAME` & `MATRIX_BOT_PASSWORD` set in the env-file. It will be visible in the console at start up. After adding it to your env-file you need to restart the bot.
- If all fails, you can always reset your key storage. It's important to exercise all of the following steps, because any remaining data could lead to the next encryption error. Once everything is working, make sure to not touch the "storage" folder anymore:
1. Stop the Bot
2. Delete the "storage" folder
3. Delete all user data of your matrix bot account (e.g. using Synapse-Admin)
4. Log into your bot account (e.g. via Element) and log out of all sessions
5. Verify your env-file and then run the bot setup again (e.g. via `docker-compose up` if you use docker-compose).

- If you experience this error after adding the bot to a new room but it was working before, you can try to use the command `/discardsession` in the element app to drop the session and trigger a new one. In this error case, the error only appears on a specific device, so using another client should work eitherway.

## What to do if I get an error saying I'm not logged in?
- If the bot can't log into your OpenAI account, your session token might not been valid anymore (e.g. you logged out of your OpenAI-Account through your Browser). Re-login to your OpenAI account using a machine in the same network as the machine your bot is using. Then restart the bot.

## I just want to chat with the bot and don't want to deal with encryption problems
- Set `MATRIX_ENCRYPTION=false` in your env-file and restart the bot. If it previously was running with encryption switched on, you need to create a new room with the bot as encryption can't be switched off once it was activated.


# License
GNU AGPLv3. See LICENSE
