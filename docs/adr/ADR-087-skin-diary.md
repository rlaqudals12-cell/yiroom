# ADR-087: 피부 일기 — 자동 기록 기반 시계열 트렌드 시스템

> **Status**: accepted
> **Date**: 2026-03-12
> **Deciders**: Claude Code
> **원리 문서**: [skin-diary.md](../principles/skin-diary.md), [skin-physiology.md](../principles/skin-physiology.md)

---

## Context

이룸의 피부 분석(S-1, S-2)은 **단발 스냅샷**만 제공한다.
운동(W-1)과 영양(N-1)은 이미 시계열 기록/트렌드를 제공하는 반면,
피부만 시간축이 없어 **모듈 간 불균형**이 존재한다.

S-2의 `changeFromPrevious` 필드가 이미 이전 분석 대비 변화를 계산하지만,
이를 시각화하거나 장기 트렌드로 제공하는 UI가 없다.

### 핵심 문제

1. 사용자가 "내 피부가 좋아지고 있는지" 확인할 방법이 없음
2. 스킨케어 제품 변경 후 효과를 추적할 수 없음
3. 피부-영양-운동 간 상관관계를 시간축으로 볼 수 없음

---

## Decision

### 선택: "자동 기록 중심 피부 일기" (Option B)

**새 테이블 없이** 기존 `skin_assessments` 시계열 데이터를 활용하고,
트렌드 엔진 + 시각화 UI만 추가한다.

### 대안 비교

| 옵션                    | 설명                                     | 장점                    | 단점                           |
| ----------------------- | ---------------------------------------- | ----------------------- | ------------------------------ |
| **A. 전통적 일기**      | 매일 셀카 + 설문 + 별도 DB               | 풍부한 데이터           | 높은 마찰, 30일 이탈률 90%+    |
| **B. 자동 기록 (선택)** | 기존 분석 결과 시계열 활용 + 선택적 메모 | 마찰 제로, 기존 DB 활용 | 데이터 빈도가 분석 빈도에 의존 |
| **C. 하이브리드**       | 자동 기록 + 매일 간단 체크인             | 데이터 밀도 높음        | 체크인 마찰 여전히 존재        |

### 선택 근거

1. **마찰 최소화**: 사용자에게 추가 행동을 요구하지 않음
2. **기존 인프라 활용**: `skin_assessments` 테이블에 이미 시계열 데이터 축적 중
3. **S-2 changeFromPrevious 활용**: 이전 분석 대비 변화 데이터가 이미 존재
4. **점진적 확장**: 필요 시 Option C로 확장 가능 (선택적 메모만 추가)

---

## Architecture

### 데이터 흐름

```
기존 플로우 (변경 없음):
  S-1/S-2 분석 → skin_assessments INSERT → 결과 페이지 표시

추가 플로우:
  skin_assessments 시계열 → 트렌드 엔진 → 트렌드 API → 다이어리 UI
                                              ↓
                         ConnectionAwareness 인사이트 자동 생성
```

### 컴포넌트 구성

```
lib/skin-diary/
├── index.ts              # Barrel export
├── types.ts              # 트렌드, 엔트리, 알림 타입
├── trend-engine.ts       # 이동평균, 악화 감지, 변화율 계산
├── diary-repository.ts   # skin_assessments 시계열 쿼리
└── insight-generator.ts  # 트렌드 → ConnectionAwareness 인사이트

app/(main)/diary/
├── page.tsx              # 다이어리 메인 (캘린더 + 트렌드)
└── components/
    ├── SkinCalendar.tsx   # 캘린더 뷰 (색상 코딩)
    ├── TrendChart.tsx     # 트렌드 라인 차트
    ├── DiaryEntry.tsx     # 개별 기록 카드
    └── AlertBanner.tsx    # 악화/개선 알림 배너

app/api/skin-diary/
└── route.ts              # 트렌드 데이터 API
```

### DB 전략

**새 테이블 없음.** 기존 테이블만 사용:

| 테이블                         | 용도                             |
| ------------------------------ | -------------------------------- |
| `skin_assessments`             | 분석 결과 시계열 (이미 존재)     |
| `skin_diary_notes` (NEW, 선택) | 사용자 메모/컨디션 (최소 스키마) |

`skin_diary_notes`는 선택적 메모 기능용 경량 테이블:

```sql
CREATE TABLE skin_diary_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,
  condition_emoji TEXT,           -- 😊😐😟😰😡 (5단계)
  note TEXT DEFAULT '',           -- 한줄 메모 (최대 200자)
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clerk_user_id, date)    -- 하루 1개
);
```

### 트렌드 엔진 알고리즘

```typescript
interface TrendResult {
  // 이동평균
  shortTermAvg: number; // 3회 이동평균
  longTermAvg: number; // 7회 이동평균

  // 변화 감지
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number; // -100 ~ +100 (%)

  // 알림
  alerts: TrendAlert[]; // 악화/개선 알림

  // 존별 트렌드
  zoneChanges: ZoneChange[]; // 개선/악화된 존 목록
}
```

---

## Consequences

### 긍정적

- 기존 분석 결과를 재활용하여 **추가 마찰 없이** 시간축 제공
- DB 마이그레이션 최소화 (선택적 메모 테이블 1개)
- ConnectionAwareness와 자연스럽게 통합
- S-2의 `changeFromPrevious`를 시각적으로 활용

### 부정적

- 데이터 빈도가 사용자의 분석 빈도에 의존 (매일 분석하지 않으면 트렌드 빈약)
- 주관적 컨디션 데이터가 선택적이라 일부 상관 분석 제한

### 리스크

| 리스크                     | 확률 | 대응                                        |
| -------------------------- | ---- | ------------------------------------------- |
| 분석 빈도 낮아 트렌드 부족 | 중   | 최소 3회 데이터에서도 의미 있는 트렌드 표시 |
| 시각화 성능 (대량 데이터)  | 낮   | 최근 90일만 쿼리, 페이지네이션              |

---

## Related

- [원리: skin-diary.md](../principles/skin-diary.md) — 트렌드 분석 과학적 근거
- [원리: skin-physiology.md](../principles/skin-physiology.md) — 피부 생리학
- [ADR-083: ConnectionAwareness](./ADR-083-connection-awareness-architecture.md) — 크로스 도메인 연결
- [SDD: SDD-SKIN-DIARY.md](../specs/SDD-SKIN-DIARY.md) — 구현 스펙

---

**Version**: 1.0 | **Created**: 2026-03-12
