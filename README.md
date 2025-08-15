# StarTynk Monorepo

A professional monorepo structure using Turborepo for managing web and mobile applications.

## Structure

```
.
├── apps/
│   ├── web/          # Next.js web application
│   └── mobile/       # React Native Expo application
├── packages/
│   ├── shared/       # Shared types and utilities
│   ├── config/       # Shared configuration (ESLint, TypeScript)
│   └── ui/           # Shared UI components (future)
```

## Getting Started

### Prerequisites

- Node.js >= 18.17.0
- pnpm (installed as dev dependency)

### Installation

```bash
npx pnpm install
```

### Development

Run both applications in development mode:

```bash
npx pnpm dev
```

Run specific app:

```bash
npx pnpm dev --filter=@repo/web
npx pnpm dev --filter=@repo/mobile
```

### Building

Build all applications:

```bash
npx pnpm build
```

### Type Checking

Run type checking across the monorepo:

```bash
npx pnpm type-check
```

### Linting

Run linting across the monorepo:

```bash
npx pnpm lint
```

## Workspaces

- `@repo/web` - Next.js web application
- `@repo/mobile` - React Native Expo application
- `@repo/shared` - Shared types and utilities
- `@repo/config-typescript` - Shared TypeScript configuration
- `@repo/config-eslint` - Shared ESLint configuration
- `@repo/ui` - Shared UI components (placeholder for future)

## Technology Stack

- **Monorepo**: Turborepo
- **Package Manager**: pnpm
- **Web**: Next.js, Prisma, NextAuth, TypeScript
- **Mobile**: React Native, Expo, TypeScript
- **Shared**: TypeScript, Zod
