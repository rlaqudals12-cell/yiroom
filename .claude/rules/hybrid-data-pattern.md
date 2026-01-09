# Hybrid 데이터 패턴

> DB 핵심 데이터 + 최신 Mock 표시 데이터 조합 전략

## 개요

Hybrid 패턴은 **DB에는 핵심 데이터만 저장**하고, **표시용 데이터는 런타임에 최신 Mock에서 가져오는** 전략입니다.

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

## 사용 시점

### Hybrid 패턴이 적합한 경우

1. **표시 데이터 개선 시 기존 사용자도 혜택 받아야 할 때**
   - 색상 이름 변경 (위트 → 밀색 베이지)
   - 스타일 가이드 개선
   - 초보자 친화 설명 추가

2. **핵심 분석 결과는 변하지 않지만 표현만 달라질 때**
   - 시즌 타입(spring, summer 등)은 고정
   - 해당 시즌의 추천 컬러/스타일은 개선 가능

3. **재분석 없이 UX 개선을 제공하고 싶을 때**
   - 사용자는 새로고침만 하면 됨
   - API 호출/DB 마이그레이션 불필요

### 직접 DB 저장이 적합한 경우

- AI가 사용자별로 생성한 고유 인사이트
- 측정값 (신체 치수, 피부 점수 등)
- 분석 신뢰도, 이미지 품질 정보

## 구현 예시

### PC-1 결과 페이지

```typescript
// apps/web/app/(main)/analysis/personal-color/result/[id]/page.tsx

import {
  BEST_COLORS,
  WORST_COLORS,
  LIPSTICK_RECOMMENDATIONS,
  STYLE_DESCRIPTIONS,
  EASY_INSIGHTS,
} from '@/lib/mock/personal-color';

function transformDbToResult(dbData: DbPersonalColorAssessment): PersonalColorResult {
  const seasonType = dbData.season.toLowerCase() as SeasonType;

  // Hybrid 전략: 표시 데이터는 항상 최신 Mock 사용
  const mockBestColors = BEST_COLORS[seasonType] || [];
  const mockWorstColors = WORST_COLORS[seasonType] || [];
  const mockLipstick = LIPSTICK_RECOMMENDATIONS[seasonType] || [];
  const mockStyle = STYLE_DESCRIPTIONS[seasonType];
  const mockEasyInsight = EASY_INSIGHTS[seasonType]?.[0];

  return {
    // DB에서 가져오는 핵심 데이터
    seasonType,
    confidence: dbData.confidence || 85,
    analyzedAt: new Date(dbData.created_at),

    // Mock에서 가져오는 표시 데이터
    bestColors: mockBestColors,
    worstColors: mockWorstColors,
    lipstickRecommendations: mockLipstick,
    styleDescription: mockStyle,
    easyInsight: mockEasyInsight,
  };
}
```

### Mock 데이터 export

```typescript
// apps/web/lib/mock/personal-color.ts

// Hybrid 데이터용 export (결과 페이지에서 사용)
export const BEST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
export const WORST_COLORS: Record<SeasonType, ColorInfo[]> = { ... };
export const LIPSTICK_RECOMMENDATIONS: Record<SeasonType, LipstickRecommendation[]> = { ... };
export const STYLE_DESCRIPTIONS: Record<SeasonType, StyleDescription> = { ... };
export const EASY_INSIGHTS: Record<SeasonType, EasyInsight[]> = { ... };
```

## 타입 설계

### 선택적 필드로 하위 호환성 유지

```typescript
// 기존 필드는 유지, 새 필드는 선택적(optional)으로 추가
export interface StyleDescription {
  // 기존 필드 (필수)
  imageKeywords: string[];
  makeupStyle: string;
  fashionStyle: string;
  accessories: string;

  // 초보자 친화 필드 (선택적, 하위 호환)
  easyMakeup?: EasyMakeupGuide;
  easyFashion?: EasyFashionGuide;
  easyAccessory?: EasyAccessoryGuide;
}

export interface PersonalColorResult {
  // 핵심 필드 (필수)
  seasonType: SeasonType;
  confidence: number;

  // 확장 필드 (선택적)
  easyInsight?: EasyInsight;
}
```

### UI에서 Fallback 처리

```tsx
{
  easyInsight ? (
    <div>
      <p>{easyInsight.summary}</p>
      <p>{easyInsight.easyExplanation}</p>
    </div>
  ) : (
    <p>{insight}</p> // 기존 인사이트로 fallback
  );
}
```

## 적용 가능 모듈

| 모듈 | DB 핵심 데이터         | Mock 표시 데이터                         |
| ---- | ---------------------- | ---------------------------------------- |
| PC-1 | seasonType, confidence | bestColors, worstColors, lipstick, style |
| S-1  | skinType, scores       | recommendations, tips, concerns          |
| C-1  | bodyType, measurements | strengths, styleRecommendations          |
| H-1  | hairType, condition    | careRoutine, productRecommendations      |

## 장점

1. **즉시 반영**: Mock 수정 → 배포 → 모든 사용자에게 적용
2. **DB 마이그레이션 불필요**: 스키마 변경 없이 UX 개선
3. **재분석 불필요**: 사용자 액션 없이 개선 사항 적용
4. **성능**: Mock은 정적 import, 런타임 오버헤드 없음

## 주의사항

1. **Mock export 필수**: 결과 페이지에서 사용할 데이터는 반드시 export
2. **타입 일관성**: Mock과 Result 타입 동기화 유지
3. **Fallback 처리**: 새 필드는 선택적으로, UI에서 null 체크

---

**Version**: 1.0 | **Updated**: 2026-01-08 | **Applies to**: PC-1, S-1, C-1, H-1
