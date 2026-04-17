# ─────────────────────────────────────────────────────────────────
#  Portal Cartorial — Web App Dockerfile
#  C2 Container: Web App [Next.js / Node.js 20]
# ─────────────────────────────────────────────────────────────────

FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3001
CMD ["npm", "run", "dev"]

FROM base AS builder
RUN npm ci
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3001
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3001
CMD ["node", "server.js"]
