FROM node:20-alpine

# Enable corepack so pnpm is available
RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

# ── 1. Copy workspace manifests first (better layer caching) ─────────────────
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/types/package.json ./packages/types/package.json
COPY apps/api/package.json ./apps/api/package.json

# ── 2. Install all workspace deps (sets up @peptide/types symlink for API) ───
RUN pnpm install --frozen-lockfile

# ── 3. Copy source ────────────────────────────────────────────────────────────
COPY tsconfig.json ./
COPY packages/types ./packages/types
COPY apps/api ./apps/api

# ── 4. Build the API ──────────────────────────────────────────────────────────
RUN pnpm --filter api build

EXPOSE 3001
ENV PORT=3001

CMD ["node", "apps/api/dist/index.js"]
