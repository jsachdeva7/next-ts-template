# Next TS Template (Supabase)

Base template for Next.js (TypeScript) projects with Supabase BaaS,
preconfigured with:

- pnpm (package manager + lockfile)
- Tailwind (styling)
- TanStack Query (server-state caching for React)
- Supabase (BaaS)

## `src` Directory Structure

```text
├─ src/
│  ├─ app/              # Next.js App Router routes, layouts, pages
│  │  ├─ api/             # Route handlers (HTTP endpoints)
│  ├─ features/         # Feature modules (client and server components, hooks, types)
│  ├─ lib/              # Application-wide utilities (logger, caching, etc.)
│  ├─ server/           # Server-side domain logic and infrastructure
│  │  ├─ auth/            # Session, OAuth, and auth guards
│  │  ├─ db/              # Supabase client setup and shared models
│  │  ├─ actions/         # Shared server actions (for client components)
│  │  ├─ commands/        # Write operations (create/update/delete)
│  │  ├─ queries/         # Read operations and query builders
│  │  └─ services/        # 3rd-party adapters (email, payments, external APIs)
│  └─ ui/               # Atomic UI components shared across the app
└─ public/              # Static assets served as-is
```

## `pnpm`

This repo uses pnpm. Use `pnpm install` / `pnpm dev` (don’t generate npm/yarn
lockfiles).
