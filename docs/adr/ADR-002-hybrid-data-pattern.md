# ADR-002: Hybrid 데이터 패턴

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

```
"핵심 분석 결과는 영구 보존하면서, 표시 데이터는 즉시 개선 가능한 시스템"

- DB: 분석 고유값(시즌타입, 점수, 신뢰도) 영구 저장
- Mock: 추천/스타일 가이드 무중단 업데이트
- 사용자: 재분석 없이 개선된 콘텐츠 자동 적용
```

### 물리적 한계

| 한계 | 설명 |
|------|------|
| 타입 일관성 | Mock과 DB 타입 동기화 필요 |
| 테스트 복잡도 | 조합 테스트 필요 |

### 100점 기준

| 지표 | 100점 기준 |
|------|-----------|
| 적용 모듈 | PC-1, S-1, C-1, H-1 100% 적용 |
| Mock 품질 | AI 결과와 90% 유사도 |
| 업데이트 속도 | 배포 후 즉시 반영 |

### 현재 달성률

**75%** - PC-1 완전 적용, S-1/C-1 부분 적용

### 의도적 제외

| 제외 항목 | 이유 |
|----------|------|
| AI 개인화 인사이트 | DB 저장 필요 (개인별 고유) |

---

## 상태

`accepted`

## 날짜

2026-01-15

## 맥락 (Context)

AI 분석 결과를 저장하고 표시할 때 두 가지 상충되는 요구사항이 있습니다:

1. **핵심 분석 데이터**: 재분석 없이도 유지되어야 함 (DB 저장)
2. **표시용 데이터**: 지속적으로 개선/업데이트 필요 (추천 색상, 스타일 가이드 등)

문제:
- DB에 모든 데이터 저장 → 개선 시 마이그레이션 필요, 기존 사용자 혜택 불가
- Mock에서 모든 데이터 → 개인화된 분석 결과 유실

## 결정 (Decision)

**Hybrid 데이터 패턴** 채택: DB에는 핵심 데이터만, 표시 데이터는 런타임에 최신 Mock에서 조합

```
┌─────────────────────────────────────────────────────────────┐
│                    transformDbToResult                       │
├─────────────────────────────────────────────────────────────┤
│  DB 데이터 (고정)         │  Mock 데이터 (최신)             │
│  ───────────────          │  ──────────────                 │
│  • seasonType             │  • bestColors                   │
│  • confidence             │  • worstColors                  │
│  • analyzedAt             │  • lipstickRecommendations      │
│  • AI 분석 원본           │  • styleDescription             │
│                           │  • easyInsight                  │
└─────────────────────────────────────────────────────────────┘
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| DB에 모든 데이터 저장 | 일관성 | 개선 시 마이그레이션 필요 | `HIGH_COMPLEXITY` - 빈번한 스키마 변경 부담 |
| Mock 전용 | 개선 용이 | 개인화 결과 유실 | `NOT_NEEDED` - 핵심 분석 결과 보존 필수 |
| 버전별 DB 테이블 | 버전 관리 | 복잡도 높음 | `LOW_ROI` - 오버엔지니어링 |

## 결과 (Consequences)

### 긍정적 결과

- **즉시 반영**: Mock 수정 → 배포 → 모든 사용자에게 적용
- **DB 마이그레이션 불필요**: 스키마 변경 없이 UX 개선
- **재분석 불필요**: 사용자 액션 없이 개선 사항 적용
- **성능**: Mock은 정적 import, 런타임 오버헤드 없음

### 부정적 결과

- **데이터 분리**: DB와 Mock 간 일관성 유지 필요
- **타입 동기화**: Mock 변경 시 타입 업데이트 필수

### 리스크

- Mock 데이터 오류 시 전체 사용자 영향 → **CI/CD에서 Mock 타입 검증**

## 구현 가이드

### 적용 대상

| 모듈 | DB 핵심 데이터 | Mock 표시 데이터 |
|------|---------------|-----------------|
| PC-1 | seasonType, confidence | bestColors, worstColors, lipstick, style |
| S-1 | skinType, scores | recommendations, tips, concerns |
| C-1 | bodyType, measurements | strengths, styleRecommendations |

### 코드 패턴

```typescript
// apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx
import {
  BEST_COLORS,
  WORST_COLORS,
  STYLE_DESCRIPTIONS,
} from '@/lib/mock/personal-color';

function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;

  return {
    // DB에서 가져오는 핵심 데이터
    seasonType,
    confidence: dbData.confidence || 85,
    analyzedAt: new Date(dbData.created_at),

    // Mock에서 가져오는 표시 데이터 (항상 최신)
    bestColors: BEST_COLORS[seasonType] || [],
    worstColors: WORST_COLORS[seasonType] || [],
    styleDescription: STYLE_DESCRIPTIONS[seasonType],
  };
}
```

### Mock Export 규칙

```typescript
// lib/mock/personal-color.ts
// Hybrid 데이터용 - 반드시 export 필수
export const BEST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
export const WORST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
```

## 리서치 티켓

```
[ADR-002-R1] Hybrid 데이터 패턴 최적화
────────────────────────────────────
claude.ai 딥 리서치 요청:
1. CQRS(Command Query Responsibility Segregation) 패턴과 Hybrid 패턴 비교
2. Event Sourcing을 활용한 Mock 데이터 버전 관리 방법
3. 실시간 Mock 업데이트 시 브라우저 캐시 무효화 전략

→ 결과를 Claude Code에서 lib/mock/ 및 transformDbToResult 패턴에 적용
```

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: Hybrid 데이터 패턴](../principles/hybrid-data.md) - DB-Mock 분리 원칙, 데이터 일관성 전략
- [원리: AI 추론](../principles/ai-inference.md) - Fallback 전략, 신뢰도 계산

### 관련 ADR/스펙
- [ADR-007: Mock Fallback 전략](./ADR-007-mock-fallback-strategy.md)
- [Hybrid Data Pattern Rule](../../.claude/rules/hybrid-data-pattern.md)

---

**Author**: Claude Code
**Reviewed by**: -
