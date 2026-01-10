# 피부 Phase C: 피부 일기/추적

> 일일 컨디션 기록 및 월간 리포트 기능

## 1. 개요

### 1.1 목적

사용자의 일일 피부 컨디션과 생활 요인을 기록하여 피부 상태 변화의 원인을 분석

### 1.2 범위

- 일일 피부 컨디션 기록
- 생활 요인 추적 (수면, 수분, 스트레스)
- 월간 트렌드 리포트
- AI 상관관계 분석

### 1.3 참조

- SDD-S1-UX-IMPROVEMENT.md §4.2 (기존 스키마)
- Phase B (스킨케어 루틴) 연동

---

## 2. 기능 요구사항

### 2.1 일일 기록 항목

```typescript
interface SkinDiaryEntry {
  id: string;
  clerkUserId: string;
  entryDate: Date;

  // 피부 컨디션 (필수)
  skinCondition: 1 | 2 | 3 | 4 | 5; // 1: 매우 나쁨 ~ 5: 매우 좋음
  conditionNotes?: string;

  // 생활 요인 (선택)
  sleepHours?: number;
  sleepQuality?: 1 | 2 | 3 | 4 | 5;
  waterIntakeMl?: number;
  stressLevel?: 1 | 2 | 3 | 4 | 5;

  // 외부 요인 (선택)
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'cold' | 'hot' | 'humid' | 'dry';
  outdoorHours?: number;

  // 스킨케어 연동 (Phase B)
  morningRoutineCompleted: boolean;
  eveningRoutineCompleted: boolean;
  specialTreatments: string[];

  // AI 분석 결과
  aiCorrelationScore?: number;
  aiInsights?: CorrelationInsight[];

  createdAt: Date;
  updatedAt: Date;
}
```

### 2.2 상관관계 분석

```typescript
interface CorrelationInsight {
  factor: string; // "수면", "수분 섭취", "스트레스"
  correlation: number; // -1 ~ 1
  confidence: number; // 0-100
  insight: string; // "수면 7시간 이상일 때 피부 상태가 15% 개선"
  recommendation: string; // "수면 시간을 7시간 이상 유지해보세요"
}

interface MonthlyReport {
  month: string; // "2026-01"
  avgCondition: number;
  bestDay: Date;
  worstDay: Date;
  topFactors: CorrelationInsight[];
  routineCompletionRate: {
    morning: number; // 0-100%
    evening: number;
  };
  trendDirection: 'improving' | 'stable' | 'declining';
}
```

---

## 3. UI/UX 설계

### 3.1 페이지 구조

```
app/(main)/analysis/skin/diary/
├── page.tsx              # 캘린더 + 오늘 기록
├── [date]/
│   └── page.tsx          # 특정 날짜 상세
├── report/
│   └── page.tsx          # 월간 리포트
└── insights/
    └── page.tsx          # AI 인사이트
```

### 3.2 컴포넌트

```
components/skin/diary/
├── DiaryCalendar.tsx         # 월간 캘린더 (컨디션 색상 표시)
├── DiaryEntryForm.tsx        # 기록 폼
├── ConditionSelector.tsx     # 컨디션 1-5 선택
├── LifestyleFactors.tsx      # 생활 요인 입력
├── RoutineCheckbox.tsx       # 루틴 완료 체크
├── MonthlyReportCard.tsx     # 월간 요약 카드
├── CorrelationChart.tsx      # 상관관계 차트
├── FactorTrendChart.tsx      # 요인별 트렌드
└── index.ts
```

### 3.3 와이어프레임

```
┌─────────────────────────────┐
│  피부 일기          [리포트] │
├─────────────────────────────┤
│  ◀  2026년 1월  ▶          │
│  일 월 화 수 목 금 토       │
│  ┌──┬──┬──┬──┬──┬──┬──┐    │
│  │  │  │  │ 1│ 2│ 3│ 4│    │
│  │  │  │  │🟢│🟡│🟡│🟢│    │ ← 컨디션 색상
│  ├──┼──┼──┼──┼──┼──┼──┤    │
│  │ 5│ 6│ 7│ 8│ 9│10│11│    │
│  │🟢│🔴│🟡│🟢│🟢│🟡│  │    │
│  └──┴──┴──┴──┴──┴──┴──┘    │
├─────────────────────────────┤
│  오늘의 기록 (1월 10일)     │
│  ┌─────────────────────┐    │
│  │ 피부 컨디션         │    │
│  │ 😫 😕 😐 🙂 😊      │    │
│  │         ↑ 선택      │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ 수면: 7시간 / ⭐⭐⭐ │    │
│  │ 수분: 1,500ml       │    │
│  │ 스트레스: ⭐⭐      │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │ ☑ 아침 루틴 완료    │    │
│  │ ☐ 저녁 루틴 완료    │    │
│  └─────────────────────┘    │
│  [저장하기]                 │
└─────────────────────────────┘
```

---

## 4. 데이터 모델

### 4.1 DB 마이그레이션

```sql
-- 마이그레이션: 202601100300_skin_diary.sql

CREATE TABLE IF NOT EXISTS skin_diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  entry_date DATE NOT NULL,

  -- 컨디션 기록
  skin_condition INTEGER CHECK (skin_condition BETWEEN 1 AND 5),
  condition_notes TEXT,

  -- 생활 요인
  sleep_hours DECIMAL(3,1),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  water_intake_ml INTEGER,
  stress_level INTEGER CHECK (stress_level BETWEEN 1 AND 5),

  -- 외부 요인
  weather TEXT CHECK (weather IN ('sunny', 'cloudy', 'rainy', 'cold', 'hot', 'humid', 'dry')),
  outdoor_hours DECIMAL(3,1),

  -- 스킨케어
  morning_routine_completed BOOLEAN DEFAULT false,
  evening_routine_completed BOOLEAN DEFAULT false,
  special_treatments TEXT[],

  -- AI 분석
  ai_correlation_score INTEGER,
  ai_insights JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_user_date UNIQUE (clerk_user_id, entry_date)
);

-- RLS
ALTER TABLE skin_diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own diary" ON skin_diary_entries
  FOR ALL USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_skin_diary_user_date
  ON skin_diary_entries(clerk_user_id, entry_date DESC);
```

---

## 5. 구현 계획

### 5.1 파일 생성 목록

| 파일                                              | 설명               |
| ------------------------------------------------- | ------------------ |
| `types/skin-diary.ts`                             | 타입 정의          |
| `lib/api/skin-diary.ts`                           | Repository (CRUD)  |
| `lib/mock/skin-diary.ts`                          | Mock 데이터        |
| `lib/skincare/correlation.ts`                     | 상관관계 분석 로직 |
| `components/skin/diary/*.tsx`                     | UI 컴포넌트 (8개)  |
| `app/(main)/analysis/skin/diary/page.tsx`         | 메인 페이지        |
| `app/(main)/analysis/skin/diary/report/page.tsx`  | 월간 리포트        |
| `supabase/migrations/202601100300_skin_diary.sql` | DB 마이그레이션    |

### 5.2 예상 파일 수

- 신규 파일: 15-18개
- 수정 파일: 2-3개

---

## 6. Phase B 연동

스킨케어 루틴 완료 시 자동으로 일기에 기록:

```typescript
// 루틴 완료 시 호출
async function markRoutineCompleted(timeOfDay: 'morning' | 'evening') {
  const today = new Date().toISOString().split('T')[0];
  await upsertDiaryEntry({
    entryDate: today,
    [timeOfDay === 'morning' ? 'morningRoutineCompleted' : 'eveningRoutineCompleted']: true,
  });
}
```

---

## 7. AI 상관관계 분석

### 7.1 분석 로직

```typescript
// lib/skincare/correlation.ts
export function analyzeCorrelations(
  entries: SkinDiaryEntry[],
  period: '7days' | '30days' | '90days'
): CorrelationInsight[] {
  // 각 요인과 피부 컨디션 간의 상관계수 계산
  const factors = [
    { key: 'sleepHours', name: '수면 시간' },
    { key: 'sleepQuality', name: '수면 품질' },
    { key: 'waterIntakeMl', name: '수분 섭취' },
    { key: 'stressLevel', name: '스트레스', inverse: true },
    { key: 'morningRoutineCompleted', name: '아침 루틴' },
    { key: 'eveningRoutineCompleted', name: '저녁 루틴' },
  ];

  return factors.map((factor) => ({
    factor: factor.name,
    correlation: calculatePearson(entries, factor.key, 'skinCondition'),
    confidence: calculateConfidence(entries.length),
    insight: generateInsight(factor, correlation),
    recommendation: generateRecommendation(factor, correlation),
  }));
}
```

### 7.2 인사이트 생성 예시

| 요인          | 상관계수 | 인사이트                                                    |
| ------------- | -------- | ----------------------------------------------------------- |
| 수면 7시간+   | 0.72     | "수면 7시간 이상일 때 피부 컨디션이 평균 20% 좋습니다"      |
| 수분 1.5L+    | 0.58     | "충분한 수분 섭취가 피부 수분도와 관련이 있습니다"          |
| 스트레스 높음 | -0.65    | "스트레스가 높을 때 피부 컨디션이 저하되는 경향이 있습니다" |

---

## 8. 테스트 계획

- [ ] DiaryCalendar 월별 네비게이션 테스트
- [ ] DiaryEntryForm 입력 유효성 테스트
- [ ] ConditionSelector 1-5 선택 테스트
- [ ] 상관관계 계산 로직 테스트
- [ ] MonthlyReport 집계 테스트
- [ ] Phase B 루틴 연동 테스트

---

**작성일**: 2026-01-10
**작성자**: Claude Code
**참조**: SDD-S1-UX-IMPROVEMENT.md §4.2
