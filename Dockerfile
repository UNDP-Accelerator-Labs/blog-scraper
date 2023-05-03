# # Use the official Node.js image as a base
# FROM node:16-alpine

FROM ubuntu:20.04

RUN apt-get update && apt-get install -y ca-certificates curl apt-transport-https lsb-release gnupg

RUN curl -sL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor | tee /etc/apt/trusted.gpg.d/microsoft.gpg
RUN AZ_REPO=$(lsb_release -cs) && \
    echo "deb [arch=amd64] https://packages.microsoft.com/repos/azure-cli/ $AZ_REPO main" | tee /etc/apt/sources.list.d/azure-cli.list && \
    echo "deb [arch=amd64] https://packages.microsoft.com/repos/microsoft-ubuntu-$AZ_REPO-prod $AZ_REPO main" | tee /etc/apt/sources.list.d/dotnetdev.list

RUN apt-get update && apt-get install -y azure-cli azure-functions-core-tools-3

RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash && apt-get install -y nodejs

ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1

# 0. Install essential packages
RUN apt-get update \
    && apt-get install -y \
        build-essential \
        cmake \
        git \
        wget \
        unzip \
    && rm -rf /var/lib/apt/lists/*

# 1. Install Chrome (root image is debian)
# See https://stackoverflow.com/questions/49132615/installing-chrome-in-docker-file
ARG CHROME_VERSION="google-chrome-stable"
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
  && echo "deb http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list \
  && apt-get update -qqy \
  && apt-get -qqy install \
    ${CHROME_VERSION:-google-chrome-stable} \
  && rm /etc/apt/sources.list.d/google-chrome.list \
  && rm -rf /var/lib/apt/lists/* /var/cache/apt/*

# 2. Install Chrome driver used by Selenium
RUN LATEST=$(wget -q -O - http://chromedriver.storage.googleapis.com/LATEST_RELEASE) && \
    wget http://chromedriver.storage.googleapis.com/$LATEST/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && ln -s $PWD/chromedriver /usr/local/bin/chromedriver

ENV PATH="/usr/local/bin/chromedriver:${PATH}"

# Set the working directory to /app
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port that the application listens on
EXPOSE 80
EXPOSE 5432

# Set the environment variables
ENV NODE_ENV=production
ENV PORT=80
ENV DB_PORT=5432

# Start the application
CMD ["npm", "start"]
