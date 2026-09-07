# API Client SDK Guidelines (@repo/api-client)

This document defines the architecture, conventions, and query management rules for the **`@repo/api-client`** shared package.

---

## 1. Tech Stack Overview

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Language** | TypeScript (Strict mode) | Type-safe API client and query wrappers |
| **Framework Integration**| Vue 3 + TanStack Query (`@tanstack/vue-query`) | Reactive caching, background synchronization, and hooks |
| **Type Check** | `vue-tsc` | Type validation without emission |
| **Linter / Formatter** | Biome (`@biomejs/biome`) | Code formatting and linting |

---

## 2. Directory Structure

```
packages/api-client/
├── src/
│   ├── client.ts              # Typed HTTP fetch wrapper (api.get, api.post, etc.)
│   └── index.ts               # Barrel re-exporting client, VueQueryPlugin, and TanStack Query hooks
├── tsconfig.json              # Extends @repo/tsconfig/vue.json
└── package.json               # Package configuration
```

---

## 3. Best Practices & Rules

1. **Typed Requests**: All HTTP calls via `api.get<T>()`, `api.post<T>()`, `api.put<T>()`, `api.delete<T>()` must return typed results wrapped in standard API response types from `@repo/shared`.
2. **TanStack Vue Query Gateway**: Export `useQuery`, `useMutation`, `useQueryClient`, and `VueQueryPlugin` through this package so frontend apps do not directly depend on `@tanstack/vue-query`.
3. **Decoupling**: The client must remain agnostic to specific frontend routing or state logic. Configuration (such as base URL or auth token injection) should be adaptable.

