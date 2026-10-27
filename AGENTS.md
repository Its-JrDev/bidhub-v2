# AGENTS.md

> **Single Source of Truth (SSOT)**: Project configuration, paths, and harness definitions are defined in `lumen.config.json`. Consult `lumen.config.json` for the authoritative settings.

<!-- BEGIN:nextjs-agent-rules -->
## This is NOT the Next.js you know
This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in node_modules/next/dist/docs/ (resolved from this file's directory...) before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

### Next.js Component Rules

- By default, all components in the App Router are React Server Components (RSC).
- Use the `"use client"` directive only at the top of files that require browser APIs, React state, or event handlers.
- Never import server-only modules or secrets into client components.

## Architecture & Conventions

- **Architecture Preset**: `feature-based`
- **Validation Mode**: `strict` (strict: architecture boundaries are enforced — do not import across features except via barrels or shared paths; violations must be fixed.)
- **Paths Resolution**: Resolve file locations via `paths.*` defined in `lumen.config.json` — never hardcode arbitrary alternative locations.
- **Feature Barrels**: Every feature directory (under `src/features/<feature>/`) must re-export its public API via `index.ts`.
- **Shared Imports**: Import shared utilities via `@/shared` (plus path aliases configured in tsconfig/jsconfig).

## Component Taxonomy

Components must be organized strictly according to `lumen.config.json` path mappings:
- **Atomic UI Primitives**: Base atoms and UI primitives (e.g. shadcn components) belong in `paths.ui` (`src/shared/components/ui`).
- **Compound Components**: Shared composite components belong in `paths.components` (`src/shared/components`).
- **Feature Components**: Domain-specific components belong inside their respective feature folder (e.g. `src/features/<feature>/components`).

Lumen CLI and AI agents must place primitive UI atoms under `paths.ui`, global compound components under `paths.components`, and feature-scoped components in their respective feature folders.

## Path Mappings

- features: `src/features`
- components: `src/shared/components`
- services: `src/shared/services`
- hooks: `src/shared/hooks`
- pages: `src/app`
- ui: `src/shared/components/ui`

## Validation Harness

Before finishing work, run each harness command defined in `lumen.config.json` `harness.commands` in order (`eslint .`, `prettier --check .`, `tsc -b`, `npm run build`):

- `lint`: `eslint .` (required)
- `format`: `prettier --check .` (required)
- `types`: `tsc -b` (required)
- `build`: `npm run build` (required)
