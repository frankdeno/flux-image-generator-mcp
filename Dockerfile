FROM node:18-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript code
RUN npm run build

# Create output directory
RUN mkdir -p /app/output && chmod 777 /app/output

# Set environment variables
ENV NODE_ENV=production
ENV OUTPUT_DIR=/app/output

# Start the server
CMD ["node", "dist/index.js"]