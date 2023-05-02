# Use the official Node.js image as a base
FROM node:16-alpine

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
CMD ["func", "start"]
