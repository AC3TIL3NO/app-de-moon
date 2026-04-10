# syntax=docker/dockerfile:1

# ── Base ──────────────────────────────────────────────────────────────────────
FROM node:22-slim AS base

# Enable corepack so pnpm is available without a separate install step
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# ── Dependencies ──────────────────────────────────────────────────────────────
FROM base AS deps

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml .npmrc ./

# Copy every package.json in the workspace (preserving directory structure)
COPY artifacts/api-server/package.json      ./artifacts/api-server/
COPY artifacts/landing/package.json         ./artifacts/landing/
COPY artifacts/mockup-sandbox/package.json  ./artifacts/mockup-sandbox/
COPY artifacts/pilates-studio/package.json  ./artifacts/pilates-studio/
COPY lib/api-client-react/package.json      ./lib/api-client-react/
COPY lib/api-spec/package.json              ./lib/api-spec/
COPY lib/api-zod/package.json               ./lib/api-zod/
COPY lib/db/package.json                    ./lib/db/
COPY scripts/package.json                   ./scripts/

# Install all dependencies.
# --no-frozen-lockfile regenerates the lockfile so the outdated Replit
# "overrides" entries in pnpm-lock.yaml don't cause the install to fail.
RUN pnpm install --no-frozen-lockfile

# ── Build ─────────────────────────────────────────────────────────────────────
FROM deps AS builder

# Copy the full source tree on top of the installed node_modules
COPY . .

# Build every package that exposes a build script
# (typecheck is skipped here to keep CI fast; run it separately if needed)
RUN PORT=3000 pnpm -r --if-present run build

# ── Production image ──────────────────────────────────────────────────────────
FROM base AS runner

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml .npmrc ./

# Copy every package.json (needed so pnpm can resolve the workspace graph)
COPY artifacts/api-server/package.json      ./artifacts/api-server/
COPY artifacts/landing/package.json         ./artifacts/landing/
COPY artifacts/mockup-sandbox/package.json  ./artifacts/mockup-sandbox/
COPY artifacts/pilates-studio/package.json  ./artifacts/pilates-studio/
COPY lib/api-client-react/package.json      ./lib/api-client-react/
COPY lib/api-spec/package.json              ./lib/api-spec/
COPY lib/api-zod/package.json               ./lib/api-zod/
COPY lib/db/package.json                    ./lib/db/
COPY scripts/package.json                   ./scripts/

# Install production dependencies only
RUN pnpm install --no-frozen-lockfile --prod

# Copy built artifacts from the builder stage
COPY --from=builder /app/artifacts ./artifacts
COPY --from=builder /app/lib       ./lib

# Each Railway service sets its own startCommand in the Railway dashboard /
# service config (e.g. "node --enable-source-maps ./artifacts/api-server/dist/index.mjs").
# No CMD is defined here so Railway's startCommand takes full control.
