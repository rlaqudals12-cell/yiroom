# UX 점검 결과 — 헤어 분석 결과 페이지 (H-1)

## 1차 점검 (2026-03-08)

**대상**: `apps/web/app/(main)/analysis/hair/result/[id]/page.tsx`
**화면 유형**: 분석 결과
**모드**: 교차 모듈 일관성 점검 (A1, I4, J1, K1 중심)
**판정**: 4건 수정 → 전 항목 통과

---

## 수정 항목 (4건)

| #   | 항목              | 파일:라인                   | 수정 내용                                               | 심각도       |
| --- | ----------------- | --------------------------- | ------------------------------------------------------- | ------------ |
| 1   | A1 영어 raw value | page.tsx:124,126,128        | `dbData.hair_type` 등 fallback → `'알 수 없음'` (3개소) | **Critical** |
| 2   | A1 영어 raw value | page.tsx:431                | `concernData?.label \|\| concern` → `\|\| '기타'`       | **Critical** |
| 3   | K1 신뢰도 표시    | page.tsx:82,108,150,339-341 | `analysisReliability` 필드 추가 + 헤더에 한글 표시      | **Medium**   |
| 4   | J1 다크 모드      | page.tsx:542                | bottom bar `dark:bg-card/90 dark:border-border` 추가    | **High**     |

---

## 수정 상세

### 1. A1 — 영어 raw value 노출 방지 (line 124, 126, 128)

**Before:**

```typescript
const hairTypeLabel = HAIR_TYPES.find((t) => t.id === dbData.hair_type)?.label || dbData.hair_type;
const hairThicknessLabel =
  HAIR_THICKNESS.find((t) => t.id === dbData.hair_thickness)?.label || dbData.hair_thickness;
const scalpTypeLabel =
  SCALP_TYPES.find((t) => t.id === dbData.scalp_type)?.label || dbData.scalp_type;
```

**After:**

```typescript
const hairTypeLabel = HAIR_TYPES.find((t) => t.id === dbData.hair_type)?.label || '알 수 없음';
const hairThicknessLabel =
  HAIR_THICKNESS.find((t) => t.id === dbData.hair_thickness)?.label || '알 수 없음';
const scalpTypeLabel = SCALP_TYPES.find((t) => t.id === dbData.scalp_type)?.label || '알 수 없음';
```

### 2. A1 — 고민 항목 fallback (line 431)

**Before:** `concernData?.label || concern`
**After:** `concernData?.label || '기타'`

### 3. K1 — 신뢰도 표시 (line 82, 108, 150, 339-341)

- `HairAnalysisDBRow` 인터페이스에 `analysisReliability?: 'high' | 'medium' | 'low'` 추가
- `HairAnalysisResultView` 인터페이스에 `analysisReliability` 필수 필드 추가
- DB → View 변환 시 `dbData.recommendations?.analysisReliability || 'medium'` 매핑
- 헤더에 신뢰도 한글 표시 (높음/보통/참고용)

### 4. J1 — 하단 고정 바 다크 모드 (line 542)

**Before:** `bg-card/95 border-t border-border/50`
**After:** `bg-card/80 dark:bg-card/90 backdrop-blur-sm border-t border-border/50 dark:border-border`

---

## 기존 통과 항목

- **I4**: AITransparencyNotice, ResultPageInsights, ContextLinkingCard, ShareButton 이미 존재
- **A2**: 해요체 통일 완료
- **D4**: 부정 표현 없음

---

## 검증

- **tsc**: 0 errors
- **ESLint**: 0 errors (2 sonarjs warnings — nested ternary in reliability display, 기능적 패턴)

---

**관련 패턴**: KI-001 (영어 enum 직접 렌더링), KI-003 (fallback raw value)
