FROM node:23-alpine

# Add build dependencies and utilities
RUN apk add --no-cache python3 make g++ dumb-init

# Set working directory
WORKDIR /app

# Copy package.json and related files
COPY package.json package-lock.json* ./
COPY nx.json tsconfig.base.json ./

# Set higher memory limit for Node
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NODE_ENV=production

# Install dependencies first (for better caching)
RUN npm install --prefer-offline --no-audit --force

# Copy the entire workspace (needed for Nx)
COPY . .

# Generate Prisma client
RUN cd server && npx prisma generate

# Now build and prune
RUN npx nx build server --skip-nx-cache && \
    npm prune --production

# Copy Prisma schema and migrations to dist folder
RUN mkdir -p /app/dist/server/prisma && \
    cp -r /app/server/prisma/* /app/dist/server/prisma/

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:3000/api/health || exit 1

# Expose port
EXPOSE 3000

# Use dumb-init as PID 1 to properly handle signals
ENTRYPOINT ["/usr/bin/dumb-init", "--"]

# Change working directory to the built app
WORKDIR /app/dist/server

# Run migrations and start the server
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node main.js
