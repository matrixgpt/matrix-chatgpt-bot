Matrix ChatGPT Bot
==================

Talk to ChatGPT via your favourite Matrix client!

![Screenshot of Element iOS app showing conversation with bot](img/matrix-chatgpt.png)

This is an unofficial Matrix bot that uses https://github.com/transitive-bullshit/chatgpt-api to access the unofficial ChatGPT API.

It is worth reading the [authentication instructions](https://www.npmjs.com/package/chatgpt#usage) for the unofficial ChatGPT API.

Your user-agent and IP address must match from the real browser window you're logged in with to the one you're using for ChatGPTAPI. This means that you currently can't log in with your laptop and then run the bot on a server or proxy somewhere.

Cloudflare will still sometimes ask you to complete a CAPTCHA, so you may need to keep an eye on it and manually resolve the CAPTCHA.

You should not be using this ChatGPT account while the bot is using it, because that browser window may refresh one of your tokens and invalidate the bot's session. 

If your OpenAI account uses Google Auth, you shouldn't encounter any of the more complicated Recaptchas — and can avoid using paid third-party CAPTCHA solving providers. To use Google auth, make sure your OpenAI account is using Google and then set IS_GOOGLE_LOGIN to true.

# Usage
- Create an (encrypted if enabled) room
- Add the bot
- Start chatting away!

# Features
- Shows typing indicator as ChatGPT is thinking!
- Doesn't yet support encryption
  - Two lines of code can be uncommented to enable it, however "unable to decrypt" messages appear
  - If you have time to look into fixing this PRs very welcome :)

# Setting up the account
- Create a new Matrix account on Matrix.org (or your favourite server)
- Go to the settings and get the access token
- Add the details to your environment vars. One way of doing this is adding this to a file called `.env`:
```
# https://matrix.org if your account is on matrix.org.
MATRIX_HOMESERVER_URL="https://matrix.org"
MATRIX_ACCESS_TOKEN=
# With the @ and :DOMAIN, ie @SOMETHING:DOMAIN
MATRIX_BOT_USERNAME=
MATRIX_BOT_PASSWORD=

# Leave prefix blank to reply to all messages
MATRIX_PREFIX="!chatgpt "
MATRIX_AUTOJOIN=true
MATRIX_ENCRYPTION=true
MATRIX_THREADS=true

OPENAI_EMAIL=
OPENAI_PASSWORD=
OPENAI_LOGIN_TYPE="google"
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
docker run -it -v /full-path-not-relative-path/storage:/storage matrix-chatgpt-bot
```

Note: Without -it flags in the command above you won't be able to stop the container using Ctrl-C

# License
GNU AGPLv3. See LICENSE
