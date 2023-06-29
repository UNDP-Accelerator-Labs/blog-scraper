# # Use the official Node.js image as a base
FROM node:16-slim

# FROM ubuntu:20.04

RUN apt-get update && apt-get -y upgrade && apt-get install -y ca-certificates curl apt-transport-https lsb-release gnupg

# RUN curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/microsoft.gpg
# RUN AZ_REPO=$(lsb_release -cs) && \
#     echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" | tee /etc/apt/sources.list.d/azure-cli.list && \
#     echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-$AZ_REPO-prod $AZ_REPO main" | tee /etc/apt/sources.list.d/dotnetdev.list

# RUN apt-get update && apt-get install -y azure-cli azure-functions-core-tools-3

# RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash && apt-get install -y nodejs

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
    && rm -rf /var/lib/apt/lists/*

# 2) Install latest stable Chrome
# https://gerg.dev/2021/06/making-chromedriver-and-chrome-versions-match-in-a-docker-image/
RUN echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | \
    tee -a /etc/apt/sources.list.d/google.list

RUN wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | \
    apt-key add -

RUN apt-get update

RUN apt-get install -y google-chrome-stable libxss1

# 3) Install the Chromedriver version that corresponds to the installed major Chrome version
# https://blogs.sap.com/2020/12/01/ui5-testing-how-to-handle-chromedriver-update-in-docker-image/
RUN google-chrome --version | grep -oE "[0-9]{1,10}.[0-9]{1,10}.[0-9]{1,10}" > /tmp/chromebrowser-main-version.txt
RUN wget --no-verbose -O /tmp/latest_chromedriver_version.txt https://chromedriver.storage.googleapis.com/LATEST_RELEASE_$(cat /tmp/chromebrowser-main-version.txt)
RUN wget --no-verbose -O /tmp/chromedriver_linux64.zip https://chromedriver.storage.googleapis.com/$(cat /tmp/latest_chromedriver_version.txt)/chromedriver_linux64.zip && rm -rf /opt/selenium/chromedriver && unzip /tmp/chromedriver_linux64.zip -d /opt/selenium && rm /tmp/chromedriver_linux64.zip && mv /opt/selenium/chromedriver /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) && chmod 755 /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) && ln -fs /opt/selenium/chromedriver-$(cat /tmp/latest_chromedriver_version.txt) /usr/bin/chromedriver

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
