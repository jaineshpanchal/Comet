# ==================================================
# Production Dockerfile for GoLive API Gateway
# ==================================================
# Multi-stage build for optimized image size and security
#
# Features:
# - Multi-stage build (builder + production)
# - Non-root user execution
# - Minimal attack surface
# - Security scanning compatible
# - Health check included
# - Build cache optimization
# ==================================================

# ==================================================
# Stage 1: Dependencies
# ==================================================
FROM node:20-alpine AS deps

# Install security updates
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# ==================================================
# Stage 2: Builder
# ==================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Remove devDependencies
RUN npm prune --production --legacy-peer-deps

# ==================================================
# Stage 3: Production Runner
# ==================================================
FROM node:20-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 golive

# Copy built application
COPY --from=builder --chown=golive:nodejs /app/dist ./dist
COPY --from=builder --chown=golive:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=golive:nodejs /app/prisma ./prisma
COPY --from=builder --chown=golive:nodejs /app/package*.json ./

# Switch to non-root user
USER golive

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["node", "dist/index.js"]
