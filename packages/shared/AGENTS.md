# Shared Domain & Schemas Guidelines (@repo/shared)

This document defines the architectural guidelines and conventions for **`@repo/shared`**, the isomorphic core package shared between frontend and backend.

---

## 1. Tech Stack Overview

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Language** | TypeScript (Strict mode) | Pure TypeScript source compiled to `.d.ts` and `.js` |
| **Compiler** | `tsc` | Emits declaration files and compiled JavaScript |
| **Validation** | Zod (`zod`) | Isomorphic runtime schema validation |
| **Linter / Formatter** | Biome (`@biomejs/biome`) | Code formatting and linting |

---

## 2. Directory Structure

```
packages/shared/
├── src/
│   ├── constants/             # Shared business and HTTP constants
│   │   └── index.ts           # HttpStatus, UserRole, UserStatus, etc.
│   ├── schemas/               # Shared Zod validation schemas
│   │   ├── auth.schema.ts     # loginSchema, registerSchema
│   │   └── user.schema.ts     # updateProfileSchema, queryUsersSchema
│   ├── types/                 # Shared TypeScript data types and DTOs
│   │   ├── admin.ts           # AdminMetricsDto, etc.
│   │   ├── api.ts             # ApiResponse<T>, PaginatedResponse<T>, ApiError
│   │   └── user.ts            # UserProfileDto, UserSummaryDto, etc.
│   └── index.ts               # Main package barrel export
├── tsconfig.json              # Extends @repo/tsconfig/base.json
└── package.json               # Package configuration
```

---

## 3. Best Practices & Rules

1. **Zero Runtime Dependencies**: Keep dependencies minimal. Only isomorphic, environment-agnostic libraries like `zod` are allowed. Never import Node.js-only (`node:*`, `fs`, `path`) or Browser-only (`window`, `document`) modules.
2. **Single Source of Truth**: All cross-cutting types (DTOs, HTTP responses) and validation rules MUST be defined here and consumed by both `apps/api-lambda` and frontend applications (`apps/admin-web`, `apps/user-web`).
3. **Zod Infer Types**: Derive TypeScript types directly from Zod schemas when applicable (e.g. `type LoginInput = z.infer<typeof loginSchema>`) to maintain type-schema synchronization.

