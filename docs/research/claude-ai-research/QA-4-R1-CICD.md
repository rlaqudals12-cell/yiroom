# QA-4-R1: CI/CD 파이프라인

> 이룸 프로젝트 CI/CD 전략 및 모범 사례

---

## 1. 핵심 요약

- **GitHub Actions**: lint, typecheck, test, quality, build 5단계 병렬/순차 파이프라인으로 PR 품질 게이트 구성
- **Vercel 배포**: Preview(PR당 자동 배포), Production(main 브랜치) 2-tier 전략으로 안전한 배포 보장
- **캐싱 전략**: npm 캐시 + Turborepo Remote Cache로 CI 시간 50-70% 단축 가능
- **환경변수 관리**: GitHub Secrets + Vercel Environment Variables 이중 관리로 보안 유지
- **롤백 전략**: Vercel Instant Rollback으로 30초 내 이전 배포 복원 가능

---

## 2. 상세 내용

### 2.1 GitHub Actions 설계

#### 현재 워크플로우 분석

현재 프로젝트의 `.github/workflows/ci.yml`에는 다음 5개 Job이 구성되어 있습니다:

| Job | 의존성 | 실패 시 | 소요 시간 |
|-----|--------|---------|----------|
| lint | 없음 | PR 블록 | ~30s |
| typecheck | 없음 | PR 블록 | ~45s |
| test | 없음 | PR 블록 | ~2min |
| quality | 없음 | 경고만 | ~1min |
| build | lint, typecheck, test | PR 블록 | ~3min |

#### 권장 3-tier 파이프라인

```
Tier 1 (Fast Feedback):    # ~1분
  - lint
  - typecheck
  - format:check

Tier 2 (Comprehensive):    # ~3분
  - unit tests
  - integration tests
  - quality checks (knip, jscpd)

Tier 3 (Validation):       # ~5분
  - build
  - e2e tests (선택적)
  - lighthouse (main only)
```

### 2.2 Vercel 배포 전략

#### 환경 구분

| 환경 | 트리거 | URL | 용도 |
|------|--------|-----|------|
| **Preview** | PR 생성/업데이트 | `*.vercel.app` | PR 리뷰, QA 테스트 |
| **Production** | main 머지 | `yiroom.app` | 실제 서비스 |
| **Development** | develop 브랜치 | `dev.yiroom.app` | 개발자 테스트 |

#### 현재 Vercel 설정 (vercel.json)

- 모노레포 빌드: `cd apps/web && npm run build`
- 보안 헤더: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- Cron Jobs: 가격 업데이트, 알림, 챌린지, 통계 등 6개 설정

### 2.3 테스트 자동화

#### 테스트 매트릭스

| 테스트 유형 | 도구 | 실행 시점 | 실패 정책 |
|------------|------|----------|----------|
| Lint | ESLint | 모든 PR | 블로킹 |
| Type Check | TypeScript | 모든 PR | 블로킹 |
| Unit Test | Vitest | 모든 PR | 블로킹 |
| Integration | Vitest | 모든 PR | 블로킹 |
| E2E | Playwright | main 머지 | 경고 |
| Lighthouse | lighthouse-ci | main 머지 | 경고 |
| Dead Code | Knip | 모든 PR | 경고 |
| Duplicates | jscpd | 모든 PR | 경고 |

### 2.4 환경변수 관리

#### 변수 분류

| 접두사 | 노출 | 사용 위치 | 예시 |
|--------|------|----------|------|
| `NEXT_PUBLIC_` | 클라이언트 | 브라우저 | `NEXT_PUBLIC_SUPABASE_URL` |
| (없음) | 서버 전용 | API/Server | `SUPABASE_SERVICE_ROLE_KEY` |

#### 현재 turbo.json globalEnv

```
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- GOOGLE_GENERATIVE_AI_API_KEY
- NEXT_PUBLIC_SENTRY_DSN, SENTRY_*
- CRON_SECRET
- FORCE_MOCK_AI
```

### 2.5 캐싱 전략

#### 현재 캐싱

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'  # package-lock.json 기반 캐싱
```

#### 권장 추가: Turborepo Remote Cache

```yaml
- uses: dtinth/setup-github-actions-caching-for-turbo@v1
- run: npm run build
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ vars.TURBO_TEAM }}
```

| 캐시 유형 | 히트 시 절감 | 키 전략 |
|----------|------------|---------|
| npm | ~60% | `hashFiles('package-lock.json')` |
| Turbo | ~70% | 파일 해시 기반 |
| Next.js | ~50% | `.next/cache` |

### 2.6 롤백 방법

#### Vercel Instant Rollback

```bash
# CLI 롤백
vercel rollback [deployment-url]

# 또는 대시보드에서
# Deployments > ... > Promote to Production (이전 배포 선택)
```

#### 롤백 시나리오

| 상황 | 롤백 방법 | 소요 시간 |
|------|----------|----------|
| 프로덕션 버그 | Vercel Instant Rollback | ~30초 |
| DB 마이그레이션 실패 | 롤백 스크립트 실행 | ~5분 |
| 피처 플래그 문제 | 플래그 비활성화 | 즉시 |
| AI 서비스 장애 | Mock Fallback 자동 | 즉시 |

---

## 3. 구현 시 필수 사항

### 3.1 GitHub Actions 체크리스트

- [x] lint job 설정
- [x] typecheck job 설정
- [x] test job 설정
- [x] quality job 설정 (knip, jscpd)
- [x] build job 설정 (의존성 체인)
- [x] Lighthouse CI 워크플로우
- [ ] Turborepo Remote Cache 설정
- [ ] E2E 테스트 워크플로우
- [ ] 슬랙 알림 연동
- [ ] PR 코멘트 자동화

### 3.2 Vercel 체크리스트

- [x] 모노레포 빌드 설정
- [x] 보안 헤더 설정
- [x] Cron Job 설정
- [ ] Preview 환경 보호 (암호)
- [ ] 자동 롤백 규칙
- [ ] 배포 알림 웹훅

### 3.3 환경변수 체크리스트

- [ ] GitHub Secrets 설정 검증
- [ ] Vercel 환경별 변수 분리
- [ ] 민감키 노출 방지 검증
- [ ] 환경변수 문서화

---

## 4. 코드 예시

### 4.1 개선된 CI 워크플로우

```yaml
# .github/workflows/ci.yml (개선안)
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}

jobs:
  # Tier 1: Fast Feedback (~1분)
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  format:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run format:check

  # Tier 2: Comprehensive (~3분)
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --run --coverage
      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          fail_ci_if_error: false

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Dead code detection (Knip)
        run: npm run quality:deadcode -w @yiroom/web
        continue-on-error: true
      - name: Duplicate code detection (jscpd)
        run: npm run quality:duplicates -w @yiroom/web
        continue-on-error: true

  # Tier 3: Validation (~5분)
  build:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - uses: dtinth/setup-github-actions-caching-for-turbo@v1
      - run: npm ci
      - run: npm run build:web
        env:
          SKIP_ENV_VALIDATION: true

  # main 브랜치만 E2E 테스트
  e2e:
    needs: [build]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'
      - run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        continue-on-error: true

  # PR 상태 요약
  summary:
    needs: [lint, typecheck, format, test, quality, build]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: Check status
        run: |
          if [ "${{ needs.lint.result }}" == "failure" ] || \
             [ "${{ needs.typecheck.result }}" == "failure" ] || \
             [ "${{ needs.test.result }}" == "failure" ] || \
             [ "${{ needs.build.result }}" == "failure" ]; then
            echo "CI failed"
            exit 1
          fi
          echo "CI passed"
```

### 4.2 환경변수 검증 스크립트

```typescript
// scripts/check-env.ts
const REQUIRED_ENV = {
  all: [
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ],
  server: [
    'CLERK_SECRET_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_GENERATIVE_AI_API_KEY',
  ],
};

function checkEnv(): void {
  const missing: string[] = [];

  [...REQUIRED_ENV.all, ...REQUIRED_ENV.server].forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing);
    if (process.env.CI === 'true') process.exit(1);
  }
}

checkEnv();
```

---

## 5. 참고 자료

### 공식 문서
- GitHub Actions Documentation: https://docs.github.com/en/actions
- Vercel Documentation: https://vercel.com/docs
- Turborepo Caching: https://turbo.build/repo/docs/core-concepts/caching
- Next.js Deployment: https://nextjs.org/docs/deployment

### 이룸 프로젝트 관련 파일
- `.github/workflows/ci.yml` - 현재 CI 설정
- `.github/workflows/lighthouse.yml` - Lighthouse CI 설정
- `vercel.json` - Vercel 배포 설정
- `turbo.json` - Turborepo 설정

---

## 6. 현재 vs 권장 비교

| 항목 | 현재 상태 | 권장 개선 |
|------|----------|----------|
| CI Jobs | lint, typecheck, test, quality, build | + format, e2e, summary |
| 캐싱 | npm만 | + Turbo Remote Cache |
| 테스트 | Unit만 | + Integration, E2E |
| 알림 | 없음 | 슬랙 연동 |
| 롤백 | 수동 | 자동 트리거 규칙 |
| 커버리지 | 미측정 | Codecov 연동 |

---

**Version**: 1.0 | **Created**: 2026-01-16
**Category**: Quality Assurance
**Priority**: P1 (Infrastructure)
