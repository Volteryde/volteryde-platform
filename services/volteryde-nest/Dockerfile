# ============================================================================
# Volteryde NestJS Backend - Multi-stage Docker Build
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

# Copy service package.json
COPY services/volteryde-nest/package.json ./services/volteryde-nest/

# Install all dependencies (including workspace dependencies)
RUN pnpm install

# Stage 2: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@8

# Copy dependencies from previous stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY --from=dependencies /app/services/volteryde-nest/node_modules ./services/volteryde-nest/node_modules

# Copy workspace configuration
COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

# Copy service source code
COPY services/volteryde-nest ./services/volteryde-nest

# Copy shared packages if they exist
COPY packages ./packages

# Build the application
WORKDIR /app/services/volteryde-nest
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
COPY services/volteryde-nest/package.json ./services/volteryde-nest/

# Install production dependencies only
RUN pnpm install --prod

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/services/volteryde-nest/dist ./dist

# Set ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
