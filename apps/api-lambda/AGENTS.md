# Backend Architecture & Guidelines - API Lambda (@repo/api-lambda)

This document defines the architectural guidelines, tech stack details, and directory organization for the **API Lambda** serverless backend service.

---

## 1. Tech Stack Overview

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Runtime** | Node.js (>= 20.0) | Standard serverless runtime environment |
| **Language** | TypeScript (Strict mode) | Strict type safety for handlers, services, and data models |
| **Target Platform** | AWS Lambda | Serverless execution model using API Gateway HTTP API v2 |
| **Bundler** | `tsup` (esbuild) | High-performance bundling of standalone ESM Lambda handlers |
| **Local Development** | `tsx` | Instant TypeScript execution & hot reload for local HTTP server |
| **Validation** | Zod (via `@repo/shared`) | Isomorphic runtime schema validation for request payloads |
| **Linting & Formatting** | Biome (`@biomejs/biome`) | High-performance unified linter and formatter |

---

## 2. Directory Structure

The backend follows a modular, layered architecture:

```
apps/api-lambda/
├── src/
│   ├── core/                  # Core abstractions and shared backend utilities
│   │   ├── errors.ts          # Standardized HTTP error hierarchy (AppError, ValidationError, etc.)
│   │   ├── response.ts        # Standardized API response formatters (formatSuccessResponse)
│   │   └── types.ts           # Core backend type definitions & context
│   │
│   ├── handlers/              # Serverless entrypoints (1 file = 1 Lambda handler)
│   │   ├── admin/
│   │   │   ├── list-users.ts  # GET /admin/users handler
│   │   │   └── metrics.ts     # GET /admin/metrics handler
│   │   ├── auth/
│   │   │   └── login.ts       # POST /auth/login handler
│   │   ├── users/
│   │   │   └── get-profile.ts # GET /users/profile handler
│   │   └── health.ts          # GET /health handler
│   │
│   ├── middleware/            # Handler middleware wrappers
│   │   ├── with-middleware.ts # Global error handling, CORS, and logging wrapper
│   │   └── with-validator.ts  # Zod schema validation helper (validateBody)
│   │
│   ├── modules/               # Domain-driven business modules (Services & Repositories)
│   │   ├── admin/
│   │   │   └── admin.service.ts
│   │   ├── auth/
│   │   │   └── auth.service.ts
│   │   └── users/
│   │       ├── users.repository.ts
│   │       └── users.service.ts
│   │
│   └── local-server.ts        # Local Node.js HTTP server simulating API Gateway on port 4000
├── tsup.config.ts             # Tsup multi-entry configuration for Lambda bundling
├── tsconfig.json              # TypeScript configuration extending @repo/tsconfig/node.json
└── package.json               # Package configuration and dependencies
```

---

## 3. Architectural Boundaries & Best Practices

### A. Strict Backend Decoupling
- `apps/api-lambda` must **never** import any frontend libraries (Vue, Naive UI, Vue Router, Pinia, DOM APIs).
- Inter-layer dependencies: Handlers $\rightarrow$ Services $\rightarrow$ Repositories.

### B. Thin Handlers Pattern
- Handlers in `src/handlers/` serve solely as HTTP transport adapters:
  1. Validate incoming event payloads using `validateBody` and `@repo/shared` schemas.
  2. Invoke domain service methods in `src/modules/<domain>/`.
  3. Return standardized HTTP responses using `formatSuccessResponse()`.
- Handlers should not contain complex business calculation logic.

### C. Middleware Pipeline
- Wrap every Lambda handler with `withMiddleware()`:
  ```ts
  export const handler = withMiddleware(async (req) => {
    const body = validateBody(mySchema, req.body);
    const data = await myService.execute(body);
    return formatSuccessResponse(data);
  });
  ```
- `withMiddleware` automatically catches domain exceptions (`AppError`), sets appropriate HTTP status codes, formats error JSON payloads, and handles CORS headers.

### D. Local Development Server
- Run local development server using `pnpm dev:lambda` (or `pnpm dev` at the root).
- `local-server.ts` mirrors API Gateway routes onto `http://localhost:4000`, enabling live API testing without deploying to AWS.

### E. Bundling with `tsup`
- Each handler is defined as an individual entry in `tsup.config.ts`.
- Output bundles are emitted to `dist/handlers/` as self-contained ESM artifacts ready for deployment to AWS Lambda.

