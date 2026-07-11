# ============================================================
# Plastic Logbook System - Frontend Dockerfile
# ============================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev for building)
RUN npm ci

# Copy source code
COPY . .

# Build the React app for production
ARG REACT_APP_API_URL=http://localhost:5000
ENV REACT_APP_API_URL=${REACT_APP_API_URL}
RUN npm run build

# --- Stage 2: Production (Nginx to serve static files) ---
FROM nginx:1.25-alpine AS production

# Copy the built React app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
