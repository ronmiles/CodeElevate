##########
# Builder stage: install full deps and build server only
##########
FROM node:20-alpine AS builder

# Avoid heavy Playwright browser downloads during install
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

WORKDIR /app

# Build dependencies needed for native modules
RUN apk add --no-cache python3 make g++

# Copy minimal files first for better layer caching
COPY package.json package-lock.json* ./
COPY nx.json tsconfig.base.json ./

# Install workspace deps (builder only)
RUN npm ci --no-audit --no-fund || npm install --no-audit --no-fund

# Copy the entire workspace (Nx build relies on it)
COPY . .

# Generate Prisma client for build tools that may rely on types
RUN cd server && npx prisma generate

# Build the server app (Nx outputs to dist/server and generates a package.json)
RUN npx nx build server --skip-nx-cache

# Ensure Prisma schema is packaged with the dist output
RUN mkdir -p /app/dist/server/prisma && \
    cp -r /app/server/prisma/* /app/dist/server/prisma/

##########
# Runtime stage: minimal image with only runtime deps
##########
FROM node:20-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Lightweight init for proper signal handling
RUN apk add --no-cache dumb-init wget

# Copy built artifacts and prisma schema from builder
COPY --from=builder /app/dist/server ./
COPY --from=builder /app/server/prisma ./prisma

# Install only runtime dependencies based on the generated package.json
RUN npm install --omit=dev --no-audit --no-fund

# Install Prisma CLI to run migrations at startup (small footprint)
RUN npm install prisma@6.3.1 --no-audit --no-fund

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

EXPOSE 3000

ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Run migrations and start the server
CMD sh -c "npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js"
