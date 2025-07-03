# Dockerfile Final (Multi-stage + Puppeteer Support)

# --- TAHAP 1: BUILDER ---
FROM node:18-slim AS builder

# Install build dependencies
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
    ca-certificates wget gnupg \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including Puppeteer)
RUN npm install --include=dev

# Copy project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js for production
RUN npm run build

# --- TAHAP 2: RUNNER ---
FROM node:18-slim AS runner

WORKDIR /app
ENV NODE_ENV=production
ENV HOME=/app

# Install Chrome dependencies and Google Chrome
USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates wget gnupg fonts-liberation libasound2 libatk-bridge2.0-0 \
      libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
      libgbm1 libgcc1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 \
      libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
      libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 \
      libxss1 libxtst6 lsb-release xdg-utils procps \
 && wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor \
      > /etc/apt/trusted.gpg.d/google.gpg \
 && echo "deb [arch=amd64 signed-by=/etc/apt/trusted.gpg.d/google.gpg] \
      http://dl.google.com/linux/chrome/deb/ stable main" \
      > /etc/apt/sources.list.d/google.list \
 && apt-get update \
 && apt-get install -y --no-install-recommends google-chrome-stable \
 && rm -rf /var/lib/apt/lists/*

# Set Puppeteer env vars
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# Copy full node_modules so Puppeteer & other deps are available
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user with home at /app
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --home /app nextjs \
 && chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000
ENV PORT=3000

# Run the standalone Next.js server
CMD ["node", "server.js"]
