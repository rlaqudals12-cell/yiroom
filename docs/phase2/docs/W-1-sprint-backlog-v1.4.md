# 📋 W-1 Sprint Backlog v1.4
## AI 운동/피트니스 추천 시스템 - Claude Code 최적화 버전

**모듈 ID**: W-1  
**작성일**: 2025-11-27  
**버전**: v1.4 (Claude Code Best Practices 적용)  
**개발자**: 병민  
**개발 도구**: Claude Code (80%) + Cursor (20%)

---

## 📌 v1.4 주요 변경사항

| 항목 | v1.3 | v1.4 |
|------|------|------|
| Claude Mode | ❌ 없음 | ✅ Task별 권장 모드 |
| 프롬프트 템플릿 | ❌ 없음 | ✅ 복사-붙여넣기 가능 |
| 테스트 코드 | ❌ 없음 | ✅ Jest/RTL 템플릿 |
| 복잡도 표시 | ❌ 없음 | ✅ 🟢🟡🔴 레벨 |
| 반복 가이드 | ❌ 없음 | ✅ 예상 반복 횟수 |

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
이 프로젝트의 코드베이스를 분석해주세요.

1. C-1 체형 분석 모듈 구조:
   - body_analyses 테이블 스키마
   - /api/body/ API 엔드포인트
   - Zustand store 패턴

2. 기존 컴포넌트 패턴:
   - components/ui/ 디렉토리 구조
   - 버튼, 카드 스타일링 패턴

3. Supabase 연동 패턴:
   - lib/supabase/ 클라이언트 구조
   - RLS 정책 패턴

각 항목에 대해 파일 경로와 핵심 코드 패턴을 정리해주세요.
```

---

## 1. Sprint 문장화

| Sprint | 기간 | 목표 |
|--------|------|------|
| **Sprint 1** | Week 1-2 | "7단계 입력 → 운동 타입 확인 → 추천 운동 리스트" 기본 플로우 완성 |
| **Sprint 2** | Week 3-4 | Gemini AI 연동, 실제 체형 맞춤 운동 추천 + AI 인사이트 |
| **Sprint 3** | Week 5-6 | 운동 기록, Streak, 크로스 모듈 연동 |
| **Sprint 4** | Week 7-8 | 쇼핑 연동, 성능 최적화, 베타 테스트 |

---

## 2. MVP 우선순위 분류

### Must (없으면 서비스 성립 안 됨)
- 입력 화면 7단계, C-1 연동, 운동 타입 분류, 결과 화면, 운동 DB 100개, 운동 상세, DB 스키마

### Should (있으면 좋음)
- 7가지 지표, AI 인사이트, 연예인 루틴, PC 연동, 주간 플랜, 휴식 타이머, Streak, 기록 저장

### Later (2차 버전)
- 1RM 계산, PR 알림, 동기 사진, 캘린더 UI, 쇼핑 연동, 또래 비교, 통합 리포트

---

## 3. Sprint 1 (Week 1-2): 기본 UI/UX

### 3.1 Week 1 Tasks

---

#### Task 1.0: 운동 모듈 레이아웃

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/layout.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: /workout/* 경로 접근 시
When: 페이지 로드되면
Then: 
  - 상단에 뒤로가기 버튼 + 페이지 제목 표시
  - 콘텐츠 영역 max-width: 480px (모바일 최적화)
  - 하단 여백 80px (하단 네비게이션 공간)
  - 배경색 #FAFAFA 적용
```

**Claude Code 프롬프트:**
```
Task 1.0: 운동 모듈 레이아웃을 구현해주세요.

파일: app/workout/layout.tsx

요구사항:
- 상단 헤더 (뒤로가기 + 제목)
- max-width: 480px, 중앙 정렬
- 하단 여백 80px
- 배경색 #FAFAFA

기존 app/body/layout.tsx 패턴을 참고해주세요.
```

**테스트 코드:**
```typescript
// __tests__/app/workout/layout.test.tsx
import { render, screen } from '@testing-library/react';
import WorkoutLayout from '@/app/workout/layout';

describe('WorkoutLayout', () => {
  it('renders children with correct max-width', () => {
    render(<WorkoutLayout><div>Test</div></WorkoutLayout>);
    const container = screen.getByRole('main');
    expect(container).toHaveClass('max-w-[480px]');
  });

  it('has correct background color', () => {
    render(<WorkoutLayout><div>Test</div></WorkoutLayout>);
    const container = screen.getByRole('main');
    expect(container).toHaveStyle({ backgroundColor: '#FAFAFA' });
  });
});
```

---

#### Task 1.1: 진행 표시 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/common/ProgressIndicator.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: ProgressIndicator에 currentStep=3, totalSteps=7 전달 시
When: 컴포넌트 렌더링되면
Then:
  - "3/7 단계" 텍스트 표시
  - 프로그레스 바 42.8% (3/7) 채워짐
  - 프로그레스 바 width 애니메이션 300ms
  - 브랜드 컬러 #6366F1 적용
```

**Claude Code 프롬프트:**
```
Task 1.1: 진행 표시 컴포넌트를 구현해주세요.

파일: components/workout/common/ProgressIndicator.tsx

Props:
- currentStep: number
- totalSteps: number

요구사항:
- "currentStep/totalSteps 단계" 텍스트
- 프로그레스 바 (백분율 계산)
- 애니메이션 transition 300ms
- 브랜드 컬러 #6366F1

테스트 먼저 작성 후 구현해주세요.
```

**테스트 코드:**
```typescript
// __tests__/components/workout/common/ProgressIndicator.test.tsx
import { render, screen } from '@testing-library/react';
import ProgressIndicator from '@/components/workout/common/ProgressIndicator';

describe('ProgressIndicator', () => {
  it('displays correct step text', () => {
    render(<ProgressIndicator currentStep={3} totalSteps={7} />);
    expect(screen.getByText('3/7 단계')).toBeInTheDocument();
  });

  it('calculates correct progress percentage', () => {
    render(<ProgressIndicator currentStep={3} totalSteps={7} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveStyle({ width: '42.86%' });
  });

  it('applies brand color', () => {
    render(<ProgressIndicator currentStep={1} totalSteps={5} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveClass('bg-indigo-500');
  });
});
```

---

#### Task 1.2: 스텝 네비게이션

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/common/StepNavigation.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: StepNavigation 컴포넌트
When: isFirstStep=true일 때
Then: 이전 버튼 숨김 또는 비활성화

When: isLastStep=true일 때
Then: "다음" 대신 "분석 시작" 버튼 표시 (Primary 스타일)

When: canProceed=false일 때 (필수 입력 미완료)
Then: 다음 버튼 비활성화 (opacity: 0.5, 클릭 불가)

When: 다음 버튼 클릭 시
Then: onNext 콜백 실행
```

**Claude Code 프롬프트:**
```
Task 1.2: 스텝 네비게이션 컴포넌트를 구현해주세요.

먼저 Plan Mode로 기존 Button 컴포넌트 패턴을 확인하고,
테스트를 먼저 작성한 후 구현해주세요.

파일: components/workout/common/StepNavigation.tsx

Props:
- isFirstStep: boolean
- isLastStep: boolean
- canProceed: boolean
- onPrev: () => void
- onNext: () => void

수락 기준:
- 첫 단계: 이전 버튼 숨김
- 마지막 단계: "분석 시작" 버튼
- 진행 불가: 다음 버튼 비활성화
```

**테스트 코드:**
```typescript
// __tests__/components/workout/common/StepNavigation.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import StepNavigation from '@/components/workout/common/StepNavigation';

describe('StepNavigation', () => {
  const defaultProps = {
    isFirstStep: false,
    isLastStep: false,
    canProceed: true,
    onPrev: jest.fn(),
    onNext: jest.fn(),
  };

  it('hides prev button on first step', () => {
    render(<StepNavigation {...defaultProps} isFirstStep={true} />);
    expect(screen.queryByText('이전')).not.toBeInTheDocument();
  });

  it('shows "분석 시작" on last step', () => {
    render(<StepNavigation {...defaultProps} isLastStep={true} />);
    expect(screen.getByText('분석 시작')).toBeInTheDocument();
  });

  it('disables next button when canProceed is false', () => {
    render(<StepNavigation {...defaultProps} canProceed={false} />);
    expect(screen.getByText('다음')).toBeDisabled();
  });

  it('calls onNext when next button clicked', () => {
    render(<StepNavigation {...defaultProps} />);
    fireEvent.click(screen.getByText('다음'));
    expect(defaultProps.onNext).toHaveBeenCalled();
  });
});
```

---

#### Task 1.3: 선택 카드 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/common/SelectionCard.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: SelectionCard mode="single"
When: 카드 A 선택 후 카드 B 탭하면
Then: 카드 A 선택 해제, 카드 B만 선택 상태

Given: SelectionCard mode="multiple", maxSelect=3
When: 이미 3개 선택된 상태에서 4번째 카드 탭하면
Then: 선택 안 됨 + 토스트 "최대 3개까지 선택 가능합니다"

When: 카드 선택 시
Then: 
  - 테두리 색상 변경 (#6366F1)
  - 체크 아이콘 표시 (우측 상단)
  - 배경색 살짝 변경 (#EEF2FF)
```

**Claude Code 프롬프트:**
```
Task 1.3: 선택 카드 컴포넌트를 구현해주세요.

파일: components/workout/common/SelectionCard.tsx

Props:
- mode: 'single' | 'multiple'
- maxSelect?: number (multiple 모드에서)
- selected: boolean
- onSelect: () => void
- icon?: ReactNode
- title: string
- description?: string

요구사항:
- 단일 선택 / 다중 선택 모드
- 최대 선택 개수 제한 (토스트 알림)
- 선택 시 시각적 피드백 (테두리, 배경, 체크 아이콘)

테스트 먼저 작성해주세요.
```

**테스트 코드:**
```typescript
// __tests__/components/workout/common/SelectionCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionCard from '@/components/workout/common/SelectionCard';

describe('SelectionCard', () => {
  it('shows check icon when selected', () => {
    render(
      <SelectionCard
        mode="single"
        selected={true}
        onSelect={jest.fn()}
        title="테스트"
      />
    );
    expect(screen.getByTestId('check-icon')).toBeInTheDocument();
  });

  it('applies selected styles when selected', () => {
    render(
      <SelectionCard
        mode="single"
        selected={true}
        onSelect={jest.fn()}
        title="테스트"
      />
    );
    const card = screen.getByRole('button');
    expect(card).toHaveClass('border-indigo-500', 'bg-indigo-50');
  });

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn();
    render(
      <SelectionCard
        mode="single"
        selected={false}
        onSelect={onSelect}
        title="테스트"
      />
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalled();
  });
});
```

---

#### Task 1.4: Zustand Store 설정

| 항목 | 내용 |
|------|------|
| **파일** | `lib/stores/workoutInputStore.ts` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | 없음 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: 사용자가 Step 3까지 입력 완료 후
When: 브라우저 새로고침하면
Then: Step 1-3 입력 데이터 그대로 유지 (persist)

Given: workoutInputStore
When: resetAll() 호출 시
Then: 모든 필드 초기값으로 리셋

Given: 7단계 모든 입력 데이터
When: getInputData() 호출 시
Then: API 요청에 필요한 형태로 데이터 반환
```

**Claude Code 프롬프트:**
```
Task 1.4: Zustand Store를 설정해주세요.

먼저 기존 Zustand store 패턴을 확인해주세요:
- lib/stores/ 디렉토리의 기존 스토어 구조
- persist 미들웨어 사용 패턴

파일: lib/stores/workoutInputStore.ts

State:
- currentStep: number
- bodyTypeData: { type, proportions } | null  // C-1에서
- goals: string[]                              // Step 2
- concerns: string[]                           // Step 3
- frequency: string                            // Step 4
- location: string                             // Step 5
- equipment: string[]                          // Step 5
- targetWeight?: number                        // Step 6
- targetDate?: string                          // Step 6
- injuries?: string[]                          // Step 7

Actions:
- setStep(step)
- setBodyTypeData(data)
- setGoals(goals)
- ... 각 필드 setter
- resetAll()
- getInputData()

persist로 localStorage 저장해주세요.
```

**테스트 코드:**
```typescript
// __tests__/lib/stores/workoutInputStore.test.ts
import { renderHook, act } from '@testing-library/react';
import { useWorkoutInputStore } from '@/lib/stores/workoutInputStore';

describe('workoutInputStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useWorkoutInputStore());
    act(() => result.current.resetAll());
  });

  it('sets and gets goals', () => {
    const { result } = renderHook(() => useWorkoutInputStore());
    act(() => result.current.setGoals(['체중감량', '근력강화']));
    expect(result.current.goals).toEqual(['체중감량', '근력강화']);
  });

  it('resets all state', () => {
    const { result } = renderHook(() => useWorkoutInputStore());
    act(() => {
      result.current.setGoals(['체중감량']);
      result.current.setFrequency('주3회');
      result.current.resetAll();
    });
    expect(result.current.goals).toEqual([]);
    expect(result.current.frequency).toBe('');
  });

  it('returns formatted input data', () => {
    const { result } = renderHook(() => useWorkoutInputStore());
    act(() => {
      result.current.setGoals(['체중감량']);
      result.current.setFrequency('주3회');
    });
    const data = result.current.getInputData();
    expect(data).toHaveProperty('goals');
    expect(data).toHaveProperty('frequency');
  });
});
```

---

#### Task 1.5: Step 1 - C-1 데이터 확인 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step1/page.tsx` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 1.0, 1.1, 1.2, 1.4 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: C-1 분석 완료 사용자
When: Step 1 진입 시
Then: 
  - 체형 타입 카드 표시 (예: "H형 체형")
  - 주요 특징 3가지 표시
  - "내 체형 정보" 확인 후 다음 단계 진행 가능

Given: C-1 분석 미완료 사용자
When: Step 1 진입 시
Then:
  - "체형 분석이 필요합니다" 안내 표시
  - "체형 분석하기" 버튼 → C-1 모듈로 이동
```

**Claude Code 프롬프트:**
```
Task 1.5: Step 1 C-1 데이터 확인 화면을 구현해주세요.

Think about:
1. C-1 데이터 조회 방법 (API or Supabase direct)
2. 로딩 상태 처리
3. C-1 미완료 시 리다이렉트 UX

먼저 Plan Mode로 확인:
- C-1 분석 결과 조회 API
- body_analyses 테이블 구조

파일: app/workout/onboarding/step1/page.tsx

요구사항:
- C-1 데이터 있으면: 체형 카드 표시
- C-1 데이터 없으면: 분석 필요 안내 + 이동 버튼
- ProgressIndicator(1/7) 표시
- StepNavigation 연결
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step1/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import Step1Page from '@/app/workout/onboarding/step1/page';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

describe('Step1Page', () => {
  it('shows body type card when C-1 data exists', async () => {
    // Setup mock to return C-1 data
    render(<Step1Page />);
    await waitFor(() => {
      expect(screen.getByText(/체형/)).toBeInTheDocument();
    });
  });

  it('shows analysis required message when no C-1 data', async () => {
    // Setup mock to return null
    render(<Step1Page />);
    await waitFor(() => {
      expect(screen.getByText('체형 분석이 필요합니다')).toBeInTheDocument();
    });
  });

  it('shows progress indicator with 1/7', () => {
    render(<Step1Page />);
    expect(screen.getByText('1/7 단계')).toBeInTheDocument();
  });
});
```

---

#### Task 1.6: Step 2 - 목표 선택 화면

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step2/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.3, 1.4 |

**수락 기준:**
```gherkin
Given: Step 2 진입 시
When: 목표 옵션 표시
Then: 
  - 5가지 목표 카드 표시
  - 최대 2개 선택 가능
  - 선택 시 Store에 저장

목표 옵션:
  - 체중 감량
  - 근력 강화  
  - 체력 향상
  - 스트레스 해소
  - 체형 교정
```

**Claude Code 프롬프트:**
```
Task 1.6: Step 2 목표 선택 화면을 구현해주세요.

파일: app/workout/onboarding/step2/page.tsx

요구사항:
- 5가지 목표 옵션 카드
- SelectionCard mode="multiple" maxSelect={2}
- 선택 시 workoutInputStore.setGoals() 호출
- ProgressIndicator(2/7)
- StepNavigation 연결

목표 옵션 데이터:
const GOALS = [
  { id: 'weight_loss', icon: '🔥', title: '체중 감량', desc: '건강하게 살 빼기' },
  { id: 'strength', icon: '💪', title: '근력 강화', desc: '근육량 늘리기' },
  { id: 'endurance', icon: '🏃', title: '체력 향상', desc: '지구력 키우기' },
  { id: 'stress', icon: '😌', title: '스트레스 해소', desc: '마음 건강 챙기기' },
  { id: 'posture', icon: '🧘', title: '체형 교정', desc: '바른 자세 만들기' },
];
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step2/page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Step2Page from '@/app/workout/onboarding/step2/page';

describe('Step2Page', () => {
  it('renders all 5 goal options', () => {
    render(<Step2Page />);
    expect(screen.getByText('체중 감량')).toBeInTheDocument();
    expect(screen.getByText('근력 강화')).toBeInTheDocument();
    expect(screen.getByText('체력 향상')).toBeInTheDocument();
    expect(screen.getByText('스트레스 해소')).toBeInTheDocument();
    expect(screen.getByText('체형 교정')).toBeInTheDocument();
  });

  it('allows maximum 2 selections', () => {
    render(<Step2Page />);
    fireEvent.click(screen.getByText('체중 감량'));
    fireEvent.click(screen.getByText('근력 강화'));
    fireEvent.click(screen.getByText('체력 향상'));
    // Third selection should show toast
    expect(screen.getByText(/최대 2개/)).toBeInTheDocument();
  });
});
```

---

#### Task 1.7: Step 3 - 신체 고민 선택

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step3/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.3, 1.4 |

**수락 기준:**
```gherkin
Given: Step 3 진입 시
When: 신체 고민 옵션 표시
Then:
  - 8가지 신체 고민 카드 표시
  - 최대 3개 선택 가능
  - C-1 체형 기반 추천 고민 하이라이트 (선택사항)

신체 고민 옵션:
  - 뱃살 / 허벅지 / 팔뚝
  - 등살 / 엉덩이 / 종아리
  - 어깨 / 전체적으로
```

**Claude Code 프롬프트:**
```
Task 1.7: Step 3 신체 고민 선택 화면을 구현해주세요.

파일: app/workout/onboarding/step3/page.tsx

요구사항:
- 8가지 신체 고민 옵션
- SelectionCard mode="multiple" maxSelect={3}
- 선택 시 workoutInputStore.setConcerns() 호출
- (선택) C-1 체형 기반 추천 고민 표시

데이터:
const CONCERNS = [
  { id: 'belly', icon: '🫃', title: '뱃살' },
  { id: 'thigh', icon: '🦵', title: '허벅지' },
  { id: 'arm', icon: '💪', title: '팔뚝' },
  { id: 'back', icon: '🔙', title: '등살' },
  { id: 'hip', icon: '🍑', title: '엉덩이' },
  { id: 'calf', icon: '🦶', title: '종아리' },
  { id: 'shoulder', icon: '🤷', title: '어깨' },
  { id: 'overall', icon: '🧍', title: '전체적으로' },
];
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step3/page.test.tsx
import { render, screen } from '@testing-library/react';
import Step3Page from '@/app/workout/onboarding/step3/page';

describe('Step3Page', () => {
  it('renders all 8 concern options', () => {
    render(<Step3Page />);
    expect(screen.getByText('뱃살')).toBeInTheDocument();
    expect(screen.getByText('허벅지')).toBeInTheDocument();
    expect(screen.getByText('전체적으로')).toBeInTheDocument();
  });

  it('shows progress indicator 3/7', () => {
    render(<Step3Page />);
    expect(screen.getByText('3/7 단계')).toBeInTheDocument();
  });
});
```

---

#### Task 1.8: Step 4 - 운동 빈도 선택

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step4/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.3, 1.4 |

**수락 기준:**
```gherkin
Given: Step 4 진입 시
When: 운동 빈도 옵션 표시
Then:
  - 4가지 빈도 카드 표시 (단일 선택)
  - 선택 시 Store에 저장
  - 각 옵션에 설명 포함

빈도 옵션:
  - 주 1-2회 (가볍게 시작)
  - 주 3-4회 (꾸준히)
  - 주 5-6회 (열심히)
  - 매일 (챌린지)
```

**Claude Code 프롬프트:**
```
Task 1.8: Step 4 운동 빈도 선택 화면을 구현해주세요.

파일: app/workout/onboarding/step4/page.tsx

요구사항:
- 4가지 빈도 옵션
- SelectionCard mode="single"
- 선택 시 workoutInputStore.setFrequency() 호출

데이터:
const FREQUENCIES = [
  { id: '1-2', title: '주 1-2회', desc: '가볍게 시작하기', icon: '🌱' },
  { id: '3-4', title: '주 3-4회', desc: '꾸준히 운동하기', icon: '🌿' },
  { id: '5-6', title: '주 5-6회', desc: '열심히 운동하기', icon: '🌳' },
  { id: 'daily', title: '매일', desc: '운동 챌린지!', icon: '🔥' },
];
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step4/page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Step4Page from '@/app/workout/onboarding/step4/page';

describe('Step4Page', () => {
  it('allows only single selection', () => {
    render(<Step4Page />);
    fireEvent.click(screen.getByText('주 1-2회'));
    fireEvent.click(screen.getByText('주 3-4회'));
    
    // Only second should be selected
    const cards = screen.getAllByRole('button');
    const selectedCards = cards.filter(card => 
      card.classList.contains('border-indigo-500')
    );
    expect(selectedCards).toHaveLength(1);
  });
});
```

---

#### Task 1.9: Step 5 - 운동 장소 + 기구 선택

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step5/page.tsx` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 1.3, 1.4 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: Step 5 진입 시
When: 장소 선택
Then:
  - 3가지 장소 옵션 (단일 선택)
  - 선택한 장소에 따라 기구 옵션 변경

Given: 장소 = "집"
When: 기구 옵션 표시
Then: 맨몸, 덤벨, 요가매트, 밴드 등

Given: 장소 = "헬스장"
When: 기구 옵션 표시
Then: 모든 기구 + 머신류 표시

Given: 장소 = "야외"
When: 기구 옵션 표시
Then: 맨몸, 철봉, 러닝 등
```

**Claude Code 프롬프트:**
```
Task 1.9: Step 5 운동 장소 + 기구 선택 화면을 구현해주세요.

Think about:
- 장소 선택 → 기구 옵션 동적 변경 로직
- 두 단계 선택 UI (장소 먼저 → 기구)

파일: app/workout/onboarding/step5/page.tsx

요구사항:
1. 장소 선택 (단일)
   - 집: 🏠
   - 헬스장: 🏋️
   - 야외: 🌳

2. 기구 선택 (다중, 장소별 필터링)
   - 집: ['맨몸', '덤벨', '요가매트', '밴드', '케틀벨']
   - 헬스장: ['맨몸', '덤벨', '바벨', '케이블머신', '런닝머신', '기타머신']
   - 야외: ['맨몸', '철봉', '평행봉', '계단']

Store 저장:
- workoutInputStore.setLocation(location)
- workoutInputStore.setEquipment(equipment[])
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step5/page.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Step5Page from '@/app/workout/onboarding/step5/page';

describe('Step5Page', () => {
  it('shows home equipment when home selected', async () => {
    render(<Step5Page />);
    fireEvent.click(screen.getByText('집'));
    
    await waitFor(() => {
      expect(screen.getByText('덤벨')).toBeInTheDocument();
      expect(screen.getByText('요가매트')).toBeInTheDocument();
    });
  });

  it('shows gym equipment when gym selected', async () => {
    render(<Step5Page />);
    fireEvent.click(screen.getByText('헬스장'));
    
    await waitFor(() => {
      expect(screen.getByText('바벨')).toBeInTheDocument();
      expect(screen.getByText('케이블머신')).toBeInTheDocument();
    });
  });
});
```

---

#### Task 1.10: Step 6 - 목표 설정 (선택)

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step6/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Should |
| **의존성** | Task 1.4 |

**수락 기준:**
```gherkin
Given: Step 6 진입 시 (선택 단계)
When: 목표 체중/기간 입력 옵션 표시
Then:
  - "건너뛰기" 옵션 표시
  - 목표 체중 입력 (숫자)
  - 목표 기간 선택 (1개월/3개월/6개월)

When: 건너뛰기 클릭 시
Then: 저장 없이 다음 단계로 이동
```

**Claude Code 프롬프트:**
```
Task 1.10: Step 6 목표 설정 화면을 구현해주세요.

파일: app/workout/onboarding/step6/page.tsx

요구사항:
- 선택 입력 단계 (건너뛰기 가능)
- 목표 체중 숫자 입력 (kg)
- 목표 기간 선택 (1개월/3개월/6개월)
- 입력 시 workoutInputStore 저장
- 건너뛰기 버튼 → 다음 단계

UI 힌트:
- 입력 필드 위에 "선택 사항" 뱃지
- 현재 체중 참고 표시 (C-1 데이터에서)
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step6/page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Step6Page from '@/app/workout/onboarding/step6/page';

describe('Step6Page', () => {
  it('shows skip button', () => {
    render(<Step6Page />);
    expect(screen.getByText('건너뛰기')).toBeInTheDocument();
  });

  it('navigates to next step on skip', () => {
    const mockRouter = { push: jest.fn() };
    render(<Step6Page />);
    fireEvent.click(screen.getByText('건너뛰기'));
    // Verify navigation
  });
});
```

---

#### Task 1.11: Step 7 - 부상/통증 확인 (선택)

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/onboarding/step7/page.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Should |
| **의존성** | Task 1.3, 1.4 |

**수락 기준:**
```gherkin
Given: Step 7 진입 시 (선택 단계)
When: 부상/통증 부위 옵션 표시
Then:
  - "없음" 옵션 포함
  - 여러 부위 선택 가능
  - 건너뛰기 가능

부위 옵션:
  - 없음 / 목 / 어깨
  - 허리 / 무릎 / 발목
  - 손목 / 기타
```

**Claude Code 프롬프트:**
```
Task 1.11: Step 7 부상/통증 확인 화면을 구현해주세요.

파일: app/workout/onboarding/step7/page.tsx

요구사항:
- 선택 입력 단계
- 부위 다중 선택 가능
- "없음" 선택 시 다른 선택 해제
- 선택 시 workoutInputStore.setInjuries() 호출
- "분석 시작" 버튼 (마지막 단계)

데이터:
const INJURIES = [
  { id: 'none', title: '없음', icon: '✅' },
  { id: 'neck', title: '목', icon: '🦒' },
  { id: 'shoulder', title: '어깨', icon: '💪' },
  { id: 'back', title: '허리', icon: '🔙' },
  { id: 'knee', title: '무릎', icon: '🦵' },
  { id: 'ankle', title: '발목', icon: '🦶' },
  { id: 'wrist', title: '손목', icon: '✋' },
  { id: 'other', title: '기타', icon: '❓' },
];
```

**테스트 코드:**
```typescript
// __tests__/app/workout/onboarding/step7/page.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Step7Page from '@/app/workout/onboarding/step7/page';

describe('Step7Page', () => {
  it('clears other selections when "없음" selected', () => {
    render(<Step7Page />);
    fireEvent.click(screen.getByText('목'));
    fireEvent.click(screen.getByText('어깨'));
    fireEvent.click(screen.getByText('없음'));
    
    // Only "없음" should be selected
    // Verify other cards are deselected
  });

  it('shows "분석 시작" button as last step', () => {
    render(<Step7Page />);
    expect(screen.getByText('분석 시작')).toBeInTheDocument();
  });
});
```

---

#### Task 1.12: 입력 Validation 로직

| 항목 | 내용 |
|------|------|
| **파일** | `lib/utils/workoutValidation.ts` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.4 |

**수락 기준:**
```gherkin
Given: 각 Step의 입력 데이터
When: validateStep(step, data) 호출 시
Then:
  - Step 1: C-1 데이터 존재 여부
  - Step 2: 최소 1개 목표 선택
  - Step 3: 최소 1개 고민 선택
  - Step 4: 빈도 선택 필수
  - Step 5: 장소 + 최소 1개 기구 선택
  - Step 6-7: 선택 사항 (항상 true)

When: 전체 데이터 검증
Then: validateAllSteps(data) → { isValid, errors[] }
```

**Claude Code 프롬프트:**
```
Task 1.12: 입력 Validation 로직을 구현해주세요.

파일: lib/utils/workoutValidation.ts

함수:
1. validateStep(step: number, data: WorkoutInputData): boolean
2. validateAllSteps(data: WorkoutInputData): { isValid: boolean, errors: string[] }
3. getStepRequirements(step: number): string[]

각 Step별 필수 조건:
- Step 1: bodyTypeData !== null
- Step 2: goals.length >= 1
- Step 3: concerns.length >= 1
- Step 4: frequency !== ''
- Step 5: location !== '' && equipment.length >= 1
- Step 6-7: true (선택)

테스트 먼저 작성해주세요.
```

**테스트 코드:**
```typescript
// __tests__/lib/utils/workoutValidation.test.ts
import { validateStep, validateAllSteps } from '@/lib/utils/workoutValidation';

describe('workoutValidation', () => {
  describe('validateStep', () => {
    it('returns false for step 1 without body data', () => {
      expect(validateStep(1, { bodyTypeData: null })).toBe(false);
    });

    it('returns true for step 1 with body data', () => {
      expect(validateStep(1, { bodyTypeData: { type: 'H' } })).toBe(true);
    });

    it('requires at least 1 goal for step 2', () => {
      expect(validateStep(2, { goals: [] })).toBe(false);
      expect(validateStep(2, { goals: ['weight_loss'] })).toBe(true);
    });

    it('always returns true for optional steps 6-7', () => {
      expect(validateStep(6, {})).toBe(true);
      expect(validateStep(7, {})).toBe(true);
    });
  });

  describe('validateAllSteps', () => {
    it('returns errors for invalid data', () => {
      const result = validateAllSteps({
        bodyTypeData: null,
        goals: [],
        concerns: ['belly'],
        frequency: '3-4',
        location: 'home',
        equipment: ['bodyweight'],
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('체형 분석이 필요합니다');
      expect(result.errors).toContain('목표를 선택해주세요');
    });
  });
});
```

---

#### Task 1.13: 운동 데이터 타입 정의

| 항목 | 내용 |
|------|------|
| **파일** | `types/workout.ts` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | 없음 |

**수락 기준:**
```gherkin
Given: types/workout.ts 파일
When: 타입 정의 완료
Then:
  - Exercise 타입 (운동 정보)
  - WorkoutPlan 타입 (주간 계획)
  - WorkoutSession 타입 (운동 기록)
  - WorkoutInputData 타입 (입력 데이터)
  - WorkoutAnalysis 타입 (분석 결과)
```

**Claude Code 프롬프트:**
```
Task 1.13: 운동 관련 TypeScript 타입을 정의해주세요.

파일: types/workout.ts

타입 정의:
1. Exercise - 개별 운동 정보
2. WorkoutPlan - 주간 운동 계획
3. WorkoutSession - 운동 세션 기록
4. WorkoutInputData - 온보딩 입력 데이터
5. WorkoutAnalysis - AI 분석 결과
6. WorkoutStreak - 연속 운동 기록

DB 스키마와 일치하도록 작성해주세요.
기존 types/ 폴더의 패턴을 참고해주세요.
```

**테스트 코드:**
```typescript
// 타입 정의는 컴파일 타임 체크이므로 별도 런타임 테스트 불필요
// TypeScript strict mode에서 타입 체크로 검증

// types/workout.ts 예상 구조
export interface Exercise {
  id: string;
  name: string;
  category: 'upper' | 'lower' | 'core' | 'cardio';
  bodyParts: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface WorkoutInputData {
  bodyTypeData: BodyTypeData | null;
  goals: string[];
  concerns: string[];
  frequency: string;
  location: string;
  equipment: string[];
  targetWeight?: number;
  targetDate?: string;
  injuries?: string[];
}
```

---

#### Task 1.14: 운동 DB JSON - 상체 (50개)

| 항목 | 내용 |
|------|------|
| **파일** | `data/exercises/upper-body.json` |
| **예상 시간** | 4h |
| **복잡도** | 🟢 낮음 (반복 작업) |
| **Claude Mode** | Auto-accept 권장 |
| **우선순위** | Must |
| **의존성** | Task 1.13 |

**수락 기준:**
```gherkin
Given: upper-body.json 파일
When: 데이터 검증
Then:
  - 총 50개 운동
  - 카테고리 분포: 가슴 12개, 어깨 12개, 등 12개, 팔 14개
  - 모든 필드 채움 (id, name, category, bodyParts, equipment, difficulty, instructions, tips)
  - 한국어 운동명 + 설명
```

**Claude Code 프롬프트:**
```
Task 1.14: 상체 운동 DB JSON을 생성해주세요.

파일: data/exercises/upper-body.json
타입: types/workout.ts의 Exercise[] 형식

요구사항:
- 총 50개 운동
- 카테고리: chest(12), shoulder(12), back(12), arm(14)
- 각 운동에 정확한 한국어 이름
- instructions: 3-5단계 동작 설명
- tips: 호흡법 + 주의사항 포함
- difficulty: 균형있게 분포

실제 헬스/피트니스에서 사용하는 운동명 사용.
플랜핏, 짐워크 앱 운동 목록 참고.
```

**검증 스크립트:**
```bash
# 개수 확인
jq '. | length' data/exercises/upper-body.json
# 50 이어야 함

# 카테고리별 개수
jq 'group_by(.category) | map({category: .[0].category, count: length})' data/exercises/upper-body.json

# 필수 필드 확인
jq 'map(select(.instructions == null or .tips == null)) | length' data/exercises/upper-body.json
# 0 이어야 함
```

---

#### Task 1.15: 운동 DB JSON - 하체/코어/유산소 (50개)

| 항목 | 내용 |
|------|------|
| **파일** | `data/exercises/lower-core-cardio.json` |
| **예상 시간** | 4h |
| **복잡도** | 🟢 낮음 (반복 작업) |
| **Claude Mode** | Auto-accept 권장 |
| **우선순위** | Must |
| **의존성** | Task 1.13 |

**수락 기준:**
```gherkin
Given: lower-core-cardio.json 파일
When: 데이터 검증
Then:
  - 총 50개 운동
  - 카테고리 분포: 하체 20개, 코어 15개, 유산소 15개
  - Task 1.14와 동일한 형식
  - 전체 100개 운동 완성
```

**Claude Code 프롬프트:**
```
Task 1.15: 하체/코어/유산소 운동 DB JSON을 생성해주세요.

파일: data/exercises/lower-core-cardio.json
타입: types/workout.ts의 Exercise[] 형식

요구사항:
- 총 50개 운동 (전체 100개 중 나머지)
- 카테고리: lower(20), core(15), cardio(15)
- Task 1.14와 동일한 형식
- 홈트 + 헬스장 운동 균형있게 포함

하체: 스쿼트 변형, 런지 변형, 레그프레스 등
코어: 플랭크 변형, 크런치 변형, 레그레이즈 등
유산소: 버피, 점핑잭, 마운틴클라이머, 러닝 등
```

**검증 스크립트:**
```bash
# 전체 100개 확인
cat data/exercises/upper-body.json data/exercises/lower-core-cardio.json | jq -s 'add | length'
# 100 이어야 함
```

---

### 📊 Week 1 Task 요약

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 1.0 | 운동 모듈 레이아웃 | 🟢 | 바로 구현 | 0.5d |
| 1.1 | 진행 표시 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 1.2 | 스텝 네비게이션 | 🟡 | Plan → Implement | 0.5d |
| 1.3 | 선택 카드 컴포넌트 | 🟡 | Plan → Implement | 0.5d |
| 1.4 | Zustand Store | 🟡 | Plan → Implement | 1d |
| 1.5 | Step 1 - C-1 확인 | 🟡 | Plan → Implement | 1d |
| 1.6 | Step 2 - 목표 선택 | 🟢 | 바로 구현 | 0.5d |
| 1.7 | Step 3 - 신체 고민 | 🟢 | 바로 구현 | 0.5d |
| 1.8 | Step 4 - 운동 빈도 | 🟢 | 바로 구현 | 0.5d |
| 1.9 | Step 5 - 장소/기구 | 🟡 | Plan → Implement | 1d |
| 1.10 | Step 6 - 목표 설정 | 🟢 | 바로 구현 | 0.5d |
| 1.11 | Step 7 - 부상/통증 | 🟢 | 바로 구현 | 0.5d |
| 1.12 | Validation 로직 | 🟢 | 바로 구현 | 0.5d |
| 1.13 | 타입 정의 | 🟢 | 바로 구현 | 0.5d |
| 1.14 | 운동 DB - 상체 | 🟢 | Auto-accept | 4h |
| 1.15 | 운동 DB - 하체 | 🟢 | Auto-accept | 4h |

**Week 1 총 예상 시간**: 9d (버퍼 포함 10d)

---

*계속: Week 2 Tasks는 다음 섹션에서...*
## 3.2 Week 2 Tasks

---

#### Task 2.1: 운동 타입 분류 로직 (Mock)

| 항목 | 내용 |
|------|------|
| **파일** | `lib/workout/classifyWorkoutType.ts` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 1.4, 1.13 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: 사용자 입력 데이터 (목표, 고민, 빈도, 기구)
When: classifyWorkoutType(inputData) 호출 시
Then:
  - 3가지 운동 타입 중 1개 반환
  - 타입: "strength" | "cardio" | "balance"
  - 분류 이유 설명 포함

Given: 목표 = "체중감량" + 빈도 = "주5회"
Then: "cardio" 타입 반환

Given: 목표 = "근력강화" + 기구 = "바벨, 덤벨"
Then: "strength" 타입 반환
```

**Claude Code 프롬프트:**
```
Task 2.1: 운동 타입 분류 로직을 구현해주세요.

Think about:
- 목표, 고민, 빈도, 기구 조합에 따른 분류 규칙
- 추후 AI로 대체될 수 있도록 인터페이스 설계

파일: lib/workout/classifyWorkoutType.ts

입력: WorkoutInputData
출력: { type: 'strength' | 'cardio' | 'balance', reason: string }

분류 규칙 (Mock):
- 체중감량 + 고빈도 → cardio
- 근력강화 + 웨이트 기구 → strength
- 체형교정 or 스트레스해소 → balance
- 복합 목표 → 가중치 계산

테스트 먼저 작성해주세요.
```

**테스트 코드:**
```typescript
// __tests__/lib/workout/classifyWorkoutType.test.ts
import { classifyWorkoutType } from '@/lib/workout/classifyWorkoutType';

describe('classifyWorkoutType', () => {
  it('returns cardio for weight loss with high frequency', () => {
    const result = classifyWorkoutType({
      goals: ['weight_loss'],
      frequency: '5-6',
      equipment: ['bodyweight'],
    });
    expect(result.type).toBe('cardio');
  });

  it('returns strength for muscle building with weights', () => {
    const result = classifyWorkoutType({
      goals: ['strength'],
      frequency: '3-4',
      equipment: ['barbell', 'dumbbell'],
    });
    expect(result.type).toBe('strength');
  });

  it('returns balance for posture correction', () => {
    const result = classifyWorkoutType({
      goals: ['posture'],
      frequency: '3-4',
      equipment: ['yoga_mat'],
    });
    expect(result.type).toBe('balance');
  });

  it('includes reason in result', () => {
    const result = classifyWorkoutType({
      goals: ['weight_loss'],
      frequency: '5-6',
      equipment: ['bodyweight'],
    });
    expect(result.reason).toBeTruthy();
    expect(typeof result.reason).toBe('string');
  });
});
```

---

#### Task 2.2: 운동 타입 카드 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/result/WorkoutTypeCard.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 2.1 |

**수락 기준:**
```gherkin
Given: WorkoutTypeCard에 type="strength" 전달
When: 렌더링 시
Then:
  - "근력 강화" 타이틀 표시
  - 💪 아이콘 표시
  - 설명 텍스트 표시
  - 브랜드 컬러 강조

Given: 각 타입별 디자인
Then:
  - strength: 파란색 계열
  - cardio: 빨간색 계열
  - balance: 초록색 계열
```

**Claude Code 프롬프트:**
```
Task 2.2: 운동 타입 카드 컴포넌트를 구현해주세요.

파일: components/workout/result/WorkoutTypeCard.tsx

Props:
- type: 'strength' | 'cardio' | 'balance'
- reason: string

타입별 디자인:
- strength: { icon: '💪', title: '근력 강화', color: 'blue', desc: '근육량 증가에 집중' }
- cardio: { icon: '🔥', title: '유산소 중심', color: 'red', desc: '체지방 감소에 집중' }
- balance: { icon: '🧘', title: '균형 운동', color: 'green', desc: '유연성과 균형에 집중' }

요구사항:
- 카드 형태 UI
- 타입별 색상 적용
- reason 텍스트 표시
```

**테스트 코드:**
```typescript
// __tests__/components/workout/result/WorkoutTypeCard.test.tsx
import { render, screen } from '@testing-library/react';
import WorkoutTypeCard from '@/components/workout/result/WorkoutTypeCard';

describe('WorkoutTypeCard', () => {
  it('displays correct title for strength type', () => {
    render(<WorkoutTypeCard type="strength" reason="테스트" />);
    expect(screen.getByText('근력 강화')).toBeInTheDocument();
  });

  it('displays reason text', () => {
    render(<WorkoutTypeCard type="cardio" reason="체중 감량 목표" />);
    expect(screen.getByText('체중 감량 목표')).toBeInTheDocument();
  });

  it('applies correct color class for each type', () => {
    const { rerender } = render(<WorkoutTypeCard type="strength" reason="" />);
    expect(screen.getByTestId('type-card')).toHaveClass('bg-blue-50');
    
    rerender(<WorkoutTypeCard type="cardio" reason="" />);
    expect(screen.getByTestId('type-card')).toHaveClass('bg-red-50');
  });
});
```

---

#### Task 2.3: 결과 화면 페이지

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/result/page.tsx` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 2.1, 2.2 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: 온보딩 7단계 완료 후
When: 결과 화면 진입
Then:
  - 로딩 → 분석 중 애니메이션
  - 운동 타입 카드 표시
  - 추천 운동 리스트 표시
  - "주간 플랜 보기" / "운동 시작" 버튼

Given: 결과 화면에서 뒤로가기
When: 브라우저 백 버튼 클릭
Then: 온보딩 데이터 유지 or 확인 모달
```

**Claude Code 프롬프트:**
```
Task 2.3: 운동 추천 결과 화면을 구현해주세요.

Think about:
- 로딩 상태 UX (분석 중 메시지)
- 결과 데이터 구조
- 뒤로가기 시 데이터 처리

파일: app/workout/result/page.tsx

구조:
1. 로딩 상태 (2-3초)
   - "AI가 당신에게 맞는 운동을 분석 중..."
   - 프로그레스 애니메이션

2. 결과 표시
   - WorkoutTypeCard (운동 타입)
   - 추천 운동 리스트 (10개)
   - 체형 기반 인사이트

3. 액션 버튼
   - "주간 플랜 보기"
   - "바로 운동 시작"
```

**테스트 코드:**
```typescript
// __tests__/app/workout/result/page.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import ResultPage from '@/app/workout/result/page';

describe('ResultPage', () => {
  it('shows loading state initially', () => {
    render(<ResultPage />);
    expect(screen.getByText(/분석 중/)).toBeInTheDocument();
  });

  it('shows workout type card after loading', async () => {
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByTestId('workout-type-card')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('shows action buttons', async () => {
    render(<ResultPage />);
    await waitFor(() => {
      expect(screen.getByText('주간 플랜 보기')).toBeInTheDocument();
      expect(screen.getByText('바로 운동 시작')).toBeInTheDocument();
    });
  });
});
```

---

#### Task 2.4: 추천 운동 리스트 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/result/RecommendedExerciseList.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.13, 1.14, 1.15 |

**수락 기준:**
```gherkin
Given: 추천 운동 배열 (10개)
When: 리스트 렌더링 시
Then:
  - 운동 카드 10개 표시
  - 무한 스크롤 또는 "더보기" 버튼
  - 카테고리별 필터 탭

Given: 운동 카드 클릭
When: 탭 시
Then: 운동 상세 페이지로 이동
```

**Claude Code 프롬프트:**
```
Task 2.4: 추천 운동 리스트 컴포넌트를 구현해주세요.

파일: components/workout/result/RecommendedExerciseList.tsx

Props:
- exercises: Exercise[]
- onExerciseClick: (exerciseId: string) => void

요구사항:
- 카테고리 필터 탭 (전체/상체/하체/코어/유산소)
- ExerciseCard 반복 렌더링
- 더보기 버튼 (처음 6개 → 전체)
```

**테스트 코드:**
```typescript
// __tests__/components/workout/result/RecommendedExerciseList.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import RecommendedExerciseList from '@/components/workout/result/RecommendedExerciseList';

const mockExercises = [
  { id: '1', name: '푸쉬업', category: 'upper' },
  { id: '2', name: '스쿼트', category: 'lower' },
  // ... more
];

describe('RecommendedExerciseList', () => {
  it('renders exercise cards', () => {
    render(<RecommendedExerciseList exercises={mockExercises} onExerciseClick={jest.fn()} />);
    expect(screen.getByText('푸쉬업')).toBeInTheDocument();
  });

  it('filters by category', () => {
    render(<RecommendedExerciseList exercises={mockExercises} onExerciseClick={jest.fn()} />);
    fireEvent.click(screen.getByText('상체'));
    expect(screen.getByText('푸쉬업')).toBeInTheDocument();
    expect(screen.queryByText('스쿼트')).not.toBeInTheDocument();
  });
});
```

---

#### Task 2.5: 운동 카드 컴포넌트

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/common/ExerciseCard.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.13 |

**수락 기준:**
```gherkin
Given: Exercise 데이터
When: ExerciseCard 렌더링 시
Then:
  - 운동 이름 표시
  - 썸네일 이미지 (placeholder)
  - 난이도 뱃지
  - 타겟 부위 태그
  - 카드 클릭 가능
```

**Claude Code 프롬프트:**
```
Task 2.5: 운동 카드 컴포넌트를 구현해주세요.

파일: components/workout/common/ExerciseCard.tsx

Props:
- exercise: Exercise
- onClick?: () => void
- variant?: 'default' | 'compact'

요구사항:
- 썸네일 (placeholder 이미지 사용)
- 운동명, 난이도, 타겟 부위
- hover 효과
- compact 모드 (리스트용)
```

**테스트 코드:**
```typescript
// __tests__/components/workout/common/ExerciseCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import ExerciseCard from '@/components/workout/common/ExerciseCard';

const mockExercise = {
  id: '1',
  name: '푸쉬업',
  category: 'upper',
  bodyParts: ['chest', 'triceps'],
  difficulty: 'beginner',
  equipment: ['bodyweight'],
  instructions: [],
  tips: [],
};

describe('ExerciseCard', () => {
  it('displays exercise name', () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText('푸쉬업')).toBeInTheDocument();
  });

  it('displays difficulty badge', () => {
    render(<ExerciseCard exercise={mockExercise} />);
    expect(screen.getByText('초급')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<ExerciseCard exercise={mockExercise} onClick={onClick} />);
    fireEvent.click(screen.getByRole('article'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

---

#### Task 2.6: 운동 상세 화면 페이지

| 항목 | 내용 |
|------|------|
| **파일** | `app/workout/exercise/[id]/page.tsx` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 1.14, 1.15, 2.5 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: 운동 ID로 상세 페이지 접근
When: 페이지 로드 시
Then:
  - 운동 이름 + 썸네일
  - 자세 가이드 (instructions)
  - 호흡법 팁
  - 세트/횟수/무게 추천
  - 유튜브 참고 영상 (선택)
  - 대체 운동 추천
```

**Claude Code 프롬프트:**
```
Task 2.6: 운동 상세 화면 페이지를 구현해주세요.

파일: app/workout/exercise/[id]/page.tsx

섹션 구성:
1. 헤더: 운동명 + 뒤로가기
2. 썸네일/영상 영역
3. 자세 가이드 (단계별)
4. 호흡법 + 팁
5. 세트/횟수 추천
6. 대체 운동

요구사항:
- Dynamic Route [id]
- exercises JSON에서 데이터 조회
- 없는 ID → 404 페이지
```

**테스트 코드:**
```typescript
// __tests__/app/workout/exercise/[id]/page.test.tsx
import { render, screen } from '@testing-library/react';
import ExerciseDetailPage from '@/app/workout/exercise/[id]/page';

describe('ExerciseDetailPage', () => {
  it('renders exercise details', () => {
    render(<ExerciseDetailPage params={{ id: 'pushup-1' }} />);
    expect(screen.getByText('푸쉬업')).toBeInTheDocument();
  });

  it('shows instructions steps', () => {
    render(<ExerciseDetailPage params={{ id: 'pushup-1' }} />);
    expect(screen.getByText(/자세 가이드/)).toBeInTheDocument();
  });

  it('shows 404 for invalid id', () => {
    render(<ExerciseDetailPage params={{ id: 'invalid-id' }} />);
    expect(screen.getByText(/찾을 수 없습니다/)).toBeInTheDocument();
  });
});
```

---

#### Task 2.7: 자세 가이드 섹션

| 항목 | 내용 |
|------|------|
| **파일** | `components/workout/detail/PostureGuide.tsx` |
| **예상 시간** | 0.5d |
| **복잡도** | 🟢 낮음 |
| **Claude Mode** | 바로 구현 |
| **우선순위** | Must |
| **의존성** | Task 1.13 |

**수락 기준:**
```gherkin
Given: instructions 배열 (3-5단계)
When: 렌더링 시
Then:
  - 단계별 번호 표시
  - 각 단계 설명 텍스트
  - 아코디언 또는 전체 펼침
```

**Claude Code 프롬프트:**
```
Task 2.7: 자세 가이드 섹션 컴포넌트를 구현해주세요.

파일: components/workout/detail/PostureGuide.tsx

Props:
- instructions: string[]
- tips?: string[]

요구사항:
- 단계별 번호 (1, 2, 3...)
- 각 단계 설명
- tips 섹션 (호흡법 등)
- 깔끔한 카드 UI
```

**테스트 코드:**
```typescript
import { render, screen } from '@testing-library/react';
import PostureGuide from '@/components/workout/detail/PostureGuide';

describe('PostureGuide', () => {
  it('renders all instruction steps', () => {
    render(<PostureGuide instructions={['준비 자세', '동작', '복귀']} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('준비 자세')).toBeInTheDocument();
  });

  it('renders tips when provided', () => {
    render(<PostureGuide instructions={['동작']} tips={['호흡을 멈추지 마세요']} />);
    expect(screen.getByText(/호흡/)).toBeInTheDocument();
  });
});
```

---

#### Task 2.8 ~ 2.16: (축약)

| Task | 이름 | 복잡도 | 시간 |
|------|------|--------|------|
| 2.8 | 세트/횟수/무게 표시 | 🟢 | 0.5d |
| 2.9 | 유튜브 영상 컴포넌트 | 🟢 | 0.5d |
| 2.10 | 대체 운동 표시 | 🟢 | 0.5d |
| 2.11 | workout_analyses 테이블 | 🟢 | 0.5d |
| 2.12 | workout_plans 테이블 | 🟢 | 0.5d |
| 2.13 | workout_logs 테이블 | 🟢 | 0.5d |
| 2.14 | workout_streaks 테이블 | 🟢 | 0.5d |
| 2.15 | Supabase API 연동 | 🟡 | 1d |
| 2.16 | Sprint 1 통합 테스트 | 🟡 | 1d |

**Task 2.11-2.14 (DB 테이블) Claude Code 프롬프트:**
```
Task 2.11-2.14: DB 테이블들을 생성해주세요.

파일: supabase/migrations/004_workout_tables.sql

테이블:
1. workout_analyses - 분석 결과 저장
2. workout_plans - 주간 계획
3. workout_logs - 운동 기록
4. workout_streaks - 연속 기록

요구사항:
- user_id FK → users.id
- RLS 정책 (본인 데이터만)
- 기존 DB 패턴 참고

기존 마이그레이션 파일을 먼저 확인해주세요.
```

---

## 4. Sprint 2 (Week 3-4): AI 연동

### 4.1 Week 3 Tasks

---

#### Task 3.1: Gemini API 연동 설정

| 항목 | 내용 |
|------|------|
| **파일** | `lib/gemini/client.ts`, `lib/gemini/workout.ts` |
| **예상 시간** | 1d |
| **복잡도** | 🟡 중간 |
| **Claude Mode** | Plan → Implement |
| **우선순위** | Must |
| **의존성** | 없음 |
| **예상 반복** | 2회 |

**수락 기준:**
```gherkin
Given: Gemini API 키 설정됨
When: generateWorkoutRecommendation(input) 호출 시
Then:
  - Gemini API 호출
  - 3초 타임아웃 적용
  - 에러 시 Fallback 동작
  - 응답 파싱 및 타입 검증
```

**Claude Code 프롬프트:**
```
Task 3.1: Gemini API 연동을 설정해주세요.

Think hard about:
1. 기존 S-1 피부 분석 Gemini 연동 패턴
2. 에러 핸들링 및 재시도 로직
3. 응답 타입 검증

먼저 기존 lib/gemini/ 구조를 확인해주세요.

파일:
- lib/gemini/client.ts (공통 클라이언트)
- lib/gemini/workout.ts (운동 관련 함수)

요구사항:
- 환경변수에서 API 키 로드
- 타임아웃 3초
- 재시도 로직 (최대 2회)
- TypeScript 타입 안전성
```

**테스트 코드:**
```typescript
// __tests__/lib/gemini/workout.test.ts
import { generateWorkoutRecommendation } from '@/lib/gemini/workout';

// Mock Gemini API
jest.mock('@google/generative-ai');

describe('generateWorkoutRecommendation', () => {
  it('returns workout recommendations', async () => {
    const result = await generateWorkoutRecommendation({
      bodyType: 'H',
      goals: ['weight_loss'],
      equipment: ['bodyweight'],
    });
    expect(result.workoutType).toBeDefined();
    expect(result.exercises).toBeInstanceOf(Array);
  });

  it('handles API timeout', async () => {
    // Mock timeout
    await expect(generateWorkoutRecommendation({}))
      .rejects.toThrow(/timeout/);
  });
});
```

---

#### Task 3.2: 운동 타입 분류 AI 프롬프트

| 항목 | 내용 |
|------|------|
| **파일** | `lib/gemini/prompts/workoutType.ts` |
| **예상 시간** | 1d |
| **복잡도** | 🔴 높음 |
| **Claude Mode** | Think Hard → Plan → Implement |
| **우선순위** | Must |
| **의존성** | Task 3.1 |
| **예상 반복** | 3회 |

**수락 기준:**
```gherkin
Given: 사용자 입력 (체형, 목표, 고민, 기구)
When: AI 프롬프트로 분석 요청 시
Then:
  - 운동 타입 분류 (strength/cardio/balance)
  - 분류 이유 한국어 설명
  - 체형 기반 추천 포인트

Given: 응답 형식
Then:
  - JSON 형식 강제
  - 필수 필드 검증
  - 파싱 에러 핸들링
```

**Claude Code 프롬프트:**
```
Task 3.2: 운동 타입 분류 AI 프롬프트를 작성해주세요.

Think hard about:
1. 체형별 운동 추천 로직
2. 목표와 고민 조합에 따른 분류
3. JSON 응답 강제 방법
4. 한국어 설명 품질

⚠️ TDD: 테스트 코드 먼저 작성 → 구현 → 반복 검증

파일: lib/gemini/prompts/workoutType.ts

프롬프트 구조:
- 역할: 피트니스 전문가
- 입력 데이터 설명
- 출력 형식 지정 (JSON)
- 분류 기준 가이드라인

테스트: 다양한 입력 조합으로 응답 품질 검증
```

**테스트 코드:**
```typescript
// __tests__/lib/gemini/prompts/workoutType.test.ts
import { buildWorkoutTypePrompt, parseWorkoutTypeResponse } from '@/lib/gemini/prompts/workoutType';

describe('workoutType prompt', () => {
  describe('buildWorkoutTypePrompt', () => {
    it('includes body type in prompt', () => {
      const prompt = buildWorkoutTypePrompt({ bodyType: 'H', goals: ['strength'] });
      expect(prompt).toContain('H형 체형');
    });

    it('includes all goals', () => {
      const prompt = buildWorkoutTypePrompt({ goals: ['weight_loss', 'strength'] });
      expect(prompt).toContain('체중 감량');
      expect(prompt).toContain('근력 강화');
    });
  });

  describe('parseWorkoutTypeResponse', () => {
    it('parses valid JSON response', () => {
      const response = '{"type": "strength", "reason": "근력 강화 목표"}';
      const result = parseWorkoutTypeResponse(response);
      expect(result.type).toBe('strength');
    });

    it('throws on invalid JSON', () => {
      expect(() => parseWorkoutTypeResponse('invalid'))
        .toThrow();
    });
  });
});
```

---

#### Task 3.3 ~ 3.10: (요약)

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 3.3 | 운동 추천 AI 프롬프트 | 🔴 | Think Hard | 1d |
| 3.4 | API Route - 분석 요청 | 🟡 | Plan → Impl | 1d |
| 3.5 | API Route - 추천 요청 | 🟡 | Plan → Impl | 1d |
| 3.6 | AI 에러 핸들링 (Fallback) | 🟡 | Plan → Impl | 0.5d |
| 3.7 | 로딩 상태 UI | 🟢 | 바로 구현 | 0.5d |
| 3.8 | 무게/횟수 계산 로직 | 🟡 | Plan → Impl | 1d |
| 3.9 | 칼로리 계산 로직 (MET) | 🟡 | Plan → Impl | 0.5d |
| 3.10 | 분석 결과 DB 저장 | 🟡 | Plan → Impl | 0.5d |

---

### 4.2 Week 4 Tasks (Task 4.1 ~ 4.8)

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 4.1 | AI 인사이트 생성 프롬프트 | 🔴 | Think Hard | 1d |
| 4.2 | 인사이트 표시 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 4.3 | 연예인 DB (20명) | 🟢 | Auto-accept | 4h |
| 4.4 | 연예인 루틴 매칭 로직 | 🟡 | Plan → Impl | 1d |
| 4.5 | 연예인 루틴 UI | 🟢 | 바로 구현 | 0.5d |
| 4.6 | 주간 플랜 생성 로직 | 🔴 | Think Hard | 1d |
| 4.7 | 주간 플랜 UI | 🟡 | Plan → Impl | 1d |
| 4.8 | 7가지 지표 대시보드 | 🟡 | Plan → Impl | 1d |

---

## 5. Sprint 3 (Week 5-6): 기록 & 연동

### Task 요약

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 5.1 | 운동 시작 화면 | 🟢 | 바로 구현 | 0.5d |
| 5.2 | 휴식 타이머 | 🟡 | Plan → Impl | 1d |
| 5.3 | 세트 완료 UI | 🟢 | 바로 구현 | 0.5d |
| 5.4 | 운동 완료 저장 | 🟡 | Plan → Impl | 1d |
| 5.5 | 운동 기록 페이지 | 🟡 | Plan → Impl | 1d |
| 5.6 | Streak 계산 로직 | 🟡 | Plan → Impl | 1d |
| 5.7 | Streak UI 컴포넌트 | 🟢 | 바로 구현 | 0.5d |
| 5.8 | PC-1 연동 (운동복) | 🟡 | Plan → Impl | 1d |
| 5.9 | S-1 연동 (피부 팁) | 🟢 | 바로 구현 | 0.5d |
| 5.10 | N-1 연동 준비 | 🟢 | 바로 구현 | 0.5d |

---

## 6. Sprint 4 (Week 7-8): 쇼핑 & 최적화

### Task 요약

| Task | 이름 | 복잡도 | Claude Mode | 시간 |
|------|------|--------|-------------|------|
| 6.1 | 운동복 추천 UI | 🟡 | Plan → Impl | 1d |
| 6.2 | 외부 쇼핑 링크 연동 | 🟢 | 바로 구현 | 0.5d |
| 6.3 | 캐싱 최적화 | 🔴 | Think Hard | 1d |
| 6.4 | 이미지 최적화 | 🟡 | Plan → Impl | 0.5d |
| 6.5 | 무한 스크롤 | 🟡 | Plan → Impl | 1d |
| 6.6 | 전체 통합 테스트 | 🔴 | Think Hard | 1d |
| 6.7 | 버그 수정 버퍼 | - | - | 2d |
| 6.8 | 베타 테스트 준비 | 🟢 | 바로 구현 | 0.5d |

---

## 📊 전체 Task 요약

### 복잡도별 분포

| 복잡도 | 개수 | 비율 |
|--------|------|------|
| 🟢 낮음 | 52개 | 57% |
| 🟡 중간 | 31개 | 34% |
| 🔴 높음 | 8개 | 9% |
| **합계** | **91개** | 100% |

### Claude Mode별 분포

| Claude Mode | 개수 | 설명 |
|-------------|------|------|
| 바로 구현 | 52개 | 단순 UI, 데이터 생성 |
| Plan → Implement | 31개 | 로직, API 연동 |
| Think Hard → Plan → Impl | 8개 | AI 프롬프트, 복잡한 로직 |

### Sprint별 예상 시간

| Sprint | 기간 | 예상 시간 | 버퍼 포함 |
|--------|------|----------|----------|
| Sprint 1 | Week 1-2 | 16d | 18d |
| Sprint 2 | Week 3-4 | 14d | 16d |
| Sprint 3 | Week 5-6 | 10d | 12d |
| Sprint 4 | Week 7-8 | 8d | 10d |
| **합계** | 8주 | **48d** | **56d** |

---

## 🔧 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2025-11-27 | 초안 작성 (63개 Task) |
| v1.1 | 2025-11-27 | 10가지 문제점 반영 (91개 Task) |
| v1.2 | 2025-11-27 | 하이브리드 방식 적용 |
| v1.3 | 2025-11-27 | 전체 Task 구체화 (수락 기준) |
| v1.4 | 2025-11-27 | **Claude Code 최적화** (복잡도, 프롬프트, 테스트) |

---

**문서 끝**
