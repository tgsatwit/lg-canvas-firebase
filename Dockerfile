# Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json yarn.lock ./
COPY apps/web/package.json ./apps/web/
COPY apps/agents/package.json ./apps/agents/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the applications
RUN yarn build

# Production stage
FROM node:20-alpine AS runner

# Install dependencies needed for runtime
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy built applications
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/agents/dist ./apps/agents/dist
COPY --from=builder /app/apps/agents/package.json ./apps/agents/package.json
COPY --from=builder /app/packages ./packages
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/yarn.lock ./yarn.lock

# Install only production dependencies
RUN yarn install --frozen-lockfile --production && yarn cache clean

# Change ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose port
EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Start the application
CMD ["yarn", "workspace", "@opencanvas/web", "start"] 