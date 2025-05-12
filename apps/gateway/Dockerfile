# Stage 1: Build the application
FROM node:20-slim AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Stage 2: Create the runtime image
FROM node:20-slim

# Set the working directory
WORKDIR /app

# Copy only the necessary files from the build stage
COPY --from=builder /app/package.json /app/pnpm-lock.yaml ./
COPY --from=builder /app/dist/ ./dist
#COPY --from=builder /app/.env ./.env

# Install pnpm
RUN npm install -g pnpm

# Install only production dependencies
RUN pnpm install --prod

# Expose port 80 and 443 for load balancing
EXPOSE 443

# Set environment variables
ENV PORT=3001
ENV AWS_REGION="ap-southeast-1"

# Start the application
CMD ["node", "dist/src/index.js"]