# 📋 N-1 Sprint Backlog v1.3
## AI 영양/식단 분석 시스템 - Claude Code 최적화 버전

**모듈 ID**: N-1  
**작성일**: 2025-11-27  
**버전**: v1.3 (Claude Code Best Practices 적용)  
**개발자**: 병민  
**개발 도구**: Claude Code (80%) + Cursor (20%)

---

## 📌 v1.3 주요 변경사항

| 항목 | v1.2 | v1.3 |
|------|------|------|
| Claude Mode | ❌ 없음 | ✅ Task별 권장 모드 |
| 프롬프트 템플릿 | ❌ 없음 | ✅ 복사-붙여넣기 가능 |
| 테스트 코드 | ❌ 없음 | ✅ Jest/RTL 템플릿 |
| 복잡도 표시 | ❌ 없음 | ✅ 🟢🟡🔴 레벨 |

---

## 🎯 복잡도 & Claude Mode 가이드

| 복잡도 | 설명 | Claude Mode | TDD | 예상 반복 |
|--------|------|-------------|-----|----------|
| 🟢 낮음 | 단순 UI, 데이터 생성 | 바로 구현 (`Shift+Tab` Auto-accept 권장) | 선택 | 1회 |
| 🟡 중간 | 로직 포함, API 연동 | Plan → Implement | **테스트 먼저** | 2회 |
| 🔴 높음 | AI 통합, 복잡한 로직 | Think Hard → Plan → Implement | **테스트 먼저** | 3회+ |

> **TDD 워크플로우**: 🟡🔴 Task는 "테스트 작성 → 구현 → 리팩토링" 순서를 따르세요.  
> **Auto-accept**: 🟢 Task는 `Shift+Tab`으로 빠른 수락 후 80% 완성 → 수동 마무리 권장.

---

## 🔴 Claude Code Plan 모드 사전 검토 항목

> **Sprint 1 시작 전 필수**: 아래 프롬프트를 Claude Code에서 실행하세요.

```
이 프로젝트의 N-1 관련 코드베이스를 분석해주세요.

1. 기존 모듈 연동 확인:
   - C-1 body_analyses 테이블 (height, weight 필드)
   - S-1 skin_analyses 테이블 (피부 고민)
   - W-1 workout 모듈 구조

2. Gemini API 패턴:
   - lib/gemini/ 기존 구조
   - 이미지 분석 패턴 (S-1 참고)

3. DB 패턴:
   - 기존 마이그레이션 파일
   - RLS 정책 패턴

각 항목에 대해 파일 경로와 핵심 패턴을 정리해주세요.
```

---

## 1. Sprint 문장화

| Sprint | 기간 | 목표 |
|--------|------|------|
| **Sprint 1** | Week 1 | 온보딩 7단계 + DB 스키마 + BMR/TDEE 계산 |
| **Sprint 2** | Week 2 | AI 음식 분석 + 식단/수분 기록 + 간헐적 단식 |
| **Sprint 3** | Week 3 | 대시보드 + 크로스 모듈 연동 + 최적화 |

---

## 2. MVP 우선순위 분류

### Must (없으면 서비스 성립 안 됨)
- 온보딩 7단계, BMR/TDEE 계산, AI 음식 분석, 식단 기록, DB 스키마

### Should (있으면 좋음)
- 신호등 시스템, 수분 섭취, 간헐적 단식, 즐겨찾기, Streak

### Later (2차 버전)
- 바코드 스캔, 주간/월간 리포트, 또래 비교, 레시피 조합

---

## 3. Sprint 1 (Week 1): 온보딩 & DB

### 3.1 Week 1 Tasks

---

#### Task 1.0: 영양 모듈 레이아웃

| 항목 | 내용 |
|------|------|
| **파일** | `app/nutrition/layout.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: /nutrition/* 경로 접근 시
When: 페이지 로드되면
Then: 
  - W-1과 동일한 레이아웃 구조
  - max-width: 480px
  - 배경색 #FAFAFA
```

**Claude Code 프롬프트:**
```
Task 1.0: 영양 모듈 레이아웃을 구현해주세요.

파일: app/nutrition/layout.tsx

요구사항:
- W-1 workout/layout.tsx와 동일한 구조
- 상단 헤더 (뒤로가기 + 제목)
- max-width: 480px, 중앙 정렬

기존 app/workout/layout.tsx를 참고해주세요.
```

**테스트 코드:**
```typescript
// __tests__/app/nutrition/layout.test.tsx
import { render, screen } from '@testing-library/react';
import NutritionLayout from '@/app/nutrition/layout';

describe('NutritionLayout', () => {
  it('renders with correct max-width', () => {
    render(<NutritionLayout><div>Test</div></NutritionLayout>);
    const container = screen.getByRole('main');
    expect(container).toHaveClass('max-w-[480px]');
  });
});
```

---

#### Task 1.1: DB 스키마 v2.5 마이그레이션

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/005_users_profile_extension.sql` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: users 테이블
When: 마이그레이션 실행 시
Then:
  - gender 필드 추가 (male/female/other)
  - birth_date 필드 추가 (DATE)
  - BMR 계산에 필요한 데이터 완비
```

**Claude Code 프롬프트:**
```
Task 1.1: users 테이블 확장 마이그레이션을 작성해주세요.

파일: supabase/migrations/005_users_profile_extension.sql

추가 필드:
- gender TEXT CHECK (gender IN ('male', 'female', 'other'))
- birth_date DATE

docs/Database-스키마-v2.5-업데이트-권장.md 문서를 참고해주세요.
```

**테스트:** Supabase Studio에서 직접 확인

---

#### Task 1.2: nutrition_settings 테이블 생성

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/006_nutrition_settings.sql` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.1 |

**수락 기준:**
```gherkin
Given: nutrition_settings 테이블 생성
When: 테이블 확인 시
Then:
  - user_id (FK → users.id)
  - goal (weight_loss/maintain/muscle/skin/health)
  - bmr, tdee (계산값)
  - preferences, cooking_skill, budget
  - allergies, meal_count
  - RLS 정책 적용
```

**Claude Code 프롬프트:**
```
Task 1.2: nutrition_settings 테이블을 생성해주세요.

파일: supabase/migrations/006_nutrition_settings.sql

스키마:
CREATE TABLE nutrition_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  goal TEXT NOT NULL,
  bmr DECIMAL(6,1),
  tdee DECIMAL(6,1),
  activity_level TEXT DEFAULT 'moderate',
  preferences TEXT[],
  cooking_skill TEXT,
  budget TEXT,
  allergies TEXT[],
  disliked_foods TEXT[],
  meal_count INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

RLS 정책도 추가해주세요.
```

**테스트:** Supabase Studio에서 직접 확인

---

#### Task 1.3: foods 테이블 생성 (공용 음식 DB)

| 항목 | 내용 |
|------|------|
| **파일** | `supabase/migrations/007_foods.sql` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: foods 테이블
When: 테이블 확인 시
Then:
  - 음식명, 영양정보 (칼로리, 단백질, 탄수화물, 지방)
  - 카테고리, 서빙 사이즈
  - 신호등 색상 (green/yellow/red)
  - 공용 테이블 (RLS 없음, 읽기 전용)
```

**Claude Code 프롬프트:**
```
Task 1.3: foods 테이블을 생성해주세요.

파일: supabase/migrations/007_foods.sql

스키마:
CREATE TABLE foods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL,
  serving_size TEXT DEFAULT '1인분',
  serving_grams INTEGER,
  calories INTEGER NOT NULL,
  protein DECIMAL(5,1),
  carbs DECIMAL(5,1),
  fat DECIMAL(5,1),
  fiber DECIMAL(5,1),
  sodium INTEGER,
  traffic_light TEXT CHECK (traffic_light IN ('green', 'yellow', 'red')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_foods_name ON foods(name);
CREATE INDEX idx_foods_category ON foods(category);
```

---

#### Task 1.4: 기본 음식 DB 시딩 (500종)

| 항목 | 내용 |
|------|------|
| **파일** | `data/foods/korean-foods.json`, `supabase/seed.sql` |
| **예상 시간** | 4h |
| **복잡도** | 🟢 낮음 (반복 작업) |
| **Claude Mode** | Auto-accept 권장 |
| **우선순위** | Must |
| **의존성** | Task 1.3 |

**수락 기준:**
```gherkin
Given: 음식 DB JSON 파일
When: 시딩 완료 시
Then:
  - 500종 이상 음식 데이터
  - 카테고리: 밥류, 국/찌개, 반찬, 고기, 해산물, 면류, 빵/디저트, 음료, 과일, 패스트푸드
  - 각 음식에 영양정보 + 신호등 색상
```

**Claude Code 프롬프트:**
```
Task 1.4: 한국 음식 500종 DB를 생성해주세요.

파일: data/foods/korean-foods.json

카테고리별 분포:
- 밥류: 50종 (비빔밥, 김밥, 볶음밥 등)
- 국/찌개: 50종 (된장찌개, 김치찌개 등)
- 반찬: 80종 (김치, 나물, 조림 등)
- 고기: 50종 (삼겹살, 불고기, 치킨 등)
- 해산물: 40종 (생선구이, 회, 조개 등)
- 면류: 40종 (라면, 국수, 파스타 등)
- 빵/디저트: 50종 (케이크, 빵, 과자 등)
- 음료: 40종 (커피, 차, 주스 등)
- 과일: 50종 (사과, 바나나, 딸기 등)
- 패스트푸드: 50종 (햄버거, 피자 등)

신호등 기준:
- green: 저칼로리, 고영양 (채소, 과일, 살코기)
- yellow: 적당 (밥, 생선, 유제품)
- red: 고칼로리, 저영양 (튀김, 디저트, 패스트푸드)
```

---

#### Task 1.5 ~ 1.8: 공통 컴포넌트 (W-1과 동일)

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 1.5 | 진행 표시 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 1.6 | 스텝 네비게이션 | 🟡 | Plan → Impl | 0.5d |
| 1.7 | 선택 카드 컴포넌트 | 🟡 | Plan → Impl | 0.5d |
| 1.8 | Zustand Store | 🟡 | Plan → Impl | 1d |

> **Note**: W-1 컴포넌트 재사용 가능 시 components/common/으로 이동

---

#### Task 1.9: Step 1 - 식사 목표 선택 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/nutrition/onboarding/step1/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.7, 1.8 |

**수락 기준:**
```gherkin
Given: Step 1 진입 시
When: 목표 옵션 표시
Then: 
  - 5가지 목표 (단일 선택)
  - 🔥 체중 감량 / ⚖️ 체중 유지 / 💪 근육 증가 / ✨ 피부 개선 / ❤️ 건강 관리
```

**Claude Code 프롬프트:**
```
Task 1.9: Step 1 식사 목표 선택 화면을 구현해주세요.

파일: app/nutrition/onboarding/step1/page.tsx

목표 옵션:
const NUTRITION_GOALS = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '칼로리 적자 식단' },
  { id: 'maintain', icon: '⚖️', title: '체중 유지', desc: '균형 잡힌 식단' },
  { id: 'muscle', icon: '💪', title: '근육 증가', desc: '고단백 식단' },
  { id: 'skin', icon: '✨', title: '피부 개선', desc: '피부 친화 식단 (S-1 연동)' },
  { id: 'health', icon: '❤️', title: '건강 관리', desc: '균형 영양 식단' },
];

W-1 Step 2 패턴을 참고해주세요.
```

**테스트 코드:**
```typescript
import { render, screen } from '@testing-library/react';
import Step1Page from '@/app/nutrition/onboarding/step1/page';

describe('NutritionStep1Page', () => {
  it('renders all 5 goal options', () => {
    render(<Step1Page />);
    expect(screen.getByText('체중 감량')).toBeInTheDocument();
    expect(screen.getByText('피부 개선')).toBeInTheDocument();
  });
});
```

---

#### Task 1.10: Step 2 - 기본 정보 입력 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/nutrition/onboarding/step2/page.tsx` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 1.1, 1.8 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: C-1 분석 완료 사용자
When: Step 2 진입 시
Then: 키/체중 자동 불러오기 → 확인 후 다음

Given: C-1 미완료 사용자
When: Step 2 진입 시
Then: 직접 입력 폼 (키, 체중, 성별, 생년월일, 활동량)

Given: 모든 정보 입력 완료
When: 다음 버튼 클릭
Then: BMR/TDEE 자동 계산 → Store 저장
```

**Claude Code 프롬프트:**
```
Task 1.10: Step 2 기본 정보 입력 화면을 구현해주세요.

Think about:
1. C-1 데이터 있으면 자동 불러오기
2. BMR/TDEE 계산 타이밍
3. 입력 유효성 검사

파일: app/nutrition/onboarding/step2/page.tsx

입력 필드:
- 키 (cm) - C-1에서 불러오기 or 직접 입력
- 체중 (kg) - C-1에서 불러오기 or 직접 입력
- 성별 - 단일 선택 (남성/여성)
- 생년월일 - Date picker
- 활동량 - 단일 선택 (비활동적/가벼운/보통/활동적/매우활동적)

BMR/TDEE 계산은 Task 1.11에서 구현.
```

**테스트 코드:**
```typescript
import { render, screen, waitFor } from '@testing-library/react';
import Step2Page from '@/app/nutrition/onboarding/step2/page';

describe('NutritionStep2Page', () => {
  it('loads C-1 data when available', async () => {
    // Mock C-1 data
    render(<Step2Page />);
    await waitFor(() => {
      expect(screen.getByDisplayValue('170')).toBeInTheDocument(); // height
    });
  });

  it('shows manual input when no C-1 data', () => {
    render(<Step2Page />);
    expect(screen.getByLabelText('키 (cm)')).toBeInTheDocument();
  });
});
```

---

#### Task 1.11: BMR/TDEE 계산 함수

| 항목 | 내용 |
|------|------|
| **파일** | `lib/nutrition/calculateBMR.ts` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: 사용자 정보 (성별, 나이, 키, 체중, 활동량)
When: calculateBMR() 호출 시
Then:
  - Harris-Benedict 공식으로 BMR 계산
  - 활동 계수 적용하여 TDEE 계산
  - 반올림하여 정수 반환

Harris-Benedict 공식:
  남성: BMR = 88.362 + (13.397 × 체중) + (4.799 × 키) - (5.677 × 나이)
  여성: BMR = 447.593 + (9.247 × 체중) + (3.098 × 키) - (4.330 × 나이)

활동 계수:
  비활동적: 1.2 / 가벼운: 1.375 / 보통: 1.55 / 활동적: 1.725 / 매우활동적: 1.9
```

**Claude Code 프롬프트:**
```
Task 1.11: BMR/TDEE 계산 함수를 구현해주세요.

파일: lib/nutrition/calculateBMR.ts

함수:
1. calculateBMR(gender, weight, height, age): number
2. calculateTDEE(bmr, activityLevel): number
3. calculateAll(userInfo): { bmr, tdee, dailyCalories }

공식은 수락 기준 참고.
테스트 먼저 작성해주세요.
```

**테스트 코드:**
```typescript
import { calculateBMR, calculateTDEE } from '@/lib/nutrition/calculateBMR';

describe('BMR/TDEE calculation', () => {
  it('calculates BMR for male correctly', () => {
    // 남성, 70kg, 175cm, 30세
    const bmr = calculateBMR('male', 70, 175, 30);
    expect(bmr).toBeCloseTo(1695, 0);
  });

  it('calculates BMR for female correctly', () => {
    // 여성, 55kg, 160cm, 25세
    const bmr = calculateBMR('female', 55, 160, 25);
    expect(bmr).toBeCloseTo(1339, 0);
  });

  it('calculates TDEE with activity level', () => {
    const bmr = 1500;
    const tdee = calculateTDEE(bmr, 'moderate'); // 1.55
    expect(tdee).toBe(2325);
  });
});
```

---

#### Task 1.12 ~ 1.19: 온보딩 Step 3-7 + API

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 1.12 | Step 3 - 선호 식습관 | 🟢 | 바로 구현 | 0.5d |
| 1.13 | Step 4 - 요리 스킬 | 🟢 | 바로 구현 | 0.5d |
| 1.14 | Step 5 - 예산 선택 | 🟢 | 바로 구현 | 0.5d |
| 1.15 | Step 6 - 알레르기 | 🟢 | 바로 구현 | 0.5d |
| 1.16 | Step 7 - 식사 횟수 | 🟢 | 바로 구현 | 0.5d |
| 1.17 | 영양 설정 저장 API | 🟡 | Plan → Impl | 1d |
| 1.18 | 온보딩 완료 화면 | 🟢 | 바로 구현 | 0.5d |
| 1.19 | TypeScript 타입 정의 | 🟢 | 바로 구현 | 0.5d |
| 1.20 | 온보딩 플로우 테스트 | 🟡 | Plan → Impl | 1d |

---

## 4. Sprint 2 (Week 2): AI 분석 & 기록

### 4.1 DB 테이블 Tasks

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 2.0-a | meal_records 테이블 | 🟢 | 바로 구현 | 0.5d |
| 2.0-b | water_records 테이블 | 🟢 | 바로 구현 | 0.5d |
| 2.0-c | daily_nutrition_summary | 🟢 | 바로 구현 | 0.5d |
| 2.0-d | favorite_foods 테이블 | 🟢 | 바로 구현 | 0.5d |
| 2.0-e | fasting_records 테이블 | 🟢 | 바로 구현 | 0.5d |
| 2.0-f | nutrition_streaks 테이블 | 🟢 | 바로 구현 | 0.5d |

---

### 4.2 AI 분석 Tasks

---

#### Task 2.1: Gemini API 클라이언트 설정

| 항목 | 내용 |
|------|------|
| **파일** | `lib/gemini/nutrition.ts` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | W-1 Task 3.1 (공통 클라이언트) |

**Claude Code 프롬프트:**
```
Task 2.1: N-1용 Gemini 클라이언트를 설정해주세요.

기존 lib/gemini/client.ts 공통 클라이언트를 활용하고,
N-1 전용 함수를 lib/gemini/nutrition.ts에 작성해주세요.

함수:
- analyzeFood(imageBase64): Promise<FoodAnalysisResult>
- generateMealSuggestion(settings, context): Promise<MealSuggestion>
```

---

#### Task 2.2: 음식 분석 프롬프트

| 항목 | 내용 |
|------|------|
| **파일** | `lib/gemini/prompts/foodAnalysis.ts` |
| **예상 시간** | 1d |
| **복잡도** | 🔴 높음 |
| **Claude Mode** | Think Hard → Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 2.1 |
| **예상 반복** | 3회 |

**수락 기준:**
```gherkin
Given: 음식 사진 (이미지)
When: AI 분석 요청 시
Then:
  - 음식명 인식 (한국어)
  - 영양정보 추정 (칼로리, 단백질, 탄수화물, 지방)
  - 신호등 색상 분류
  - 1회 제공량 추정
  - 인식 신뢰도 표시
```

**Claude Code 프롬프트:**
```
Task 2.2: 음식 분석 AI 프롬프트를 작성해주세요.

Think hard about:
1. 한국 음식 인식 최적화
2. 여러 음식이 한 접시에 있는 경우
3. 양 추정의 정확도
4. JSON 응답 강제 방법

⚠️ TDD: 테스트 코드 먼저 작성 → 구현 → 반복 검증

파일: lib/gemini/prompts/foodAnalysis.ts

프롬프트 요구사항:
- 역할: 영양 전문가
- 한국 음식 중심
- 다중 음식 인식
- 신뢰도 점수 포함

응답 형식:
{
  "foods": [
    {
      "name": "비빔밥",
      "portion": "1인분 (약 500g)",
      "calories": 550,
      "protein": 15,
      "carbs": 80,
      "fat": 12,
      "trafficLight": "yellow",
      "confidence": 0.85
    }
  ],
  "totalCalories": 550
}
```

**테스트 코드:**
```typescript
import { buildFoodAnalysisPrompt, parseFoodAnalysisResponse } from '@/lib/gemini/prompts/foodAnalysis';

describe('foodAnalysis prompt', () => {
  it('parses valid response', () => {
    const response = '{"foods": [{"name": "김치찌개", "calories": 200}], "totalCalories": 200}';
    const result = parseFoodAnalysisResponse(response);
    expect(result.foods[0].name).toBe('김치찌개');
  });

  it('handles multiple foods', () => {
    const response = '{"foods": [{"name": "밥"}, {"name": "김치"}], "totalCalories": 400}';
    const result = parseFoodAnalysisResponse(response);
    expect(result.foods).toHaveLength(2);
  });
});
```

---

#### Task 2.3 ~ 2.18: 나머지 Sprint 2 Tasks

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 2.3 | 음식 분석 API Route | 🟡 | Plan → Impl | 1d |
| 2.4 | 카메라 촬영 UI | 🟡 | Plan → Impl | 1d |
| 2.5 | 분석 결과 화면 | 🟡 | Plan → Impl | 1d |
| 2.6 | 신호등 표시 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 2.7 | 식단 기록 화면 | 🟡 | Plan → Impl | 1d |
| 2.8 | 오늘의 식단 API | 🟡 | Plan → Impl | 1d |
| 2.9 | 수분 섭취 입력 UI | 🟢 | 바로 구현 | 0.5d |
| 2.10 | 수분 섭취 API | 🟢 | 바로 구현 | 0.5d |
| 2.11 | 음식 직접 입력 UI | 🟡 | Plan → Impl | 0.5d |
| 2.12 | 음식 검색 API | 🟡 | Plan → Impl | 0.5d |
| 2.13 | 식단 히스토리 화면 | 🟡 | Plan → Impl | 1d |
| 2.14 | 히스토리 API | 🟡 | Plan → Impl | 0.5d |
| 2.15 | 즐겨찾기 API | 🟢 | 바로 구현 | 0.5d |
| 2.16 | 간헐적 단식 설정 UI | 🟡 | Plan → Impl | 0.5d |
| 2.17 | 간헐적 단식 타이머 | 🟡 | Plan → Impl | 1d |
| 2.18 | 간헐적 단식 API | 🟢 | 바로 구현 | 0.5d |

---

## 5. Sprint 3 (Week 3): 대시보드 & 연동

### Task 요약

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 3.1 | 영양 대시보드 페이지 | 🟡 | Plan → Impl | 1d |
| 3.2 | 오늘의 영양 요약 카드 | 🟢 | 바로 구현 | 0.5d |
| 3.3 | 칼로리 프로그레스 링 | 🟡 | Plan → Impl | 0.5d |
| 3.4 | 영양소 바 차트 | 🟡 | Plan → Impl | 0.5d |
| 3.5 | 식단 Streak 로직 | 🟡 | Plan → Impl | 0.5d |
| 3.6 | Streak UI 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 3.7 | S-1 피부 연동 인사이트 | 🟡 | Plan → Impl | 1d |
| 3.8 | W-1 운동 연동 알림 | 🟢 | 바로 구현 | 0.5d |
| 3.9 | C-1 체형 연동 칼로리 | 🟢 | 바로 구현 | 0.5d |
| 3.10 | Sprint 3 통합 테스트 | 🟡 | Plan → Impl | 1d |

---

## 📊 전체 Task 요약

### 복잡도별 분포

| 복잡도 | 개수 | 비율 |
|--------|------|------|
| 🟢 낮음 | 35개 | 59% |
| 🟡 중간 | 22개 | 37% |
| 🔴 높음 | 2개 | 4% |
| **합계** | **59개** | 100% |

### Claude Mode별 분포

| Claude Mode | 개수 | 설명 |
|-------------|------|------|
| 바로 구현 | 35개 | 단순 UI, DB, 데이터 |
| Plan → Implement | 22개 | 로직, API 연동 |
| Think Hard | 2개 | AI 프롬프트 |

### Sprint별 예상 시간

| Sprint | 기간 | Task 수 | 예상 시간 |
|--------|------|---------|----------|
| Sprint 1 | Week 1 | 20개 | 10d |
| Sprint 2 | Week 2 | 24개 | 12d |
| Sprint 3 | Week 3 | 15개 | 7d |
| **합계** | 3주 | **59개** | **29d** |

---

## 🔧 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-11-27 | 초안 작성 (44개 Task) |
| v1.1 | 2025-11-27 | 방법론 검토 반영 |
| v1.2 | 2025-11-27 | 13개 Task 추가 (57개) |
| v1.3 | 2025-11-27 | **Claude Code 최적화** (복잡도, 프롬프트, 테스트) |

---

**문서 끝**
