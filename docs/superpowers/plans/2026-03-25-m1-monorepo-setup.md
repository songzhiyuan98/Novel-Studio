# M1: Monorepo + Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up a pnpm monorepo with TypeScript, all packages, and lint/test infrastructure so that M2+ can start building features immediately.

**Architecture:** pnpm workspace monorepo with 6 packages: 2 apps (web, api) and 4 shared packages (core, orchestrator, prompts, llm-adapter). TypeScript with path aliases. Vitest for testing. ESLint + Prettier for code quality.

**Tech Stack:** Node.js >=20, pnpm 10, TypeScript 5.x, Next.js 15, Hono, Vitest, ESLint 9 (flat config), Prettier

**Prerequisites:** Install pnpm first: `npm install -g pnpm`

---

## File Structure

```
Novel-Studio/
├── package.json                    # root workspace config
├── pnpm-workspace.yaml             # workspace package locations
├── tsconfig.base.json              # shared TS config
├── .prettierrc                     # prettier config
├── eslint.config.js                # ESLint flat config
├── .gitignore                      # updated gitignore
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── next.config.ts
│   │   ├── src/
│   │   │   └── app/
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   └── __tests__/
│   │       └── placeholder.test.ts
│   └── api/                        # Hono backend
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── app.ts              # Hono app (no server start)
│       │   └── index.ts            # server entry point
│       └── __tests__/
│           └── placeholder.test.ts
├── packages/
│   ├── core/                       # shared domain types + schemas
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       └── placeholder.test.ts
│   ├── orchestrator/               # workflow engine (deterministic code)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       └── placeholder.test.ts
│   ├── prompts/                    # LLM prompt templates + output contracts
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   └── index.ts
│   │   └── __tests__/
│   │       └── placeholder.test.ts
│   └── llm-adapter/                # Vercel AI SDK wrapper
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   └── index.ts
│       └── __tests__/
│           └── placeholder.test.ts
└── docs/                           # (already exists)
```

---

### Task 1: Install pnpm and initialize root workspace

**Files:**

- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Update: `.gitignore`
- Create: `.npmrc`

- [ ] **Step 1: Install pnpm globally**

```bash
npm install -g pnpm
```

Verify: `pnpm -v` outputs a version number.

- [ ] **Step 2: Create root package.json**

```json
{
  "name": "novel-studio",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "lint": "eslint .",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  },
  "engines": {
    "node": ">=20"
  }
}
```

- [ ] **Step 3: Create pnpm-workspace.yaml**

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

- [ ] **Step 4: Create .npmrc**

```
auto-install-peers=true
```

- [ ] **Step 5: Update .gitignore**

```
node_modules/
dist/
.next/
*.tsbuildinfo
.env
.env.local
.DS_Store
coverage/
```

- [ ] **Step 6: Run pnpm install to verify workspace init**

```bash
pnpm install
```

Expected: creates pnpm-lock.yaml, no errors.

- [ ] **Step 7: Commit**

```bash
git add package.json pnpm-workspace.yaml .npmrc .gitignore pnpm-lock.yaml
git commit -m "chore: initialize pnpm monorepo workspace"
```

---

### Task 2: Create shared TypeScript config

**Files:**

- Create: `tsconfig.base.json`

- [ ] **Step 1: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Commit**

```bash
git add tsconfig.base.json
git commit -m "chore: add shared TypeScript base config"
```

---

### Task 3: Create packages/core

**Files:**

- Create: `packages/core/package.json`
- Create: `packages/core/tsconfig.json`
- Create: `packages/core/src/index.ts`
- Create: `packages/core/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@novel-studio/core",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
export const PACKAGE_NAME = '@novel-studio/core' as const
```

- [ ] **Step 4: Create placeholder test**

```typescript
import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '../src/index.js'

describe('core', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/core')
  })
})
```

- [ ] **Step 5: Install deps and verify**

```bash
cd packages/core && pnpm install && pnpm test
```

Expected: 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add packages/core/
git commit -m "chore: add packages/core skeleton"
```

---

### Task 4: Create packages/orchestrator

**Files:**

- Create: `packages/orchestrator/package.json`
- Create: `packages/orchestrator/tsconfig.json`
- Create: `packages/orchestrator/src/index.ts`
- Create: `packages/orchestrator/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@novel-studio/orchestrator",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@novel-studio/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/index.ts**

```typescript
import { PACKAGE_NAME as CORE } from '@novel-studio/core'

export const PACKAGE_NAME = '@novel-studio/orchestrator' as const
export { CORE }
```

- [ ] **Step 4: Create placeholder test**

```typescript
import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME, CORE } from '../src/index.js'

describe('orchestrator', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/orchestrator')
  })

  it('can import from core', () => {
    expect(CORE).toBe('@novel-studio/core')
  })
})
```

- [ ] **Step 5: Install and test**

```bash
pnpm install && cd packages/orchestrator && pnpm test
```

Expected: 2 tests pass. This verifies cross-package imports work.

- [ ] **Step 6: Commit**

```bash
git add packages/orchestrator/
git commit -m "chore: add packages/orchestrator skeleton with core dependency"
```

---

### Task 5: Create packages/prompts

**Files:**

- Create: `packages/prompts/package.json`
- Create: `packages/prompts/tsconfig.json`
- Create: `packages/prompts/src/index.ts`
- Create: `packages/prompts/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@novel-studio/prompts",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@novel-studio/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json, src/index.ts, test** (same pattern as core)

tsconfig.json:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

src/index.ts:

```typescript
export const PACKAGE_NAME = '@novel-studio/prompts' as const
```

**tests**/placeholder.test.ts:

```typescript
import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '../src/index.js'

describe('prompts', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/prompts')
  })
})
```

- [ ] **Step 3: Install and test**

```bash
pnpm install && cd packages/prompts && pnpm test
```

Expected: 1 test passes.

- [ ] **Step 4: Commit**

```bash
git add packages/prompts/
git commit -m "chore: add packages/prompts skeleton"
```

---

### Task 6: Create packages/llm-adapter

**Files:**

- Create: `packages/llm-adapter/package.json`
- Create: `packages/llm-adapter/tsconfig.json`
- Create: `packages/llm-adapter/src/index.ts`
- Create: `packages/llm-adapter/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json** (includes ai SDK dependency for later)

```json
{
  "name": "@novel-studio/llm-adapter",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run"
  },
  "dependencies": {
    "@novel-studio/core": "workspace:*"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json, src/index.ts, test** (same pattern)

tsconfig.json:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

src/index.ts:

```typescript
export const PACKAGE_NAME = '@novel-studio/llm-adapter' as const
```

**tests**/placeholder.test.ts:

```typescript
import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '../src/index.js'

describe('llm-adapter', () => {
  it('exports package name', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/llm-adapter')
  })
})
```

- [ ] **Step 3: Install and test**

```bash
pnpm install && cd packages/llm-adapter && pnpm test
```

Expected: 1 test passes.

- [ ] **Step 4: Commit**

```bash
git add packages/llm-adapter/
git commit -m "chore: add packages/llm-adapter skeleton"
```

---

### Task 7: Create apps/api (Hono)

**Files:**

- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/src/index.ts`
- Create: `apps/api/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@novel-studio/api",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run"
  },
  "dependencies": {
    "@novel-studio/core": "workspace:*",
    "@novel-studio/orchestrator": "workspace:*",
    "@novel-studio/llm-adapter": "workspace:*",
    "@novel-studio/prompts": "workspace:*",
    "hono": "^4.7.0",
    "@hono/node-server": "^1.14.0"
  },
  "devDependencies": {
    "typescript": "^5.7.0",
    "tsx": "^4.19.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create src/app.ts** (exports app without starting server)

```typescript
import { Hono } from 'hono'
import { PACKAGE_NAME as CORE } from '@novel-studio/core'

const app = new Hono()

app.get('/', (c) => c.json({ name: 'Novel Studio API', core: CORE }))

app.get('/health', (c) => c.json({ status: 'ok' }))

export { app }
```

- [ ] **Step 4: Create src/index.ts** (server entry point, imports app)

```typescript
import { serve } from '@hono/node-server'
import { app } from './app.js'

const port = Number(process.env.PORT) || 3001
console.log(`Server running on http://localhost:${port}`)
serve({ fetch: app.fetch, port })
```

- [ ] **Step 5: Create placeholder test** (imports from app.ts, NOT index.ts — avoids starting server)

```typescript
import { describe, it, expect } from 'vitest'
import { app } from '../src/app.js'

describe('api', () => {
  it('returns health check', async () => {
    const res = await app.request('/health')
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.status).toBe('ok')
  })

  it('returns root info with core dependency', async () => {
    const res = await app.request('/')
    const json = await res.json()
    expect(json.name).toBe('Novel Studio API')
    expect(json.core).toBe('@novel-studio/core')
  })
})
```

- [ ] **Step 6: Install and test**

```bash
pnpm install && cd apps/api && pnpm test
```

Expected: 2 tests pass. This verifies Hono works and can import workspace packages. The test imports from `app.ts` (not `index.ts`), so no server is started during testing.

- [ ] **Step 7: Commit**

```bash
git add apps/api/
git commit -m "chore: add apps/api skeleton with Hono + workspace imports"
```

---

### Task 8: Create apps/web (Next.js)

**Files:**

- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/next.config.ts`
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/__tests__/placeholder.test.ts`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@novel-studio/web",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "next dev --port 3000",
    "build": "next build",
    "start": "next start",
    "test": "vitest run"
  },
  "dependencies": {
    "@novel-studio/core": "workspace:*",
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create tsconfig.json**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "target": "ES2017",
    "module": "ESNext",
    "jsx": "preserve",
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    },
    "declaration": false,
    "declarationMap": false
  },
  "include": ["src", "next-env.d.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

- [ ] **Step 3: Create next.config.ts**

```typescript
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  transpilePackages: ['@novel-studio/core'],
}

export default nextConfig
```

- [ ] **Step 4: Create src/app/layout.tsx**

```tsx
export const metadata = {
  title: 'Novel Studio',
  description: 'AI-powered serial fiction workbench',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
```

- [ ] **Step 5: Create src/app/page.tsx**

```tsx
import { PACKAGE_NAME } from '@novel-studio/core'

export default function Home() {
  return (
    <main>
      <h1>Novel Studio</h1>
      <p>AI-powered serial fiction workbench</p>
      <p>Core: {PACKAGE_NAME}</p>
    </main>
  )
}
```

- [ ] **Step 6: Create placeholder test**

```typescript
import { describe, it, expect } from 'vitest'
import { PACKAGE_NAME } from '@novel-studio/core'

describe('web', () => {
  it('can import from core package', () => {
    expect(PACKAGE_NAME).toBe('@novel-studio/core')
  })
})
```

- [ ] **Step 7: Install and test**

```bash
pnpm install && cd apps/web && pnpm test
```

Expected: 1 test passes.

- [ ] **Step 8: Commit**

```bash
git add apps/web/
git commit -m "chore: add apps/web skeleton with Next.js + core import"
```

---

### Task 9: Add ESLint + Prettier

**Files:**

- Create: `eslint.config.js`
- Create: `.prettierrc`
- Modify: `package.json` (root — add dev deps)

- [ ] **Step 1: Install ESLint + Prettier at root**

```bash
pnpm add -Dw eslint @eslint/js typescript-eslint prettier eslint-config-prettier
```

- [ ] **Step 2: Create eslint.config.js (flat config)**

```javascript
import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettierConfig,
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/.next/**'],
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
)
```

- [ ] **Step 3: Create .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 4: Run lint and format to verify**

```bash
pnpm lint
pnpm format:check
```

Expected: no errors (or only fixable formatting issues).

- [ ] **Step 5: Fix any formatting issues**

```bash
pnpm format
```

- [ ] **Step 6: Commit**

```bash
git add eslint.config.js .prettierrc package.json pnpm-lock.yaml
git add -u  # stage any reformatted files
git commit -m "chore: add ESLint flat config + Prettier"
```

---

### Task 10: Verify full workspace build and test

**Files:** None (verification only)

- [ ] **Step 1: Clean install from scratch**

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules pnpm-lock.yaml
pnpm install
```

Expected: installs with no errors.

- [ ] **Step 2: Build all packages**

```bash
pnpm -r build
```

Expected: all 6 packages compile. (Next.js build may take a moment.)

Note: If Next.js `build` fails due to missing server components setup, that is acceptable at this stage. The important thing is that `tsc` works for all packages and the API server compiles.

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: all placeholder tests pass (at least 8 tests across 6 packages).

- [ ] **Step 4: Verify cross-package imports**

The apps/api test already verifies it can import from @novel-studio/core. The orchestrator test verifies it can import from core. This confirms workspace resolution works.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: verify full monorepo build and test pipeline"
```

---

## M1 Acceptance Checklist

After all tasks are complete, verify:

- [ ] `pnpm install` — succeeds with no errors
- [ ] `pnpm -r build` — compiles all packages (Next.js build is optional at this stage)
- [ ] `pnpm test` — all placeholder tests pass
- [ ] `packages/core` can be imported from `apps/api` (verified by api test)
- [ ] `packages/core` can be imported from `packages/orchestrator` (verified by orchestrator test)
- [ ] ESLint + Prettier run without errors
- [ ] All commits pushed to GitHub
