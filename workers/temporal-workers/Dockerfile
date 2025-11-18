# ============================================================================
# Volteryde Temporal Workers - Multi-stage Docker Build
# ============================================================================

# Stage 1: Dependencies
FROM node:20-alpine AS dependencies

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy monorepo workspace files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml* ./

# Copy worker package.json
COPY workers/temporal-workers/package.json ./workers/temporal-workers/

# Install all dependencies (including workspace dependencies)
RUN pnpm install

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/workers/temporal-workers/node_modules ./workers/temporal-workers/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy worker source code
COPY workers/temporal-workers ./workers/temporal-workers

# Copy shared packages if they exist
COPY packages ./packages

# Build the application
WORKDIR /app/workers/temporal-workers
RUN pnpm build

# Stage 3: Production
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml* ./
COPY workers/temporal-workers/package.json ./workers/temporal-workers/

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/workers/temporal-workers/dist ./dist

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Temporal workers don't expose HTTP ports typically
# But we can add a health check endpoint if needed

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the worker
CMD ["node", "dist/index.js"]
