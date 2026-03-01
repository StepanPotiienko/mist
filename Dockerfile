# ── Multi-platform support ────────────────────────────────────────────────────
# Build for the target architecture (linux/amd64 or linux/arm64).
# To cross-compile from a Mac/x86 host for Raspberry Pi (arm64), install the
# Docker Buildx QEMU emulator and run:
#   docker buildx create --use
#   docker buildx build --platform linux/arm64 -t mist --load .
# Building natively on the Pi is faster and simpler for personal deployments:
#   ssh pi@<pi-ip> "cd mist && docker compose up -d --build"
ARG TARGETPLATFORM
ARG BUILDPLATFORM

# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:22-alpine AS deps

# Native module build tools (needed for better-sqlite3)
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app
COPY package*.json ./
RUN npm install

# ── Stage 2: Build ─────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
# Need a placeholder DATABASE_URL for prisma generate (not used at build time)
ENV DATABASE_URL=file:/tmp/build.db

RUN npx prisma generate
RUN npm run build

# ── Stage 3: Production runner ─────────────────────────────────────────────────
FROM node:22-alpine AS runner

RUN apk add --no-cache libc6-compat

WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Next.js build output
COPY --from=builder /app/public         ./public
COPY --from=builder /app/.next          ./.next
COPY --from=builder /app/package*.json  ./

# All node_modules (includes native better-sqlite3 binaries)
COPY --from=builder /app/node_modules   ./node_modules

# Prisma schema + migrations (entrypoint runs `prisma migrate deploy`)
COPY --from=builder /app/prisma         ./prisma
COPY --from=builder /app/prisma.config.ts ./

# Generated Prisma client
COPY --from=builder /app/src/generated  ./src/generated

# Entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Volume for persistent SQLite data
RUN mkdir -p /data && chown nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
