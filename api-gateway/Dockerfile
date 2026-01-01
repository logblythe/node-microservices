# Use the official Node.js LTS image as the base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN npm run build

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose the port your API Gateway runs on (e.g., 3000)
EXPOSE 3000

# Start the API Gateway
CMD ["npm", "start"]