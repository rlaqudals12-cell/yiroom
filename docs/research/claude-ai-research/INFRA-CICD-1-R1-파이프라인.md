# CI/CD 파이프라인

> **ID**: INFRA-CICD
> **작성일**: 2026-01-19
> **상태**: 완료
> **적용 대상**: .github/workflows/, apps/web/, apps/mobile/

---

## 1. 현재 구현 분석

### 현재 상태

```yaml
# .github/workflows/ci.yml
✅ 기본 lint/typecheck 실행
✅ Vercel 자동 배포 (연동)
✅ PR 검사

# 개선 필요 항목
❌ Turborepo 캐싱 최적화
❌ 변경된 앱만 빌드
❌ 병렬 테스트 실행
❌ Lighthouse CI
❌ 릴리스 자동화
```

---

## 2. Turborepo CI 최적화

### 2.1 기본 설정

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2 # 변경 감지를 위해

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      # 단일 turbo 명령으로 병렬 실행
      - name: Build, Lint, and Test
        run: npx turbo run build lint test --concurrency=10
```

### 2.2 변경 감지 최적화

```yaml
# 변경된 패키지만 빌드
- name: Build changed packages
  run: npx turbo run build --filter='...[origin/main]'

# PR에서 변경된 것만
- name: Build PR changes
  if: github.event_name == 'pull_request'
  run: npx turbo run build --filter='...[HEAD^1]'
```

### 2.3 Remote Caching

```yaml
# turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": [".env"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"],
      "cache": true
    },
    "lint": {
      "outputs": [],
      "cache": true
    },
    "test": {
      "outputs": ["coverage/**"],
      "cache": true
    },
    "typecheck": {
      "outputs": [],
      "cache": true
    }
  }
}
```

---

## 3. 완전한 CI 워크플로우

### 3.1 메인 CI

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
  NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
  NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

jobs:
  # 품질 검사
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npx turbo run lint

      - name: Type Check
        run: npx turbo run typecheck

      - name: Format Check
        run: npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

  # 테스트
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run Tests
        run: npx turbo run test -- --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: ./apps/web/coverage/lcov.info

  # 빌드
  build:
    runs-on: ubuntu-latest
    needs: [quality]
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npx turbo run build

      - name: Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: build-artifacts
          path: |
            apps/web/.next
            apps/web/out
          retention-days: 7

  # E2E 테스트 (선택)
  e2e:
    runs-on: ubuntu-latest
    needs: [build]
    if: github.event_name == 'pull_request'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Download Build Artifacts
        uses: actions/download-artifact@v4
        with:
          name: build-artifacts
          path: apps/web/.next

      - name: Run E2E Tests
        run: npm run test:e2e
        env:
          BASE_URL: http://localhost:3000

      - name: Upload Playwright Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

### 3.2 Lighthouse CI

```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build --workspace=apps/web

      - name: Run Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          configPath: './lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true

      - name: Format Lighthouse Score
        id: format_lighthouse
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const results = JSON.parse(
              fs.readFileSync('.lighthouseci/manifest.json')
            );
            // PR 코멘트용 포맷팅
```

```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run start --workspace=apps/web",
      "startServerReadyPattern": "ready on",
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/analysis/personal-color"
      ]
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.8 }],
        "categories:accessibility": ["error", { "minScore": 0.9 }],
        "categories:best-practices": ["error", { "minScore": 0.9 }],
        "categories:seo": ["error", { "minScore": 0.9 }]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 4. 배포 워크플로우

### 4.1 Vercel Preview 배포

```yaml
# .github/workflows/preview.yml
name: Preview Deployment

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  deploy-preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=preview --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Vercel Preview
        id: deploy
        run: |
          url=$(vercel deploy --prebuilt --token=${{ secrets.VERCEL_TOKEN }})
          echo "url=$url" >> $GITHUB_OUTPUT

      - name: Comment Preview URL
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🚀 Preview: ${{ steps.deploy.outputs.url }}`
            })
```

### 4.2 Production 배포

```yaml
# .github/workflows/production.yml
name: Production Deployment

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4

      - name: Install Vercel CLI
        run: npm install -g vercel@latest

      - name: Pull Vercel Environment
        run: vercel pull --yes --environment=production --token=${{ secrets.VERCEL_TOKEN }}

      - name: Build Project
        run: vercel build --prod --token=${{ secrets.VERCEL_TOKEN }}

      - name: Deploy to Production
        run: vercel deploy --prebuilt --prod --token=${{ secrets.VERCEL_TOKEN }}

      # Sentry Release
      - name: Create Sentry Release
        env:
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
        run: |
          npx @sentry/cli releases new ${{ github.sha }}
          npx @sentry/cli releases set-commits ${{ github.sha }} --auto
          npx @sentry/cli releases finalize ${{ github.sha }}
```

---

## 5. 릴리스 자동화

### 5.1 Semantic Release

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          persist-credentials: false

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Semantic Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
        run: npx semantic-release
```

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    ["@semantic-release/git", {
      "assets": ["CHANGELOG.md", "package.json"],
      "message": "chore(release): ${nextRelease.version}"
    }],
    "@semantic-release/github"
  ]
}
```

### 5.2 Changesets (모노레포용)

```yaml
# .github/workflows/changesets.yml
name: Changesets

on:
  push:
    branches: [main]

jobs:
  changesets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: npm run release
          version: npm run version
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 6. 보안 검사

### 6.1 의존성 검사

```yaml
# .github/workflows/security.yml
name: Security

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1' # 매주 월요일

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run npm audit
        run: npm audit --audit-level=critical

      - name: Run Snyk
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  codeql:
    runs-on: ubuntu-latest
    permissions:
      security-events: write
    steps:
      - uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: javascript

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

---

## 7. 캐싱 전략

### 7.1 Node.js 캐싱

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
    cache-dependency-path: '**/package-lock.json'
```

### 7.2 Turbo 캐싱

```yaml
# 로컬 캐시 (Remote Cache 사용하지 않을 때)
- name: Cache Turbo
  uses: actions/cache@v4
  with:
    path: .turbo
    key: ${{ runner.os }}-turbo-${{ github.sha }}
    restore-keys: |
      ${{ runner.os }}-turbo-

# Remote Cache 사용 (권장)
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

### 7.3 Next.js 캐싱

```yaml
- name: Cache Next.js
  uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ${{ github.workspace }}/apps/web/.next/cache
    key: ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nextjs-${{ hashFiles('**/package-lock.json') }}-
```

---

## 8. 환경 변수 관리

### 8.1 Secrets 설정

```
GitHub Repository > Settings > Secrets and variables > Actions

필수 Secrets:
- VERCEL_TOKEN
- VERCEL_ORG_ID
- VERCEL_PROJECT_ID
- TURBO_TOKEN
- SENTRY_AUTH_TOKEN
- CODECOV_TOKEN
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_GENERATIVE_AI_API_KEY

Variables:
- TURBO_TEAM
```

### 8.2 Environment 분리

```yaml
jobs:
  deploy-production:
    runs-on: ubuntu-latest
    environment: production # GitHub Environment
    steps:
      # production 환경의 secrets 사용
```

---

## 9. 구현 체크리스트

### 즉시 적용 (P0)

- [ ] Turbo Remote Cache 설정
- [ ] 변경 감지 최적화
- [ ] 병렬 실행 통합

### 단기 적용 (P1)

- [ ] Lighthouse CI 추가
- [ ] E2E 테스트 통합
- [ ] 보안 검사 워크플로우

### 장기 적용 (P2)

- [ ] Semantic Release
- [ ] Changesets 도입
- [ ] 성능 예산 검사

---

## 10. 참고 자료

- [Turborepo GitHub Actions](https://turborepo.dev/docs/guides/ci-vendors/github-actions)
- [Vercel Academy: Production Monorepos](https://vercel.com/academy/production-monorepos/github-actions)
- [GitHub Actions 2026 Guide](https://dev.to/pockit_tools/github-actions-in-2026-the-complete-guide-to-monorepo-cicd-and-self-hosted-runners-1jop)

---

**Version**: 1.0 | **Priority**: P0 Critical
