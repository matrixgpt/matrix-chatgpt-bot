FROM satantime/puppeteer-node:19-slim

# Create app directory
WORKDIR /usr/src/app
RUN mkdir -p /usr/src/app/Downloads

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium
ENV DEBIAN_FRONTEND=noninteractive

RUN apt update -qq \
    && apt install -qq -y --no-install-recommends \
      chromium \
      dumb-init \
      # To run Headful mode we just need to install Xvfb and Puppeteer related dependencies.
      xfonts-100dpi xfonts-75dpi xfonts-scalable xfonts-cyrillic \
      xvfb xauth\
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /src/*.deb

# Install app dependencies
COPY package*.json ./
RUN yarn install --frozen-lockfile --production && yarn cache clean

COPY ./tsconfig.json ./tsconfig.json
COPY ./src ./src
RUN yarn build

VOLUME /storage
ENV DATA_PATH="/storage"

# We run a fake display and run our script using Xvfb
CMD xvfb-run --server-args="-screen 0 1024x768x24" yarn start