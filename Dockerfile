# Use Node.js base image
FROM node:14-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json files to workdir
COPY package*.json ./

# Install dependencies
RUN npm install


# Copy remaining files to workdir
COPY . .

# Set environment variables
ENV NODE_ENV=production


# then run the server
CMD npm start