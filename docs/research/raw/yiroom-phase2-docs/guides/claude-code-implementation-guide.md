# 이룸 Phase 2 Claude Code 구현 가이드

> **버전**: 1.0.0  
> **작성일**: 2025-12-18  
> **대상**: Claude Code Max + Opus 4.5

---

## 📋 목차

1. [사전 준비](#1-사전-준비)
2. [구현 순서](#2-구현-순서)
3. [단계별 Claude Code 명령어](#3-단계별-claude-code-명령어)
4. [품질 체크리스트](#4-품질-체크리스트)
5. [트러블슈팅](#5-트러블슈팅)

---

## 1. 사전 준비

### 1.1 필수 파일 배치

```bash
# 프로젝트 루트에서 실행
mkdir -p docs/specs
mkdir -p docs/prototypes
mkdir -p supabase/seed-data

# 스펙 문서 배치
mv w1-workout-module-spec.md docs/specs/
mv n1-nutrition-module-spec.md docs/specs/

# 프로토타입 배치
mv *-prototype.jsx docs/prototypes/

# 시드 데이터 배치 (이전에 생성한 JSON 파일들)
mv exercises-*.json supabase/seed-data/
mv korean-foods-*.json supabase/seed-data/
```

### 1.2 환경 변수 확인

```env
# .env.local 필수 항목
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

GEMINI_API_KEY=your_gemini_key
```

### 1.3 기존 Phase 1 코드 확인

```bash
# Phase 1 구조 확인
ls -la app/(protected)/
# 예상: analysis/, skin/, body-type/ 등

# 공통 컴포넌트 확인
ls -la components/ui/
```

---

## 2. 구현 순서

### 2.1 전체 로드맵

```
Phase 2-1: 기반 (1주)
├── Week 1-1: DB 스키마 + 시드 데이터
├── Week 1-2: 타입 정의 + Server Actions 기본
└── Week 1-3: 공통 컴포넌트

Phase 2-2: W-1 운동 모듈 (2주)
├── Week 2: 대시보드 + 온보딩
├── Week 3-1: 운동 상세 + 실행
└── Week 3-2: 기록/통계

Phase 2-3: N-1 영양 모듈 (2주)
├── Week 4: 대시보드 + 온보딩
├── Week 5-1: 식단 기록 + AI 인식
└── Week 5-2: 기록/통계

Phase 2-4: 통합 + 고도화 (1주)
├── Week 6-1: 통합 홈 대시보드
├── Week 6-2: 게이미피케이션
└── Week 6-3: 테스트 + 버그 수정
```

### 2.2 의존성 순서

```
[필수 선행]
1. DB 스키마 → 2. 타입 정의 → 3. Server Actions

[병렬 가능]
4. W-1 UI ←→ 5. N-1 UI (독립적)

[마지막]
6. 통합 홈 (W-1, N-1 완료 후)
```

---

## 3. 단계별 Claude Code 명령어

### 3.1 Phase 2-1: 기반 구축

#### Step 1: DB 스키마 생성

```
docs/specs/w1-workout-module-spec.md 섹션 4번 "데이터베이스 스키마"를 참조해서
Supabase 마이그레이션 파일을 생성해줘.

파일 위치: supabase/migrations/20241218_workout_tables.sql

다음 테이블을 포함해야 해:
- user_workout_profiles
- workouts
- workout_sessions
- daily_workout_goals
- saved_workouts
- workout_rewards

RLS 정책도 함께 작성해줘.
```

```
docs/specs/n1-nutrition-module-spec.md 섹션 4번을 참조해서
영양 모듈 마이그레이션 파일을 생성해줘.

파일 위치: supabase/migrations/20241218_nutrition_tables.sql

다음 테이블 포함:
- user_nutrition_profiles
- foods
- daily_nutrition_logs
- meal_logs
- food_log_items
- favorite_foods
- custom_foods
- nutrition_rewards
```

#### Step 2: 시드 데이터 삽입

```
supabase/seed-data/exercises-*.json 파일들을 읽어서
workouts 테이블에 삽입하는 시드 스크립트를 만들어줘.

파일 위치: supabase/seed/seed-workouts.ts

운동 데이터 70개를 삽입하고, 
각 운동의 body_types 필드는 추천 체형 배열로 설정해줘.
```

```
supabase/seed-data/korean-foods-*.json 파일들을 읽어서
foods 테이블에 삽입하는 시드 스크립트를 만들어줘.

파일 위치: supabase/seed/seed-foods.ts

음식 데이터 80개를 삽입하고,
color_category는 칼로리 밀도에 따라 자동 계산해줘:
- green: < 100 kcal/100g
- yellow: 100-250 kcal/100g  
- orange: > 250 kcal/100g
```

#### Step 3: 타입 정의

```
docs/specs/w1-workout-module-spec.md의 TypeScript 인터페이스들을 참조해서
types/workout.ts 파일을 생성해줘.

다음 타입들을 포함해야 해:
- UserWorkoutProfile
- Workout
- WorkoutSession
- DailyWorkoutGoal
- OnboardingStep, OnboardingOption
- WorkoutCardProps
- etc.
```

```
docs/specs/n1-nutrition-module-spec.md의 TypeScript 인터페이스들을 참조해서
types/nutrition.ts 파일을 생성해줘.
```

#### Step 4: Server Actions 기본

```
docs/specs/w1-workout-module-spec.md 섹션 5번 "API 엔드포인트"를 참조해서
app/actions/workout.ts 파일을 생성해줘.

다음 함수들을 구현해:
- completeWorkoutOnboarding
- getRecommendedWorkouts
- startWorkoutSession
- completeWorkoutSession
- getWorkoutHistory
- getWeeklyStats

각 함수에 Clerk auth() 체크와 Supabase 연동 포함해줘.
```

```
docs/specs/n1-nutrition-module-spec.md 섹션 5번을 참조해서
app/actions/nutrition.ts 파일을 생성해줘.
```

---

### 3.2 Phase 2-2: W-1 운동 모듈

#### Step 5: W-1 대시보드

```
docs/prototypes/w1-dashboard-prototype.jsx를 참조해서
실제 Next.js 페이지를 구현해줘.

파일 위치: app/(protected)/workout/page.tsx

다음을 포함해야 해:
1. getRecommendedWorkouts 호출해서 추천 운동 표시
2. 사용자 프로필에서 오늘의 진행률 표시
3. 스트릭 배지 표시
4. BottomNavigation은 공통 컴포넌트로 분리

프로토타입의 디자인을 최대한 유지하되,
실제 데이터 연동해줘.
```

#### Step 6: W-1 온보딩

```
docs/prototypes/onboarding-prototype.jsx의 WorkoutOnboarding 컴포넌트를 참조해서
app/(protected)/workout/onboarding/page.tsx를 구현해줘.

3단계 온보딩:
1. 운동 목표 선택
2. 가능 시간 선택
3. 장비 유무 선택

완료 시 completeWorkoutOnboarding 호출하고
/workout으로 리다이렉트해줘.
```

#### Step 7: W-1 운동 상세

```
docs/prototypes/w1-detail-prototype.jsx를 참조해서
app/(protected)/workout/[workoutId]/page.tsx를 구현해줘.

동적 라우트로 workoutId를 받아서:
1. Supabase에서 운동 상세 정보 조회
2. AI 추천 이유 표시 (체형 연동)
3. 운동 구성 타임라인 표시
4. 좋아요/피드백 기능
```

#### Step 8: W-1 운동 실행

```
docs/prototypes/w1-session-prototype.jsx를 참조해서
app/(protected)/workout/[workoutId]/session/page.tsx를 구현해줘.

세 가지 화면 상태 관리:
1. 운동 중 (ExerciseScreen)
2. 휴식 중 (RestScreen)  
3. 완료 (CompletionScreen)

Zustand store 사용해서 세션 상태 관리해줘.
stores/workoutSessionStore.ts 파일도 함께 생성해줘.
```

#### Step 9: W-1 기록/통계

```
docs/prototypes/w1-history-prototype.jsx를 참조해서
app/(protected)/workout/history/page.tsx를 구현해줘.

포함 내용:
1. 스트릭 캘린더 (월간)
2. 주간 요약 카드
3. 주간 막대 차트
4. 최근 운동 히스토리 목록

getWeeklyStats, getWorkoutHistory 함수 연동해줘.
```

---

### 3.3 Phase 2-3: N-1 영양 모듈

#### Step 10: N-1 대시보드

```
docs/prototypes/n1-dashboard-prototype.jsx를 참조해서
app/(protected)/nutrition/page.tsx를 구현해줘.

getTodayNutritionSummary 호출해서:
1. 칼로리 원형 게이지 표시
2. 탄단지 진행 바 표시
3. 끼니별 카드 표시
4. 추천 음식 카드 표시

플로팅 기록 버튼 포함해줘.
```

#### Step 11: N-1 온보딩

```
docs/prototypes/onboarding-prototype.jsx의 NutritionOnboarding 컴포넌트를 참조해서
app/(protected)/nutrition/onboarding/page.tsx를 구현해줘.

3단계 온보딩:
1. 식단 목표 선택
2. 식사 패턴 선택
3. 칼로리 목표 확인 (자동 계산 + 슬라이더 조정)

lib/nutrition/calorieCalculator.ts 유틸리티도 함께 구현해줘.
```

#### Step 12: N-1 식단 기록 + AI 인식

```
docs/prototypes/n1-food-log-prototype.jsx를 참조해서
식단 기록 플로우를 구현해줘.

파일 구조:
- app/(protected)/nutrition/log/page.tsx (메인)
- app/(protected)/nutrition/log/camera/page.tsx (카메라)
- app/(protected)/nutrition/log/search/page.tsx (검색)

AI 음식 인식:
- lib/nutrition/foodRecognition.ts에 Gemini API 연동
- 인식 결과 → DB 매칭 → 사용자 확인 → 저장

logMeal Server Action 연동해줘.
```

#### Step 13: N-1 기록/통계

```
docs/prototypes/n1-history-prototype.jsx를 참조해서
app/(protected)/nutrition/history/page.tsx를 구현해줘.

포함 내용:
1. 주간 칼로리 막대 차트
2. 영양 밸런스 파이 차트
3. 자주 먹는 음식 TOP 5
4. 최근 기록 목록

getWeeklyNutritionStats, getTopFoods 함수 연동해줘.
```

---

### 3.4 Phase 2-4: 통합 + 고도화

#### Step 14: 통합 홈 대시보드

```
docs/prototypes/integrated-home-prototype.jsx를 참조해서
app/(protected)/home/page.tsx를 구현해줘.

기존 Phase 1 완료 후 보여지는 메인 홈 화면으로:
1. W-1 + N-1 오늘의 요약 통합
2. 체형 기반 인사이트
3. 빠른 액션 버튼
4. 끼니 퀵 로그
5. 주간 캘린더 미니

기존 Phase 1 대시보드와 통합 방안도 제안해줘.
```

#### Step 15: 게이미피케이션 시스템

```
스트릭과 포인트 시스템을 완성해줘.

lib/gamification/streakUtils.ts:
- updateStreak: 스트릭 업데이트 로직
- checkStreakProtection: 스트릭 보호 (1회 무료)
- getStreakReward: 스트릭별 보상 계산

lib/gamification/pointsUtils.ts:
- grantPoints: 포인트 지급
- calculateLevel: 레벨 계산
- POINT_RULES: 액션별 포인트 룰

두 모듈(W-1, N-1) 모두에 적용해줘.
```

---

## 4. 품질 체크리스트

### 4.1 각 화면별 체크리스트

```markdown
## 화면 완료 체크리스트

### 기능
- [ ] 모든 버튼/링크 동작 확인
- [ ] 데이터 로딩 상태 표시
- [ ] 에러 상태 처리
- [ ] 빈 상태 UI 표시

### 디자인
- [ ] 프로토타입과 일치 확인
- [ ] 반응형 (모바일 최적화)
- [ ] 다크모드 대응 (선택)
- [ ] 애니메이션/트랜지션

### 데이터
- [ ] Server Action 연동 확인
- [ ] 로딩 중 스켈레톤 표시
- [ ] 캐싱/재검증 전략
- [ ] 에러 바운더리

### 접근성
- [ ] 키보드 네비게이션
- [ ] 스크린리더 호환
- [ ] 색상 대비 충분
```

### 4.2 모듈별 통합 테스트

```markdown
## W-1 통합 테스트

1. 온보딩 플로우
   - [ ] 3단계 완료 → 프로필 저장 확인
   - [ ] 스킵 시 기본값 적용

2. 운동 추천 → 실행 → 완료
   - [ ] 추천 목록에서 운동 선택
   - [ ] 세션 시작 → 세트 완료 반복
   - [ ] 휴식 타이머 동작
   - [ ] 완료 화면에서 통계 표시
   - [ ] 스트릭/포인트 업데이트

3. 기록/통계
   - [ ] 캘린더에 완료일 표시
   - [ ] 주간 차트 데이터 정확성
   - [ ] 히스토리 페이지네이션
```

```markdown
## N-1 통합 테스트

1. 온보딩 플로우
   - [ ] 3단계 완료 → 프로필 저장 확인
   - [ ] 칼로리 자동 계산 정확성

2. 식단 기록 플로우
   - [ ] 사진 촬영 → AI 인식 → 결과 표시
   - [ ] 음식 검색 → 선택 → 수량 조절
   - [ ] 기록 저장 → 대시보드 반영

3. AI 음식 인식
   - [ ] Gemini API 호출 성공
   - [ ] DB 매칭 정확도
   - [ ] 인식 실패 시 수동 입력 유도

4. 기록/통계
   - [ ] 주간 칼로리 차트 정확성
   - [ ] 매크로 비율 계산 정확성
   - [ ] TOP 5 음식 집계 정확성
```

---

## 5. 트러블슈팅

### 5.1 자주 발생하는 이슈

#### Supabase RLS 에러

```
문제: "new row violates row-level security policy"

해결:
1. RLS 정책 확인
2. auth.uid() 매칭 확인
3. Service Role Key로 시드 데이터 삽입
```

#### Clerk + Supabase 연동

```
문제: Clerk userId와 Supabase auth.uid() 불일치

해결:
1. Clerk webhook으로 Supabase user 동기화
2. 또는 별도 users 테이블에 clerk_id 저장
3. Server Action에서 Clerk userId로 조회
```

#### Gemini API 음식 인식 실패

```
문제: JSON 파싱 에러 또는 빈 결과

해결:
1. 프롬프트에 "JSON만 응답" 명시
2. ```json 백틱 제거 로직 추가
3. 타임아웃 설정 (10초)
4. 실패 시 수동 입력 폴백
```

### 5.2 성능 최적화 팁

```typescript
// 1. 이미지 최적화
import Image from 'next/image';
<Image src={food.thumbnail} width={64} height={64} />

// 2. 데이터 프리페칭
import { prefetch } from 'next/navigation';
prefetch('/workout/123');

// 3. Suspense + 스트리밍
<Suspense fallback={<WorkoutSkeleton />}>
  <WorkoutList />
</Suspense>

// 4. React Query 캐싱 (선택)
const { data } = useQuery({
  queryKey: ['workouts', userId],
  queryFn: getRecommendedWorkouts,
  staleTime: 5 * 60 * 1000, // 5분
});
```

---

## 📎 부록: 유용한 명령어 모음

### 파일 생성 요청

```
[컴포넌트명]을 다음 위치에 생성해줘: [경로]
프로토타입: docs/prototypes/[파일명].jsx
스펙: docs/specs/[파일명].md 섹션 [번호]
```

### 버그 수정 요청

```
[파일 경로]에서 [증상] 문제가 있어.
에러 메시지: [에러 내용]
수정해줘.
```

### 리팩토링 요청

```
[파일 경로]의 [컴포넌트/함수]를 
[공통 컴포넌트/유틸리티]로 분리해줘.
재사용성을 높여줘.
```

### 테스트 요청

```
[파일 경로]에 대한 유닛 테스트를 작성해줘.
Jest + React Testing Library 사용.
주요 시나리오: [시나리오 목록]
```

---

**Happy Coding! 🚀**
