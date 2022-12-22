FROM node:18 as builder

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

# We don't need the standalone Chromium here.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

RUN yarn install --frozen-lockfile && yarn cache clean

COPY . .

RUN yarn build


FROM node:18-slim

RUN mkdir -p /home/pptruser/Downloads
# Create app directory
WORKDIR /home/pptruser

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -qq \
    && apt install -qq -y --no-install-recommends \
      curl \
      git \
      gnupg \
      libgconf-2-4 \
      libxss1 \
      libxtst6 \
      python \
      g++ \
      build-essential \
      chromium \
      chromium-sandbox \
      dumb-init \
      fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb

# To run Headful mode, you will need to have a display, which is not present in a server.
# To avoid this, we will use Xvfb, and create a fake display, so the chrome will think there is a display and run properly.
# So we just need to install Xvfb and Puppeteer related dependencies.
RUN apt-get update && apt-get install -yq gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget x11vnc x11-xkb-utils xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic x11-apps xvfb

# Install app dependencies
COPY package*.json ./

COPY .env .env

RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY --from=builder /usr/src/app/dist ./dist

RUN npm install puppeteer@19.4.1 \
    # Add user so we don't need --no-sandbox.
    # same layer as npm install to keep re-chowned files from using up several hundred MBs more space
    && groupadd -r pptruser && useradd -rm -g pptruser -G audio,video pptruser \
    && chown -R pptruser:pptruser /home/pptruser
USER pptruser

# We run a fake display and run our script.
# Start script on Xvfb
CMD xvfb-run --server-args="-screen 0 1024x768x24" yarn start