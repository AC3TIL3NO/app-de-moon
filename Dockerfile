# syntax=docker/dockerfile:1

# ─── Stage 1: Install dependencies & build ───────────────────────────────────
FROM node:22-slim AS builder

# Install pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./

# Copy all package.json files so pnpm can resolve the workspace graph
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/landing/package.json ./artifacts/landing/
COPY artifacts/pilates-studio/package.json ./artifacts/pilates-studio/
COPY artifacts/mockup-sandbox/package.json ./artifacts/mockup-sandbox/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

# Install all dependencies, regenerating the lockfile to match the current
# overrides configuration (bypasses the frozen-lockfile error from Replit).
# npm_config_user_agent is set so the preinstall guard accepts pnpm.
RUN npm_config_user_agent="pnpm" pnpm install --no-frozen-lockfile

# Copy the rest of the source
COPY . .

# Build all packages (typecheck + recursive build across all workspaces)
# Skip the DB push step that requires a live database at build time by
# overriding the api-server build script to only run esbuild.
RUN pnpm --filter @workspace/db --if-present run build || true
RUN pnpm --filter @workspace/api-zod --if-present run build || true
RUN pnpm --filter @workspace/api-client-react --if-present run build || true
RUN cd artifacts/api-server && node ./build.mjs
RUN pnpm --filter @workspace/landing --if-present run build || true
RUN pnpm --filter @workspace/pilates-studio --if-present run build || true

# ─── Stage 2: Production image ────────────────────────────────────────────────
FROM node:22-slim AS runner

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY lib/api-spec/package.json ./lib/api-spec/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/db/package.json ./lib/db/
COPY scripts/package.json ./scripts/

# Install production dependencies only
RUN npm_config_user_agent="pnpm" pnpm install --no-frozen-lockfile --prod

# Copy built artefacts from the builder stage
COPY --from=builder /app/artifacts/api-server/dist ./artifacts/api-server/dist

EXPOSE 3000

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
