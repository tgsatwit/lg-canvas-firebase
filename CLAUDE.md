# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PBL Canvas is an AI-powered educational platform that combines project-based learning with advanced conversational AI capabilities. Built on LangChain's Open Canvas architecture, it has been customized as "PBL.ai" - a comprehensive dashboard for educational content creation, social media management, and project collaboration.

## 🎨 Design System Guidelines

### Color Palette (STRICTLY ENFORCED)
- **Primary Color**: Pink (`#ec4899`, `rgb(236, 72, 153)`)
  - Light: `#fce7f3` (pink-50)
  - Medium: `#f9a8d4` (pink-300) 
  - Dark: `#be185d` (pink-700)
- **Secondary Color**: Purple (`#8b5cf6`, `rgb(139, 92, 246)`)
  - Light: `#f3e8ff` (purple-50)
  - Medium: `#c4b5fd` (purple-300)
  - Dark: `#7c3aed` (purple-600)
- **Gradients**: Always use pink-to-purple gradients
  - Primary: `linear-gradient(135deg, rgba(236, 72, 153, 0.9) 0%, rgba(139, 92, 246, 0.9) 100%)`
  - Subtle: `linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`
- **Neutrals**: Gray scale only (white, gray-50 through gray-900, black)

### UI Principles
- **NO ICONS**: Never use any icons (Lucide React, Heroicons, etc.). Use text, shapes, or pure visual elements only
- **Clean Typography**: Text-only navigation and interfaces
- **Rounded Corners**: 
  - Cards: `rounded-2xl` (16px)
  - Buttons: `rounded-xl` (12px)
  - Small elements: `rounded-lg` (8px)
- **Spacing**: Generous whitespace using Tailwind spacing scale
- **Shadows**: Subtle shadows with pink/purple tints where appropriate

## Development Commands

### Core Development
```bash
# Start development servers separately
cd apps/web && yarn dev     # Start Next.js frontend (port 3000)
cd apps/agents && yarn dev  # Start LangGraph agents server (port 54367)

# Build and deployment
yarn build                  # Build all packages using Turbo
yarn lint                   # Lint all packages
yarn lint:fix              # Fix linting issues
yarn format                 # Format code with Prettier

# Note: Deployment scripts referenced but not present
# yarn deploy              # Script file missing: ./scripts/deploy.sh
# yarn deploy:web          # Script file missing: ./scripts/deploy-web-only.sh
# yarn deploy:firebase     # Script file missing: ./scripts/deploy-firebase.sh
# yarn deploy:agents       # Script file missing: ./scripts/deploy-agents.sh

# Docker operations
yarn docker:build          # Build Docker image
yarn docker:run           # Run container with env file
yarn docker:up             # Start with docker-compose
yarn docker:down           # Stop docker-compose
```

### Package-specific Commands
```bash
# Web app (from apps/web/)
yarn dev                    # Start Next.js dev server
yarn build                  # Build Next.js app
yarn start                  # Start production server
yarn lint                   # Run ESLint
yarn lint:fix              # Fix linting issues
yarn format                 # Format with Prettier

# Agent server (from apps/agents/)
yarn dev                    # Start LangGraph CLI dev server on port 54367
yarn build                  # Build TypeScript to dist/
yarn clean                  # Clean build artifacts

# Run commands from project root using Turbo
yarn turbo dev --filter=@opencanvas/web
yarn turbo build --filter=@opencanvas/agents
```

## Architecture Overview

### Monorepo Structure
- **Root**: Yarn workspaces + Turbo orchestration
- **apps/web/**: Next.js 15 frontend with App Router
- **apps/agents/**: LangGraph-based AI agent system  
- **packages/shared/**: Common types, utilities, constants

### Technology Stack
- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API routes, Firebase (Firestore, Auth, Storage)
- **AI/ML**: LangChain, LangGraph, OpenAI, Anthropic, Google GenAI, Groq
- **State**: Zustand, React Context, SWR
- **Development**: Turbo, ESLint, Prettier, Docker

### Key Features
1. **Canvas**: AI-powered document/code editor with artifact generation
2. **Chat**: Multi-model conversational AI interface  
3. **Tasks**: Kanban-style project management with drag-and-drop
4. **Videos**: YouTube integration with upload scheduling and analytics
5. **Social Monitor**: Multi-platform social media management and AI responses
6. **Playlists**: Content organization and curation

## LangGraph Agent System

### Available Agents (langgraph.json)
- **agent**: Main conversation and artifact generation (`./apps/agents/src/open-canvas/index.ts:graph`)
- **reflection**: Memory generation and user insights (`./apps/agents/src/reflection/index.ts:graph`)  
- **thread_title**: Automatic conversation titling (`./apps/agents/src/thread-title/index.ts:graph`)
- **summarizer**: Content summarization (`./apps/agents/src/summarizer/index.ts:graph`)
- **web_search**: Internet search capabilities (`./apps/agents/src/web-search/index.ts:graph`)

### Agent Development
- Agents run on port 54367 (configured in langgraph.json)
- Start agent server: `cd apps/agents && yarn dev` (uses `npx @langchain/langgraph-cli dev`)
- Each agent is a separate TypeScript module with exported graph
- Use Node.js 20 runtime environment
- Environment variables loaded from root .env file
- Agent server must be running for Canvas and Chat features to work properly

## Environment Configuration

### Environment Variables

All configuration is consolidated in the root `.env` file:
- **LangChain**: API keys and project configuration
- **AI Models**: OpenAI, Anthropic, Google, Groq API keys  
- **Firebase**: Complete Firebase configuration including service account JSON
- **YouTube**: OAuth credentials and API keys
- **Feature Flags**: Model enablement toggles (NEXT_PUBLIC_*_ENABLED)

### Important Notes

- Web app accesses root .env via symlink: `apps/web/.env.local` → `../../.env`
- Turbo configuration passes specific env vars to build tasks
- Firebase requires service account JSON for server-side operations
- YouTube integration uses OAuth2 with refresh tokens

## Development Patterns

### File Structure Conventions

- **API Routes**: `apps/web/src/app/api/` (Next.js App Router)
- **Components**: `apps/web/src/components/` (organized by feature)
- **Pages**: `apps/web/src/app/` (App Router file-based routing)
- **Shared Code**: `packages/shared/src/` (types, utils, constants)
- **Agent Code**: `apps/agents/src/` (LangGraph agent implementations)

### Key Architectural Patterns

- **Server Components**: Use for data fetching and SEO-critical content
- **Client Components**: Use for interactive features, marked with 'use client'
- **Streaming**: Real-time AI responses using streaming APIs
- **State Management**: Zustand stores for global state, React Context for auth
- **Error Handling**: Error boundaries and loading states throughout UI

### Database & Storage

- **Firestore**: Primary database (custom database: "pbl-backend")
- **Firebase Storage**: File uploads and static assets
- **Google Cloud Storage**: Video processing and large file storage
- **Collections**: videos-master, users, conversations, artifacts

## Testing & Quality

### Code Quality

- ESLint configuration extends Next.js and Prettier rules
- TypeScript strict mode enabled
- Prettier for consistent formatting
- Import organization with eslint-plugin-import

### Build Process

- Turbo handles monorepo builds with dependency graph
- Next.js builds to standalone output for Docker deployment
- Webpack configuration includes Node.js polyfills for client-side compatibility
- Build outputs cached in `.next/` and `dist/` directories

## Deployment & Infrastructure

### Firebase Configuration

- **Hosting**: Static assets with CDN caching
- **Functions**: Serverless backend logic
- **Database**: Firestore with custom rules and indexes
- **Authentication**: Custom token handling with NextAuth.js integration

### Docker Support

- Multi-stage Dockerfile for production builds
- Environment-based configuration
- Standalone Next.js output for optimal container size
- Docker Compose for local development environment

### Important Deployment Notes

- Always run build before deployment to catch TypeScript errors
- Firebase requires proper service account configuration
- Agent system deploys separately from web frontend
- YouTube integration requires OAuth redirect URL configuration

## Common Development Tasks

### Starting Development Environment

1. Start the agent server (required for AI features):
   ```bash
   cd apps/agents && yarn dev
   ```
2. In a new terminal, start the Next.js frontend:
   ```bash
   cd apps/web && yarn dev
   ```
3. Access the application at http://localhost:3000

### Adding New AI Models

1. Add API key to `.env` file
2. Add feature flag: `NEXT_PUBLIC_[MODEL]_ENABLED=true`
3. Update model configuration in shared types
4. Add model selection UI in chat interface

### Modifying Agent Behavior

1. Edit agent graph in `apps/agents/src/[agent-name]/index.ts`
2. Update agent configuration in langgraph.json if needed
3. Test agent locally with `yarn dev:server`
4. Deploy agents with `yarn deploy:agents`

### Database Schema Changes

1. Update Firestore security rules if needed
2. Update TypeScript types in `packages/shared/src/types.ts`
3. Add data migration scripts if breaking changes
4. Test with Firebase emulator for complex changes

### Environment Issues

- Ensure all required environment variables are set in root `.env`
- Check that symlink exists: `apps/web/.env.local` → `../../.env`
- Verify Firebase service account JSON is properly formatted
- Test OAuth redirects match configured URLs

When debugging build failures, check:

1. TypeScript compilation errors
2. Environment variable availability
3. Import path correctness between packages
4. Firebase configuration completeness
