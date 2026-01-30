# React 19 + Next.js 16 모노레포 코드 품질 실행 가이드

> **대상**: Turborepo 모노레포, 3 packages, 1-2인 팀  
> **스택**: React 19, Next.js 16, Expo SDK 54, Supabase, Clerk, Gemini AI  
> **목적**: Claude Code에서 바로 적용 가능한 실행 가이드

---

## 1. 핵심 요약 (현재 vs 권장)

| 항목 | 현재 (일반적) | 2026 권장 | 조치 |
|------|--------------|----------|------|
| **ESLint 설정** | `.eslintrc.js` (legacy) | `eslint.config.mjs` (flat config) | 🔄 변경 |
| **Import 패턴** | barrel exports (`index.ts`) | package.json `exports` 필드 | 🔄 변경 |
| **TypeScript 참조** | Project References | 공유 tsconfig 패키지 | 🔄 변경 |
| **테스트 비율** | Unit 중심 (Pyramid) | Integration 중심 (Trophy) | 🔄 변경 |
| **커버리지 목표** | 80-90% | 70-75% (소규모 팀) | ✅ 유지/조정 |
| **데드 코드 탐지** | 수동 | Knip 자동화 | ➕ 개선 |
| **중복 코드 탐지** | 없음 | jscpd + sonarjs | ➕ 개선 |
| **Turborepo 버전** | 1.x | 2.x (`ui: "tui"`) | ➕ 개선 |
| **React 패턴** | forwardRef, defaultProps | ref as prop, default params | 🔄 변경 |
| **Next.js params** | 동기 params | `await params` (Promise) | 🔄 변경 |
| **Vitest workspace** | `workspace` 옵션 | `projects` 옵션 (3.2+) | 🔄 변경 |
| **Prettier** | 현재 설정 | 현재 설정 유지 | ✅ 유지 |
| **Husky + lint-staged** | 현재 설정 | 현재 설정 유지 | ✅ 유지 |
| **TypeScript strict** | 활성화 | 활성화 유지 | ✅ 유지 |

---

## 2. 즉시 적용 체크리스트

### Phase 1: 도구 설치 (Day 1)

```bash
# 데드 코드 탐지
pnpm add -Dw knip

# 중복 코드 탐지
pnpm add -Dw jscpd

# ESLint 플러그인
pnpm add -Dw eslint-plugin-sonarjs
```

- [ ] `pnpm add -Dw knip` 실행
- [ ] `pnpm add -Dw jscpd` 실행
- [ ] `pnpm add -Dw eslint-plugin-sonarjs` 실행

### Phase 2: 설정 파일 생성 (Day 1-2)

- [ ] `/knip.json` 생성
- [ ] `/.jscpd.json` 생성
- [ ] `/eslint.config.mjs` 생성 (기존 `.eslintrc.*` 대체)
- [ ] `/turbo.json` 업데이트 (2.x 형식)
- [ ] `/packages/shared/package.json` - `exports` 필드 추가

### Phase 3: 코드 분석 (Day 2-3)

```bash
# 데드 코드 베이스라인 측정
npx knip --reporter=compact

# 중복 코드 분석
npx jscpd ./apps ./packages --output ./reports/jscpd

# 테스트 커버리지 현황
pnpm test -- --coverage
```

- [ ] `npx knip` 실행 → 결과 기록
- [ ] `npx jscpd` 실행 → 결과 기록
- [ ] 커버리지 리포트 확인 → 현재 % 기록

### Phase 4: barrel exports 제거 (Day 3-5)

- [ ] `/packages/shared/src/index.ts` 삭제 또는 최소화
- [ ] `/packages/shared/package.json` - `exports` 필드로 경로 매핑
- [ ] 모든 앱에서 import 경로 수정
- [ ] `sideEffects: false` 추가 확인

### Phase 5: 레거시 패턴 마이그레이션 (Week 2)

```bash
# React 19 codemod 실행
npx react-codemod@latest preset-19 ./apps ./packages
npx types-react-codemod@latest preset-19 ./apps ./packages
```

- [ ] `forwardRef` → ref as prop 변환
- [ ] `defaultProps` → default parameters 변환
- [ ] Next.js 16 `await params` 패턴 적용

### Phase 6: CI 파이프라인 추가 (Week 2)

- [ ] `/.github/workflows/quality.yml` 생성
- [ ] Knip 체크 추가
- [ ] jscpd 체크 추가 (threshold 초과 시 실패)

### Phase 7: 문서화 (Week 2)

- [ ] `/CLAUDE.md` 업데이트 - 마이그레이션 현황 섹션 추가
- [ ] 코드 품질 메트릭 대시보드 추가

---

## 3. 설정 파일 템플릿

### 3.1 `/eslint.config.mjs`

```javascript
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import nextPlugin from '@next/eslint-plugin-next';
import sonarjs from 'eslint-plugin-sonarjs';
import prettier from 'eslint-config-prettier';

export default [
  // Base
  js.configs.recommended,
  ...tseslint.configs.recommended,
  
  // React 19
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat['jsx-runtime'],
  reactHooks.configs.flat.recommended,
  
  // Next.js 16
  nextPlugin.flatConfig.coreWebVitals,
  
  // Code Quality
  sonarjs.configs.recommended,
  
  // Prettier (마지막)
  prettier,
  
  // Custom Rules
  {
    settings: {
      react: { version: 'detect' }
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-unused-vars': ['error', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      '@typescript-eslint/no-explicit-any': 'error',
      
      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      
      // Sonar
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-identical-functions': 'error',
      
      // Best Practices
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error'
    }
  },
  
  // Ignores
  {
    ignores: [
      '.next/**',
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '.expo/**',
      '*.config.js',
      '*.config.mjs'
    ]
  }
];
```

### 3.2 `/packages/typescript-config/base.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": false,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3.3 `/packages/typescript-config/react-library.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"]
  }
}
```

### 3.4 `/packages/typescript-config/nextjs.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "extends": "./base.json",
  "compilerOptions": {
    "jsx": "preserve",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "plugins": [{ "name": "next" }]
  }
}
```

### 3.5 `/apps/web/tsconfig.json` (Next.js 앱)

```json
{
  "extends": "@repo/typescript-config/nextjs.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@repo/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 3.6 `/packages/shared/tsconfig.json`

```json
{
  "extends": "@repo/typescript-config/react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

### 3.7 `/turbo.json`

```json
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**", "dist/**"],
      "inputs": ["$TURBO_DEFAULT$", "!**/*.test.*", "!**/*.spec.*"]
    },
    "lint": {
      "dependsOn": ["^lint"],
      "outputs": [],
      "inputs": ["$TURBO_DEFAULT$", "eslint.config.*", "../../eslint.config.*"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": [],
      "inputs": ["**/*.{ts,tsx}", "tsconfig.json", "../../packages/typescript-config/*.json"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**", "**/*.test.{ts,tsx}", "vitest.config.*"]
    },
    "test:watch": {
      "cache": false,
      "persistent": true
    },
    "cpd": {
      "outputs": ["reports/jscpd/**"],
      "inputs": ["**/*.{ts,tsx}", "../../.jscpd.json"]
    },
    "knip": {
      "outputs": [],
      "inputs": ["**/*.{ts,tsx}", "../../knip.json"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### 3.8 `/.prettierrc`

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf",
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

### 3.9 `/knip.json`

```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "workspaces": {
    "apps/web": {
      "entry": [
        "src/app/**/*.{ts,tsx}",
        "src/pages/**/*.{ts,tsx}",
        "src/middleware.ts"
      ],
      "project": ["src/**/*.{ts,tsx}"],
      "ignore": ["src/**/*.test.{ts,tsx}", "src/**/*.stories.{ts,tsx}"]
    },
    "apps/mobile": {
      "entry": ["App.tsx", "src/**/*.{ts,tsx}"],
      "project": ["src/**/*.{ts,tsx}"]
    },
    "packages/shared": {
      "entry": ["src/index.ts", "src/**/index.ts"],
      "project": ["src/**/*.{ts,tsx}"]
    }
  },
  "ignoreExportsUsedInFile": true,
  "ignoreDependencies": [
    "@types/*",
    "eslint-*",
    "prettier-*",
    "@repo/*"
  ]
}
```

### 3.10 `/.jscpd.json`

```json
{
  "threshold": 5,
  "minLines": 5,
  "minTokens": 50,
  "reporters": ["html", "console", "json"],
  "ignore": [
    "**/__snapshots__/**",
    "**/node_modules/**",
    "**/.next/**",
    "**/dist/**",
    "**/*.d.ts",
    "**/coverage/**",
    "**/.expo/**"
  ],
  "format": ["typescript", "tsx", "javascript", "jsx"],
  "mode": "mild",
  "gitignore": true,
  "output": "./reports/jscpd",
  "absolute": true
}
```

### 3.11 `/vitest.config.ts` (루트 - 공유 설정)

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'lcov', 'html'],
      reportsDirectory: './coverage',
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70
      },
      exclude: [
        'node_modules/**',
        '**/*.d.ts',
        '**/types/**',
        '**/*.config.*',
        '**/test/**',
        '**/*.stories.*'
      ]
    }
  }
});
```

### 3.12 `/test/setup.ts`

```typescript
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 각 테스트 후 cleanup
afterEach(() => {
  cleanup();
});

// Next.js router mock
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({})
}));

// Clerk mock
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ 
    isSignedIn: true, 
    user: { id: 'user_test', emailAddresses: [{ emailAddress: 'test@example.com' }] },
    isLoaded: true 
  }),
  useAuth: () => ({ 
    isSignedIn: true, 
    userId: 'user_test',
    getToken: vi.fn().mockResolvedValue('mock-token')
  }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  SignedIn: ({ children }: { children: React.ReactNode }) => children,
  SignedOut: () => null
}));

// Supabase mock
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      then: vi.fn().mockResolvedValue({ data: [], error: null })
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null })
    }
  }
}));
```

### 3.13 `/packages/shared/package.json` (exports 필드)

```json
{
  "name": "@repo/shared",
  "version": "0.0.0",
  "private": true,
  "sideEffects": false,
  "exports": {
    "./components/Button": "./src/components/Button/index.ts",
    "./components/Input": "./src/components/Input/index.ts",
    "./components/Modal": "./src/components/Modal/index.ts",
    "./hooks/useDebounce": "./src/hooks/useDebounce.ts",
    "./hooks/useLocalStorage": "./src/hooks/useLocalStorage.ts",
    "./utils/formatDate": "./src/utils/formatDate.ts",
    "./utils/cn": "./src/utils/cn.ts",
    "./types": "./src/types/index.ts"
  },
  "scripts": {
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

### 3.14 `/package.json` (루트)

```json
{
  "name": "monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "lint:fix": "turbo lint -- --fix",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:watch": "turbo test:watch",
    "test:coverage": "turbo test -- --coverage",
    "cpd": "jscpd ./apps ./packages",
    "knip": "knip",
    "knip:fix": "knip --fix",
    "quality": "turbo lint typecheck test && pnpm cpd && pnpm knip",
    "quality:ci": "turbo lint typecheck test cpd knip",
    "prepare": "husky"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*",
    "eslint": "^9.0.0",
    "husky": "^9.0.0",
    "jscpd": "^4.0.0",
    "knip": "^5.0.0",
    "lint-staged": "^15.0.0",
    "prettier": "^3.0.0",
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "vitest": "^3.2.0"
  },
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20"
  }
}
```

### 3.15 `/.lintstagedrc.js`

```javascript
module.exports = {
  '*.{ts,tsx}': ['eslint --fix', 'prettier --write'],
  '*.{js,jsx,mjs,cjs}': ['eslint --fix', 'prettier --write'],
  '*.{json,md,mdx,yml,yaml}': ['prettier --write'],
  '*.css': ['prettier --write']
};
```

### 3.16 `/.github/workflows/quality.yml`

```yaml
name: Code Quality

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  quality:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: pnpm/action-setup@v3
        with:
          version: 9
          
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Typecheck
        run: pnpm typecheck
        
      - name: Lint
        run: pnpm lint
        
      - name: Test
        run: pnpm test -- --coverage
        
      - name: Dead Code Detection
        run: pnpm knip
        
      - name: Duplicate Code Detection
        run: pnpm cpd
        
      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          fail_ci_if_error: false
```

---

## 4. Turborepo 모노레포 특화 권장사항

### 4.1 패키지 간 의존성

```
apps/web (Next.js 16)
├── @repo/shared (공유 컴포넌트/hooks)
├── @repo/typescript-config (TS 설정)
└── @repo/eslint-config (ESLint 설정) [선택]

apps/mobile (Expo SDK 54)
├── @repo/shared
└── @repo/typescript-config

packages/shared
└── @repo/typescript-config
```

**의존성 설정 (pnpm workspace)**:

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

```json
// apps/web/package.json
{
  "dependencies": {
    "@repo/shared": "workspace:*"
  },
  "devDependencies": {
    "@repo/typescript-config": "workspace:*"
  }
}
```

### 4.2 캐싱 최적화

| Task | Cache | Outputs | 비고 |
|------|-------|---------|------|
| `build` | ✅ | `.next/**`, `dist/**` | `.next/cache` 제외 |
| `lint` | ✅ | 없음 | config 변경 시 무효화 |
| `typecheck` | ✅ | 없음 | |
| `test` | ✅ | `coverage/**` | |
| `dev` | ❌ | - | `persistent: true` |
| `lint:fix` | ❌ | - | 파일 수정하므로 |

**Remote Caching (선택)**:

```bash
# Vercel Remote Cache 활성화
npx turbo login
npx turbo link
```

### 4.3 병렬 실행 전략

```json
// turbo.json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"]  // 의존 패키지 먼저
    },
    "lint": {
      "dependsOn": []          // 독립 실행 (병렬)
    },
    "typecheck": {
      "dependsOn": ["^build"]  // 빌드 후 실행
    },
    "test": {
      "dependsOn": ["^build"]  // 빌드 후 실행
    }
  }
}
```

**실행 예시**:

```bash
# 전체 품질 체크 (최대 병렬)
turbo lint typecheck test --concurrency=10

# 특정 앱만
turbo build --filter=web

# 변경된 패키지만
turbo build --filter=...[origin/main]

# 의존 패키지 포함
turbo build --filter=web...
```

### 4.4 Input 최적화로 캐시 히트율 향상

```json
{
  "tasks": {
    "build": {
      "inputs": [
        "$TURBO_DEFAULT$",
        "!**/*.test.*",      // 테스트 파일 제외
        "!**/*.spec.*",
        "!**/*.stories.*",   // 스토리북 제외
        "!**/README.md"
      ]
    }
  }
}
```

### 4.5 환경 변수 관리

```json
// turbo.json
{
  "globalEnv": [
    "NODE_ENV"
  ],
  "tasks": {
    "build": {
      "env": [
        "NEXT_PUBLIC_*",
        "SUPABASE_URL",
        "CLERK_*"
      ]
    }
  }
}
```

---

## 5. 참고 자료

| 출처 | URL | 핵심 내용 |
|------|-----|----------|
| Turborepo Docs | https://turborepo.dev/docs/core-concepts/internal-packages | barrel exports 지양, Just-in-Time 패키지 권장 |
| Turborepo ESLint | https://turborepo.dev/docs/guides/tools/eslint | flat config 설정, 캐싱 전략 |
| Turborepo Vitest | https://turborepo.ai/docs/guides/tools/vitest | workspace 대신 projects 사용 |
| Turborepo Config | https://turborepo.dev/docs/reference/configuration | turbo.json 2.x 스키마 |
| Next.js Migration | https://nextjs.org/docs/app/guides/migrating/app-router-migration | Pages → App Router 가이드 |
| Next.js Vitest | https://nextjs.org/docs/app/guides/testing/vitest | Next.js + Vitest 설정 |
| React 19 Migration | https://10xdev.blog/react-19-migration-guidance/ | codemod, 주요 변경사항 |
| Knip Docs | https://knip.dev/ | 데드 코드 탐지 도구 |
| jscpd Docs | https://kucherenko.github.io/jscpd/ | 중복 코드 탐지 도구 |
| Testing Trophy | https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications | Integration 중심 테스트 전략 |
| CLAUDE.md Guide | https://www.humanlayer.dev/blog/writing-a-good-claude-md | 효과적인 CLAUDE.md 작성법 |
| ESLint Flat Config | https://blog.linotte.dev/eslint-9-next-js-935c2b6d0371 | Next.js + ESLint 9 설정 |

---

## 6. CLAUDE.md 업데이트 템플릿

```markdown
# CLAUDE.md

## 프로젝트 개요
React 19 + Next.js 16 Turborepo 모노레포. Expo SDK 54 모바일 앱 포함.

## 기술 스택
- **Frontend**: React 19, Next.js 16
- **Mobile**: Expo SDK 54
- **Backend**: Supabase
- **Auth**: Clerk
- **AI**: Gemini AI

## 모노레포 구조
```
apps/
├── web/          # Next.js 16 메인 웹앱
└── mobile/       # Expo SDK 54 모바일앱
packages/
├── shared/       # 공유 컴포넌트/hooks/utils
└── typescript-config/  # 공유 TS 설정
```

## 핵심 명령어
```bash
turbo dev                    # 전체 개발 서버
turbo dev --filter=web       # web만
turbo lint typecheck test    # 코드 품질 체크
pnpm knip                    # 데드 코드 탐지
pnpm cpd                     # 중복 코드 탐지
pnpm quality                 # 전체 품질 체크
```

## Import 규칙
```typescript
// ✅ 권장
import { Button } from "@repo/shared/components/Button";

// ❌ 금지 (barrel exports)
import { Button } from "@repo/shared";
```

## 마이그레이션 현황
- [x] ESLint flat config 전환
- [x] barrel exports → exports 필드
- [ ] Pages Router → App Router (진행중)
- [ ] forwardRef → ref as prop

## 코드 품질 메트릭
| 항목 | 현재 | 목표 |
|------|------|------|
| 테스트 커버리지 | __% | 75% |
| 데드 코드 파일 | __ | 0 |
| 중복 코드 비율 | __% | <5% |
```

---

## 7. 실행 순서 요약

```bash
# Week 1: 기반 설정
1. pnpm add -Dw knip jscpd eslint-plugin-sonarjs
2. 설정 파일 생성 (eslint.config.mjs, knip.json, .jscpd.json)
3. turbo.json 2.x 형식으로 업데이트
4. 베이스라인 측정 (knip, jscpd, coverage)

# Week 2: 코드 정리
5. barrel exports 제거 → package.json exports
6. React 19 codemod 실행
7. CI 파이프라인 추가
8. CLAUDE.md 업데이트

# 매주 유지보수
- 30분 knip 리뷰
- jscpd 리포트 확인
- 커버리지 트렌드 모니터링
```
