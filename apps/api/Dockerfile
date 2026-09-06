# syntax=docker/dockerfile:1
# Multi-stage build for the NexaHaus Connect API. The same image runs the
# background worker — override the command with ["node", "dist/worker.js"].
#
#   docker build -f apps/api/Dockerfile -t nexahaus-api .
#
# Build context is the repo root (pnpm workspace). See docs/DEPLOYMENT.md §5.

FROM node:20.17.0-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.12.0 --activate
WORKDIR /repo

# --- deps: full workspace install (cached on lockfile) ----------------------
FROM base AS deps
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# --- build: compile shared packages + API ----------------------------------
FROM deps AS build
ENV NODE_ENV=development
COPY . .
RUN pnpm --filter @nexahaus/api exec prisma generate
RUN pnpm --filter @nexahaus/api... build

# --- prod deps only ------------------------------------------------------------
FROM deps AS proddeps
ENV NODE_ENV=production
COPY --from=build /repo/packages ./packages
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter @nexahaus/api...

# --- runner: slim runtime, non-root -----------------------------------------
FROM base AS runner
ENV NODE_ENV=production
RUN groupadd --system --gid 1001 nodejs \
 && useradd --system --uid 1001 --gid nodejs --create-home nexahaus

COPY --from=proddeps --chown=nexahaus:nodejs /repo/node_modules ./node_modules
COPY --from=proddeps --chown=nexahaus:nodejs /repo/apps/api/node_modules ./apps/api/node_modules
COPY --from=build    --chown=nexahaus:nodejs /repo/packages ./packages
COPY --from=build    --chown=nexahaus:nodejs /repo/apps/api/dist ./apps/api/dist
COPY --from=build    --chown=nexahaus:nodejs /repo/apps/api/prisma ./apps/api/prisma
COPY --from=build    --chown=nexahaus:nodejs /repo/apps/api/package.json ./apps/api/package.json

USER nexahaus
WORKDIR /repo/apps/api
ENV API_PORT=4000
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.API_PORT||4000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Worker override: command: ["node", "dist/worker.js"]
CMD ["node", "dist/main.js"]
