# W-1 운동 모듈 개발 스펙

> **문서 버전**: 1.0.0  
> **작성일**: 2025-12-18  
> **대상**: Claude Code 구현용 SDD 스펙

---

## 1. 모듈 개요

### 1.1 목적
이룸(Yiroom) 플랫폼의 Phase 2 운동 모듈로, **퍼스널컬러/체형 분석 결과를 기반으로 맞춤 운동을 추천**하는 기능 제공.

### 1.2 핵심 목표 지표
| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| Day 7 리텐션 | 50% | 가입 후 7일 내 재방문율 |
| 모듈 전환율 | 60% | Phase 1 완료 → W-1 진입율 |
| 일일 기록률 | 40% | DAU 중 운동 기록 완료율 |

### 1.3 타겟 사용자
- 한국 여성 10-30대
- Phase 1(퍼스널컬러/피부/체형 분석) 완료 사용자
- 홈트레이닝 선호, 짧은 시간 운동 원하는 사용자

### 1.4 기술 스택
- **Frontend**: Next.js 16 + React 19
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Auth**: Clerk
- **AI**: Gemini API (운동 자세 분석 - 향후)
- **State**: Zustand 또는 React Context

---

## 2. 정보 구조 (IA)

### 2.1 W-1 모듈 네비게이션

```
W-1 운동 모듈
├── 대시보드 (홈)
│   ├── 오늘의 운동 요약
│   ├── 주간 진행률 링
│   └── 빠른 시작 버튼
├── 운동 탐색
│   ├── 추천 운동 (AI 맞춤)
│   ├── 체형별 운동
│   ├── 부위별 운동
│   └── 전체 운동 라이브러리
├── 운동 실행
│   ├── 운동 상세 정보
│   ├── 운동 타이머/카운터
│   └── 세트/반복 기록
├── 기록/통계
│   ├── 운동 히스토리
│   ├── 주간/월간 리포트
│   └── 스트릭 캘린더
└── 설정
    ├── 운동 목표 설정
    ├── 알림 설정
    └── 체형 정보 수정
```

### 2.2 화면 플로우

```
[Phase 1 완료] 
    ↓
[W-1 온보딩] ← 60초 내 첫 가치 전달
    ├── 운동 목표 선택 (1문항)
    ├── 운동 가능 시간 (1문항)
    └── 장비 유무 (1문항)
    ↓
[대시보드] ← 메인 진입점
    ↓
[운동 추천 카드] → [운동 상세] → [운동 실행] → [완료 & 기록]
    ↓
[기록/통계] → [주간 리포트]
```

---

## 3. 화면별 상세 스펙

### 3.1 W-1 온보딩 화면

#### 목적
Phase 1 완료 후 W-1 모듈 진입 시 최소한의 정보 수집 (3문항, 30초 이내)

#### 화면 구성

```
┌─────────────────────────────────────┐
│  [← 뒤로]              [건너뛰기]    │
│                                     │
│  ●○○ (1/3)                         │
│                                     │
│  💪 운동 목표가 뭐예요?              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔥 체중 감량               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  💪 근력 강화               │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  🧘 유연성 향상             │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  ❤️ 전반적 건강              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [다음]                             │
└─────────────────────────────────────┘
```

#### 컴포넌트 구조

```tsx
// app/(protected)/workout/onboarding/page.tsx

interface OnboardingStep {
  id: number;
  question: string;
  options: OnboardingOption[];
}

interface OnboardingOption {
  id: string;
  emoji: string;
  label: string;
  value: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    question: "운동 목표가 뭐예요?",
    options: [
      { id: "goal-1", emoji: "🔥", label: "체중 감량", value: "weight_loss" },
      { id: "goal-2", emoji: "💪", label: "근력 강화", value: "muscle_gain" },
      { id: "goal-3", emoji: "🧘", label: "유연성 향상", value: "flexibility" },
      { id: "goal-4", emoji: "❤️", label: "전반적 건강", value: "general_health" },
    ]
  },
  {
    id: 2,
    question: "하루에 운동할 수 있는 시간은?",
    options: [
      { id: "time-1", emoji: "⚡", label: "10분 이하", value: "under_10" },
      { id: "time-2", emoji: "🕐", label: "10-20분", value: "10_to_20" },
      { id: "time-3", emoji: "🕑", label: "20-30분", value: "20_to_30" },
      { id: "time-4", emoji: "🕒", label: "30분 이상", value: "over_30" },
    ]
  },
  {
    id: 3,
    question: "운동 장비가 있어요?",
    options: [
      { id: "equip-1", emoji: "🏠", label: "맨몸 운동만", value: "bodyweight" },
      { id: "equip-2", emoji: "🎾", label: "간단한 도구 (밴드, 덤벨)", value: "light_equipment" },
      { id: "equip-3", emoji: "🏋️", label: "홈짐 장비", value: "home_gym" },
    ]
  }
];
```

#### 상태 관리

```tsx
interface WorkoutOnboardingState {
  currentStep: number;
  answers: {
    goal: string | null;
    availableTime: string | null;
    equipment: string | null;
  };
  isComplete: boolean;
}
```

---

### 3.2 대시보드 (홈) 화면

#### 목적
오늘의 운동 현황을 한눈에 파악하고, 빠르게 운동 시작 유도

#### 화면 구성

```
┌─────────────────────────────────────┐
│  이룸 운동        [🔔] [👤]         │
├─────────────────────────────────────┤
│                                     │
│  안녕하세요, [이름]님! 👋           │
│  Y체형에 맞는 운동을 준비했어요     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      ╭───────────╮          │   │
│  │      │    75%    │  ← 링 게이지│
│  │      │  3/4 완료  │          │   │
│  │      ╰───────────╯          │   │
│  │   오늘의 운동 목표            │   │
│  └─────────────────────────────┘   │
│                                     │
│  🔥 3일 연속 달성 중!              │
│                                     │
│  ─────────────────────────────────  │
│  ✨ 오늘의 추천 운동                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [이미지]                     │   │
│  │ 힙업 스쿼트                  │   │
│  │ 🟢 92% 매칭 • 15분 • 초급    │   │
│  │ "Y체형 하체 밸런스에 효과적"  │   │
│  │ [시작하기]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ [이미지]                     │   │
│  │ 어깨 스트레칭                │   │
│  │ 🟢 88% 매칭 • 10분 • 초급    │   │
│  │ [시작하기]                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  [전체 운동 보기 →]                 │
│                                     │
├─────────────────────────────────────┤
│  [🏠홈] [🔍탐색] [📊기록] [👤MY]   │
└─────────────────────────────────────┘
```

#### 컴포넌트 트리

```
WorkoutDashboardPage
├── Header
│   ├── Logo
│   ├── NotificationBell
│   └── ProfileAvatar
├── WelcomeSection
│   ├── GreetingText (이름 + 체형 연결)
│   └── StreakBadge
├── DailyProgressRing
│   ├── CircularProgress (75%)
│   └── ProgressLabel ("3/4 완료")
├── RecommendedWorkoutSection
│   ├── SectionTitle ("오늘의 추천 운동")
│   └── WorkoutCardList
│       └── WorkoutCard (반복)
│           ├── WorkoutThumbnail
│           ├── WorkoutTitle
│           ├── MatchScore (AI 매칭률)
│           ├── WorkoutMeta (시간, 난이도)
│           ├── RecommendReason (추천 이유)
│           └── StartButton
├── ViewAllButton
└── BottomNavigation
    ├── NavItem (홈)
    ├── NavItem (탐색)
    ├── NavItem (기록)
    └── NavItem (MY)
```

#### 컴포넌트 Props 정의

```tsx
// components/workout/WorkoutCard.tsx

interface WorkoutCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number; // 분 단위
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  matchScore: number; // 0-100
  recommendReason?: string; // AI 추천 이유
  bodyType?: 'X' | 'A' | 'Y' | 'H' | 'O';
  targetArea: string[]; // ['하체', '코어']
  onStart: () => void;
  onSave: () => void;
}

// components/workout/DailyProgressRing.tsx

interface DailyProgressRingProps {
  completed: number;
  total: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

// components/workout/StreakBadge.tsx

interface StreakBadgeProps {
  currentStreak: number;
  bestStreak: number;
  showFire?: boolean;
}
```

---

### 3.3 운동 상세 화면

#### 목적
운동 시작 전 상세 정보 확인 및 시작 유도

#### 화면 구성

```
┌─────────────────────────────────────┐
│  [← 뒤로]              [♡ 저장]     │
├─────────────────────────────────────┤
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [운동 미리보기 이미지]    │   │
│  │         또는 GIF            │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│  힙업 스쿼트                        │
│  ⭐ 4.8 (128 리뷰)                  │
│                                     │
│  ┌────┐ ┌────┐ ┌────┐              │
│  │15분│ │초급│ │맨몸│              │
│  └────┘ └────┘ └────┘              │
│                                     │
│  ─────────────────────────────────  │
│  ✨ AI 추천 이유                    │
│  ┌─────────────────────────────┐   │
│  │ "Y체형의 하체 볼륨 밸런스에  │   │
│  │  효과적이에요. 엉덩이 근육을 │   │
│  │  강화하면서 허벅지 라인을    │   │
│  │  정리할 수 있어요."          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────────  │
│  📋 운동 구성                       │
│                                     │
│  1. 워밍업 (3분)                    │
│  2. 메인 운동 - 스쿼트 3세트        │
│  3. 사이드 런지 3세트               │
│  4. 쿨다운 스트레칭 (2분)           │
│                                     │
│  ─────────────────────────────────  │
│  🎯 타겟 부위                       │
│  [하체] [엉덩이] [코어]             │
│                                     │
│  ─────────────────────────────────  │
│  ⚠️ 주의사항                        │
│  • 무릎이 발끝을 넘지 않도록        │
│  • 허리를 곧게 유지                 │
│                                     │
│  ┌─────────────────────────────┐   │
│  │       [🎬 운동 시작하기]     │   │
│  └─────────────────────────────┘   │
│                                     │
│  [👎 맞지 않아요]  [👍 좋아요]      │
└─────────────────────────────────────┘
```

#### 컴포넌트 Props 정의

```tsx
// types/workout.ts

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number; // 초 단위 (타이머용)
  restTime: number; // 세트 간 휴식 시간
}

interface WorkoutDetail {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl?: string;
  gifUrl?: string;
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
  targetAreas: string[];
  bodyTypes: ('X' | 'A' | 'Y' | 'H' | 'O')[];
  exercises: Exercise[];
  warmup?: Exercise[];
  cooldown?: Exercise[];
  cautions: string[];
  matchScore: number;
  recommendReason: string;
  rating: number;
  reviewCount: number;
  caloriesBurned: number;
}

// components/workout/WorkoutDetailPage.tsx

interface WorkoutDetailPageProps {
  workoutId: string;
}
```

---

### 3.4 운동 실행 화면

#### 목적
운동 진행 중 가이드 및 세트/반복 기록

#### 화면 구성 (운동 중)

```
┌─────────────────────────────────────┐
│  [✕ 종료]           [⏸️ 일시정지]   │
├─────────────────────────────────────┤
│                                     │
│  스쿼트                             │
│  세트 2/3                           │
│                                     │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  │    [운동 동작 GIF/영상]      │   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│         ╭─────────────╮            │
│         │             │            │
│         │     12      │ ← 반복 카운트│
│         │    /15      │            │
│         ╰─────────────╯            │
│                                     │
│  [이전 기록: 15회 × 3세트]          │
│                                     │
│  ─────────────────────────────────  │
│  💡 팁: 무릎이 발끝을 넘지 않게!    │
│  ─────────────────────────────────  │
│                                     │
│  ┌──────────┐  ┌──────────┐        │
│  │  [-1]    │  │  [+1]    │        │
│  └──────────┘  └──────────┘        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [✓ 세트 완료]           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 화면 구성 (휴식 중)

```
┌─────────────────────────────────────┐
│  [✕ 종료]           [⏭️ 건너뛰기]   │
├─────────────────────────────────────┤
│                                     │
│              휴식 시간               │
│                                     │
│         ╭─────────────╮            │
│         │             │            │
│         │    0:45     │ ← 타이머   │
│         │             │            │
│         ╰─────────────╯            │
│              /1:00                  │
│                                     │
│  ─────────────────────────────────  │
│  다음 운동                          │
│  ┌─────────────────────────────┐   │
│  │ 사이드 런지 • 3세트 × 12회   │   │
│  └─────────────────────────────┘   │
│  ─────────────────────────────────  │
│                                     │
│  💧 물 한 잔 마시기 좋은 타이밍!    │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [▶️ 바로 시작]           │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 상태 관리

```tsx
// stores/workoutSessionStore.ts (Zustand)

interface WorkoutSessionState {
  // 세션 정보
  sessionId: string | null;
  workoutId: string | null;
  startedAt: Date | null;
  
  // 진행 상태
  currentExerciseIndex: number;
  currentSetIndex: number;
  currentReps: number;
  isResting: boolean;
  restTimeRemaining: number;
  
  // 기록
  completedSets: CompletedSet[];
  totalCaloriesBurned: number;
  
  // 액션
  startSession: (workoutId: string) => void;
  completeSet: (reps: number, weight?: number) => void;
  skipRest: () => void;
  pauseSession: () => void;
  resumeSession: () => void;
  endSession: () => void;
  incrementReps: () => void;
  decrementReps: () => void;
}

interface CompletedSet {
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight?: number;
  completedAt: Date;
}
```

---

### 3.5 운동 완료 화면

#### 목적
운동 완료 축하 및 기록 저장, 다음 행동 유도

#### 화면 구성

```
┌─────────────────────────────────────┐
│                                     │
│           🎉                        │
│                                     │
│      운동 완료!                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔥 125 kcal                │   │
│  │  ⏱️ 18분 32초               │   │
│  │  💪 12세트 완료              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────────  │
│  🔥 4일 연속 달성! (+20P)          │
│  ─────────────────────────────────  │
│                                     │
│  이 운동이 어땠나요?                │
│                                     │
│  😫    😐    🙂    😊    🤩        │
│  너무   조금   보통  좋았어  최고!  │
│  힘들어 힘들어       요            │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [📤 공유하기]            │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │     [🏠 홈으로]              │   │
│  └─────────────────────────────┘   │
│                                     │
│  [다음 추천 운동 보기 →]            │
└─────────────────────────────────────┘
```

#### 컴포넌트 Props

```tsx
// components/workout/WorkoutCompletionCard.tsx

interface WorkoutCompletionProps {
  sessionSummary: {
    caloriesBurned: number;
    duration: number; // 초 단위
    setsCompleted: number;
    exercisesCompleted: number;
  };
  streakInfo: {
    currentStreak: number;
    isNewRecord: boolean;
    pointsEarned: number;
  };
  onRateWorkout: (rating: 1 | 2 | 3 | 4 | 5) => void;
  onShare: () => void;
  onGoHome: () => void;
  onViewNextRecommendation: () => void;
}
```

---

### 3.6 기록/통계 화면

#### 목적
운동 히스토리 확인 및 진행 상황 시각화

#### 화면 구성

```
┌─────────────────────────────────────┐
│  기록                    [📅 월간]  │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │     2024년 12월              │   │
│  │  일 월 화 수 목 금 토        │   │
│  │  1  2  3  4  5  6  7         │   │
│  │  ●  ○  ●  ●  ○  ●  ○        │   │
│  │  8  9  10 11 12 13 14        │   │
│  │  ●  ●  ●  ○  ●  ●  ○        │   │
│  │  15 16 17 18 ...             │   │
│  │  ●  ●  ●  ■  ...            │   │
│  └─────────────────────────────┘   │
│  ● 완료 ○ 미완료 ■ 오늘           │
│                                     │
│  ─────────────────────────────────  │
│  이번 주 요약                       │
│  ┌─────────────────────────────┐   │
│  │  🔥 총 750 kcal 소모         │   │
│  │  ⏱️ 총 2시간 15분            │   │
│  │  💪 총 45세트 완료           │   │
│  │  📈 지난주 대비 +15%         │   │
│  └─────────────────────────────┘   │
│                                     │
│  ─────────────────────────────────  │
│  최근 운동                          │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 12/17 (화) • 힙업 스쿼트     │   │
│  │ 125kcal • 18분 • 😊         │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ 12/16 (월) • 전신 스트레칭   │   │
│  │ 85kcal • 15분 • 🙂          │   │
│  └─────────────────────────────┘   │
│                                     │
├─────────────────────────────────────┤
│  [🏠홈] [🔍탐색] [📊기록] [👤MY]   │
└─────────────────────────────────────┘
```

#### 컴포넌트 구조

```tsx
// components/workout/WorkoutHistoryPage.tsx

interface WorkoutHistoryPageProps {
  userId: string;
}

// components/workout/StreakCalendar.tsx

interface StreakCalendarProps {
  year: number;
  month: number;
  completedDates: Date[];
  onDateSelect?: (date: Date) => void;
}

// components/workout/WeeklySummaryCard.tsx

interface WeeklySummaryProps {
  totalCalories: number;
  totalDuration: number; // 분 단위
  totalSets: number;
  weekOverWeekChange: number; // 퍼센트
}

// components/workout/WorkoutHistoryItem.tsx

interface WorkoutHistoryItemProps {
  date: Date;
  workoutTitle: string;
  caloriesBurned: number;
  duration: number;
  rating: 1 | 2 | 3 | 4 | 5;
  onClick?: () => void;
}
```

---

## 4. 데이터베이스 스키마 (Supabase)

### 4.1 테이블 구조

```sql
-- 사용자 운동 프로필
CREATE TABLE user_workout_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 온보딩 답변
  fitness_goal TEXT, -- 'weight_loss', 'muscle_gain', 'flexibility', 'general_health'
  available_time TEXT, -- 'under_10', '10_to_20', '20_to_30', 'over_30'
  equipment TEXT, -- 'bodyweight', 'light_equipment', 'home_gym'
  
  -- 체형 연동 (Phase 1에서)
  body_type TEXT, -- 'X', 'A', 'Y', 'H', 'O'
  
  -- 통계
  total_workouts INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0, -- 분 단위
  total_calories INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  last_workout_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 라이브러리 (시드 데이터)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 기본 정보
  title TEXT NOT NULL,
  title_en TEXT,
  description TEXT,
  thumbnail_url TEXT,
  video_url TEXT,
  gif_url TEXT,
  
  -- 분류
  category TEXT, -- 'strength', 'cardio', 'flexibility', 'balance'
  target_areas TEXT[], -- ['하체', '엉덩이', '코어']
  body_types TEXT[], -- ['X', 'A', 'Y', 'H', 'O']
  difficulty TEXT, -- 'beginner', 'intermediate', 'advanced'
  equipment TEXT[], -- ['덤벨', '밴드'] 또는 빈 배열
  
  -- 메타데이터
  duration INTEGER, -- 분 단위
  calories_per_minute INTEGER,
  
  -- 운동 구성
  exercises JSONB, -- Exercise[] 배열
  warmup JSONB,
  cooldown JSONB,
  cautions TEXT[],
  
  -- 통계
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 운동 세션 (완료된 운동 기록)
CREATE TABLE workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id),
  
  -- 세션 정보
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  duration INTEGER, -- 실제 소요 시간 (초)
  
  -- 결과
  calories_burned INTEGER,
  sets_completed INTEGER,
  exercises_completed INTEGER,
  
  -- 기록 상세
  completed_sets JSONB, -- CompletedSet[] 배열
  
  -- 피드백
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  difficulty_felt TEXT, -- 'too_easy', 'just_right', 'too_hard'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 일일 운동 목표/기록
CREATE TABLE daily_workout_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- 목표
  target_workouts INTEGER DEFAULT 1,
  target_duration INTEGER DEFAULT 20, -- 분 단위
  
  -- 달성
  completed_workouts INTEGER DEFAULT 0,
  completed_duration INTEGER DEFAULT 0,
  
  -- 스트릭 체크
  is_goal_met BOOLEAN DEFAULT FALSE,
  
  UNIQUE(user_id, date)
);

-- 운동 저장 (좋아요)
CREATE TABLE saved_workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, workout_id)
);

-- 포인트/보상 기록
CREATE TABLE workout_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  reward_type TEXT, -- 'daily_complete', 'streak_3', 'streak_7', 'first_workout'
  points INTEGER,
  description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.2 Row Level Security (RLS)

```sql
-- user_workout_profiles
ALTER TABLE user_workout_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_workout_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON user_workout_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_workout_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- workout_sessions
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON workout_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON workout_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- workouts (공개 읽기)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view workouts"
  ON workouts FOR SELECT
  USING (true);
```

---

## 5. API 엔드포인트

### 5.1 Server Actions (Next.js App Router)

```tsx
// app/actions/workout.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { auth } from '@clerk/nextjs/server'

// 온보딩 완료
export async function completeWorkoutOnboarding(data: {
  goal: string;
  availableTime: string;
  equipment: string;
}) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  
  const { error } = await supabase
    .from('user_workout_profiles')
    .upsert({
      user_id: userId,
      fitness_goal: data.goal,
      available_time: data.availableTime,
      equipment: data.equipment,
    });
  
  if (error) throw error;
  return { success: true };
}

// 추천 운동 가져오기
export async function getRecommendedWorkouts(limit = 5) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  
  // 사용자 프로필 조회
  const { data: profile } = await supabase
    .from('user_workout_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  // 체형 기반 운동 필터링
  let query = supabase
    .from('workouts')
    .select('*')
    .limit(limit);
  
  if (profile?.body_type) {
    query = query.contains('body_types', [profile.body_type]);
  }
  
  // 시간 필터링
  if (profile?.available_time === 'under_10') {
    query = query.lte('duration', 10);
  } else if (profile?.available_time === '10_to_20') {
    query = query.lte('duration', 20);
  }
  
  // 장비 필터링
  if (profile?.equipment === 'bodyweight') {
    query = query.eq('equipment', '{}');
  }
  
  const { data: workouts, error } = await query;
  
  if (error) throw error;
  
  // 매칭 점수 계산 추가
  return workouts?.map(workout => ({
    ...workout,
    matchScore: calculateMatchScore(workout, profile),
  }));
}

// 운동 세션 시작
export async function startWorkoutSession(workoutId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('workout_sessions')
    .insert({
      user_id: userId,
      workout_id: workoutId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// 운동 세션 완료
export async function completeWorkoutSession(
  sessionId: string,
  data: {
    duration: number;
    caloriesBurned: number;
    setsCompleted: number;
    exercisesCompleted: number;
    completedSets: CompletedSet[];
    rating?: number;
  }
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  
  // 세션 업데이트
  const { error: sessionError } = await supabase
    .from('workout_sessions')
    .update({
      completed_at: new Date().toISOString(),
      duration: data.duration,
      calories_burned: data.caloriesBurned,
      sets_completed: data.setsCompleted,
      exercises_completed: data.exercisesCompleted,
      completed_sets: data.completedSets,
      rating: data.rating,
    })
    .eq('id', sessionId)
    .eq('user_id', userId);
  
  if (sessionError) throw sessionError;
  
  // 일일 목표 업데이트
  await updateDailyGoal(userId, data.duration);
  
  // 스트릭 업데이트
  await updateStreak(userId);
  
  // 포인트 지급
  await grantWorkoutRewards(userId);
  
  return { success: true };
}

// 운동 히스토리 조회
export async function getWorkoutHistory(
  page = 1,
  limit = 10
) {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('workout_sessions')
    .select(`
      *,
      workout:workouts(title, thumbnail_url)
    `, { count: 'exact' })
    .eq('user_id', userId)
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  
  return {
    sessions: data,
    totalCount: count,
    hasMore: (count ?? 0) > offset + limit,
  };
}

// 주간 통계 조회
export async function getWeeklyStats() {
  const { userId } = await auth();
  if (!userId) throw new Error('Unauthorized');
  
  const supabase = createClient();
  
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const { data, error } = await supabase
    .from('workout_sessions')
    .select('duration, calories_burned, sets_completed')
    .eq('user_id', userId)
    .gte('completed_at', weekAgo.toISOString())
    .not('completed_at', 'is', null);
  
  if (error) throw error;
  
  return {
    totalDuration: data.reduce((sum, s) => sum + (s.duration || 0), 0),
    totalCalories: data.reduce((sum, s) => sum + (s.calories_burned || 0), 0),
    totalSets: data.reduce((sum, s) => sum + (s.sets_completed || 0), 0),
    workoutCount: data.length,
  };
}
```

---

## 6. UX 구현 체크리스트

### 6.1 게이미피케이션 (조사 묶음 A 기반)

- [ ] **스트릭 시스템**
  - [ ] 캘린더 UI에 달성일 체크마크 + 색상 변화
  - [ ] "3일 연속 달성! 내일도 이어가세요 🔥" 알림
  - [ ] 스트릭 보호 (1회 무료 복구)
  - [ ] 최장 스트릭 기록 표시

- [ ] **포인트/레벨**
  - [ ] 운동 완료 +15P
  - [ ] 3일 연속 +20P
  - [ ] 7일 연속 +50P

- [ ] **마이크로인터랙션**
  - [ ] 운동 완료 시 컨페티 애니메이션
  - [ ] 세트 완료 시 프로그레스 링 채우기 + 햅틱
  - [ ] 스트릭 달성 시 불꽃 애니메이션

### 6.2 개인화/AI (조사 묶음 B 기반)

- [ ] **AI 라벨링**
  - [ ] ✨ 아이콘 + "AI 맞춤 추천" 텍스트 배지
  - [ ] 매칭 점수 색상 코딩 (🟢 80%+ / 🟡 60-79% / 🔴 60% 미만)

- [ ] **추천 이유 설명**
  - [ ] 체형 연결: "Y체형의 하체 밸런스에 효과적"
  - [ ] 목표 연결: "체중 감량 목표에 적합"

- [ ] **피드백 수집**
  - [ ] 👍/👎 간단한 평가 버튼
  - [ ] 운동 후 난이도 체감 피드백 (RPE)
  - [ ] "이 운동 다시 추천하지 않기" 옵션

### 6.3 정보 전달 (조사 묶음 C 기반)

- [ ] **대시보드**
  - [ ] 링형 진행률 게이지 (3초 내 현황 파악)
  - [ ] 오늘의 추천 운동 카드 (최대 3개)
  - [ ] 스트릭 배지 상단 노출

- [ ] **온보딩**
  - [ ] 3문항, 30초 이내 완료
  - [ ] 스킵 가능 (나중에 설정에서 변경)
  - [ ] 마지막에 첫 추천 운동 즉시 표시

- [ ] **빈 상태**
  - [ ] 브랜드 일러스트 + 동기부여 메시지
  - [ ] 명확한 CTA 버튼

---

## 7. 파일 구조

```
app/
├── (protected)/
│   └── workout/
│       ├── page.tsx                 # 대시보드
│       ├── onboarding/
│       │   └── page.tsx             # 온보딩
│       ├── [workoutId]/
│       │   ├── page.tsx             # 운동 상세
│       │   └── session/
│       │       └── page.tsx         # 운동 실행
│       ├── history/
│       │   └── page.tsx             # 기록/통계
│       └── explore/
│           └── page.tsx             # 운동 탐색
├── actions/
│   └── workout.ts                   # Server Actions
└── api/
    └── workout/
        └── ...                      # API Routes (필요시)

components/
└── workout/
    ├── WorkoutCard.tsx
    ├── WorkoutDetailView.tsx
    ├── WorkoutSessionPlayer.tsx
    ├── WorkoutCompletionCard.tsx
    ├── DailyProgressRing.tsx
    ├── StreakCalendar.tsx
    ├── StreakBadge.tsx
    ├── WeeklySummaryCard.tsx
    ├── WorkoutHistoryItem.tsx
    ├── ExerciseCounter.tsx
    ├── RestTimer.tsx
    └── FeedbackRating.tsx

stores/
└── workoutSessionStore.ts           # Zustand store

types/
└── workout.ts                       # TypeScript 타입

lib/
└── workout/
    ├── matchScore.ts                # 매칭 점수 계산
    └── streakUtils.ts               # 스트릭 유틸리티
```

---

## 8. 구현 우선순위

### Phase 2-1: MVP (1-2주)
1. 데이터베이스 스키마 생성
2. 운동 시드 데이터 삽입
3. 대시보드 기본 UI
4. 운동 상세 화면
5. 운동 실행 (기본 타이머/카운터)

### Phase 2-2: 핵심 기능 (2-3주)
6. 온보딩 플로우
7. 세션 기록 저장
8. 기록/통계 화면
9. 스트릭 시스템

### Phase 2-3: 고도화 (3-4주)
10. AI 매칭 점수 개선
11. 게이미피케이션 (포인트/배지)
12. 푸시 알림 연동
13. 소셜 공유

---

## 9. 참고 자료

- [조사 묶음 A] 게이미피케이션 전략 가이드
- [조사 묶음 B] 개인화/AI 추천 UX 가이드  
- [조사 묶음 C] 정보 전달 UX 가이드
- 이룸 Phase 1 UI 목업
- DESIGNNAS 가이드라인
