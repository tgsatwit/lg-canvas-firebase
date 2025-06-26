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

# Accept build-time environment variables
ARG NEXT_PUBLIC_FIREBASE_API_KEY
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ARG NEXT_PUBLIC_FIREBASE_APP_ID
ARG NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ARG NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL
ARG NEXT_PUBLIC_FIREWORKS_ENABLED
ARG NEXT_PUBLIC_GEMINI_ENABLED
ARG NEXT_PUBLIC_ANTHROPIC_ENABLED
ARG NEXT_PUBLIC_OPENAI_ENABLED
ARG NEXT_PUBLIC_AZURE_ENABLED
ARG NEXT_PUBLIC_OLLAMA_ENABLED
ARG NEXT_PUBLIC_GROQ_ENABLED

# Set them as environment variables for the build
ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID
ENV NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=$NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
ENV NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL=$NEXT_PUBLIC_FIREBASE_FUNCTIONS_URL
ENV NEXT_PUBLIC_FIREWORKS_ENABLED=$NEXT_PUBLIC_FIREWORKS_ENABLED
ENV NEXT_PUBLIC_GEMINI_ENABLED=$NEXT_PUBLIC_GEMINI_ENABLED
ENV NEXT_PUBLIC_ANTHROPIC_ENABLED=$NEXT_PUBLIC_ANTHROPIC_ENABLED
ENV NEXT_PUBLIC_OPENAI_ENABLED=$NEXT_PUBLIC_OPENAI_ENABLED
ENV NEXT_PUBLIC_AZURE_ENABLED=$NEXT_PUBLIC_AZURE_ENABLED
ENV NEXT_PUBLIC_OLLAMA_ENABLED=$NEXT_PUBLIC_OLLAMA_ENABLED
ENV NEXT_PUBLIC_GROQ_ENABLED=$NEXT_PUBLIC_GROQ_ENABLED

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