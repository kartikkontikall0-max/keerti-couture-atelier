# ==============================================================================
# KEERTI COUTURE — BACKEND PRODUCTION DOCKERFILE
# ==============================================================================

FROM node:20-alpine AS base
WORKDIR /app

# Install build dependencies for sharp/libvips
RUN apk add --no-cache libc6-compat python3 make g++

FROM base AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Create secure non-root service account
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 keertiapp

# Copy production dependencies and application source
COPY --from=dependencies --chown=keertiapp:nodejs /app/node_modules ./node_modules
COPY --chown=keertiapp:nodejs . .

USER keertiapp

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

CMD ["node", "server.js"]
