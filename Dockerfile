# =========================================
# Stage 1: Build the TanStack Start Application
# =========================================
ARG NODE_VERSION=24.12.0-slim

FROM node:${NODE_VERSION} AS builder

WORKDIR /app

# Copy package files first for optimal caching
COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* ./

# Install dependencies with cache mounts for speed
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/local/share/.cache/yarn \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
  if [ -f package-lock.json ]; then \
    npm ci --no-audit --no-fund; \
  elif [ -f yarn.lock ]; then \
    corepack enable yarn && yarn install --frozen-lockfile --production=false; \
  elif [ -f pnpm-lock.yaml ]; then \
    corepack enable pnpm && pnpm install --frozen-lockfile; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

COPY . .

# Build with cache mount for .vinxi artifacts
RUN --mount=type=cache,target=/app/.vinxi/cache \
  if [ -f package-lock.json ]; then \
    npm run build; \
  elif [ -f yarn.lock ]; then \
    yarn build; \
  elif [ -f pnpm-lock.yaml ]; then \
    pnpm build; \
  else \
    echo "No lockfile found." && exit 1; \
  fi

# =========================================
# Stage 2: Run the TanStack Start Server
# =========================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

COPY --from=builder /app/.output ./

USER node

EXPOSE 3000

ENTRYPOINT ["node", "server/index.mjs"]
