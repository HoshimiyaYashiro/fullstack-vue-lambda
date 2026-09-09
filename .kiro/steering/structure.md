# Project Structure

## Organization Philosophy

The repository is structured as a **Turborepo monorepo** with clear architectural boundaries separating deployable applications (`apps/`) from reusable packages (`packages/`).

- **Frontend Applications**: Feature-driven organization using file-based routing (`pages/`), segregated queries (`queries/`), and modular UI features (`features/`).
- **Backend Service**: Clean, layered serverless architecture (`handlers/` $\rightarrow$ `modules/services/` $\rightarrow$ `modules/repositories/`).
- **Shared Packages**: Domain logic, UI primitives, and HTTP transport infrastructure decoupled from concrete application state.

## Directory Patterns

### Monorepo Apps (`apps/`)
**Location**: `apps/`  
**Purpose**: Independent deployable artifacts and entrypoints.
- `apps/user-web`: Customer-facing web portal (Vite, Vue 3, port 3000).
- `apps/admin-web`: Back-office management portal (Vite, Vue 3, port 3001).
- `apps/api-lambda`: AWS Lambda backend handlers and local dev gateway (port 4000).

### Shared Workspace Packages (`packages/`)
**Location**: `packages/`  
**Purpose**: Reusable code consumed across applications via `workspace:*`.
- `packages/shared`: Pure isomorphic schemas, DTOs, and constants. Must remain agnostic to DOM and Node.js-only APIs.
- `packages/ui`: Shared design system tokens (`styles/theme.css`), Naive UI theme configuration, and presentational components.
- `packages/api-client`: Typed base HTTP client wrapper (`ApiHttpClient`) and re-exported TanStack Query core.
- `packages/tsconfig`: Centralized TypeScript configurations (`base.json`, `vue.json`, `node.json`).

### Serverless Backend Layering (`apps/api-lambda/src/`)
**Location**: `apps/api-lambda/src/`  
**Purpose**: Modular backend with thin handlers and testable domain logic.
- `handlers/`: Thin entrypoints wrapping execution with `withMiddleware` (HTTP transport adapter only).
- `modules/<domain>/`: Domain-driven business services (`*.service.ts`) and data access layers (`*.repository.ts`).
- `core/`: Common error classes (`AppError`), status codes, and response formatters (`formatSuccessResponse`).
- `middleware/`: Common wrappers for CORS, auth, validation (`withValidator`), and centralized error handling.

### Frontend Application Layering (`apps/*-web/src/`)
**Location**: `apps/*-web/src/`  
**Purpose**: Vue 3 SPA architecture with automated component/route registration.
- `pages/`: File-based routes managed via `unplugin-vue-router`.
- `queries/`: Application-scoped TanStack Query hooks (e.g., `useProfileQuery`, `useAdminUsersQuery`).
- `features/`: Feature-sliced modules containing localized UI components and stores.
- `layouts/`: Shared page layouts managed via `vite-plugin-vue-layouts-next`.
- `locales/`: Internationalization translation dictionaries (`en.json`, `vi.json`).

## Naming Conventions

- **UI Components**: PascalCase prefixed with `App` for shared components in `@repo/ui` (e.g., `AppButton.vue`, `AppCard.vue`, `AppConfigProvider.vue`).
- **Lambda Handlers**: kebab-case single-purpose files matching route paths (e.g., `health.ts`, `auth/login.ts`, `users/get-profile.ts`).
- **Domain Services & Repositories**: `<domain>.service.ts` and `<domain>.repository.ts`.
- **Query Hooks**: camelCase prefixed with `use` and suffixed with `Query` or `Mutation` (e.g., `useProfileQuery`, `useLoginMutation`).
- **Zod Schemas & DTOs**: `<domain>.schema.ts` (e.g., `auth.schema.ts`, `user.schema.ts`) and `<domain>.ts` for type definitions.

## Import Organization

```typescript
// 1. External dependencies
import { defineComponent, ref } from 'vue';

// 2. Monorepo shared packages
import { loginSchema, type UserProfileDto } from '@repo/shared';
import { AppButton, AppCard } from '@repo/ui';
import { api, useQuery } from '@repo/api-client';

// 3. Application-internal aliases
import { useAuthStore } from '@/stores/auth';

// 4. Relative imports
import { formatLocalHelper } from './helpers';
```

**Path Aliases**:
- `@/`: Resolves to `./src` inside each frontend application.
- `@repo/*`: Resolves to workspace packages via `pnpm-workspace.yaml`.

## Code Organization Principles

1. **No Cross-App Imports**: `apps/admin-web` and `apps/user-web` must never import directly from each other.
2. **Strict Backend Decoupling**: `apps/api-lambda` must never depend on frontend libraries (Vue, Naive UI, router, DOM).
3. **Thin Handlers**: Handlers only parse input, call domain services, and return standardized responses.
4. **Dumb UI Components**: Reusable components in `@repo/ui` receive state via props and notify via emits; they must not couple to Pinia stores or router state.

---
_Document patterns, not file trees. New files following patterns shouldn't require updates_

