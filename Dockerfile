# # Use the official Node.js image as a base
FROM node:16-slim

RUN apt-get update && apt-get -y upgrade && apt-get install -y ca-certificates curl apt-transport-https lsb-release gnupg

ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

ARG DEBIAN_FRONTEND=noninteractive
# 0. Install essential packages
RUN apt-get update \
    && apt-get install -y \
    build-essential \
    cmake \
    git \
    wget \
    unzip \
    unixodbc-dev \
    fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0  libatspi2.0-0 \
    libcairo2 libcups2 libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 \
    libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libu2f-udev \
    libvulkan1 libxcomposite1 libxdamage1 libxfixes3 libxkbcommon0 libxrandr2  xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# 2) Install latest stable Chrome
# https://gerg.dev/2021/06/making-chromedriver-and-chrome-versions-match-in-a-docker-image/
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | \
    tee -a /etc/apt/sources.list.d/google.list

RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | \
    apt-key add -

RUN wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
RUN apt-get install ./google-chrome-stable_current_amd64.deb

# 3) Install the Chromedriver version that corresponds to the installed major Chrome version
# https://blogs.sap.com/2020/12/01/ui5-testing-how-to-handle-chromedriver-update-in-docker-image/
# For some reasone, there is a breaking change with Chrome drive and the latest google chrome browser. Hence, the reason for default Chrome driver to the last know working version
# TODO=> Find fix for breaking change =:)
RUN google-chrome --version | grep -oE "[0-9]{1,10}.[0-9]{1,10}.[0-9]{1,10}" > /tmp/chromebrowser-main-version.txt
RUN wget --no-verbose -O /tmp/latest_chromedriver_version.txt https://chromedriver.storage.googleapis.com/LATEST_RELEASE_114.0.5735
RUN wget --no-verbose -O /tmp/chromedriver_linux64.zip https://chromedriver.storage.googleapis.com/114.0.5735.90/chromedriver_linux64.zip \
    && rm -rf /opt/selenium/chromedriver \
    && unzip /tmp/chromedriver_linux64.zip -d /opt/selenium \
    && rm /tmp/chromedriver_linux64.zip && mv /opt/selenium/chromedriver /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) \
    && chmod 755 /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) \
    && ln -fs /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) /usr/bin/chromedriver

# Set the working directory to /app
WORKDIR /app

# 3. Install selenium
RUN npm config set unsafe-perm true
RUN npm i selenium-webdriver
# RUN npm i -g azure-functions-core-tools@2 --unsafe-perm true

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the application listens on
EXPOSE 3000

# Start the application
CMD ["make", "run-web"]
