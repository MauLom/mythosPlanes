# mythosPlanes

A modern TypeScript monorepo for the mythosPlanes application, built with pnpm, Turborepo, and strict TypeScript configuration.

## 🏗️ Monorepo Structure

```
mythosPlanes/
├── apps/
│   ├── client/          # Client application
│   └── server/          # Server application
├── packages/
│   └── types/           # Shared TypeScript types
├── tsconfig.base.json   # Base TypeScript configuration (strict mode)
├── turbo.json           # Turborepo pipeline configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── package.json         # Root package with scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Available Scripts

- **`pnpm dev`** - Run all apps in development mode with hot reload
- **`pnpm build`** - Build all packages and apps
- **`pnpm lint`** - Lint all packages and apps with TypeScript
- **`pnpm test`** - Run tests across all packages and apps

## 📦 Packages

### `packages/types` (@mythos/types)

Shared TypeScript types and interfaces used across the monorepo. Accessible via the `@mythos/types` path alias.

## 🔧 TypeScript Configuration

The monorepo uses a strict TypeScript configuration (`tsconfig.base.json`) with:

- **Strict mode** enabled with additional checks
- **Path aliases** configured (`@mythos/types`)
- **ESNext** module system with bundler resolution
- **Composite** projects for fast incremental builds

## 🔄 Turborepo Pipeline

The build pipeline automatically handles dependencies between packages:

1. `packages/types` builds first
2. `apps/client` and `apps/server` build after types are ready
3. Parallel builds where possible for speed

## 📝 Code Style

- Uses `.editorconfig` for consistent formatting
- Follows strict TypeScript standards
- 2-space indentation
- LF line endings