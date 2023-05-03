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
