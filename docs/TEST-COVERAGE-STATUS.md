# 테스트 커버리지 현황

> **Version**: 1.0 | **Created**: 2026-01-29 | **Updated**: 2026-01-29

> 이룸 프로젝트 테스트 커버리지 현황 및 목표

---

## 요약

| 지표 | 현황 | 목표 |
|------|------|------|
| **총 단위 테스트** | 506개 | - |
| **총 E2E 테스트** | 30개 | - |
| **테스트 프레임워크** | Vitest + Playwright | - |

---

## 테스트 파일 분포

### 카테고리별 분포

| 카테고리 | 테스트 수 | 비율 |
|----------|-----------|------|
| `components/` | 210 | 41.5% |
| `lib/` | 175 | 34.6% |
| `api/` | 59 | 11.7% |
| `pages/` | 22 | 4.3% |
| `app/` | 21 | 4.2% |
| `hooks/` | 13 | 2.6% |
| `types/` | 3 | 0.6% |
| `integration/` | 2 | 0.4% |
| `a11y/` | 1 | 0.2% |
| **총합** | **506** | 100% |

### 모듈별 테스트 커버리지

| 모듈 | 관련 테스트 수 | 주요 테스트 영역 |
|------|----------------|------------------|
| **W-1 (운동)** | 127 | 칼로리 계산, 주간 플랜, 스트릭, 세션 |
| **N-1 (영양)** | 107 | BMR 계산, 식품 분석, 수분 섭취, 인사이트 |
| **S-1 (피부)** | 127 | 피부 분석, 스킨케어 추천, 상관관계 |
| **C-1 (체형)** | 122 | 체형 분석, 인사이트, 시뮬레이션 |
| **PC-1 (퍼스널컬러)** | 43 | 색상 분석, 드레이프 팔레트, 근거 리포트 |

---

## E2E 테스트 커버리지

### 주요 사용자 플로우

| 영역 | 테스트 파일 | 커버리지 |
|------|------------|----------|
| **인증** | `auth/login.spec.ts`, `auth/logout.spec.ts` | ✅ |
| **분석** | `analysis/analysis.spec.ts`, `skin/skin-analysis.spec.ts` | ✅ |
| **영양** | `nutrition/nutrition.spec.ts` | ✅ |
| **운동** | `workout/onboarding.spec.ts` | ✅ |
| **제품** | `products/products.spec.ts`, `products/ingredients.spec.ts` | ✅ |
| **소셜** | `social/social.spec.ts` | ✅ |
| **도움말** | `help/help.spec.ts`, `help/faq.spec.ts`, `help/announcements.spec.ts` | ✅ |
| **설정** | `settings/settings.spec.ts`, `settings/notifications.spec.ts` | ✅ |
| **접근성** | `a11y/accessibility.spec.ts` | ✅ |
| **모바일** | `mobile.spec.ts` | ✅ |
| **하이브리드 UX** | `hybrid/hybrid-ux.spec.ts` | ✅ |
| **새 UX 플로우** | `ux/new-ux-flow.spec.ts` | ✅ |

---

## 커버리지 목표

> 출처: `.claude/rules/testing-patterns.md`

| 영역 | 목표 | 현재 상태 |
|------|------|-----------|
| **전체** | 80% | 측정 필요 |
| **lib/** | 90% | 175개 테스트 존재 |
| **components/** | 75% | 210개 테스트 존재 |
| **api/** | 85% | 59개 테스트 존재 |

### 커버리지 측정 명령어

```bash
cd apps/web
npm run test:coverage
```

### 커버리지 제외 항목

```typescript
// vitest.config.ts에서 제외
exclude: [
  'node_modules/',
  '.next/',
  '**/*.d.ts',
  '**/*.config.*',
  '**/components/ui/**',    // shadcn 컴포넌트
  '**/types/**',            // 타입 정의
  '**/lib/supabase/**',     // Supabase 인프라
]
```

---

## 테스트 구조

### 디렉토리 구조

```
apps/web/tests/
├── components/          # 컴포넌트 테스트 (210개)
│   ├── analysis/
│   ├── dashboard/
│   ├── gamification/
│   ├── nutrition/
│   ├── products/
│   ├── workout/
│   └── ...
├── lib/                 # 비즈니스 로직 테스트 (175개)
│   ├── analysis/
│   ├── gamification/
│   ├── mock/
│   ├── nutrition/
│   ├── products/
│   ├── workout/
│   └── ...
├── api/                 # API 라우트 테스트 (59개)
│   ├── analyze/
│   ├── nutrition/
│   ├── workout/
│   └── ...
├── hooks/               # 커스텀 훅 테스트 (13개)
├── pages/               # 페이지 테스트 (22개)
├── app/                 # App 라우터 테스트 (21개)
├── integration/         # 통합 테스트 (2개)
├── a11y/                # 접근성 테스트 (1개)
└── types/               # 타입 테스트 (3개)
```

### E2E 디렉토리 구조

```
apps/web/e2e/
├── a11y/                # 접근성 테스트
├── admin/               # 관리자 테스트
├── analysis/            # 분석 플로우
├── api/                 # API 엔드포인트
├── auth/                # 인증 플로우
├── challenges/          # 챌린지 기능
├── closet/              # 옷장 기능
├── coach/               # AI 코치
├── gamification/        # 게이미피케이션
├── help/                # 도움말
├── hybrid/              # 하이브리드 UX
├── nutrition/           # 영양 플로우
├── products/            # 제품 기능
├── report/              # 리포트
├── scan/                # 스캔 기능
├── settings/            # 설정
├── skin/                # 피부 분석
├── social/              # 소셜 기능
├── ux/                  # UX 플로우
└── workout/             # 운동 플로우
```

---

## 테스트 실행 명령어

```bash
# 전체 테스트
npm run test

# 특정 파일
npm run test -- path/to/file.test.ts

# Watch 모드
npm run test -- --watch

# 커버리지 리포트
npm run test:coverage

# E2E 테스트
npm run test:e2e

# 특정 테스트만
npm run test -- -t "테스트 이름"
```

---

## 테스트 품질 개선 영역

### 우선순위 높음

| 영역 | 현황 | 개선 필요 |
|------|------|-----------|
| 통합 테스트 | 2개 | 주요 플로우 추가 필요 |
| 접근성 테스트 | 1개 | WCAG 2.1 AA 검증 강화 |

### 우선순위 중간

| 영역 | 현황 | 개선 필요 |
|------|------|-----------|
| PC-1 테스트 | 43개 | 다른 모듈 대비 적음 |
| 에러 경로 테스트 | 부분적 | Mock 실패 시나리오 추가 |

---

## 테스트 작성 가이드라인

> 상세: `.claude/rules/testing-patterns.md` 참조

### 필수 패턴

1. **AAA 패턴**: Arrange → Act → Assert
2. **data-testid**: 최상위 컨테이너에 필수
3. **에지 케이스**: null, undefined, 빈 배열 테스트
4. **에러 케이스**: 실패 시나리오 테스트

### Mock 데이터

- **위치**: `lib/mock/` (21개 파일)
- **용도**: AI 분석 Fallback + 테스트 데이터

---

## 네비게이션

| 목적 | 문서 |
|------|------|
| 테스트 패턴 상세 | [testing-patterns.md](../.claude/rules/testing-patterns.md) |
| Mock Fallback 전략 | [ADR-007](./adr/ADR-007-mock-fallback-strategy.md) |
| CI 파이프라인 | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |
| Lighthouse CI | [.github/workflows/lighthouse.yml](../.github/workflows/lighthouse.yml) |
| 성능 가이드라인 | [performance-guidelines.md](../.claude/rules/performance-guidelines.md) |

---

**Author**: Claude Code
