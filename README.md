# Next TS Template
Base template for Next projects!

## `src` Directory Structure
```
├─ src/
|  ├─ app/              # Next.js App Router routes, layouts, pages
|  |  ├─ api/             # Server API routes that need to be exposed beyond application
│  ├─ features/         # Feature modules (UI, hooks, types, server actions for one domain)
│  ├─ lib/              # Application-wide utilities (logger, caching, etc.)
│  ├─ server/           # Server logic
|  |  ├─ auth/            # Session, OAuth, and auth guards
|  |  ├─ db/              # DB client setup and shared models
|  |  ├─ commands/        # Write operations (create/update/delete)
|  |  ├─ queries/         # Read operations and query builders
│  ├─ ui/               # Atomic components shared across the application
├─ public/              # Static assets served as-is
```
