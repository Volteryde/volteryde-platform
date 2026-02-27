# ============================================================================
# Volteryde Temporal Workers - Multi-stage Docker Build
# ============================================================================

# Stage 1: Base with pnpm
FROM node:20-alpine AS base

WORKDIR /app

# Set pnpm environment
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Enable corepack for pnpm version management
RUN corepack enable && corepack prepare pnpm@9 --activate

# Stage 2: Dependencies
FROM base AS deps

WORKDIR /app

# Copy workspace files
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./

# Copy worker package.json
COPY workers/temporal-workers/package.json ./workers/temporal-workers/

# Install dependencies with BuildKit cache mount
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Stage 3: Builder
FROM deps AS builder

WORKDIR /app

# Copy all source code
COPY workers/temporal-workers ./workers/temporal-workers

# Build the worker application
WORKDIR /app/workers/temporal-workers
RUN pnpm build

# Deploy to an isolated directory with only production dependencies
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm --filter=@volteryde/temporal-workers --prod deploy /prod/worker

# Copy built artifacts to the deployed directory
RUN cp -r dist /prod/worker/dist

# Stage 4: Production Runner
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy the deployed application (pruned production deps + built code)
COPY --from=builder --chown=nodejs:nodejs /prod/worker ./

# Switch to non-root user
USER nodejs

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Set healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "require('http').request('http://localhost:7233/health').end()" || exit 1

# Start the worker
CMD ["node", "dist/index.js"]
