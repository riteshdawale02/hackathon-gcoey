# Multi-stage Dockerfile for Node.js Identity & Patient Service
# Stage 1: Build & Dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Production Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
COPY src/ ./src/

EXPOSE 5001
USER node
CMD ["node", "src/index.js"]
