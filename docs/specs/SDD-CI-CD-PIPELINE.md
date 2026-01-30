# SDD: CI/CD 파이프라인 (CI/CD Pipeline)

> **Status**: Approved
> **Version**: 2.0
> **Created**: 2026-01-23
> **Updated**: 2026-01-23

> GitHub Actions 기반 CI/CD 및 Vercel 배포 자동화 스펙

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 변경이 자동 검증되고 안전하게 배포되는 상태"

- **CI 완전 자동화**: PR 생성 → lint, typecheck, test, build 자동 완료
- **Branch Protection**: 모든 체크 통과 시에만 머지 가능
- **E2E 자동화**: Preview 환경에서 자동 E2E 테스트 실행
- **성능 게이트**: Lighthouse 90+ 미달 시 PR 블록
- **번들 게이트**: 번들 크기 예산 초과 시 PR 블록
- **빠른 CI**: Turborepo Remote Cache로 전체 CI 3분 이내
- **Smoke Test**: Production 배포 후 자동 검증
- **Instant Rollback**: 문제 발생 시 1분 이내 롤백
- **알림**: Slack/Discord 배포 알림으로 팀 전체 가시성

### 물리적 한계

| 한계 | 설명 |
|------|------|
| GitHub Actions 무료 티어 | 월 2,000분 (초과 시 유료) |
| Vercel Hobby 플랜 | 상용 불가 (Pro 필요 시 비용) |
| E2E 테스트 시간 | Preview당 5-10분 추가 |
| 네트워크 의존성 | 외부 서비스 장애 시 CI 실패 가능 |

### 100점 기준

| 항목 | 100점 기준 | 현재 | 달성률 |
|------|-----------|------|--------|
| CI 파이프라인 | 완전 자동화 | 완전 자동화 | 100% |
| Preview 배포 | 자동 | 자동 | 100% |
| Production 배포 | 자동 | 자동 | 100% |
| Lighthouse | 자동+블록 | 자동(권장) | 70% |
| Bundle Check | 자동+블록 | 예정 | 0% |
| Remote Cache | Turborepo | 예정 | 0% |
| E2E on Preview | 자동 | 제외 | 0% |

### 현재 목표

**종합 달성률**: **75%** (MVP CI/CD Pipeline)

### 의도적 제외 (이번 버전)

- E2E on Preview (비용/시간, PR당 5분+)
- Slack 알림 (GitHub Notifications로 대체)
- 멀티 환경 staging (Preview = Staging 대체)
- Canary 배포 (Instant Rollback으로 대체)

#### 📊 구현 현황

| 기능 | 상태 | 위치 |
|------|------|------|
| CI 워크플로우 | ✅ 완료 | `.github/workflows/ci.yml` |
| 번들 체크 워크플로우 | ✅ 완료 | `.github/workflows/bundle-check.yml` |
| 문서 QA 워크플로우 | ✅ 완료 | `.github/workflows/docs-qa.yml` |
| Dependabot 설정 | ✅ 완료 | `.github/dependabot.yml` |
| Vercel 배포 설정 | ✅ 완료 | `vercel.json` |
| Typecheck 자동화 | ✅ 완료 | `turbo.json` |
| Lint 자동화 | ✅ 완료 | `apps/web/eslint.config.mjs` |
| Preview 환경 | ✅ 완료 | Vercel Integration |

---

## 1. 개요

### 1.1 목적

- 코드 품질 자동 검증 (typecheck, lint, test)
- 빌드 무결성 보장
- Preview/Production 배포 자동화
- 성능 및 번들 크기 모니터링
- 빠른 롤백으로 서비스 안정성 확보

### 1.2 P1: 궁극의 형태

> "모든 변경이 자동 검증되고 안전하게 배포되는 상태"

#### 100점 기준 (이상적 최종 상태)

```
100점 기준:
- PR 생성 → 자동 CI (lint, typecheck, test, build) 완료
- 모든 체크 통과 시에만 머지 가능 (Branch Protection)
- Preview 환경에서 자동 E2E 테스트 실행
- Lighthouse 성능 점수 90+ 미달 시 PR 블록
- 번들 크기 예산 초과 시 PR 블록
- Turborepo Remote Cache로 전체 CI 3분 이내
- Production 배포 후 자동 Smoke Test
- 문제 발생 시 1분 이내 Instant Rollback
- 배포 알림 (Slack/Discord)으로 팀 전체 가시성 확보
- 보안 취약점 자동 감지 (Dependabot + npm audit)
```

#### 물리적 한계

```
- GitHub Actions 무료 티어: 월 2,000분 (초과 시 유료)
- Vercel Hobby 플랜: 상용 불가 (Pro 필요 시 비용)
- E2E 테스트 시간: Preview당 5-10분 추가
- 네트워크 의존성: 외부 서비스 장애 시 CI 실패 가능
```

#### 현재 목표 (75%)

| 항목 | 100% | 현재 목표 | 비고 |
|------|------|----------|------|
| CI 파이프라인 | 자동화 | 자동화 | lint, typecheck, test, build |
| Preview 배포 | 자동 | 자동 | Vercel 자동 |
| Production 배포 | 자동 | 자동 | main 머지 시 |
| Lighthouse | 자동+블록 | 자동(권장) | 90+ 권장, 블록은 Phase 2 |
| Bundle Check | 자동+블록 | 예정 | Phase 2 |
| Remote Cache | Turborepo | 예정 | Phase 2 |
| E2E on Preview | 자동 | 제외 | Phase 3 |
| Smoke Test | 자동 | 제외 | Phase 3 |
| 알림 | Slack | 제외 | GitHub Notifications로 대체 |

#### 의도적 제외

| 항목 | 제외 이유 | 대안 |
|------|----------|------|
| E2E on Preview | 비용/시간 (PR당 5분+) | 로컬 E2E + 수동 검증 |
| Slack 알림 | 팀 규모 작음 | GitHub Notifications |
| 멀티 환경 (staging) | 비용 | Preview = Staging 대체 |
| Canary 배포 | 복잡도 | Instant Rollback으로 대체 |

### 1.3 범위

| 항목 | 우선순위 | 복잡도 | 구현 상태 |
|------|----------|--------|----------|
| PR 트리거 CI | 필수 (P0) | 낮음 | Completed |
| 병렬 Job 실행 | 필수 (P0) | 낮음 | Completed |
| npm 캐싱 | 필수 (P0) | 낮음 | Completed |
| Vercel Preview 배포 | 필수 (P0) | 낮음 | Completed (자동) |
| Vercel Production 배포 | 필수 (P0) | 낮음 | Completed (자동) |
| Lighthouse CI | 높음 (P1) | 중간 | Completed |
| 문서 QA | 높음 (P1) | 낮음 | Completed |
| Bundle Size Check | 중간 (P2) | 중간 | Pending |
| Turborepo Remote Cache | 중간 (P2) | 중간 | Pending |
| Dependabot 설정 | 중간 (P2) | 낮음 | Pending |

### 1.4 관련 문서

- [ADR-049: CI/CD 파이프라인 아키텍처](../adr/ADR-049-cicd-pipeline.md)
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml)
- [.github/workflows/lighthouse.yml](../../.github/workflows/lighthouse.yml)
- [.github/workflows/docs-qa.yml](../../.github/workflows/docs-qa.yml)
- [vercel.json](../../vercel.json)
- [규칙: git-workflow.md](../../.claude/rules/git-workflow.md)
- [규칙: testing-patterns.md](../../.claude/rules/testing-patterns.md)
- [규칙: performance-guidelines.md](../../.claude/rules/performance-guidelines.md)

---

## 2. 파이프라인 구조

### 2.1 전체 플로우

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CI/CD Pipeline Flow                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  [1. PR 생성]                                                               │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    [2. CI - GitHub Actions]                          │   │
│  │                                                                      │   │
│  │   ┌────────┐  ┌──────────┐  ┌──────┐  ┌─────────┐                   │   │
│  │   │  Lint  │  │Typecheck │  │ Test │  │ Quality │  ← 병렬 실행      │   │
│  │   └───┬────┘  └────┬─────┘  └──┬───┘  └────┬────┘                   │   │
│  │       │            │           │            │                        │   │
│  │       └────────────┼───────────┼────────────┘                        │   │
│  │                    ▼           ▼                                     │   │
│  │              ┌──────────────────────┐                                │   │
│  │              │        Build         │ ← 순차 (needs: lint, type, test)│   │
│  │              └──────────────────────┘                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    [3. Preview - Vercel]                             │   │
│  │                                                                      │   │
│  │   ┌──────────────────┐     ┌────────────────────┐                   │   │
│  │   │  Preview 배포    │     │   Lighthouse CI    │                   │   │
│  │   │  (PR 브랜치)     │     │   (성능 측정)      │                   │   │
│  │   └──────────────────┘     └────────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼ (모든 체크 통과 + 리뷰 승인)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    [4. Merge to main]                                │   │
│  │                    (Squash or Rebase)                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│       │                                                                     │
│       ▼                                                                     │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    [5. Production - Vercel]                          │   │
│  │                                                                      │   │
│  │   ┌──────────────────┐     ┌────────────────────┐                   │   │
│  │   │ Production 배포  │     │  Instant Rollback  │                   │   │
│  │   │   (자동)         │     │  (필요시 수동)     │                   │   │
│  │   └──────────────────┘     └────────────────────┘                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 단계별 상세

| 단계 | 트리거 | 실행 위치 | 소요 시간 | 결과 |
|------|--------|----------|----------|------|
| **1. PR 생성** | 개발자 | GitHub | - | PR 오픈 |
| **2. CI** | PR 생성/푸시 | GitHub Actions | 3-5분 | 체크 상태 |
| **3. Preview** | PR 생성 | Vercel | 2분 | Preview URL |
| **4. Merge** | 리뷰 승인 | GitHub | - | main 업데이트 |
| **5. Production** | main 푸시 | Vercel | 2분 | 라이브 배포 |

### 2.3 Job 의존성

```yaml
# 병렬 실행 (독립적)
jobs:
  lint:        # Job 1 - 병렬
  typecheck:   # Job 2 - 병렬
  test:        # Job 3 - 병렬
  quality:     # Job 4 - 병렬 (continue-on-error)

# 순차 실행 (의존성 있음)
  build:       # Job 5 - needs: [lint, typecheck, test]
```

---

## 3. GitHub Actions 워크플로우

### 3.1 CI 워크플로우 (현재 구현)

**파일**: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --run

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - name: Dead code detection (Knip)
        run: npm run quality:deadcode -w @yiroom/web
        continue-on-error: true
      - name: Duplicate code detection (jscpd)
        run: npm run quality:duplicates -w @yiroom/web
        continue-on-error: true

  build:
    needs: [lint, typecheck, test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build:web
```

### 3.2 Turborepo 캐싱 전략

#### 현재: npm 캐싱

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'npm'  # package-lock.json 기반 캐싱
```

**캐시 키 패턴**:
- `npm-${{ runner.os }}-${{ hashFiles('**/package-lock.json') }}`

#### 예정: Turborepo Remote Cache

```yaml
# Phase 2에서 추가 예정
- name: Setup Turborepo Remote Cache
  run: |
    npx turbo link
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}

- run: npm run build:web
  env:
    TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
    TURBO_TEAM: ${{ secrets.TURBO_TEAM }}
```

**캐시 효과**:

| 캐시 대상 | 키 패턴 | 예상 효과 |
|----------|---------|----------|
| npm | `npm-${{ hashFiles('**/package-lock.json') }}` | CI 시간 50% 감소 |
| Turborepo | `turbo-${{ github.sha }}` | 빌드 시간 70% 감소 |
| Next.js | `.next/cache` | 빌드 시간 30% 감소 |

### 3.3 Lighthouse CI 워크플로우

**파일**: `.github/workflows/lighthouse.yml`

```yaml
name: Lighthouse CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  workflow_dispatch:

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build:web
        env:
          SKIP_ENV_VALIDATION: true

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v12
        with:
          urls: |
            http://localhost:3000/home
            http://localhost:3000/analysis/skin
            http://localhost:3000/beauty
          budgetPath: ./apps/web/lighthouse-budget.json
          uploadArtifacts: true
          temporaryPublicStorage: true
          configPath: ./apps/web/lighthouserc.json

      - name: Upload Lighthouse Report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: lighthouse-report
          path: .lighthouseci/
          retention-days: 30
```

### 3.4 문서 QA 워크플로우

**파일**: `.github/workflows/docs-qa.yml`

```yaml
name: Documentation QA

on:
  push:
    branches: [main]
    paths:
      - 'docs/**'
      - '.claude/**'
      - 'CLAUDE.md'
  pull_request:
    branches: [main]
    paths:
      - 'docs/**'
      - '.claude/**'
      - 'CLAUDE.md'

jobs:
  broken-links:
    name: Check Broken Links
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Check broken links in docs
        run: node scripts/check-broken-links.js
        continue-on-error: true
```

---

## 4. Vercel 배포

### 4.1 환경 분류

| 환경 | 트리거 | URL 패턴 | 용도 |
|------|--------|----------|------|
| **Preview** | PR 생성/업데이트 | `yiroom-*.vercel.app` | 기능 검증, 코드 리뷰 |
| **Production** | main 브랜치 머지 | `yiroom.app` | 사용자 서비스 |

### 4.2 Vercel 설정

**파일**: `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "installCommand": "npm install",
  "framework": "nextjs",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ],
  "crons": [
    { "path": "/api/cron/update-prices", "schedule": "0 3 * * *" },
    { "path": "/api/cron/push-reminders", "schedule": "0 0,6,9 * * *" },
    { "path": "/api/cron/challenges", "schedule": "0 0 * * *" },
    { "path": "/api/cron/community-stats", "schedule": "0 */6 * * *" },
    { "path": "/api/cron/expiry-reminder", "schedule": "0 0 * * *" },
    { "path": "/api/cron/cleanup-consents", "schedule": "0 18 * * *" },
    { "path": "/api/cron/cleanup-images", "schedule": "0 19 * * *" },
    { "path": "/api/cron/cleanup-audit-logs", "schedule": "0 19 * * *" }
  ]
}
```

### 4.3 Preview 환경

**특징**:
- PR마다 고유 URL 자동 생성
- 환경 변수는 Production과 동일 (민감 정보 제외 가능)
- PR 닫히면 자동 삭제
- 코멘트로 Preview URL 자동 안내

**활용**:
```
1. 개발자: PR 생성
2. Vercel: 자동 빌드 + Preview 배포
3. 리뷰어: Preview URL에서 기능 확인
4. 개발자: 피드백 반영 → 재배포
5. 리뷰어: 최종 승인
```

### 4.4 Production 환경

**특징**:
- main 브랜치 머지 시 자동 배포
- Zero-Downtime 배포 (Blue-Green)
- Edge Functions 지원
- ISR (Incremental Static Regeneration) 네이티브

**배포 시간**: ~2분

---

## 5. 품질 게이트

### 5.1 PR 머지 조건 (Branch Protection)

| 체크 | 조건 | 필수 여부 | 실행 위치 |
|------|------|----------|----------|
| **Lint** | 에러 0개 | **필수** | GitHub Actions |
| **Typecheck** | 에러 0개 | **필수** | GitHub Actions |
| **Test** | 모든 테스트 통과 | **필수** | GitHub Actions |
| **Build** | 빌드 성공 | **필수** | GitHub Actions |
| Quality (Knip) | 경고 허용 | 권장 | GitHub Actions |
| Quality (jscpd) | 경고 허용 | 권장 | GitHub Actions |
| Lighthouse | 90+ 권장 | 권장 | GitHub Actions |
| Code Review | 1명 이상 승인 | **필수** | GitHub |

### 5.2 테스트 커버리지 목표

| 영역 | 목표 | 최소 (블록 임계값) |
|------|------|------------------|
| **전체** | 80% | 70% |
| **lib/** | 90% | 80% |
| **components/** | 75% | 60% |
| **api/** | 85% | 75% |

**Phase 2 구현 예정**: 커버리지 미달 시 PR 블록

### 5.3 Lighthouse 성능 점수 (90+)

**예산 설정**: `apps/web/lighthouse-budget.json`

```json
[
  {
    "path": "/*",
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "total", "budget": 700 }
    ],
    "resourceCounts": [
      { "resourceType": "script", "budget": 20 },
      { "resourceType": "image", "budget": 30 }
    ]
  }
]
```

**점수 기준**:

| 지표 | 목표 | 경고 | 실패 |
|------|------|------|------|
| **Performance** | 90+ | 80-89 | < 80 |
| **Accessibility** | 95+ | 90-94 | < 90 |
| **Best Practices** | 95+ | 90-94 | < 90 |
| **SEO** | 90+ | 80-89 | < 80 |

### 5.4 번들 크기 제한

| 청크 | 최대 크기 (gzip) | 경고 임계값 |
|------|-----------------|------------|
| Main bundle | 200KB | 180KB |
| Vendor bundle | 300KB | 270KB |
| 개별 페이지 | 50KB | 45KB |
| 전체 초기 로드 | 500KB | 450KB |

**Phase 2 구현 예정**: `preactjs/compressed-size-action`

---

## 6. 롤백 전략

### 6.1 롤백 유형

| 상황 | 액션 | 소요 시간 | 자동화 |
|------|------|----------|--------|
| **빌드 실패** | 자동 롤백 (이전 배포 유지) | 즉시 | 자동 |
| **런타임 오류** | Vercel Instant Rollback | < 1분 | 수동 |
| **기능 이슈** | Revert PR → 새 배포 | < 10분 | 수동 |
| **보안 취약점** | 긴급 Hotfix PR | < 30분 | 수동 |

### 6.2 Instant Rollback 절차

**방법 1: Vercel Dashboard**

```
1. Vercel Dashboard 접속 (https://vercel.com/[team]/yiroom)
2. "Deployments" 탭 선택
3. 롤백할 이전 배포 찾기
4. "..." 메뉴 → "Promote to Production" 클릭
5. 확인 → 1분 이내 완료
```

**방법 2: Vercel CLI**

```bash
# 특정 배포로 롤백
vercel rollback [deployment-url]

# 예시
vercel rollback yiroom-abc123.vercel.app
```

### 6.3 Revert PR 절차

```bash
# 문제 커밋 식별
git log --oneline -10

# Revert 커밋 생성
git revert <commit-hash>

# PR 생성
git push origin revert-branch
gh pr create --title "revert: [문제 기능] 롤백"
```

### 6.4 롤백 결정 기준

| 지표 | 임계값 | 액션 |
|------|--------|------|
| 에러율 | > 5% | 즉시 롤백 |
| 응답 시간 (p95) | > 5초 | 조사 후 롤백 검토 |
| Lighthouse 점수 | < 70 | 조사 후 롤백 검토 |
| 사용자 보고 | 동일 이슈 3건+ | 즉시 롤백 |

---

## 7. P3 원자 분해

### 7.1 의존성 그래프

```
ATOM-1: CI 워크플로우 (✅ 완료)
    ├── ATOM-2: npm 캐싱 (✅ 완료)
    │       └── ATOM-3: Turborepo Remote Cache (⏳ 예정)
    │               └── ATOM-8: CI 성능 최적화 (⏳ 예정)
    ├── ATOM-4: Lighthouse CI (✅ 완료)
    │       └── ATOM-6: Bundle Size Check (⏳ 예정)
    ├── ATOM-5: 문서 QA (✅ 완료)
    └── ATOM-7: Dependabot 설정 (⏳ 예정)
```

### 7.2 ATOM 상세

#### ATOM-1: CI 워크플로우 (Completed)

| 항목 | 내용 |
|------|------|
| **소요시간** | 2시간 |
| **의존성** | 없음 |
| **산출물** | `.github/workflows/ci.yml` |
| **입력** | PR 이벤트 |
| **출력** | 체크 상태 (pass/fail) |
| **성공 기준** | lint, typecheck, test, build 모두 통과 |

#### ATOM-2: npm 캐싱 (Completed)

| 항목 | 내용 |
|------|------|
| **소요시간** | 30분 |
| **의존성** | ATOM-1 |
| **산출물** | `actions/setup-node` cache 설정 |
| **입력** | `package-lock.json` |
| **출력** | 캐시 히트/미스 |
| **성공 기준** | 2회차 CI 시간 50% 감소 |

#### ATOM-3: Turborepo Remote Cache (Pending)

| 항목 | 내용 |
|------|------|
| **소요시간** | 1시간 |
| **의존성** | ATOM-2 |
| **산출물** | `turbo.json` 업데이트, Vercel 연동 |
| **입력** | 빌드 아티팩트 |
| **출력** | Remote Cache 히트/미스 |
| **성공 기준** | 빌드 시간 3분 이내 |

```bash
# 설정 방법
npx turbo link  # Vercel 계정 연동
# 이후 CI에서 자동 캐시
```

#### ATOM-4: Lighthouse CI (Completed)

| 항목 | 내용 |
|------|------|
| **소요시간** | 2시간 |
| **의존성** | ATOM-1 |
| **산출물** | `.github/workflows/lighthouse.yml` |
| **입력** | 빌드된 앱 |
| **출력** | Lighthouse 리포트 |
| **성공 기준** | 성능 점수 90+ 측정 |

#### ATOM-5: 문서 QA (Completed)

| 항목 | 내용 |
|------|------|
| **소요시간** | 2시간 |
| **의존성** | ATOM-1 |
| **산출물** | `.github/workflows/docs-qa.yml` |
| **입력** | `docs/**`, `.claude/**` 변경 |
| **출력** | 링크 검증 결과 |
| **성공 기준** | 깨진 링크 감지 |

#### ATOM-6: Bundle Size Check (Pending)

| 항목 | 내용 |
|------|------|
| **소요시간** | 1시간 |
| **의존성** | ATOM-4 |
| **산출물** | `.github/workflows/bundle-check.yml` |
| **입력** | 빌드 아티팩트 |
| **출력** | 번들 크기 비교 코멘트 |
| **성공 기준** | 예산 초과 시 PR 코멘트 |

```yaml
# 예정 워크플로우
name: Bundle Size Check

on:
  pull_request:
    branches: [main]

jobs:
  bundle-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run build:web

      - name: Analyze bundle
        uses: preactjs/compressed-size-action@v2
        with:
          repo-token: ${{ secrets.GITHUB_TOKEN }}
          pattern: "apps/web/.next/static/**/*.js"
```

#### ATOM-7: Dependabot 설정 (Pending)

| 항목 | 내용 |
|------|------|
| **소요시간** | 30분 |
| **의존성** | 없음 |
| **산출물** | `.github/dependabot.yml` |
| **입력** | 의존성 목록 |
| **출력** | 자동 PR |
| **성공 기준** | 주간 의존성 업데이트 PR 생성 |

```yaml
# 예정 설정
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
      timezone: "Asia/Seoul"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "automated"
```

#### ATOM-8: CI 성능 최적화 (Pending)

| 항목 | 내용 |
|------|------|
| **소요시간** | 2시간 |
| **의존성** | ATOM-3 |
| **산출물** | 최적화된 워크플로우 |
| **입력** | 현재 CI 시간 |
| **출력** | 개선된 CI 시간 |
| **성공 기준** | 전체 CI 시간 5분 이내 |

---

## 8. 보안

### 8.1 환경 변수 관리

| 위치 | 용도 | 접근 제한 |
|------|------|----------|
| GitHub Secrets | CI 빌드용 | Repository Admins |
| Vercel Environment | 런타임용 | Project Members |
| .env.local | 로컬 개발용 | Git Ignored |

### 8.2 필수 Secrets

**GitHub Secrets**:

```
VERCEL_TOKEN          # Vercel CLI용 (수동 배포 시)
TURBO_TOKEN           # Turborepo Remote Cache용
TURBO_TEAM            # Turborepo Team
```

**Vercel Environment Variables**:

```
# 모든 환경 (Production + Preview)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
GOOGLE_GENERATIVE_AI_API_KEY
SUPABASE_SERVICE_ROLE_KEY
CRON_SECRET

# Production만
DATABASE_URL
```

---

## 9. 테스트 계획

### 9.1 CI 파이프라인 테스트

| ID | 시나리오 | 입력 | 예상 결과 |
|----|---------|------|----------|
| CI-1 | Lint 에러 PR | ESLint 위반 코드 | 빌드 실패 |
| CI-2 | Type 에러 PR | TypeScript 에러 | 빌드 실패 |
| CI-3 | 테스트 실패 PR | 실패하는 테스트 | 빌드 실패 |
| CI-4 | 정상 PR | 모든 체크 통과 | 빌드 성공 |
| CI-5 | 캐시 히트 | 동일 package-lock | 빌드 시간 50% 감소 |

### 9.2 배포 테스트

| ID | 시나리오 | 트리거 | 예상 결과 |
|----|---------|--------|----------|
| CD-1 | Preview 배포 | PR 생성 | `*.vercel.app` 접근 가능 |
| CD-2 | Preview 업데이트 | PR 커밋 추가 | 새 배포 |
| CD-3 | Production 배포 | main 머지 | `yiroom.app` 업데이트 |
| CD-4 | 롤백 | Vercel Rollback | 이전 버전 복구 |

### 9.3 성능 테스트

| ID | 시나리오 | 측정 대상 | 목표 |
|----|---------|----------|------|
| PF-1 | CI 전체 시간 | lint + typecheck + test + build | < 5분 |
| PF-2 | 빌드 시간 (캐시) | npm ci + build | < 2분 |
| PF-3 | Preview 배포 시간 | PR → URL 접근 | < 3분 |
| PF-4 | Production 배포 시간 | 머지 → 라이브 | < 3분 |

---

## 10. 모니터링

### 10.1 대시보드

```
GitHub Actions:
https://github.com/[org]/yiroom/actions

Vercel Dashboard:
https://vercel.com/[team]/yiroom

Lighthouse Reports:
GitHub Actions → Artifacts → lighthouse-report 다운로드
```

### 10.2 알림 조건

| 이벤트 | 알림 | 대상 |
|--------|------|------|
| CI 실패 | GitHub Notification | PR 작성자 |
| 배포 실패 | Vercel + GitHub | 팀 전체 |
| Lighthouse < 80 | GitHub Comment | PR 작성자 |

---

## 11. 향후 개선 계획

### Phase 2 (2주 내)

- [ ] Turborepo Remote Cache 연동
- [ ] Bundle Size Check 워크플로우
- [ ] Dependabot 설정
- [ ] npm audit 자동화

### Phase 3 (1개월 내)

- [ ] E2E 테스트 on Preview
- [ ] Smoke Test 자동화
- [ ] Slack/Discord 알림
- [ ] 배포 승인 워크플로우

### Phase 4 (분기별)

- [ ] CodeQL 정적 분석
- [ ] 멀티 환경 (staging)
- [ ] Canary 배포
- [ ] 성능 회귀 자동 감지

---

## 12. 체크리스트

### 12.1 구현 체크리스트

- [x] ATOM-1: CI 워크플로우 (lint, typecheck, test, build)
- [x] ATOM-2: npm 캐싱
- [ ] ATOM-3: Turborepo Remote Cache
- [x] ATOM-4: Lighthouse CI
- [x] ATOM-5: 문서 QA
- [ ] ATOM-6: Bundle Size Check
- [ ] ATOM-7: Dependabot 설정
- [ ] ATOM-8: CI 성능 최적화

### 12.2 보안 체크리스트

- [x] GitHub Secrets 설정
- [x] Vercel Environment Variables 설정
- [x] 보안 헤더 (X-Frame-Options 등)
- [ ] Dependabot 활성화
- [ ] npm audit CI 추가

### 12.3 품질 체크리스트

- [x] PR 머지 조건 설정
- [x] Lighthouse 예산 설정
- [ ] Bundle 예산 설정
- [ ] 커버리지 리포트

---

**Author**: Claude Code
**Version**: 2.0 | **Created**: 2026-01-23 | **Updated**: 2026-01-23

### 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2026-01-23 | 초기 버전 (현재 구현 상태 문서화) |
| 2.0 | 2026-01-23 | P1 궁극의 형태 상세화, 롤백 전략 강화, P3 원자 분해 개선 |
