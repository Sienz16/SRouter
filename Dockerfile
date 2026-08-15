# ==============================================================================
# SRouter Production Multi-Stage Dockerfile
# ==============================================================================

# --- Stage 1: Base image with Node 22 & PNPM ---
FROM node:22-alpine AS base
WORKDIR /app

# Enable Corepack & prepare PNPM
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@11.20.0 --activate

# --- Stage 2: Dependencies and Build ---
FROM base AS builder

# Copy package manifests for workspace dependency resolution & layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/constants/package.json ./packages/constants/
COPY packages/db/package.json ./packages/db/
COPY packages/executors/package.json ./packages/executors/
COPY packages/pricing/package.json ./packages/pricing/
COPY packages/providers/package.json ./packages/providers/
COPY packages/translator/package.json ./packages/translator/
COPY packages/types/package.json ./packages/types/

# Install all dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy full source tree
COPY . .

# Build all packages, API server, and web dashboard
RUN pnpm build

# Prune devDependencies to keep production runtime footprint minimal
RUN pnpm prune --prod

# --- Stage 3: Production Runner ---
FROM node:22-alpine AS runner
WORKDIR /app

# Install tzdata for accurate timezone and logging
RUN apk add --no-cache tzdata

# Set runtime environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV OAUTH_PORT=1455
ENV DATABASE_PATH=/app/data/srouter.db
ENV WEB_DIST_PATH=/app/apps/web/dist

# Create persistent storage directory for SQLite WAL database
RUN mkdir -p /app/data

# Copy workspace package manifests & production node_modules from builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled workspace packages
COPY --from=builder /app/packages/constants/dist ./packages/constants/dist
COPY --from=builder /app/packages/constants/package.json ./packages/constants/package.json
COPY --from=builder /app/packages/db/dist ./packages/db/dist
COPY --from=builder /app/packages/db/package.json ./packages/db/package.json
COPY --from=builder /app/packages/executors/dist ./packages/executors/dist
COPY --from=builder /app/packages/executors/package.json ./packages/executors/package.json
COPY --from=builder /app/packages/pricing/dist ./packages/pricing/dist
COPY --from=builder /app/packages/pricing/package.json ./packages/pricing/package.json
COPY --from=builder /app/packages/providers/dist ./packages/providers/dist
COPY --from=builder /app/packages/providers/package.json ./packages/providers/package.json
COPY --from=builder /app/packages/translator/dist ./packages/translator/dist
COPY --from=builder /app/packages/translator/package.json ./packages/translator/package.json
COPY --from=builder /app/packages/types/dist ./packages/types/dist
COPY --from=builder /app/packages/types/package.json ./packages/types/package.json

# Copy compiled API server & Web Dashboard build
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Expose API/Web port (3000) and OAuth callback receiver port (1455)
EXPOSE 3000 1455

# Declare persistent volume mount point
VOLUME ["/app/data"]

# Native health check using Node 22 built-in fetch
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 3000) + '/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start SRouter unified API & Dashboard server
CMD ["node", "apps/api/dist/index.js"]
