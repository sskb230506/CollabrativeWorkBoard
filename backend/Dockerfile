# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile — Production Build
#
# Multi-stage build:
#   Stage 1 (builder): Install deps + compile TypeScript
#   Stage 2 (runner):  Copy only compiled output + production deps
#
# This keeps the final image lean (~200MB vs ~800MB with devDeps + source).
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Builder ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — Docker cache layer optimization.
# If package.json hasn't changed, npm install is skipped on rebuild.
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --include=dev

COPY . .

# Generate Prisma client (must happen after node_modules are installed)
RUN npm run db:generate

# Compile TypeScript
RUN npm run build

# ── Stage 2: Runner ──────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

# Install only production dependencies
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy generated Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Non-root user for security
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Run DB migrations then start the server
# Migrations are idempotent — safe to run on every deploy
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
