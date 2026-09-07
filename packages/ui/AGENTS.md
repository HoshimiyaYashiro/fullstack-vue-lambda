# Shared UI Library Guidelines (@repo/ui)

This document defines the guidelines, component architecture, and design tokens for the shared **`@repo/ui`** component library.

---

## 1. Tech Stack Overview

| Category | Technology | Description |
| :--- | :--- | :--- |
| **Framework** | Vue 3 (`<script setup>`) | Reusable UI component library |
| **Language** | TypeScript (Strict mode) | Type-safe props, emits, and slots |
| **Component Base** | Naive UI | Underlying enterprise UI system |
| **Composables** | `@vueuse/core` | Reactive composition utilities for UI components |
| **Shared Domain** | `@repo/shared` | Shared isomorphic types, schemas, and constants |
| **Styling** | CSS Variables (`src/styles/theme.css`) | Central design tokens for colors, radii, spacing |
| **Type Check** | `vue-tsc` | Type checking without emission |
| **Linter / Formatter** | Biome (`@biomejs/biome`) | Code formatting and linting |

---

## 2. Directory Structure

```
packages/ui/
├── src/
│   ├── components/            # Reusable UI components
│   │   ├── AppBadge.vue       # Status badge wrapper
│   │   ├── AppButton.vue      # Primary/secondary action button
│   │   ├── AppCard.vue        # Container card with header/footer slots
│   │   ├── AppConfigProvider.vue # Global Naive UI theme & locale provider
│   │   ├── AppInput.vue       # Text input wrapper
│   │   └── AppNavbar.vue      # Top navigation header component
│   ├── styles/                # CSS variable theme definitions
│   │   └── theme.css          # Design tokens (colors, radii, shadows, font)
│   ├── theme/                 # Naive UI theme overrides
│   │   └── index.ts
│   └── index.ts               # Main package barrel export
├── tsconfig.json              # Extends @repo/tsconfig/vue.json
└── package.json               # Package configuration
```

---

## 3. Best Practices & Rules

1. **Prefix Convention**: All exported reusable components MUST be prefixed with `App` (e.g., `AppButton`, `AppCard`, `AppNavbar`). This enables automated resolution in consumer applications via `unplugin-vue-components`.
2. **Framework Decoupling**: Components in `@repo/ui` must NOT depend on Vue Router or Pinia stores. Keep components dumb/presentational by accepting data via `props` and emitting events via `emits`.
3. **Design Tokens**: Style components using CSS variables defined in `src/styles/theme.css` (`var(--color-primary)`, `var(--radius-md)`, etc.) to maintain visual consistency across all consuming apps.

