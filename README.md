# Next TS Template

Base template for Next.js (TypeScript) projects, preconfigured with:

- pnpm (package manager + lockfile)
- Tailwind (styling)
- TanStack Query (server-state caching for React)

## `src` Directory Structure

```text
├─ src/
│  ├─ app/              # Next.js App Router routes, layouts, pages
│  │  ├─ api/             # Route handlers (HTTP endpoints)
│  ├─ features/         # Feature modules (UI, hooks, types, server actions per domain)
│  ├─ lib/              # Application-wide utilities (logger, caching, etc.)
│  ├─ server/           # Server-side domain logic and infrastructure
│  │  ├─ auth/            # Session, OAuth, and auth guards
│  │  ├─ db/              # DB client setup and shared models
│  │  ├─ commands/        # Write operations (create/update/delete)
│  │  └─ queries/         # Read operations and query builders
│  └─ ui/               # Atomic UI components shared across the app
└─ public/              # Static assets served as-is
```

## `pnpm`

This repo uses pnpm. Use `pnpm install` / `pnpm dev` (don’t generate npm/yarn
lockfiles).
