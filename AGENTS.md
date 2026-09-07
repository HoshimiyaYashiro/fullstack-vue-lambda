# Antigravity & Agent Guidelines

This document defines mandatory guidelines and constraints that any AI Agent must strictly follow when working within this repository.

---

## 1. Documentation & Markdown Language Rule

- **Language Uniformity**: Regardless of the language used in conversation or user prompts, **all generated Markdown (`.md`) files, technical documentation, code comments, and skills MUST be written in English**.
- Keep documentation clear, concise, and structured according to GitHub Flavored Markdown (GFM).

---

## 2. Monorepo Architecture Overview

This project is an enterprise monorepo managed with **Turborepo** and **pnpm workspaces**:

### Applications (`apps/`)
- `apps/admin-web`: Back-office admin dashboard.
  - **Tech Stack**: Vue 3 (Composition API), TypeScript, Vite, Naive UI, UnoCSS (`presetWind3`), Vue Router (`unplugin-vue-router`), Layouts (`vite-plugin-vue-layouts-next`), I18n (`@intlify/unplugin-vue-i18n`, `vue-i18n`), TanStack Query, Pinia, AWS Amplify (`aws-amplify`), Vue Macros (`vue-macros`), `@unhead/vue`, `@vueuse/core`, Playwright.
- `apps/user-web`: Customer-facing web application.
  - **Tech Stack**: Vue 3 (Composition API), TypeScript, Vite, Naive UI, UnoCSS (`presetWind3`), Vue Router (`unplugin-vue-router`), Layouts (`vite-plugin-vue-layouts-next`), I18n (`@intlify/unplugin-vue-i18n`, `vue-i18n`), TanStack Query, Pinia, AWS Amplify (`aws-amplify`), Vue Macros (`vue-macros`), `@unhead/vue`, `@vueuse/core`, Playwright.
- `apps/api-lambda`: Serverless backend running on AWS Lambda.
  - **Tech Stack**: Node.js (>=20.0), TypeScript, AWS Lambda (`@types/aws-lambda`), `tsup` (ESM bundler), `tsx` (local development server), Zod runtime validation.

### Shared Packages (`packages/`)
- `packages/ui`: Shared UI component library (`AppButton`, `AppCard`, `AppInput`, `AppNavbar`, `AppBadge`, `AppConfigProvider`) and design tokens (`styles/theme.css`) consumed by frontend applications.
- `packages/shared`: Common utilities, HTTP/domain constants, shared Zod data schemas (`auth.schema.ts`, `user.schema.ts`), and isomorphic TypeScript types (`UserProfileDto`, `ApiResponse`, etc.).
- `packages/api-client`: Typed API client / SDK for consuming Lambda endpoints, powered by TanStack Vue Query (`@tanstack/vue-query`) and typed HTTP fetch wrappers.
- `packages/tsconfig`: Centralized, shared TypeScript configurations (`base.json`, `vue.json`, `node.json`).

### Monorepo Structure Overview

```
fullstack-vue-lambda/
├── apps/
│   ├── admin-web/             # Back-office admin web application (Port 3001)
│   ├── user-web/              # Customer portal web application (Port 3000)
│   └── api-lambda/            # Serverless AWS Lambda backend handlers (Port 4000)
├── packages/
│   ├── api-client/            # Shared TanStack Query client & HTTP SDK
│   ├── shared/                # Shared types, Zod schemas, constants
│   ├── tsconfig/              # Centralized tsconfig configurations
│   └── ui/                    # Reusable Vue component library & theme CSS
├── biome.json                 # Unified Biome linter & formatter configuration
├── pnpm-workspace.yaml        # pnpm monorepo workspace definition
├── turbo.json                 # Turborepo task pipeline configuration
└── AGENTS.md                  # Global Agent guidelines & SDLC rules
```

---

## 3. Architectural Boundaries & Separation of Concerns

- **No Cross-App Imports**: Code in `apps/admin-web` and `apps/user-web` must **never** directly import from each other.
- **Shared Code Extraction**:
  - Business logic, schemas, and helpers used across packages belong in `packages/shared`.
  - Reusable visual components belong in `packages/ui`.
- **Backend Decoupling**:
  - `apps/api-lambda` must remain strictly decoupled from any frontend dependencies (Vue, Naive UI, router, DOM APIs).
  - Frontend apps communicate with the backend exclusively via `packages/api-client`.

---

## 4. Package Management & Shell Commands

- **Package Manager**: Exclusively use **`pnpm`** (v9.0+ / v11.x). **Never** run `npm` or `yarn`.
- **Scoped Dependency Installation**:
  - Do **not** install dependencies at the monorepo root unless they are repo-wide dev tools (e.g., Turbo, Biome).
  - Always use `pnpm --filter` to target specific packages:
    ```bash
    pnpm --filter @repo/admin-web add <package-name>
    ```
- **Internal Workspace Dependencies**: Always use the `"workspace:*"` protocol when referencing internal packages in `package.json`.

---

## 5. Code Quality, Linting & Formatting

- **Tooling**: This project uses **Biome** (`@biomejs/biome`) as the unified formatter and linter.
  - Do **not** introduce ESLint or Prettier configurations.
  - Before completing any task, ensure code complies with Biome:
    - Lint check: `pnpm lint`
    - Auto-fix lint and formatting: `pnpm lint:fix`
    - Format code: `pnpm format`
- **TypeScript**:
  - Maintain strict type safety. Avoid `any` types.
  - Verify types across the repository with:
    ```bash
    pnpm check
    ```

---

## 6. Common Development Commands

| Task | Command |
| :--- | :--- |
| **Start All (Dev)** | `pnpm dev` |
| **Dev User Web** | `pnpm dev:user` |
| **Dev Admin Web** | `pnpm dev:admin` |
| **Dev Lambda Backend** | `pnpm dev:lambda` |
| **Build All** | `pnpm build` |
| **Build User Web** | `pnpm build:user` |
| **Build Admin Web** | `pnpm build:admin` |
| **Build Lambda** | `pnpm build:lambda` |
| **Lint & Format Check** | `pnpm lint` |
| **Lint & Format Auto-fix** | `pnpm lint:fix` |
| **Type Check** | `pnpm check` |
| **Clean Build Artifacts** | `pnpm clean` |


# Agentic SDLC and Spec-Driven Development

Kiro-style Spec-Driven Development on an agentic SDLC

## Project Memory
Project memory keeps persistent guidance (steering, specs notes, component docs) so OpenCode honors your standards each run. Treat it as the long-lived source of truth for patterns, conventions, and decisions.

- Use `.kiro/steering/` for project-wide policies: architecture principles, naming schemes, security constraints, tech stack decisions, api standards, etc.
- Use local `AGENTS.md` files for feature or library context (e.g. `src/lib/payments/AGENTS.md`): describe domain assumptions, API contracts, or testing conventions specific to that folder. OpenCode auto-loads these when working in the matching path.
- Specs notes stay with each spec (under `.kiro/specs/`) to guide specification-level workflows.

## Project Context

### Paths
- Steering: `.kiro/steering/`
- Specs: `.kiro/specs/`

### Steering vs Specification

**Steering** (`.kiro/steering/`) - Guide AI with project-wide rules and context
**Specs** (`.kiro/specs/`) - Formalize development process for individual features

### Active Specifications
- Check `.kiro/specs/` for active specifications
- Use `/kiro-spec-status [feature-name]` to check progress

## Development Guidelines
- Think in English, generate responses in English. All Markdown content written to project files (e.g., requirements.md, design.md, tasks.md, research.md, validation reports) MUST be written in the target language configured for this specification (see spec.json.language).

## Minimal Workflow
- Phase 0 (optional): `/kiro-steering`, `/kiro-steering-custom`
- Discovery: `/kiro-discovery "idea"` — determines action path, writes brief.md + roadmap.md for multi-spec projects
- Phase 1 (Specification):
  - Single spec: `/kiro-spec-quick {feature} [--auto]` or step by step:
    - `/kiro-spec-init "description"`
    - `/kiro-spec-requirements {feature}`
    - `/kiro-validate-gap {feature}` (optional: for existing codebase)
    - `/kiro-spec-design {feature} [-y]` *(Requires user discussion on Basic UI, OpenAPI, and DBML)*
    - `/kiro-validate-design {feature}` (optional: design review)
    - `/kiro-spec-tasks {feature} [-y]`
  - Multi-spec: `/kiro-spec-batch` — creates all specs from roadmap.md in parallel by dependency wave
- Phase 2 (Implementation): `/kiro-impl {feature} [tasks]`
  - Without task numbers: autonomous mode (subagent per task + independent review + final validation)
  - With task numbers: manual mode (selected tasks in main context, still reviewer-gated before completion)
  - `/kiro-validate-impl {feature}` (standalone re-validation)
- Progress check: `/kiro-spec-status {feature}` (use anytime)

## Spec Design Requirements (`/kiro-spec-design`)

When executing `/kiro-spec-design` (or drafting the design phase of a specification), the agent **MUST collaborate and explicitly discuss with the user** the following three mandatory architectural pillars before finalizing `design.md`:

1. **Basic UI / UX Design**:
   - Screen layouts, wireframes, component hierarchy, user interaction flows, and UI states (loading, error, empty).
   - Component reuse strategy (leveraging `@repo/ui` and Naive UI).
2. **Standard API Design (OpenAPI Specification)**:
   - RESTful endpoint contracts formatted according to OpenAPI 3.x specifications (`paths`, HTTP methods, request bodies, query/path parameters, HTTP status codes, error responses, and headers).
   - Reusable DTO schemas aligned with `@repo/shared` and runtime validation rules.
3. **Database Schema Design (DBML)**:
   - Data models, primary keys, relationships (`>`, `<`, `-`), indexes, enums, constraints, and audit fields documented in standard **DBML** (Database Markup Language) syntax.
   - Clear distinction between operational storage and caching layers.

## Skills Structure
Skills are located in `.opencode/skills/kiro-*/SKILL.md`
- Each skill is a directory with a `SKILL.md` file
- Use `/skills` to inspect currently available skills
- Invoke a skill directly with `/kiro-<skill-name>`
- **If there is even a 1% chance a skill applies to the current task, invoke it.** Do not skip skills because the task seems simple.
- `kiro-review` — task-local adversarial review protocol used by reviewer subagents
- `kiro-debug` — root-cause-first debug protocol used by debugger subagents
- `kiro-verify-completion` — fresh-evidence gate before success or completion claims

## Development Rules
- 3-phase approval workflow: Requirements → Design → Tasks → Implementation
- Human review required each phase; use `-y` only for intentional fast-track
- **Design Collaboration Gate**: In `/kiro-spec-design`, always discuss and align with the user on: (1) Basic UI layouts & user flows, (2) OpenAPI-compliant API design, and (3) DBML-compliant database schema.
- Keep steering current and verify alignment with `/kiro-spec-status`
- Follow the user's instructions precisely, and within that scope act autonomously: gather the necessary context and complete the requested work end-to-end in this run, asking questions only when essential information is missing or the instructions are critically ambiguous.

## Steering Configuration
- Load entire `.kiro/steering/` as project memory
- Default files: `product.md`, `tech.md`, `structure.md`
- Custom files are supported (managed via `/kiro-steering-custom`)
