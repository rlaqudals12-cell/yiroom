# 챌린지 시스템 설계 문서

> **작성일**: 2025-12-24
> **상태**: 설계 완료, 구현 대기
> **전제조건**: Sprint 1-3 게이미피케이션 완료 후

---

## 1. 개요

### 목적
사용자가 특정 목표에 도전하고 달성함으로써 지속적인 동기부여와 참여를 유도하는 시스템.

### 핵심 원칙
1. **단순함**: 복잡한 규칙 없이 명확한 목표
2. **달성 가능성**: 너무 어렵지 않은 현실적 목표
3. **보상**: 배지, XP, 특별 콘텐츠 해금
4. **사회적 요소**: 친구와 함께 참여 (향후)

---

## 2. 챌린지 유형

### 2.1 기간별 분류

| 유형 | 기간 | 난이도 | 보상 |
|------|------|--------|------|
| 단기 | 7일 | 쉬움 | 배지 + 50 XP |
| 중기 | 14일 | 보통 | 배지 + 100 XP |
| 장기 | 30일 | 어려움 | 배지 + 200 XP |

### 2.2 도메인별 분류

| 도메인 | 예시 챌린지 |
|--------|------------|
| 운동 | 7일 연속 운동, 주 5회 운동, 100분 운동 |
| 영양 | 7일 칼로리 목표 달성, 14일 물 8잔, 채소 매일 섭취 |
| 피부 | 21일 스킨케어 루틴, 자외선 차단제 매일 사용 |
| 복합 | 7일 운동+영양 목표 동시 달성 |

---

## 3. DB 스키마

### 3.1 challenges 테이블

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,           -- 고유 코드 (예: 'workout_7day')
  name TEXT NOT NULL,                   -- 한국어 이름
  description TEXT,                     -- 설명
  icon TEXT NOT NULL,                   -- 이모지 아이콘

  -- 유형
  domain TEXT NOT NULL,                 -- 'workout' | 'nutrition' | 'skin' | 'combined'
  duration_days INTEGER NOT NULL,       -- 기간 (일)

  -- 목표 조건 (JSONB)
  target JSONB NOT NULL,
  -- 예: { "type": "streak", "days": 7 }
  -- 예: { "type": "count", "workouts": 5 }
  -- 예: { "type": "daily", "waterCups": 8 }

  -- 보상
  reward_xp INTEGER DEFAULT 50,
  reward_badge_id UUID REFERENCES badges(id),

  -- 메타
  difficulty TEXT DEFAULT 'easy',       -- 'easy' | 'medium' | 'hard'
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 (공개 조회)
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view challenges" ON challenges FOR SELECT USING (true);
```

### 3.2 user_challenges 테이블

```sql
CREATE TABLE user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,

  -- 상태
  status TEXT DEFAULT 'in_progress',    -- 'in_progress' | 'completed' | 'failed' | 'abandoned'

  -- 기간
  started_at TIMESTAMPTZ DEFAULT NOW(),
  target_end_at TIMESTAMPTZ NOT NULL,   -- 목표 종료일
  completed_at TIMESTAMPTZ,             -- 실제 완료일

  -- 진행 상황 (JSONB)
  progress JSONB DEFAULT '{}',
  -- 예: { "currentDays": 5, "totalDays": 7 }
  -- 예: { "completedDays": [1, 2, 3, 5], "missedDays": [4] }

  -- 보상 수령 여부
  reward_claimed BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(clerk_user_id, challenge_id)  -- 동일 챌린지 중복 참여 방지
);

-- RLS 정책
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own challenges" ON user_challenges
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- 인덱스
CREATE INDEX idx_user_challenges_user ON user_challenges(clerk_user_id);
CREATE INDEX idx_user_challenges_status ON user_challenges(status);
```

---

## 4. TypeScript 타입

### 4.1 타입 정의 (`types/challenges.ts`)

```typescript
// 챌린지 도메인
export type ChallengeDomain = 'workout' | 'nutrition' | 'skin' | 'combined';

// 챌린지 난이도
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

// 챌린지 상태
export type ChallengeStatus = 'in_progress' | 'completed' | 'failed' | 'abandoned';

// 챌린지 목표 타입
export interface StreakTarget {
  type: 'streak';
  days: number;
}

export interface CountTarget {
  type: 'count';
  workouts?: number;
  meals?: number;
  waterCups?: number;
}

export interface DailyTarget {
  type: 'daily';
  waterCups?: number;
  calories?: number;
  protein?: number;
}

export type ChallengeTarget = StreakTarget | CountTarget | DailyTarget;

// 챌린지
export interface Challenge {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  domain: ChallengeDomain;
  durationDays: number;
  target: ChallengeTarget;
  rewardXp: number;
  rewardBadgeId: string | null;
  difficulty: ChallengeDifficulty;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
}

// 진행 상황
export interface ChallengeProgress {
  currentDays?: number;
  totalDays?: number;
  completedDays?: number[];
  missedDays?: number[];
  percentage?: number;
}

// 사용자 챌린지
export interface UserChallenge {
  id: string;
  clerkUserId: string;
  challengeId: string;
  status: ChallengeStatus;
  startedAt: Date;
  targetEndAt: Date;
  completedAt: Date | null;
  progress: ChallengeProgress;
  rewardClaimed: boolean;
  createdAt: Date;
  updatedAt: Date;
  challenge?: Challenge; // 조인 시 포함
}
```

---

## 5. 라이브러리 함수

### 5.1 파일 구조

```
lib/challenges/
├── index.ts           # 통합 export
├── constants.ts       # 상수 정의
├── queries.ts         # DB 조회 함수
├── mutations.ts       # DB 변경 함수
└── progress.ts        # 진행 상황 계산 함수
```

### 5.2 주요 함수

```typescript
// queries.ts
export async function getAvailableChallenges(supabase: SupabaseClient): Promise<Challenge[]>;
export async function getUserChallenges(supabase: SupabaseClient, clerkUserId: string): Promise<UserChallenge[]>;
export async function getChallengeById(supabase: SupabaseClient, challengeId: string): Promise<Challenge | null>;

// mutations.ts
export async function joinChallenge(
  supabase: SupabaseClient,
  clerkUserId: string,
  challengeId: string
): Promise<UserChallenge>;

export async function updateChallengeProgress(
  supabase: SupabaseClient,
  userChallengeId: string,
  progress: ChallengeProgress
): Promise<void>;

export async function completeChallenge(
  supabase: SupabaseClient,
  userChallengeId: string
): Promise<{ xpAwarded: number; badgeAwarded?: Badge }>;

export async function abandonChallenge(
  supabase: SupabaseClient,
  userChallengeId: string
): Promise<void>;

// progress.ts
export function calculateProgress(
  challenge: Challenge,
  userChallenge: UserChallenge
): ChallengeProgress;

export function checkChallengeCompletion(
  challenge: Challenge,
  progress: ChallengeProgress
): boolean;
```

---

## 6. UI 컴포넌트

### 6.1 컴포넌트 구조

```
components/challenges/
├── index.ts              # 통합 export
├── ChallengeCard.tsx     # 개별 챌린지 카드
├── ChallengeList.tsx     # 챌린지 목록
├── ChallengeProgress.tsx # 진행 상황 표시
├── ChallengeDetail.tsx   # 상세 모달
├── JoinChallengeSheet.tsx # 참여 바텀시트
└── ChallengeCompletionModal.tsx # 완료 축하 모달
```

### 6.2 주요 컴포넌트

#### ChallengeCard
```tsx
interface ChallengeCardProps {
  challenge: Challenge;
  userChallenge?: UserChallenge;
  onJoin?: () => void;
  onView?: () => void;
}
```

#### ChallengeProgress
```tsx
interface ChallengeProgressProps {
  progress: ChallengeProgress;
  durationDays: number;
  showDayIndicators?: boolean; // 각 날짜 성공/실패 표시
}
```

---

## 7. 페이지 구조

### 7.1 라우트

| 경로 | 설명 |
|------|------|
| `/challenges` | 챌린지 목록 (탐색 + 내 챌린지) |
| `/challenges/[id]` | 챌린지 상세 |
| `/challenges/my` | 내 진행 중 챌린지 |
| `/challenges/completed` | 완료한 챌린지 |

### 7.2 대시보드 위젯

```tsx
// 대시보드에 표시될 챌린지 요약 위젯
interface ChallengeWidgetProps {
  activeChallenges: UserChallenge[];
  recommendedChallenges: Challenge[];
}
```

---

## 8. 초기 챌린지 목록 (시드 데이터)

### 8.1 운동 챌린지

| 코드 | 이름 | 기간 | 목표 | 보상 |
|------|------|------|------|------|
| workout_streak_7 | 7일 연속 운동 | 7일 | 스트릭 7일 | 50 XP + 배지 |
| workout_streak_14 | 14일 연속 운동 | 14일 | 스트릭 14일 | 100 XP + 배지 |
| workout_5_per_week | 주 5회 운동 | 7일 | 5회 운동 | 30 XP |
| workout_total_10 | 10회 운동 완료 | 30일 | 10회 운동 | 80 XP |

### 8.2 영양 챌린지

| 코드 | 이름 | 기간 | 목표 | 보상 |
|------|------|------|------|------|
| nutrition_streak_7 | 7일 연속 식단 기록 | 7일 | 스트릭 7일 | 50 XP + 배지 |
| water_8cups_7days | 7일 물 8잔 마시기 | 7일 | 매일 물 8잔 | 40 XP |
| calorie_goal_7days | 7일 칼로리 목표 달성 | 7일 | 매일 목표 달성 | 50 XP |
| protein_goal_14days | 14일 단백질 목표 달성 | 14일 | 매일 목표 달성 | 80 XP |

### 8.3 복합 챌린지

| 코드 | 이름 | 기간 | 목표 | 보상 |
|------|------|------|------|------|
| wellness_7day | 7일 웰니스 챌린지 | 7일 | 운동+영양 목표 | 100 XP + 배지 |
| total_wellness_30 | 30일 토탈 웰니스 | 30일 | 운동+영양+피부 | 300 XP + 배지 |

---

## 9. 진행 상황 업데이트 로직

### 9.1 자동 업데이트 시점

| 이벤트 | 업데이트 내용 |
|--------|--------------|
| 운동 기록 저장 | 운동 챌린지 진행 |
| 식단 기록 저장 | 영양 챌린지 진행 |
| 물 섭취 기록 | 수분 챌린지 진행 |
| 일일 체크인 | 복합 챌린지 진행 |

### 9.2 실패 처리

```typescript
// 매일 자정 Cron Job으로 실행
async function checkChallengeFailures() {
  // 1. 스트릭 기반 챌린지: 연속 일수 끊김 시 실패
  // 2. 기간 만료: target_end_at 지나면 미완료 → 실패
}
```

---

## 10. 구현 일정

### Sprint 4 (예정)

```yaml
Week 1:
  - DB 마이그레이션 (challenges, user_challenges)
  - TypeScript 타입 정의
  - 라이브러리 함수 구현 (queries, mutations, progress)

Week 2:
  - UI 컴포넌트 구현 (ChallengeCard, ChallengeList, ChallengeProgress)
  - 챌린지 목록 페이지 (/challenges)
  - 참여/포기 기능

Sprint 5 (예정):
  - 진행 상황 자동 업데이트 (운동/영양 API 연동)
  - 완료 보상 처리 (XP + 배지)
  - 대시보드 위젯
  - 테스트 작성 (50개 이상)
```

---

## 11. 테스트 계획

### 11.1 단위 테스트

```
tests/lib/challenges/
├── queries.test.ts     # DB 조회 테스트
├── mutations.test.ts   # DB 변경 테스트
└── progress.test.ts    # 진행 계산 테스트

tests/components/challenges/
├── ChallengeCard.test.tsx
├── ChallengeProgress.test.tsx
└── ChallengeList.test.tsx
```

### 11.2 통합 테스트

- 챌린지 참여 → 운동 기록 → 진행 업데이트 → 완료 시나리오
- 챌린지 실패 시나리오 (스트릭 끊김)
- 보상 수령 시나리오

---

**Status**: 설계 완료
**Version**: 1.0
**Updated**: 2025-12-24

---

## 구현 현황 (2024-12-24 업데이트)

### 완료된 기능

#### DB 마이그레이션
- ✅ `challenges` 테이블 생성
- ✅ `user_challenges` 테이블 생성
- ✅ RLS 정책 설정
- ✅ 초기 챌린지 시드 데이터 (5개)

#### 라이브러리 함수
- ✅ `lib/challenges/constants.ts` - 타입 변환, 진행률 계산
- ✅ `lib/challenges/queries.ts` - 챌린지 조회
- ✅ `lib/challenges/mutations.ts` - 챌린지 참여/완료/포기
- ✅ `lib/challenges/integration.ts` - 운동/영양 자동 업데이트

#### UI 컴포넌트
- ✅ `ChallengeCard` - 챌린지 카드
- ✅ `ChallengeList` - 챌린지 목록
- ✅ `ChallengeProgress` - 진행률 표시

#### 페이지
- ✅ `/challenges` - 챌린지 목록 페이지
- ✅ `/challenges/[id]` - 챌린지 상세 페이지
- ✅ 대시보드 위젯 (`ChallengeWidget`)

#### 통합
- ✅ 운동 완료 시 자동 업데이트
- ✅ 영양 기록 시 자동 업데이트
- ✅ Combined 챌린지 지원 (운동+영양)

### 테스트
- ✅ 28개 테스트 통과
  - constants.test.ts (19개)
  - integration.test.ts (9개)

### 미완료 (Phase H Sprint 2+)
- 친구 챌린지 기능
- 리더보드
- 챌린지 알림 (푸시 알림)
- 챌린지 템플릿 추가 (10개+)
