Matrix ChatGPT Bot
==================

Talk to ChatGPT via your favourite Matrix client!

![Screenshot of Element iOS app showing conversation with bot](img/matrix-chatgpt.png)

This is an unofficial Matrix bot that uses https://github.com/transitive-bullshit/chatgpt-api to access the unofficial ChatGPT API.

# Usage
- Create an unencrypted room
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
MATRIX_HOMESERVER_URL=
MATRIX_ACCESS_TOKEN=

# The value of the __Secure-next-auth.session-token cookie. See instructions on
# https://www.npmjs.com/package/chatgpt
CHATGPT_SESSION_TOKEN=

# With the @ and :DOMAIN, ie @SOMETHING:DOMAIN
MATRIX_BOT_USERNAME=
MATRIX_BOT_PASSWORD=
```

# Local development setup
- Run `yarn`
- Run `yarn build`

## Running in "prod"
- `yarn`
- `yarn build`
- `yarn start`

# License
GNU AGPLv3. See LICENSE
