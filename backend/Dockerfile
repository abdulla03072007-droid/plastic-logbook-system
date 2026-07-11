<<<<<<< HEAD
# ============================================================
# Plastic Logbook System - Backend Dockerfile
# ============================================================

# --- Stage 1: Base ---
FROM node:20-alpine AS base
LABEL maintainer="Plastic Logbook System"
LABEL description="Backend API for Plastic Logbook multi-tenant application"

# Set working directory
WORKDIR /app

# Install dependencies needed for bcrypt and other native modules
RUN apk add --no-cache python3 make g++

# Copy package files first (for better layer caching)
COPY package*.json ./

# --- Stage 2: Dependencies ---
FROM base AS deps
RUN npm ci --only=production

# --- Stage 3: Dev Dependencies (for testing) ---
FROM base AS dev-deps
RUN npm ci

# --- Stage 4: Test ---
FROM dev-deps AS test
COPY . .
ENV NODE_ENV=test
ENV JWT_SECRET=test_jwt_secret_for_testing_only
ENV MONGO_URI=mongodb://mongo:27017/plastic_logbook_test
RUN npm test --if-present

# --- Stage 5: Production ---
FROM base AS production
WORKDIR /app

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

# Change ownership
RUN chown -R nodeuser:nodejs /app

USER nodeuser

# Expose the application port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]
=======
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm","start"]
>>>>>>> 8fd51967e2e1a1ce18ca62115333a321cd4caad8
