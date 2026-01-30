# ADR-049: CI/CD 파이프라인 아키텍처

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"모든 PR에 대해 자동으로 품질 검증을 수행하고, 승인된 코드를 안전하게 프로덕션에 배포하며, 문제 발생 시 즉시 롤백할 수 있는 완전 자동화된 파이프라인"

- **품질 검증**: lint, typecheck, test, build 모든 PR에서 자동 실행
- **Preview 배포**: PR별 독립 Preview 환경 자동 생성
- **성능 모니터링**: Lighthouse CI로 Core Web Vitals 자동 검증
- **자동 배포**: main 머지 시 프로덕션 자동 배포
- **즉시 롤백**: 문제 발생 시 1분 이내 이전 버전 복구

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 테스트 시간 | 전체 테스트 스위트 실행 시간 (5-10분) |
| 비용 | GitHub Actions 무료 티어 한도 (2000분/월) |
| Vercel 한도 | Pro 플랜 필요 시 비용 발생 |
| 모바일 테스트 | Expo EAS Build 별도 파이프라인 필요 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| CI 성공률 | 95%+ | - | flaky 테스트 최소화 |
| 빌드 시간 | < 5분 | - | Turborepo 캐싱 |
| 배포 시간 | < 2분 | - | Vercel 최적화 |
| 롤백 시간 | < 1분 | - | Vercel Instant Rollback |
| 테스트 커버리지 | 80%+ | - | unit + integration |

### 현재 목표: 85%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 자체 호스팅 CI | Vercel 통합으로 충분 (ALT_SUFFICIENT) | 팀 규모 10명+ 시 |
| 카나리 배포 | 소규모 팀에 과도 (SCOPE_EXCEED) | MAU 10만+ 시 |
| 블루-그린 배포 | Vercel 롤백으로 충분 (ALT_SUFFICIENT) | 복잡한 마이그레이션 시 |
| E2E 모든 PR | 시간/비용 (FINANCIAL_HOLD) | 중요 경로만 선택 |

## 맥락 (Context)

이룸 프로젝트의 코드 품질 보장과 배포 자동화를 위한 CI/CD 전략 결정이 필요:

1. **코드 품질 보장**: 모든 PR에 대해 typecheck, lint, test, build 검증 필수
2. **배포 자동화**: 수동 배포로 인한 휴먼 에러 방지 및 배포 속도 향상
3. **성능 모니터링**: Core Web Vitals 기준 충족 여부 자동 검증
4. **롤백 전략**: 문제 발생 시 빠른 복구 방안 필요
5. **비용 효율성**: 소규모 팀에 적합한 무료/저비용 솔루션 선호

### 프로젝트 특성

- **모노레포 구조**: Turborepo 기반 (apps/web, apps/mobile, packages/shared)
- **호스팅**: Vercel (Next.js 최적화)
- **팀 규모**: 소규모 (1-3명)
- **배포 빈도**: 일 1-5회 (PR 기반)

## 결정 (Decision)

**GitHub Actions + Vercel** 조합 채택:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CI/CD 아키텍처                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────┐                                               │
│  │   PR 생성    │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              GitHub Actions (CI)                      │       │
│  │  ┌────────┐ ┌──────────┐ ┌──────┐ ┌─────────┐        │       │
│  │  │  Lint  │ │Typecheck │ │ Test │ │ Quality │ (병렬) │       │
│  │  └────────┘ └──────────┘ └──────┘ └─────────┘        │       │
│  │         │         │          │          │            │       │
│  │         └─────────┼──────────┼──────────┘            │       │
│  │                   ▼                                  │       │
│  │            ┌──────────┐                              │       │
│  │            │  Build   │ (needs: lint, typecheck, test)│       │
│  │            └──────────┘                              │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Vercel (자동 트리거)                     │       │
│  │  ┌──────────────────┐     ┌────────────────────┐     │       │
│  │  │  Preview 배포    │     │  Lighthouse CI     │     │       │
│  │  │  (PR 브랜치)     │     │  (성능 측정)       │     │       │
│  │  └──────────────────┘     └────────────────────┘     │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                       │
│         ▼ (모든 체크 통과 + 리뷰 승인)                          │
│  ┌──────────────┐                                               │
│  │   PR 머지    │                                               │
│  │  (to main)   │                                               │
│  └──────┬───────┘                                               │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Vercel (Production)                      │       │
│  │  ┌──────────────────┐     ┌────────────────────┐     │       │
│  │  │ Production 배포  │     │   Instant Rollback │     │       │
│  │  │   (자동)         │     │   (필요시 수동)    │     │       │
│  │  └──────────────────┘     └────────────────────┘     │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### CI 플랫폼: GitHub Actions

**선택 이유**:
- GitHub 네이티브 통합 (PR 체크, 코멘트 자동화)
- 무료 티어 충분 (월 2,000분 무료)
- YAML 기반 설정으로 버전 관리 용이
- Marketplace 액션 풍부 (Lighthouse, Bundle Check 등)

### CD 플랫폼: Vercel

**선택 이유**:
- Next.js 최적화 (공식 지원)
- GitHub 연동 자동 배포 (설정 불필요)
- Preview 환경 자동 생성 (PR당)
- Instant Rollback 지원 (1분 이내)
- Edge Functions, ISR 네이티브 지원

### 필수 체크 (PR 머지 조건)

| 체크 | 조건 | 실행 위치 |
|------|------|----------|
| **Lint** | 에러 0개 | GitHub Actions |
| **Typecheck** | 에러 0개 | GitHub Actions |
| **Test** | 모든 테스트 통과 | GitHub Actions |
| **Build** | 빌드 성공 | GitHub Actions |

### 권장 체크 (비필수)

| 체크 | 조건 | 실행 위치 |
|------|------|----------|
| Quality (Knip) | 경고 허용 | GitHub Actions |
| Quality (jscpd) | 경고 허용 | GitHub Actions |
| Lighthouse | 90+ 권장 | GitHub Actions |

### 병렬화 전략

```yaml
jobs:
  lint:        # 병렬 1
  typecheck:   # 병렬 2
  test:        # 병렬 3
  quality:     # 병렬 4 (continue-on-error)
  build:       # 순차 (needs: lint, typecheck, test)
```

### 캐싱 전략

| 캐시 대상 | 키 패턴 | 예상 효과 |
|----------|---------|----------|
| npm | `npm-${{ hashFiles('**/package-lock.json') }}` | CI 시간 50% 감소 |
| Turborepo | `turbo-${{ github.sha }}` | 빌드 시간 70% 감소 |
| Next.js | `.next/cache` | 빌드 시간 30% 감소 |

### 품질 게이트

**Lighthouse 예산**:

| 지표 | 목표 | 경고 | 실패 |
|------|------|------|------|
| Performance | 90+ | 80-89 | < 80 |
| Accessibility | 95+ | 90-94 | < 90 |
| Best Practices | 95+ | 90-94 | < 90 |
| SEO | 90+ | 80-89 | < 80 |

**테스트 커버리지 목표**:

| 영역 | 목표 | 최소 |
|------|------|------|
| 전체 | 80% | 70% |
| lib/ | 90% | 80% |
| components/ | 75% | 60% |
| api/ | 85% | 75% |

**번들 크기 예산 (예정)**:

| 청크 | 최대 크기 (gzip) |
|------|-----------------|
| Main bundle | 200KB |
| Vendor bundle | 300KB |
| 개별 페이지 | 50KB |
| 전체 초기 로드 | 500KB |

### 롤백 전략

| 상황 | 액션 | 소요 시간 |
|------|------|----------|
| 빌드 실패 | 자동 롤백 (이전 배포 유지) | 즉시 |
| 런타임 오류 | Vercel Instant Rollback | < 1분 |
| 기능 이슈 | Revert PR -> 새 배포 | < 10분 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **CircleCI** | 강력한 병렬화, Orbs 생태계 | 무료 티어 제한 (250분/주), GitHub 외부 도구 | `COST_CONCERN` |
| **Jenkins** | 완전한 커스터마이징, 온프레미스 가능 | 셀프 호스팅 부담, 설정 복잡도, 유지보수 비용 | `COMPLEXITY_HIGH` |
| **AWS CodePipeline** | AWS 생태계 통합, 엔터프라이즈급 | 복잡한 설정, 러닝 커브, Vercel과 중복 | `NOT_ALIGNED` |
| **GitLab CI** | GitLab 네이티브, 무료 DevOps 기능 | GitHub 사용 중이므로 마이그레이션 필요 | `MIGRATION_COST` |
| **Netlify (CD)** | 간편한 설정, 무료 티어 | Next.js 고급 기능(ISR, Edge) 제한 | `FEATURE_GAP` |

### 제외 사유 코드 설명

| 코드 | 의미 |
|------|------|
| `COST_CONCERN` | 무료 티어 제한으로 비용 발생 예상 |
| `COMPLEXITY_HIGH` | 설정/유지보수 복잡도가 팀 규모 대비 과도 |
| `NOT_ALIGNED` | 현재 인프라(Vercel)와 중복/불일치 |
| `MIGRATION_COST` | 기존 GitHub 워크플로우 마이그레이션 비용 |
| `FEATURE_GAP` | Next.js 고급 기능 지원 부족 |

## 결과 (Consequences)

### 긍정적 결과

1. **품질 자동 보장**: 모든 PR이 typecheck, lint, test, build 통과해야 머지
2. **빠른 피드백**: 병렬 실행으로 CI 시간 3-5분 이내
3. **무중단 배포**: Vercel Preview로 사전 검증, Instant Rollback으로 빠른 복구
4. **비용 효율**: GitHub Actions 무료 티어 + Vercel Hobby/Pro 내에서 운영
5. **개발자 경험**: PR 생성만으로 자동 Preview 배포, 별도 설정 불필요
6. **성능 모니터링**: Lighthouse CI로 Core Web Vitals 자동 측정

### 부정적 결과

1. **Vercel 종속성**: 다른 호스팅으로 마이그레이션 시 배포 파이프라인 재구성 필요
2. **GitHub Actions 러닝 커브**: YAML 문법, 액션 사용법 학습 필요
3. **E2E 테스트 미포함**: Preview 환경에서 자동 E2E 테스트는 Phase 3로 연기

### 리스크

| 리스크 | 가능성 | 영향 | 완화 전략 |
|--------|--------|------|----------|
| GitHub Actions 장애 | 낮음 | 중간 | 수동 배포 절차 문서화 |
| Vercel 장애 | 낮음 | 높음 | 롤백 절차 숙지, 알림 설정 |
| 무료 티어 초과 | 중간 | 낮음 | 사용량 모니터링, 캐싱 최적화 |

## 구현 가이드

### CI 워크플로우 (현재 구현)

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

### Vercel 배포 설정 (현재 구현)

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
  ]
}
```

### Turborepo Remote Cache 연동 (예정)

```bash
# Vercel과 연동
npx turbo link

# CI에서 사용
TURBO_TOKEN=${{ secrets.TURBO_TOKEN }}
TURBO_TEAM=${{ secrets.TURBO_TEAM }}
```

### 롤백 절차

```
1. Vercel Dashboard 접속
2. Deployments 탭 선택
3. 롤백할 배포 선택
4. "Promote to Production" 클릭
5. 확인

또는 CLI:
$ vercel rollback [deployment-url]
```

## 향후 개선 계획

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

## 관련 문서

### 스펙 문서
- [SDD-CI-CD-PIPELINE.md](../specs/SDD-CI-CD-PIPELINE.md) - 상세 구현 스펙

### 규칙 문서
- [git-workflow.md](../../.claude/rules/git-workflow.md) - Git 워크플로우
- [testing-patterns.md](../../.claude/rules/testing-patterns.md) - 테스트 패턴
- [performance-guidelines.md](../../.claude/rules/performance-guidelines.md) - 성능 가이드

### 워크플로우 파일
- [.github/workflows/ci.yml](../../.github/workflows/ci.yml) - CI 워크플로우
- [.github/workflows/lighthouse.yml](../../.github/workflows/lighthouse.yml) - Lighthouse CI
- [.github/workflows/docs-qa.yml](../../.github/workflows/docs-qa.yml) - 문서 QA

### 관련 ADR
- [ADR-015: 테스트 전략](./ADR-015-testing-strategy.md) - 테스트 피라미드
- [ADR-019: 성능 모니터링](./ADR-019-performance-monitoring.md) - 성능 모니터링

---

**Author**: Claude Code
**Reviewed by**: -
