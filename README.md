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

Create a copy of the example `.env` file

```
cp .env.example .env
```

You must adjust all required settings in the `.env` file according to your needs. Optional settings can also be adjusted later.

## Prerequsistes

### Matrix
- You need a Matrix account on Matrix.org (or any other server) for the bot user. 

Per default, whoever knows the name of your bot can add it to their rooms and start chatting. Access can be restricted by setting `MATRIX_BLACKLIST` or `MATRIX_WHISTLIST` in your `.env` file. When using a self-hosted setup, you could wildcard all your user by adding `MATRIX_WHITELIST=:anotherhomeserver.example` and change it to your homeserver address.

### OpenAI / ChatGPT
- You need to have an account at [openai.com. ](https://openai.com/). Create a [API Key](https://platform.openai.com/account/api-keys). Then, set `OPENAI_API_KEY` in your `.env` file

## Setup

At first run, the bot outputs `MATRIX_ACCESS_TOKEN` to the console if it is not already set but `MATRIX_BOT_USERNAME` & `MATRIX_BOT_PASSWORD` are.

You must set `MATRIX_ACCESS_TOKEN` to use this token. Do not use it with any other client. Also, do not use an access token extracted via Element. This can cause issues with encryption later on.

You no longer need `MATRIX_BOT_PASSWORD` set but you can leave it if you want.

# Run

There are multiple ways to run this bot. The easiest way is to run it within docker.

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

Note: In order to see the output of your console you need to run `docker logs matrix-chatgpt-bot`

## with Docker Compose

You can also simply use a docker-compose file. You only need to copy the content below and save it in a file named `docker-compose.yml`. Either with a self-build image (run `docker build . -t matrix-chatgpt-bot` from your local git repo location) or with the latest stable release as pre-build package from this repo, which is the **recommended** way. The script will look for the `.env` file in the same folder as the `docker-compose.yml`. The key storage folder `storage` will be created in the same folder as well. Adjust the locations to your needs.

```
  version: '3.7'
  services:
    matrix-chatgpt-bot:
      container_name: matrix-chatgpt-bot 
      image: ghcr.io/matrixgpt/matrix-chatgpt-bot:latest ## change to "matrix-chatgpt-bot" if you want to use your self-build image 
      volumes:
        - ./storage:/storage
      env_file: 
        - ./.env
````

## without Docker

**Important**: It is strongly recommended to run this package under Docker to not need to install various dependencies manually.
Nevertheless, you can also run it by using the package manager yarn (get it via `apt install -y yarn`). You might also need to have a newer version of Node.js and other missing packages. 

- `yarn`
- `yarn build`
- `yarn start`

## in Development

You only need to do this if you want to contribute code to this package.

- Run `yarn`
- Run `yarn build`


# Good to know

- The "storage"-folder contains all your encryption keys. If you delete it, you will loose access to all your encrypted messages.
- The bot replies in a thread. If you want to keep the context you need to reply to this thread or the bot will think its a new conversation. "Threads" were recently an experimental feature so you may need to activate it in your clients settings (e.g. in Element in the "lab"-section).
- There is support to set the context to work at the room level, the thread level or both (threads fork the conversation from the main room)

# FAQ

## How do I handle "[Error: decryption failed because the room key is missing]" 
Encryption works great with this package but can sometimes be a bit sensitive. Following steps can help to solve the "encryption" error

- Don't use a `MATRIX_ACCESS_TOKEN` extracted via Element-App, use the generated token from the bot based on your `MATRIX_BOT_USERNAME` & `MATRIX_BOT_PASSWORD` set in the `env`file. It will be visible in the console at start up if the `MATRIX_ACCESS_TOKEN` is not already set:
1) Remove the `MATRIX_ACCESS_TOKEN` from the `env` file and make sure `MATRIX_BOT_USERNAME` & `MATRIX_BOT_PASSWORD` are set
2) Re-run the bot
3) Copy the token from console output to your `env` file 
4) Restart the bot again.

- If all fails, you can always reset your key storage. It's important to exercise all of the following steps, because any remaining data could lead to the next encryption error. Once everything is working, make sure to not touch the "storage" folder anymore:
1) Stop the bot
2) Delete the "storage" folder
3) Delete all user data for the matrix bot account (e.g. use Synapse-Admin) or create a fresh bot user account (you can then skip step 4)
4) Log into your bot account (e.g. via Element) and log out of all sessions
5) Verify the correctness of your `env` file and then run the bot setup again (e.g. via `docker-compose up` if you use docker-compose).

- If you experience this error after adding the bot to a new room but it was working before, you can try to use the command `/discardsession` in the element app to drop the session and trigger a new one. In this error case, the error only appears on a specific device, so using another client should work eitherway.
bot is using. Then restart the bot.

## I just want to chat with the bot and don't want to deal with encryption problems
- Set `MATRIX_ENCRYPTION=false` in your env-file and restart the bot. If it previously was running with encryption switched on, you need to create a new room with the bot as encryption can't be switched off once it was activated.

## I'm getting a "{ errcode: 'M_NOT_FOUND', error: 'Event not found.' }" in my log files, do I need to worry?
- So far, its not known to cause issues, you can safely ignore it.

## What to do if I get a TimeoutError, e.g. "TimeoutError: Navigation timeout of 30000 ms exceeded"?
This can happen if your bot can't reach the openai server.

- Make sure that your machine can reach the internet (e.g. using curl: `curl -I www.google.com` should give you a useful output (not "Could not resolve host")
- When using docker, you first need to get inside the container via `docker exec -it matrix-chatgpt-bot bash` and get the curl package `apt-get update && apt install -y curl`). You can then run the command from within the container.
- Verify that you are using a google account and 2FA is **NOT** activated. 

## ChatGPT is at capacity right now?
There are multiple ways out there on what to do, so see this just as some ideas
- If you can't login via website, try clearing your browser cache by pressing "shift" and reload the OpenAI page https://chat.openai.com
- If your bot can't connect, just be a bit patient, it typically does not take long until it's back

## How do I know that the bot is running succesfully?
Once the bot has started succesfully, it will output the following information to your console. 
-  `[INFO] [index] Starting bot...`
-  `[INFO] [MatrixClientLite] End-to-end encryption enabled`  ## this depends on your setup
-  `[INFO] [index] Bot started!`

## I use Docker but I don't see an console output
You most likely need to view the logs by running `docker logs matrix-chatgpt-bot`


# Reporting issues

You must report issues via Github if you want support. The chat room is for discussion not first line tech support.

# Discussion

Join [#matrix-chatgpt-bot:matrix.org](https://matrix.to/#/#matrix-chatgpt-bot:matrix.org) with any Matrix chat client or on the web!

If you've never set up a Matrix client before you can follow the prompts to get started.

Please use the search on Github and Matrix before asking for support. 


# License
GNU AGPLv3. See LICENSE
