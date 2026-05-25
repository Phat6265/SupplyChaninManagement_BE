# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Keys are mounted at runtime (not baked into image)
VOLUME ["/app/keys"]

EXPOSE 3001
CMD ["node", "dist/index.js"]
