# Phase H Sprint 2: 웰니스 스코어 + 소셜 기능

> **작성일**: 2025-12-24
> **전제조건**: Sprint 1 (게이미피케이션 + 챌린지) 완료
> **목표**: 통합 웰니스 스코어 + 친구/리더보드 기초

---

## 1. Sprint 1 완료 현황

### 게이미피케이션
- 배지 시스템 (23개 배지, 5개 카테고리)
- 레벨 시스템 (4개 티어, XP 자동 부여)
- 프로필/배지 페이지
- 대시보드 위젯
- 배지 알림 Toast + 레벨업 모달
- 테스트: 83개 통과

### 챌린지 시스템
- 챌린지 DB + 시드 데이터 (5개)
- 참여/완료/포기 기능
- 자동 진행 업데이트 (운동/영양 연동)
- 챌린지 목록/상세 페이지
- 대시보드 위젯
- 테스트: 28개 통과

### E2E 테스트
- 프로필/배지 페이지 E2E
- 챌린지 페이지 E2E
- Smoke 테스트 확장

---

## 2. Sprint 2 목표

### 핵심 기능

| 우선순위 | 기능 | 설명 | 예상 작업량 |
|---------|------|------|------------|
| **P0** | 통합 웰니스 스코어 | 종합 건강 점수 (0-100) | 높음 |
| **P1** | 친구 기능 기초 | 친구 추가/목록 | 중 |
| **P2** | 리더보드 | 주간/월간 랭킹 | 중 |
| **P3** | 챌린지 확장 | 템플릿 10개 추가 | 낮음 |

---

## 3. 통합 웰니스 스코어

### 3.1 개요

사용자의 전체적인 건강 상태를 0-100 점수로 시각화.

```yaml
구성:
  운동 영역 (25%):
    - 스트릭 유지: 10점
    - 운동 빈도: 10점
    - 목표 달성률: 5점

  영양 영역 (25%):
    - 칼로리 목표 달성: 10점
    - 영양소 균형: 10점
    - 수분 섭취: 5점

  피부 영역 (25%):
    - 분석 완료: 10점
    - 루틴 준수: 10점
    - 제품 매칭도: 5점

  체형 영역 (25%):
    - 분석 완료: 10점
    - 목표 진행률: 10점
    - 운동 연동: 5점
```

### 3.2 DB 스키마

```sql
CREATE TABLE wellness_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  date DATE NOT NULL,

  -- 점수
  total_score INTEGER,           -- 0-100
  workout_score INTEGER,          -- 0-25
  nutrition_score INTEGER,        -- 0-25
  skin_score INTEGER,             -- 0-25
  body_score INTEGER,             -- 0-25

  -- 상세 점수 (JSONB)
  score_breakdown JSONB,
  -- 예: { "workout": { "streak": 10, "frequency": 8, "goal": 5 }, ... }

  -- 메타
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(clerk_user_id, date)
);

-- RLS 정책
ALTER TABLE wellness_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own scores" ON wellness_scores
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_wellness_scores_user_date ON wellness_scores(clerk_user_id, date DESC);
```

### 3.3 라이브러리 구조

```
lib/wellness/
├── index.ts           # 통합 export
├── constants.ts       # 점수 가중치, 계산 상수
├── calculator.ts      # 점수 계산 로직
├── queries.ts         # DB 조회
└── mutations.ts       # DB 저장
```

### 3.4 주요 함수

```typescript
// calculator.ts
export function calculateWellnessScore(
  workoutData: WorkoutScoreInput,
  nutritionData: NutritionScoreInput,
  skinData: SkinScoreInput,
  bodyData: BodyScoreInput
): WellnessScore;

// queries.ts
export async function getWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  date?: string
): Promise<WellnessScore | null>;

export async function getWellnessHistory(
  supabase: SupabaseClient,
  clerkUserId: string,
  days: number
): Promise<WellnessScore[]>;

// mutations.ts
export async function saveWellnessScore(
  supabase: SupabaseClient,
  clerkUserId: string,
  score: WellnessScore
): Promise<void>;
```

### 3.5 UI 컴포넌트

```
components/wellness/
├── index.ts
├── WellnessScoreCard.tsx    # 메인 점수 카드
├── WellnessBreakdown.tsx    # 영역별 상세
├── WellnessTrendChart.tsx   # 트렌드 차트
└── WellnessInsight.tsx      # AI 개선 제안
```

---

## 4. 친구 기능

### 4.1 DB 스키마

```sql
-- 친구 관계
CREATE TABLE friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id TEXT NOT NULL,      -- 요청자
  addressee_id TEXT NOT NULL,      -- 수신자
  status TEXT DEFAULT 'pending',   -- 'pending' | 'accepted' | 'rejected' | 'blocked'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(requester_id, addressee_id)
);

-- RLS 정책
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own friendships" ON friendships
  USING (requester_id = auth.jwt() ->> 'sub' OR addressee_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
```

### 4.2 라이브러리 구조

```
lib/friends/
├── index.ts
├── queries.ts      # 친구 조회
├── mutations.ts    # 친구 요청/수락/거절
└── search.ts       # 사용자 검색
```

### 4.3 UI 컴포넌트

```
components/friends/
├── index.ts
├── FriendCard.tsx         # 친구 카드
├── FriendList.tsx         # 친구 목록
├── FriendRequestCard.tsx  # 요청 카드
├── AddFriendSheet.tsx     # 친구 추가 시트
└── FriendSearchInput.tsx  # 검색 입력
```

### 4.4 페이지

| 경로 | 설명 |
|------|------|
| `/friends` | 친구 목록 |
| `/friends/requests` | 받은 요청 |
| `/friends/search` | 친구 검색 |

---

## 5. 리더보드

### 5.1 DB 스키마

```sql
-- 리더보드 캐시 (성능 최적화)
CREATE TABLE leaderboard_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,            -- 'weekly' | 'monthly'
  category TEXT NOT NULL,          -- 'workout' | 'nutrition' | 'combined'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  rankings JSONB NOT NULL,         -- [{ "userId": "...", "score": 100, "rank": 1 }, ...]
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(period, category, start_date)
);

-- 공개 조회 가능
ALTER TABLE leaderboard_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view leaderboard" ON leaderboard_cache FOR SELECT USING (true);
```

### 5.2 라이브러리 구조

```
lib/leaderboard/
├── index.ts
├── constants.ts    # 기간/카테고리 상수
├── calculator.ts   # 랭킹 계산
├── queries.ts      # 리더보드 조회
└── cron.ts         # 정기 업데이트 (Cron Job)
```

### 5.3 UI 컴포넌트

```
components/leaderboard/
├── index.ts
├── LeaderboardCard.tsx      # 랭킹 카드 (1-3위)
├── LeaderboardList.tsx      # 전체 랭킹 목록
├── LeaderboardTabs.tsx      # 기간/카테고리 탭
└── MyRankCard.tsx           # 내 순위 카드
```

### 5.4 페이지

| 경로 | 설명 |
|------|------|
| `/leaderboard` | 리더보드 메인 |
| `/leaderboard/workout` | 운동 랭킹 |
| `/leaderboard/nutrition` | 영양 랭킹 |

---

## 6. 챌린지 확장

### 6.1 추가 챌린지 템플릿 (10개)

| 코드 | 이름 | 도메인 | 기간 | 보상 |
|------|------|--------|------|------|
| workout_streak_30 | 30일 연속 운동 | workout | 30일 | 200 XP + 배지 |
| workout_morning_7 | 7일 아침 운동 | workout | 7일 | 50 XP |
| nutrition_protein_7 | 7일 단백질 목표 | nutrition | 7일 | 50 XP |
| nutrition_veggie_14 | 14일 채소 매일 섭취 | nutrition | 14일 | 80 XP |
| water_2l_7days | 7일 2L 물 마시기 | nutrition | 7일 | 40 XP |
| skincare_21day | 21일 스킨케어 루틴 | skin | 21일 | 100 XP + 배지 |
| combined_wellness_14 | 14일 웰니스 챌린지 | combined | 14일 | 150 XP + 배지 |
| combined_morning_routine | 7일 아침 루틴 | combined | 7일 | 80 XP |
| no_snack_7days | 7일 간식 없이 | nutrition | 7일 | 60 XP |
| workout_variety_7 | 7일 다양한 운동 | workout | 7일 | 70 XP |

---

## 7. 구현 순서

### Week 1: 웰니스 스코어

```yaml
Day 1-2:
  - DB 마이그레이션 (wellness_scores)
  - TypeScript 타입 정의
  - 점수 계산 로직 구현

Day 3-4:
  - UI 컴포넌트 (WellnessScoreCard, WellnessBreakdown)
  - 대시보드 위젯 통합
  - 트렌드 차트

Day 5:
  - 테스트 작성 (30개 이상)
  - 코드 리뷰
```

### Week 2: 친구 기능 + 리더보드

```yaml
Day 1-2:
  - 친구 DB 마이그레이션
  - 친구 라이브러리 함수
  - 친구 UI 컴포넌트

Day 3-4:
  - 리더보드 DB + 라이브러리
  - 리더보드 UI 컴포넌트
  - Cron Job 설정

Day 5:
  - 챌린지 템플릿 10개 추가
  - E2E 테스트
  - 통합 테스트
```

---

## 8. 파일 목록

### 생성 예정 (16개+)

```
# 웰니스 스코어
apps/web/supabase/migrations/202512250100_wellness_scores.sql
apps/web/types/wellness.ts
apps/web/lib/wellness/index.ts
apps/web/lib/wellness/constants.ts
apps/web/lib/wellness/calculator.ts
apps/web/lib/wellness/queries.ts
apps/web/lib/wellness/mutations.ts
apps/web/components/wellness/index.ts
apps/web/components/wellness/WellnessScoreCard.tsx
apps/web/components/wellness/WellnessBreakdown.tsx
apps/web/components/wellness/WellnessTrendChart.tsx

# 친구
apps/web/supabase/migrations/202512250200_friendships.sql
apps/web/lib/friends/index.ts
apps/web/components/friends/FriendCard.tsx
apps/web/app/(main)/friends/page.tsx

# 리더보드
apps/web/supabase/migrations/202512250300_leaderboard.sql
apps/web/lib/leaderboard/index.ts
apps/web/components/leaderboard/LeaderboardCard.tsx
apps/web/app/(main)/leaderboard/page.tsx
```

### 수정 예정

```
apps/web/app/(main)/dashboard/page.tsx (웰니스 위젯 추가)
apps/web/supabase/migrations/시드데이터 (챌린지 10개 추가)
```

---

## 9. 테스트 목표

| 영역 | 목표 | 내용 |
|------|------|------|
| 웰니스 스코어 | 30개 | 계산 로직, 쿼리, 컴포넌트 |
| 친구 기능 | 20개 | 요청/수락/거절, 검색, UI |
| 리더보드 | 15개 | 랭킹 계산, 조회, UI |
| 챌린지 확장 | 10개 | 새 템플릿 동작 |
| E2E | 10개 | 주요 플로우 |

**총 목표**: 85개 테스트 추가

---

## 10. 성공 기준

- [ ] 웰니스 스코어 대시보드 위젯 표시
- [ ] 친구 추가/수락/거절 동작
- [ ] 리더보드 주간/월간 랭킹 표시
- [ ] 챌린지 15개 이상 활성화
- [ ] 테스트 85개 이상 통과
- [ ] 빌드 성공 + 타입체크 통과

---

**Status**: 계획 완료
**Version**: 1.0
**Updated**: 2025-12-24
