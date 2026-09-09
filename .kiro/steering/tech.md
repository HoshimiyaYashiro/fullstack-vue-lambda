# Technology Stack

## Architecture

Enterprise monorepo managed with **Turborepo** and **pnpm workspaces**, employing clean architectural separation across frontend consumer applications, serverless backend handlers, and shared domain/UI packages.

```
[user-web] (Port 3000)  ───┐
                            ├───> [@repo/api-client] ───> [@repo/shared] <─── [api-lambda] (Port 4000)
[admin-web] (Port 3001) ───┘                ▲
       │                                    │
       └──────────> [@repo/ui] ─────────────┘
```

## Core Technologies

- **Monorepo Engine**: Turborepo v2 with pnpm workspaces (`pnpm@11.x`)
- **Language**: TypeScript (Strict mode across all packages)
- **Frontend Framework**: Vue 3 (Composition API with `<script setup>`)
- **Backend Runtime**: Node.js (>= 20.0.0), AWS Lambda with API Gateway HTTP API v2
- **Bundlers**: Vite (frontends) and `tsup` / esbuild (backend serverless handlers)

## Key Libraries

- **Frontend UI & Styling**: Naive UI, UnoCSS (`presetWind3`), `@vueuse/core`
- **Routing & State**: Vue Router (`unplugin-vue-router`), Pinia
- **Data Fetching**: TanStack Query (`@tanstack/vue-query`) via `@repo/api-client`
- **Internationalization**: Vue I18n (`@intlify/unplugin-vue-i18n`)
- **Cloud & Auth**: AWS Amplify (`aws-amplify`)
- **Validation**: Zod (isomorphic runtime validation via `@repo/shared`)
- **Testing**: Playwright (end-to-end browser testing)

## Development Standards

### Type Safety
- Monorepo-wide strict TypeScript configuration (`packages/tsconfig/`).
- Zero `any` policy; strict null and undefined checks.
- Types derived directly from Zod validation schemas (`z.infer<typeof schema>`) to maintain frontend-backend contract parity.

### Code Quality
- **Unified Tooling**: Exclusively **Biome** (`@biomejs/biome`) for all linting and code formatting. No ESLint or Prettier.
- **Rules**: 2 spaces, single quotes in JavaScript/TypeScript, trailing commas (`es5`), 100 character line width.

### Testing
- End-to-end user journeys and admin workflows tested using Playwright.
- Type integrity verified continuously across all workspaces before build steps.

## Development Environment

### Required Tools
- Node.js `>= 20.0.0`
- pnpm `>= 9.0.0` (monorepo configured for pnpm 11.x)

### Common Commands

```bash
# Start all dev servers concurrently
pnpm dev

# Start specific service
pnpm dev:user      # User web app (http://localhost:3000)
pnpm dev:admin     # Admin web app (http://localhost:3001)
pnpm dev:lambda    # AWS Lambda dev gateway (http://localhost:4000)

# Build & verification
pnpm build         # Build all packages and applications
pnpm check         # Monorepo-wide TypeScript type check
pnpm lint          # Run Biome lint checks
pnpm lint:fix      # Auto-fix linting and formatting issues
pnpm format        # Run Biome code formatter
pnpm test:e2e      # Run Playwright end-to-end test suite
pnpm clean         # Clean build artifacts and Turbo cache
```

## Key Technical Decisions

- **Single Validation Source of Truth (`@repo/shared`)**: Forms validate on client inputs using identical Zod schemas enforced on Lambda middleware, preventing contract drift.
- **Tree-Shaken Lambda Bundling (`tsup`)**: Each Lambda entrypoint is compiled into a standalone, tree-shaken ESM module to minimize cold start duration and package footprint.
- **Query Segregation**: Shared package `@repo/api-client` provides generic HTTP transport primitives and TanStack Query exports; concrete business queries reside within application boundaries to prevent leaking privileged administrative endpoints.
- **Unified Biome Toolchain**: Replaced legacy ESLint/Prettier combinations with Biome for near-instant linting and formatting across large workspace trees.

---
_Document standards and patterns, not every dependency_

