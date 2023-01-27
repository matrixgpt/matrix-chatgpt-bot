Matrix ChatGPT Bot
==================

Talk to ChatGPT via your favourite Matrix client!

![Screenshot of Element iOS app showing conversation with bot](img/matrix-chatgpt.png)

This is an unofficial Matrix bot that uses https://github.com/transitive-bullshit/chatgpt-api to access the unofficial ChatGPT API.

It is worth reading the [authentication instructions](https://www.npmjs.com/package/chatgpt#usage) for the unofficial ChatGPT API.

Your user-agent and IP address must match from the real browser window you're logged in with to the one you're using for ChatGPTAPI. This means that you currently can't log in with your laptop and then run the bot on a server or proxy somewhere.

Cloudflare will still sometimes ask you to complete a CAPTCHA, so you may need to keep an eye on it and manually resolve the CAPTCHA.

You should not be using this ChatGPT account while the bot is using it, because that browser window may refresh one of your tokens and invalidate the bot's session. 

If your OpenAI account uses Google Auth, you shouldn't encounter any of the more complicated Recaptchas — and can avoid using paid third-party CAPTCHA solving providers. To use Google auth, make sure your OpenAI account is using Google and then set `OPENAI_LOGIN_TYPE` to `google`. You should also note that if your Google account uses 2FA it will not work but there is a workaround detailed [here](https://github.com/transitive-bullshit/chatgpt-api/issues/169#issuecomment-1362206780)

To get an access token you can provide MATRIX_USERNAME and MATRIX_PASSWORD whilst leaving MATRIX_ACCESS_TOKEN blank. This will print a token to the screen. You can then add this token to the MATRIX_ACCESS_TOKEN field.

# Usage
- Create an (encrypted if enabled) room
- Add the bot
- Start chatting away!

# Features
- Shows typing indicator as ChatGPT is thinking!
- Supports encryption

# Setting up the account
- Create a new Matrix account on Matrix.org (or your favourite server)
- Go to the settings and get the access token
- Add the details to your environment vars. One way of doing this is adding this to a file called `.env`:
```
# ChatGPT Settings (required)
OPENAI_EMAIL=
OPENAI_PASSWORD=
# What type of Login it is, possibility's are google, openai, microsoft
OPENAI_LOGIN_TYPE=google
# Set the next line to true if you are using a ChatGPT pro account.
OPENAI_PRO=false

# Set the ChatGPT conversation context to 'thread', 'room' or 'both'.
CHATGPT_CONTEXT=thread

# Matrix Static Settings (required, see notes)
# Defaults to "https://matrix.org"
MATRIX_HOMESERVER_URL=
# With the @ and :DOMAIN, ie @SOMETHING:DOMAIN - Not used if `MATRIX_ACCESS_TOKEN` is set.
MATRIX_BOT_USERNAME=
# Set `MATRIX_BOT_PASSWORD` the bot will print an `MATRIX_ACCESS_TOKEN` to the terminal
MATRIX_ACCESS_TOKEN=
# Not used if `MATRIX_ACCESS_TOKEN` is set.
MATRIX_BOT_PASSWORD=

# Matrix Configurable Settings Defaults (optional)
# Leave prefix blank to reply to all messages
MATRIX_DEFAULT_PREFIX=!chatgpt
MATRIX_DEFAULT_PREFIX_REPLY=false

# Matrix Access Control (optional)
# Can be set to user:homeserver or a wildcard like :anotherhomeserver.example
MATRIX_BLACKLIST=
# `MATRIX_WHITELIST` is overriden by `MATRIX_BLACKLIST` if they contain same entry
MATRIX_WHITELIST=

# Matrix Feature Flags (optional)
MATRIX_AUTOJOIN=true
MATRIX_ENCRYPTION=true
MATRIX_THREADS=true
MATRIX_PREFIX_DM=false
MATRIX_RICH_TEXT=true
```

# Discussion

Come and join [#matrix-chatgpt-bot:matrix.org](https://matrix.to/#/#matrix-chatgpt-bot:matrix.org)
with your favourite Matrix chat client! If you've never set up a Matrix client before I'd
recomend following the prompts at https://element.io/get-started to download and sign into Element.

# Local development setup
- Run `yarn`
- Run `yarn build`

## Running in "prod"
- `yarn`
- `yarn build`
- `yarn start`

## Running with Docker

```
docker build . -t matrix-chatgpt-bot
docker run -it -v storage:/storage --env-file=./.env --name matrix-chatgpt-bot matrix-chatgpt-bot
```

Note: Without -it flags in the command above you won't be able to stop the container using Ctrl-C

# License
GNU AGPLv3. See LICENSE
