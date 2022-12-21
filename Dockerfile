FROM node:18
RUN git clone https://github.com/jakecoppinger/matrix-chatgpt-bot.git
WORKDIR matrix-chatgpt-bot
COPY env .env
#RUN yarn install
RUN yarn install --har --production=true
RUN yarn build
RUN yarn start
