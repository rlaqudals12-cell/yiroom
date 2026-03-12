# SDD-SKIN-DIARY: 피부 일기 — 자동 기록 기반 시계열 트렌드

> **Status**: Active | **Version**: 1.0 | **Date**: 2026-03-12
> **ADR**: [ADR-087](../adr/ADR-087-skin-diary.md)
> **원리**: [skin-diary.md](../principles/skin-diary.md)

---

## 1. 개요

기존 S-1/S-2 분석 결과를 시계열로 활용하여, 추가 마찰 없이 피부 변화 트렌드를 제공하는 시스템.

### 궁극의 형태 (P1)

- **100점**: AI 기반 피부 패턴 예측 + 크로스 도메인 인과 분석 + 개인화 루틴 자동 조정
- **현재 목표**: 75% (시계열 트렌드 시각화 + 악화 알림 + 선택적 메모)
- **의도적 제외**: AI 예측 (데이터 부족), 루틴 자동 조정 (Phase 2), 사진 비교 뷰 (CIE Phase 2 의존)

---

## 2. 데이터 모델

### 2.1 트렌드 엔진 입출력

```typescript
// 입력: skin_assessments 시계열
interface DiaryEntry {
  id: string;
  date: string; // ISO date (YYYY-MM-DD)
  vitalityScore: number; // 0-100
  vitalityGrade: 'S' | 'A' | 'B' | 'C' | 'D';
  scoreBreakdown: {
    hydration: number;
    elasticity: number;
    clarity: number;
    tone: number;
  };
  primaryConcerns: string[];
  skinType: string;
  zoneHighlights?: {
    // 주요 존 변화
    improved: string[];
    worsened: string[];
  };
  note?: DiaryNote; // 선택적 사용자 메모
}

// 선택적 메모
interface DiaryNote {
  conditionEmoji: '😊' | '🙂' | '😐' | '😟' | '😰';
  text: string; // 최대 200자
}

// 출력: 트렌드 분석 결과
interface TrendAnalysis {
  period: '7d' | '30d' | '90d';
  entries: DiaryEntry[];
  entryCount: number;

  // 이동평균
  shortTermAvg: number; // 최근 3회 평균
  longTermAvg: number; // 최근 7회 평균

  // 트렌드 방향
  trend: 'improving' | 'stable' | 'declining';
  changeRate: number; // % 변화율

  // 카테고리별 트렌드
  categoryTrends: {
    hydration: TrendDirection;
    elasticity: TrendDirection;
    clarity: TrendDirection;
    tone: TrendDirection;
  };

  // 알림
  alerts: TrendAlert[];

  // 스트릭
  analysisStreak: number; // 연속 분석 일수 (주 1회 기준)
}

type TrendDirection = {
  trend: 'improving' | 'stable' | 'declining';
  change: number; // 절대값 변화
  changePercent: number; // % 변화
};

interface TrendAlert {
  type: 'deterioration' | 'improvement' | 'milestone';
  severity: 'info' | 'warning';
  category: string; // hydration, elasticity 등
  message: string; // "최근 3회 수분 점수 연속 하락"
  suggestion?: string; // "수분 섭취를 늘려보세요"
}
```

### 2.2 캘린더 뷰 데이터

```typescript
interface CalendarDay {
  date: string; // YYYY-MM-DD
  hasAssessment: boolean;
  vitalityGrade?: 'S' | 'A' | 'B' | 'C' | 'D';
  conditionEmoji?: string;
  isToday: boolean;
}

interface CalendarMonth {
  year: number;
  month: number; // 1-12
  days: CalendarDay[];
  assessmentCount: number;
  averageScore: number;
}
```

---

## 3. 트렌드 엔진

### 3.1 이동평균 계산

```
shortTermAvg = average(최근 3회 vitalityScore)
longTermAvg = average(최근 7회 vitalityScore)
```

### 3.2 트렌드 판정

```
changeRate = (shortTermAvg - longTermAvg) / longTermAvg × 100

|changeRate| < 5%  → 'stable'
changeRate ≥ 5%    → 'improving'
changeRate ≤ -5%   → 'declining'
```

### 3.3 악화 감지

```
연속 하락 알림 조건:
  최근 3회 vitalityScore가 모두 이전보다 낮고,
  총 하락 폭 ≥ 10점

카테고리별 악화 조건:
  특정 카테고리(hydration 등)가 최근 3회 연속 5점 이상 하락

개선 마일스톤:
  vitalityGrade가 한 단계 이상 상승 (예: C→B)
```

---

## 4. API 엔드포인트

### 4.1 트렌드 조회

```
GET /api/skin-diary?period=30d
Authorization: Bearer {clerk_token}

Response:
{
  success: true,
  data: {
    trend: TrendAnalysis,
    calendar: CalendarMonth,
    recentEntries: DiaryEntry[]   // 최근 5개
  }
}
```

### 4.2 메모 저장

```
POST /api/skin-diary/note
Authorization: Bearer {clerk_token}

Request:
{
  date: "2026-03-12",
  conditionEmoji: "😊",
  text: "새 세럼 사용 3일째, 수분감 좋아진 느낌"
}

Response:
{
  success: true,
  data: { id: string }
}
```

---

## 5. DB 스키마

### 5.1 기존 테이블 활용

`skin_assessments` — 변경 없음. 시계열 쿼리만 추가.

```sql
-- 트렌드 쿼리 (최근 90일)
SELECT
  id,
  created_at::date AS date,
  (scores->>'vitalityScore')::int AS vitality_score,
  scores->>'vitalityGrade' AS vitality_grade,
  scores->'scoreBreakdown' AS score_breakdown,
  concerns AS primary_concerns,
  skin_type
FROM skin_assessments
WHERE clerk_user_id = $1
  AND created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;
```

### 5.2 신규 테이블 (선택적 메모)

```sql
CREATE TABLE IF NOT EXISTS skin_diary_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,
  condition_emoji TEXT CHECK (condition_emoji IN ('😊', '🙂', '😐', '😟', '😰')),
  note TEXT DEFAULT '' CHECK (char_length(note) <= 200),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clerk_user_id, date)
);

ALTER TABLE skin_diary_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_own_notes" ON skin_diary_notes
  FOR ALL USING (clerk_user_id = auth.get_user_id());

CREATE INDEX idx_skin_diary_notes_user_date
  ON skin_diary_notes(clerk_user_id, date DESC);
```

---

## 6. 파일 구조

```
lib/skin-diary/
├── index.ts              # Barrel export
├── types.ts              # DiaryEntry, TrendAnalysis, CalendarDay 등
├── trend-engine.ts       # 이동평균, 트렌드 판정, 악화 감지
├── diary-repository.ts   # skin_assessments 시계열 쿼리 + 메모 CRUD
└── insight-generator.ts  # 트렌드 → ConnectionAwareness 인사이트

app/(main)/diary/
├── page.tsx              # 다이어리 메인 (캘린더 + 트렌드)
└── _components/
    ├── SkinCalendar.tsx   # 캘린더 뷰 (월간, 색상 코딩)
    ├── TrendChart.tsx     # 트렌드 라인 차트 (7d/30d/90d 토글)
    ├── DiaryEntryCard.tsx # 개별 기록 카드 (점수 + 존 변화)
    ├── AlertBanner.tsx    # 악화/개선 알림 배너
    ├── NoteInput.tsx      # 메모 입력 (이모지 + 텍스트)
    └── TrendSummary.tsx   # 상단 요약 카드 (트렌드 방향 + 변화율)

app/api/skin-diary/
└── route.ts              # GET (트렌드 조회) + POST (메모 저장)
```

---

## 7. 테스트 전략

| 레벨     | 대상                             | 파일                                            |
| -------- | -------------------------------- | ----------------------------------------------- |
| 단위     | 이동평균, 트렌드 판정, 악화 감지 | `tests/lib/skin-diary/trend-engine.test.ts`     |
| 단위     | 시계열 쿼리, 캘린더 생성         | `tests/lib/skin-diary/diary-repository.test.ts` |
| API      | 트렌드 조회, 메모 CRUD           | `tests/api/skin-diary.test.ts`                  |
| 컴포넌트 | 캘린더, 차트, 알림 렌더링        | `tests/components/diary/`                       |

### 핵심 테스트 케이스

- 데이터 0건 → 빈 상태 UI
- 데이터 1-2건 → "데이터 부족" 메시지, 부분 차트
- 데이터 3건+ → 이동평균 계산 정확성
- 연속 하락 3회 → 악화 알림 트리거
- 등급 상승 → 마일스톤 알림
- 메모 200자 초과 → 유효성 검증 실패

---

## 8. 성능 목표

| 지표            | 목표                       |
| --------------- | -------------------------- |
| 트렌드 API 응답 | < 500ms (90일 데이터)      |
| 캘린더 렌더링   | < 200ms                    |
| 차트 렌더링     | < 300ms (90 데이터 포인트) |

---

**Version**: 1.0 | **Created**: 2026-03-12
