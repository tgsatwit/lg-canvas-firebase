# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/agents/package.json ./apps/agents/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies without running build scripts
RUN yarn install --frozen-lockfile --ignore-scripts

# Copy source code
COPY . .

# Set NODE_ENV for build
ENV NODE_ENV=production

# Build the applications
RUN yarn turbo build

# Production stage
FROM node:20-alpine AS runner

# Install dependencies needed for runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the langgraph.json to the root (needed for agent service)
COPY --from=builder /app/langgraph.json ./langgraph.json

# Copy the standalone build for the web app
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

# Copy agents build
COPY --from=builder /app/apps/agents/dist ./apps/agents/dist
COPY --from=builder /app/apps/agents/package.json ./apps/agents/package.json
COPY --from=builder /app/apps/agents/src ./apps/agents/src

# Copy packages
COPY --from=builder /app/packages/shared ./packages/shared

# Copy root files (needed for agents)
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock
COPY --from=builder /app/turbo.json ./turbo.json

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start the standalone server
CMD ["node", "apps/web/server.js"] 