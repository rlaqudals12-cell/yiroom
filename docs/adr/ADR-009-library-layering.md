# ADR-009: 라이브러리 계층화 및 의존성 관리

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"모든 lib/ 모듈이 4계층 중 하나에 명확히 배치되고, 하향 의존성만 허용"

- Layer 4: Application Features (coach, feed, affiliate)
- Layer 3: Domain Logic (analysis, workout, nutrition)
- Layer 2: Repositories (products, analysis-results)
- Layer 1: Infrastructure (supabase, gemini, utils)
```

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 순환 의존성 | 0건 |
| 계층 위반 | 하향 의존성만 허용 |
| 문서화 | 모든 모듈 계층 명시 |

### 현재 달성률

**55%** - 주요 모듈 계층화, 일부 순환 의존성 존재

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

lib/ 폴더가 56개 모듈로 확산되어 다음 문제 발생:

1. **원형 의존성 위험**: 모듈 간 방향 불명확
2. **계층 구분 없음**: 인프라 vs 도메인 vs 기능 혼재
3. **온보딩 어려움**: 새 개발자가 구조 파악 어려움

**현재 문제 예시**:
```
lib/coach/ → lib/products/ (OK)
lib/coach/ → lib/analysis/ (OK)
lib/analysis/ → lib/coach/? (순환?)
```

## 결정 (Decision)

**4계층 의존성 규칙** 채택:

```
┌─────────────────────────────────────────────────────────────┐
│                    라이브러리 계층화                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 4: Application Features (상위)                        │
│  ├── coach/           # 모든 도메인 의존                     │
│  ├── feed/            # 소셜 기능                           │
│  ├── affiliate/       # 어필리에이트                        │
│  └── smart-matching/  # 크로스 매칭                         │
│                      ↑                                       │
│  Layer 3: Domain Core (중간)                                 │
│  ├── analysis/        # PC-1, S-1, C-1                      │
│  ├── workout/         # W-1                                  │
│  ├── nutrition/       # N-1                                  │
│  └── products/        # 제품 DB                              │
│                      ↑                                       │
│  Layer 2: Shared Services (공유)                             │
│  ├── gemini/          # AI 파이프라인                        │
│  ├── cache/           # 캐싱                                 │
│  └── error/           # 에러 처리                            │
│                      ↑                                       │
│  Layer 1: Core Foundation (최하위)                           │
│  ├── supabase/        # DB 클라이언트                        │
│  ├── utils/           # 순수 유틸리티                        │
│  └── types/           # 공통 타입                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 의존성 규칙

| 계층 | 의존 가능 | 금지 |
|------|----------|------|
| Layer 4 | Layer 1,2,3 | 다른 Layer 4 모듈 |
| Layer 3 | Layer 1,2 | Layer 4, 다른 Layer 3 |
| Layer 2 | Layer 1 | Layer 3,4 |
| Layer 1 | 없음 (자체 완결) | 모든 상위 계층 |

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| Flat 구조 유지 | 변경 없음 | 순환 의존성 위험 | `LOW_ROI` |
| Monorepo packages/ | 강제 분리 | 빌드 복잡도 | `HIGH_COMPLEXITY` |

## 결과 (Consequences)

### 긍정적 결과

- **순환 의존성 방지**: 방향이 명확
- **테스트 격리**: 하위 계층만 mock
- **병렬 개발**: 계층별 독립 작업 가능

### 부정적 결과

- **리팩토링 필요**: 현재 혼재된 코드 정리
- **인터페이스 증가**: 계층 간 통신용 타입

## 구현 가이드

### ESLint 규칙 (권장)

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // Layer 3이 Layer 4를 import 금지
          {
            target: './lib/analysis',
            from: './lib/coach',
            message: 'Layer 3 cannot import from Layer 4'
          },
          // Layer 2가 Layer 3을 import 금지
          {
            target: './lib/gemini',
            from: './lib/analysis',
            message: 'Layer 2 cannot import from Layer 3'
          }
        ]
      }
    ]
  }
};
```

### 폴더 구조 표시

```
lib/
├── [L1] supabase/      # Core Foundation
├── [L1] utils/
├── [L2] gemini/        # Shared Services
├── [L2] cache/
├── [L2] error/
├── [L3] analysis/      # Domain Core
├── [L3] workout/
├── [L3] nutrition/
├── [L3] products/
├── [L4] coach/         # Application Features
├── [L4] feed/
└── [L4] affiliate/
```

## 마이그레이션 계획

| 단계 | 작업 | 예상 시간 |
|------|------|----------|
| 1 | Layer 1 정리 (supabase, utils) | 2시간 |
| 2 | Layer 2 분리 (gemini 분해) | 4시간 |
| 3 | Layer 3 정리 (analysis 통합) | 4시간 |
| 4 | Layer 4 분리 (coach 의존성 정리) | 4시간 |
| 5 | ESLint 규칙 적용 | 1시간 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 보안 패턴](../principles/security-patterns.md) - 의존성 보안, 계층화 원칙
- [원리: 확장성](../principles/extensibility.md) - 모듈 경계, OCP 패턴

### 관련 ADR/스펙
- [ADR-008: Repository-Service 계층](./ADR-008-repository-service-layer.md)
- [ADR-010: AI 파이프라인](./ADR-010-ai-pipeline.md)

---

**Author**: Claude Code
**Reviewed by**: -
