# SDD-PC1-ONBOARDING: PC-1 온보딩 안정화 스펙

> **Phase**: Phase 0 (INF-2)
> **Priority**: P0
> **ADR**: [ADR-039](../adr/ADR-039-pc1-onboarding-stabilization.md)
> **Status**: 📝 작성 완료
> **Updated**: 2026-01-28

---

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"신규 사용자가 2분 이내에 첫 번째 가치(PC-1 분석 결과)를 경험하고, 서비스에 몰입하는 마찰 없는 온보딩 플로우"

- TTFV (Time to First Value) < 2분
- 카메라 권한 승인률 90%+
- 온보딩 완료율 80%+
- 이탈률 10% 미만

### 물리적 한계

| 한계 | 이유 | 완화 전략 |
|------|------|----------|
| 브라우저 권한 UX | 각 브라우저별 다른 권한 다이얼로그 | Pre-permission 패턴 |
| 14세 미만 차단 | 법적 요구사항 | 친절한 안내 메시지 |
| 필수 동의 항목 | 법적 요구사항 | 간소화된 동의 UI |
| AI 분석 시간 | Gemini API 응답 시간 | 로딩 상태 최적화 |

### 100점 기준

| 항목 | 100점 기준 | 현재 |
|------|-----------|------|
| TTFV | < 2분 | 📝 설계됨 |
| 카메라 승인률 | 90% | 78-88% 목표 |
| 온보딩 완료율 | 80% | 22% 향상 목표 |
| 단계 수 | 최소화 (5단계) | ✅ 5단계 |
| 스킵 후 재시도 유도 | 배너 표시 | ✅ 설계됨 |

### 현재 목표: 70%

**종합 달성률**: **70%** (설계 완료, 구현 진행)

| 기능 | 달성률 | 상태 |
|------|--------|------|
| 5단계 플로우 설계 | 100% | ✅ |
| Pre-permission UI | 80% | 📝 |
| 상태 머신 | 90% | 📝 |
| 컴포넌트 구조 | 80% | 📝 |
| 분석 통합 | 60% | 📝 |

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 모바일 앱 온보딩 | 별도 스펙 (SDD-MOBILE) | Phase 2 |
| 소셜 로그인 우선 | Clerk 기본 지원 | 필요 시 |
| A/B 테스트 인프라 | MVP 이후 | MAU 1만+ |

---

## 1. 개요

### 1.1 목적

PC-1 (퍼스널컬러 분석) 첫 사용까지의 온보딩 플로우를 5단계로 최적화하여:
- TTFV (Time to First Value) < 2분 달성
- 카메라 권한 승인률 78-88% 달성
- 온보딩 완료율 22% 향상

### 1.2 범위

| 포함 | 제외 |
|------|------|
| 웹 온보딩 플로우 | 모바일 앱 (별도 스펙) |
| 5단계 UI/UX | 분석 알고리즘 |
| Pre-permission 패턴 | 카메라 하드웨어 처리 |
| 상태 관리 | 결제 플로우 |

### 1.3 의존성

| 의존 대상 | 타입 | 설명 |
|----------|------|------|
| ADR-022 | ADR | 만 14세 확인 로직 |
| ADR-023 | ADR | 약관 동의 플로우 |
| ADR-001 | ADR | CIE 이미지 처리 |
| SDD-N-1-AGE-VERIFICATION | Spec | 연령 확인 구현 |
| SDD-PERSONAL-COLOR-v2 | Spec | PC-1 분석 로직 |

---

## 2. 아키텍처

### 2.1 플로우 다이어그램

```
┌─────────────────────────────────────────────────────────────────┐
│                    온보딩 플로우 아키텍처                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  OnboardingProvider                      │   │
│  │  ┌─────────────────────────────────────────────────┐    │   │
│  │  │             OnboardingState                      │    │   │
│  │  │  - currentStep: 1-5                             │    │   │
│  │  │  - completedSteps: Set<number>                  │    │   │
│  │  │  - userInfo: { birthDate, gender }              │    │   │
│  │  │  - agreements: { terms, privacy, ... }          │    │   │
│  │  │  - cameraPermission: PermissionState            │    │   │
│  │  └─────────────────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   OnboardingFlow                         │   │
│  │  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐  ┌─────┐          │   │
│  │  │Step1│→ │Step2│→ │Step3│→ │Step4│→ │Step5│          │   │
│  │  │Welcome│ │Info │ │Terms│ │Camera│ │PC-1 │          │   │
│  │  └─────┘  └─────┘  └─────┘  └─────┘  └─────┘          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│                              ▼                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  ProgressIndicator                       │   │
│  │  [●●●○○] 3/5                                            │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 상태 머신

```
                    ┌─────────────────────┐
                    │    INITIAL (Step 1) │
                    └──────────┬──────────┘
                               │ "시작하기" 클릭
                               ▼
                    ┌─────────────────────┐
                    │  BASIC_INFO (Step 2)│
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
            14세 미만                 14세 이상
                    │                     │
                    ▼                     ▼
          ┌─────────────────┐  ┌─────────────────────┐
          │   BLOCKED       │  │  AGREEMENT (Step 3) │
          │   (차단 화면)    │  └──────────┬──────────┘
          └─────────────────┘             │ 필수 동의 완료
                                          ▼
                               ┌─────────────────────┐
                               │  PERMISSION (Step 4)│
                               └──────────┬──────────┘
                                          │
                        ┌─────────────────┼─────────────────┐
                        │                 │                 │
                   "허용하기"         "나중에"          거부됨
                        │                 │                 │
                        ▼                 │                 │
             ┌─────────────────────┐      │                 │
             │  ANALYSIS (Step 5)  │      │                 │
             └──────────┬──────────┘      │                 │
                        │                 │                 │
                        │ 분석 완료       │                 │
                        ▼                 ▼                 ▼
             ┌─────────────────────────────────────────────────┐
             │                   COMPLETED                      │
             │  (대시보드 이동, 스킵 시 재시도 배너 표시)       │
             └─────────────────────────────────────────────────┘
```

### 2.3 컴포넌트 구조

```
components/onboarding/
├── index.ts                      # Barrel export
├── OnboardingFlow.tsx            # 메인 컨테이너
├── ProgressIndicator.tsx         # 진행 표시기
├── steps/
│   ├── WelcomeStep.tsx           # Step 1
│   ├── BasicInfoStep.tsx         # Step 2
│   ├── AgreementStep.tsx         # Step 3
│   ├── CameraPermissionStep.tsx  # Step 4 (Pre-permission)
│   └── PC1AnalysisStep.tsx       # Step 5
├── shared/
│   ├── StepContainer.tsx         # 공통 레이아웃
│   ├── NavigationButtons.tsx     # 이전/다음 버튼
│   └── SkipButton.tsx            # 건너뛰기 버튼
└── hooks/
    ├── useOnboarding.ts          # 온보딩 상태 훅
    └── useCameraPermission.ts    # 카메라 권한 훅

contexts/
└── OnboardingContext.tsx         # 전역 상태
```

---

## 3. ATOM 분해

### ATOM-1: OnboardingContext 구현

**예상 시간**: 1시간
**입력**: 없음
**출력**: OnboardingProvider, useOnboarding hook

```typescript
// contexts/OnboardingContext.tsx
'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 타입 정의
export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
export type PermissionState = 'prompt' | 'granted' | 'denied' | 'skipped';

export interface UserInfo {
  birthDate?: Date;
  gender?: 'male' | 'female' | 'other';
}

export interface Agreements {
  terms: boolean;
  privacy: boolean;
  sensitive: boolean;
  marketing: boolean;
}

export interface OnboardingState {
  currentStep: OnboardingStep;
  completedSteps: Set<number>;
  userInfo: UserInfo;
  agreements: Agreements;
  cameraPermission: PermissionState;
  isBlocked: boolean;
  pc1ResultId?: string;
}

interface OnboardingContextType {
  state: OnboardingState;
  goToStep: (step: OnboardingStep) => void;
  completeStep: (step: OnboardingStep) => void;
  goBack: () => void;
  setUserInfo: (info: Partial<UserInfo>) => void;
  setAgreements: (agreements: Partial<Agreements>) => void;
  setCameraPermission: (permission: PermissionState) => void;
  setBlocked: (blocked: boolean) => void;
  setPC1Result: (resultId: string) => void;
  canProceed: () => boolean;
}

const initialState: OnboardingState = {
  currentStep: 1,
  completedSteps: new Set(),
  userInfo: {},
  agreements: {
    terms: false,
    privacy: false,
    sensitive: false,
    marketing: false,
  },
  cameraPermission: 'prompt',
  isBlocked: false,
};

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>(initialState);

  const goToStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const completeStep = useCallback((step: OnboardingStep) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
      currentStep: Math.min(step + 1, 5) as OnboardingStep,
    }));
  }, []);

  const goBack = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 1) as OnboardingStep,
    }));
  }, []);

  const setUserInfo = useCallback((info: Partial<UserInfo>) => {
    setState(prev => ({
      ...prev,
      userInfo: { ...prev.userInfo, ...info },
    }));
  }, []);

  const setAgreements = useCallback((agreements: Partial<Agreements>) => {
    setState(prev => ({
      ...prev,
      agreements: { ...prev.agreements, ...agreements },
    }));
  }, []);

  const setCameraPermission = useCallback((permission: PermissionState) => {
    setState(prev => ({ ...prev, cameraPermission: permission }));
  }, []);

  const setBlocked = useCallback((blocked: boolean) => {
    setState(prev => ({ ...prev, isBlocked: blocked }));
  }, []);

  const setPC1Result = useCallback((resultId: string) => {
    setState(prev => ({ ...prev, pc1ResultId: resultId }));
  }, []);

  const canProceed = useCallback(() => {
    const { currentStep, userInfo, agreements } = state;

    switch (currentStep) {
      case 1:
        return true;
      case 2:
        return !!userInfo.birthDate;
      case 3:
        return agreements.terms && agreements.privacy && agreements.sensitive;
      case 4:
        return true; // 스킵 가능
      case 5:
        return true;
      default:
        return false;
    }
  }, [state]);

  return (
    <OnboardingContext.Provider
      value={{
        state,
        goToStep,
        completeStep,
        goBack,
        setUserInfo,
        setAgreements,
        setCameraPermission,
        setBlocked,
        setPC1Result,
        canProceed,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}
```

**성공 기준**:
- [ ] Context 생성 및 Provider 동작
- [ ] 모든 상태 업데이트 함수 정상 동작
- [ ] canProceed() 각 단계별 검증

---

### ATOM-2: ProgressIndicator 구현

**예상 시간**: 30분
**입력**: currentStep, totalSteps
**출력**: 진행 표시 UI

```typescript
// components/onboarding/ProgressIndicator.tsx
'use client';

import { motion } from 'framer-motion';

interface Props {
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export function ProgressIndicator({ currentStep, totalSteps, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isCurrent = stepNumber === currentStep;

        return (
          <motion.div
            key={stepNumber}
            initial={false}
            animate={{
              scale: isCurrent ? 1.2 : 1,
              backgroundColor: isCompleted
                ? 'var(--color-primary)'
                : isCurrent
                ? 'var(--color-primary-50)'
                : 'var(--color-gray-200)',
            }}
            className={`w-3 h-3 rounded-full transition-colors`}
            style={{
              backgroundColor: isCompleted
                ? 'hsl(var(--primary))'
                : isCurrent
                ? 'hsl(var(--primary) / 0.5)'
                : 'hsl(var(--muted))',
            }}
          />
        );
      })}
      <span className="text-sm text-muted-foreground ml-2">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
```

**성공 기준**:
- [ ] 현재 단계 시각적 구분
- [ ] 완료된 단계 표시
- [ ] 애니메이션 부드럽게 동작

---

### ATOM-3: WelcomeStep 구현

**예상 시간**: 30분
**입력**: 없음
**출력**: 웰컴 화면

```typescript
// components/onboarding/steps/WelcomeStep.tsx
'use client';

import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';

export function WelcomeStep() {
  const { completeStep } = useOnboarding();

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
      data-testid="welcome-step"
    >
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Sparkles className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-3xl font-bold mb-3">
        이룸에 오신 것을
        <br />
        환영합니다
      </h1>

      <p className="text-muted-foreground mb-8 max-w-sm">
        AI 기반 퍼스널컬러 분석으로
        <br />
        나에게 어울리는 색을 찾아보세요
      </p>

      <Button
        onClick={() => completeStep(1)}
        size="lg"
        className="w-full max-w-xs"
      >
        시작하기
      </Button>
    </div>
  );
}
```

**성공 기준**:
- [ ] 웰컴 메시지 표시
- [ ] "시작하기" 클릭 시 Step 2로 이동
- [ ] 10초 이내 완료 가능

---

### ATOM-4: BasicInfoStep 구현

**예상 시간**: 1시간
**입력**: 사용자 입력 (생년월일, 성별)
**출력**: userInfo 상태 업데이트, 14세 미만 차단

```typescript
// components/onboarding/steps/BasicInfoStep.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { isAge14OrOlder } from '@/lib/age-verification/check';

export function BasicInfoStep() {
  const { state, setUserInfo, setBlocked, completeStep, goBack } = useOnboarding();
  const [birthDate, setBirthDate] = useState<string>(
    state.userInfo.birthDate?.toISOString().split('T')[0] ?? ''
  );
  const [gender, setGender] = useState<string>(state.userInfo.gender ?? '');
  const [error, setError] = useState<string>('');

  const handleNext = () => {
    if (!birthDate) {
      setError('생년월일을 입력해주세요');
      return;
    }

    const date = new Date(birthDate);

    // 14세 확인
    if (!isAge14OrOlder(date)) {
      setBlocked(true);
      return;
    }

    setUserInfo({
      birthDate: date,
      gender: gender as 'male' | 'female' | 'other' | undefined,
    });
    completeStep(2);
  };

  // 차단 화면
  if (state.isBlocked) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
        data-testid="age-blocked"
      >
        <h2 className="text-2xl font-bold mb-4">
          가입할 수 없습니다
        </h2>
        <p className="text-muted-foreground mb-6">
          이룸은 만 14세 이상만 이용할 수 있습니다.
          <br />
          개인정보보호법에 따라 만 14세 미만은
          <br />
          법정대리인의 동의가 필요합니다.
        </p>
        <Button variant="outline" onClick={() => window.location.href = '/'}>
          홈으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8" data-testid="basic-info-step">
      <h2 className="text-2xl font-bold mb-6">기본 정보</h2>

      <div className="space-y-6">
        {/* 생년월일 */}
        <div className="space-y-2">
          <Label htmlFor="birthDate">
            생년월일 <span className="text-red-500">*</span>
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => {
              setBirthDate(e.target.value);
              setError('');
            }}
            max={new Date().toISOString().split('T')[0]}
            className={error ? 'border-red-500' : ''}
          />
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* 성별 (선택) */}
        <div className="space-y-2">
          <Label>성별 (선택)</Label>
          <RadioGroup value={gender} onValueChange={setGender}>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="female" />
                <Label htmlFor="female">여성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="male" />
                <Label htmlFor="male">남성</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="other" id="other" />
                <Label htmlFor="other">기타</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={goBack} className="flex-1">
          이전
        </Button>
        <Button onClick={handleNext} className="flex-1">
          다음
        </Button>
      </div>
    </div>
  );
}
```

**성공 기준**:
- [ ] 생년월일 입력 및 검증
- [ ] 14세 미만 차단 화면 표시
- [ ] 성별 선택 (선택사항)
- [ ] 이전/다음 버튼 동작

---

### ATOM-5: AgreementStep 구현

**예상 시간**: 1.5시간
**입력**: 사용자 동의 선택
**출력**: agreements 상태 업데이트, DB 저장

```typescript
// components/onboarding/steps/AgreementStep.tsx
'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useOnboarding } from '@/contexts/OnboardingContext';

interface AgreementItem {
  key: keyof typeof AGREEMENTS;
  label: string;
  required: boolean;
  href: string;
}

const AGREEMENTS: Record<string, AgreementItem> = {
  terms: { key: 'terms', label: '서비스 이용약관', required: true, href: '/terms' },
  privacy: { key: 'privacy', label: '개인정보처리방침', required: true, href: '/privacy' },
  sensitive: { key: 'sensitive', label: '민감정보 처리 동의', required: true, href: '/sensitive' },
  marketing: { key: 'marketing', label: '마케팅 정보 수신', required: false, href: '/marketing' },
};

export function AgreementStep() {
  const { state, setAgreements, completeStep, goBack } = useOnboarding();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const allRequiredChecked =
    state.agreements.terms &&
    state.agreements.privacy &&
    state.agreements.sensitive;

  const allChecked = allRequiredChecked && state.agreements.marketing;

  const handleAllAgree = () => {
    const newValue = !allChecked;
    setAgreements({
      terms: newValue,
      privacy: newValue,
      sensitive: newValue,
      marketing: newValue,
    });
  };

  const handleSingleAgree = (key: string, value: boolean) => {
    setAgreements({ [key]: value });
  };

  const toggleExpand = (key: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleNext = async () => {
    // TODO: DB에 동의 기록 저장 (lib/agreements/save-agreement.ts)
    completeStep(3);
  };

  return (
    <div className="px-6 py-8" data-testid="agreement-step">
      <h2 className="text-2xl font-bold mb-2">약관 동의</h2>
      <p className="text-muted-foreground mb-6">
        서비스 이용을 위해 동의가 필요합니다
      </p>

      <div className="space-y-4">
        {/* 전체 동의 */}
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <Checkbox
              id="all"
              checked={allChecked}
              onCheckedChange={handleAllAgree}
            />
            <Label htmlFor="all" className="font-medium cursor-pointer">
              전체 동의
            </Label>
          </div>
        </div>

        {/* 개별 동의 */}
        <div className="space-y-2">
          {Object.values(AGREEMENTS).map((item) => (
            <div key={item.key} className="border rounded-lg">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={item.key}
                    checked={state.agreements[item.key as keyof typeof state.agreements]}
                    onCheckedChange={(checked) =>
                      handleSingleAgree(item.key, checked as boolean)
                    }
                  />
                  <Label htmlFor={item.key} className="cursor-pointer">
                    {item.label}
                    {item.required && (
                      <span className="text-red-500 ml-1">(필수)</span>
                    )}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => toggleExpand(item.key)}
                    className="text-muted-foreground"
                  >
                    {expandedItems.has(item.key) ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              {expandedItems.has(item.key) && (
                <div className="px-4 pb-4 text-sm text-muted-foreground">
                  {/* 약관 요약 (실제로는 API에서 가져옴) */}
                  약관 내용 요약...
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Button variant="outline" onClick={goBack} className="flex-1">
          이전
        </Button>
        <Button
          onClick={handleNext}
          disabled={!allRequiredChecked}
          className="flex-1"
        >
          다음
        </Button>
      </div>
    </div>
  );
}
```

**성공 기준**:
- [ ] 전체 동의 체크박스
- [ ] 개별 동의 체크박스
- [ ] 필수 동의 미완료 시 진행 불가
- [ ] 약관 보기 링크

---

### ATOM-6: CameraPermissionStep 구현 (Pre-permission)

**예상 시간**: 1시간
**입력**: 사용자 선택
**출력**: 카메라 권한 상태

```typescript
// components/onboarding/steps/CameraPermissionStep.tsx
'use client';

import { useState } from 'react';
import { Camera, Shield, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';

export function CameraPermissionStep() {
  const { setCameraPermission, completeStep, goBack } = useOnboarding();
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string>('');

  const requestPermission = async () => {
    setIsRequesting(true);
    setError('');

    try {
      // 카메라 권한 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      // 스트림 정리
      stream.getTracks().forEach(track => track.stop());

      setCameraPermission('granted');
      completeStep(4);
    } catch (err) {
      console.error('Camera permission error:', err);

      if (err instanceof DOMException) {
        if (err.name === 'NotAllowedError') {
          setError('카메라 권한이 거부되었습니다. 브라우저 설정에서 허용해주세요.');
          setCameraPermission('denied');
        } else if (err.name === 'NotFoundError') {
          setError('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
        } else {
          setError('카메라 접근 중 오류가 발생했습니다.');
        }
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleSkip = () => {
    setCameraPermission('skipped');
    completeStep(4);
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
      data-testid="camera-permission-step"
    >
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Camera className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        퍼스널컬러 분석을 위해
        <br />
        카메라 접근이 필요해요
      </h2>

      <ul className="mt-6 space-y-3 text-left max-w-xs">
        <li className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Camera className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-sm text-muted-foreground">
            얼굴 톤 분석에 사용됩니다
          </span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-green-600" />
          </div>
          <span className="text-sm text-muted-foreground">
            동의 시에만 서버에 저장됩니다
          </span>
        </li>
        <li className="flex items-start gap-3">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-4 h-4 text-purple-600" />
          </div>
          <span className="text-sm text-muted-foreground">
            미동의 시 분석 후 즉시 삭제됩니다
          </span>
        </li>
      </ul>

      {error && (
        <p className="mt-4 text-sm text-red-500 max-w-xs">{error}</p>
      )}

      <div className="mt-8 w-full max-w-xs space-y-3">
        <Button
          onClick={requestPermission}
          disabled={isRequesting}
          className="w-full"
          size="lg"
        >
          {isRequesting ? '권한 요청 중...' : '카메라 허용하기'}
        </Button>

        <button
          onClick={handleSkip}
          className="text-sm text-muted-foreground underline w-full"
        >
          나중에 하기
        </button>

        <Button
          variant="ghost"
          onClick={goBack}
          className="w-full"
        >
          이전
        </Button>
      </div>
    </div>
  );
}
```

**성공 기준**:
- [ ] Pre-permission 설명 표시
- [ ] "허용하기" → 시스템 권한 요청
- [ ] 권한 승인 → Step 5 이동
- [ ] "나중에" → 대시보드 이동 (또는 Step 5 스킵)
- [ ] 권한 거부 시 에러 메시지

---

### ATOM-7: PC1AnalysisStep 구현

**예상 시간**: 2시간
**입력**: 카메라 스트림
**출력**: PC-1 분석 결과

```typescript
// components/onboarding/steps/PC1AnalysisStep.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnboarding } from '@/contexts/OnboardingContext';

type AnalysisState = 'capture' | 'analyzing' | 'complete' | 'error';

export function PC1AnalysisStep() {
  const router = useRouter();
  const { state, setPC1Result, goBack } = useOnboarding();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [analysisState, setAnalysisState] = useState<AnalysisState>('capture');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<PC1Result | null>(null);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setError('카메라를 시작할 수 없습니다.');
    }
  }, []);

  // 카메라 중지
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  // 사진 촬영
  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    const imageBase64 = canvas.toDataURL('image/jpeg', 0.8);

    setAnalysisState('analyzing');
    stopCamera();

    try {
      // API 호출
      const response = await fetch('/api/analyze/personal-color', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        throw new Error('분석 실패');
      }

      const data = await response.json();
      setResult(data);
      setPC1Result(data.id);
      setAnalysisState('complete');
    } catch (err) {
      setError('분석 중 오류가 발생했습니다. 다시 시도해주세요.');
      setAnalysisState('error');
    }
  }, [stopCamera, setPC1Result]);

  // 결과 화면으로 이동
  const goToResult = () => {
    if (result?.id) {
      router.push(`/analysis/personal-color/result/${result.id}`);
    } else {
      router.push('/dashboard');
    }
  };

  // 다시 시도
  const retry = () => {
    setAnalysisState('capture');
    setError('');
    startCamera();
  };

  // 스킵된 경우
  if (state.cameraPermission === 'skipped' || state.cameraPermission === 'denied') {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
        data-testid="pc1-skipped"
      >
        <h2 className="text-2xl font-bold mb-4">온보딩 완료!</h2>
        <p className="text-muted-foreground mb-6">
          퍼스널컬러 분석은 나중에 진행할 수 있습니다.
          <br />
          대시보드에서 언제든 시작하세요.
        </p>
        <Button onClick={() => router.push('/dashboard')}>
          대시보드로 이동
        </Button>
      </div>
    );
  }

  return (
    <div className="px-6 py-8" data-testid="pc1-analysis-step">
      {analysisState === 'capture' && (
        <>
          <h2 className="text-2xl font-bold mb-2 text-center">퍼스널컬러 분석</h2>
          <p className="text-muted-foreground mb-6 text-center">
            얼굴이 가이드 안에 들어오도록 해주세요
          </p>

          <div className="relative aspect-[3/4] max-w-sm mx-auto bg-black rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              onLoadedMetadata={() => startCamera()}
            />
            {/* 얼굴 가이드 오버레이 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-64 border-2 border-white/50 rounded-full" />
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={goBack} className="flex-1">
              이전
            </Button>
            <Button onClick={capturePhoto} className="flex-1">
              <Camera className="w-4 h-4 mr-2" />
              촬영하기
            </Button>
          </div>
        </>
      )}

      {analysisState === 'analyzing' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
          <p className="text-lg font-medium">분석 중...</p>
          <p className="text-sm text-muted-foreground">잠시만 기다려주세요</p>
        </div>
      )}

      {analysisState === 'complete' && result && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">분석 완료!</h2>
          <p className="text-lg text-primary mb-1">
            당신의 퍼스널컬러는
          </p>
          <p className="text-3xl font-bold text-primary mb-6">
            {result.season} {result.subType}
          </p>
          <Button onClick={goToResult} size="lg">
            상세 결과 보기
          </Button>
        </div>
      )}

      {analysisState === 'error' && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={retry}>다시 시도</Button>
        </div>
      )}
    </div>
  );
}

interface PC1Result {
  id: string;
  season: string;
  subType: string;
}
```

**성공 기준**:
- [ ] 카메라 프리뷰 표시
- [ ] 얼굴 가이드 오버레이
- [ ] 촬영 → 분석 → 결과 표시
- [ ] 분석 실패 시 재시도
- [ ] 스킵된 경우 대시보드 안내

---

### ATOM-8: OnboardingFlow 통합

**예상 시간**: 1시간
**입력**: 모든 Step 컴포넌트
**출력**: 통합된 온보딩 플로우

```typescript
// components/onboarding/OnboardingFlow.tsx
'use client';

import { useOnboarding } from '@/contexts/OnboardingContext';
import { ProgressIndicator } from './ProgressIndicator';
import { WelcomeStep } from './steps/WelcomeStep';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { AgreementStep } from './steps/AgreementStep';
import { CameraPermissionStep } from './steps/CameraPermissionStep';
import { PC1AnalysisStep } from './steps/PC1AnalysisStep';

const TOTAL_STEPS = 5;

export function OnboardingFlow() {
  const { state } = useOnboarding();

  const renderStep = () => {
    switch (state.currentStep) {
      case 1:
        return <WelcomeStep />;
      case 2:
        return <BasicInfoStep />;
      case 3:
        return <AgreementStep />;
      case 4:
        return <CameraPermissionStep />;
      case 5:
        return <PC1AnalysisStep />;
      default:
        return <WelcomeStep />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col" data-testid="onboarding-flow">
      {/* Progress Indicator (Step 1 제외) */}
      {state.currentStep > 1 && (
        <div className="p-4 border-b">
          <ProgressIndicator
            currentStep={state.currentStep}
            totalSteps={TOTAL_STEPS}
          />
        </div>
      )}

      {/* Step Content */}
      <main className="flex-1">
        {renderStep()}
      </main>
    </div>
  );
}
```

**성공 기준**:
- [ ] 각 단계 렌더링
- [ ] Progress 표시
- [ ] 상태에 따른 단계 전환

---

### ATOM-9: 온보딩 페이지 라우트

**예상 시간**: 30분
**입력**: 없음
**출력**: /onboarding 페이지

```typescript
// app/(auth)/onboarding/page.tsx
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';
import { hasCompletedOnboarding } from '@/lib/onboarding/check';

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // 이미 온보딩 완료한 사용자
  const completed = await hasCompletedOnboarding(userId);
  if (completed) {
    redirect('/dashboard');
  }

  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
```

**성공 기준**:
- [ ] 인증 확인
- [ ] 온보딩 완료 여부 확인
- [ ] Provider 래핑

---

### ATOM-10: 온보딩 완료 체크 유틸리티

**예상 시간**: 30분
**입력**: userId
**출력**: boolean

```typescript
// lib/onboarding/check.ts
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function hasCompletedOnboarding(clerkUserId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();

  // users 테이블에서 onboarding_completed_at 확인
  const { data, error } = await supabase
    .from('users')
    .select('onboarding_completed_at')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error || !data) {
    return false;
  }

  return !!data.onboarding_completed_at;
}

export async function markOnboardingComplete(clerkUserId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  await supabase
    .from('users')
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq('clerk_user_id', clerkUserId);
}
```

**성공 기준**:
- [ ] 온보딩 완료 여부 조회
- [ ] 온보딩 완료 마킹

---

### ATOM-11: 테스트 작성

**예상 시간**: 2시간
**입력**: 모든 컴포넌트
**출력**: 테스트 파일

```typescript
// tests/components/onboarding/OnboardingFlow.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

describe('OnboardingFlow', () => {
  const renderOnboarding = () => {
    return render(
      <OnboardingProvider>
        <OnboardingFlow />
      </OnboardingProvider>
    );
  };

  describe('Step 1: Welcome', () => {
    it('should render welcome screen', () => {
      renderOnboarding();
      expect(screen.getByTestId('welcome-step')).toBeInTheDocument();
      expect(screen.getByText('이룸에 오신 것을')).toBeInTheDocument();
    });

    it('should proceed to step 2 on button click', () => {
      renderOnboarding();
      fireEvent.click(screen.getByText('시작하기'));
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
  });

  describe('Step 2: BasicInfo', () => {
    beforeEach(() => {
      renderOnboarding();
      fireEvent.click(screen.getByText('시작하기'));
    });

    it('should block users under 14', () => {
      const input = screen.getByLabelText(/생년월일/);
      fireEvent.change(input, { target: { value: '2020-01-01' } });
      fireEvent.click(screen.getByText('다음'));

      expect(screen.getByTestId('age-blocked')).toBeInTheDocument();
    });

    it('should proceed for users 14 or older', () => {
      const input = screen.getByLabelText(/생년월일/);
      fireEvent.change(input, { target: { value: '2000-01-01' } });
      fireEvent.click(screen.getByText('다음'));

      expect(screen.getByTestId('agreement-step')).toBeInTheDocument();
    });
  });

  describe('Step 3: Agreement', () => {
    // ... 동의 테스트
  });

  describe('Step 4: CameraPermission', () => {
    // ... 카메라 권한 테스트
  });

  describe('Step 5: PC1Analysis', () => {
    // ... 분석 테스트
  });
});
```

**성공 기준**:
- [ ] 각 단계 렌더링 테스트
- [ ] 상태 전환 테스트
- [ ] 엣지 케이스 테스트

---

## 4. 테스트 케이스

| TC ID | 시나리오 | 전제 조건 | 입력 | 예상 결과 |
|-------|---------|----------|------|----------|
| TC-1 | 정상 플로우 | 신규 사용자 | 모든 단계 완료 | PC-1 결과 표시 |
| TC-2 | 14세 미만 차단 | 2012년 이후 생년월일 | 생년월일 입력 | 차단 화면 |
| TC-3 | 필수 동의 미체크 | Step 3 | terms만 체크 | 다음 버튼 비활성화 |
| TC-4 | 카메라 거부 | Step 4 | 시스템 거부 | 에러 메시지 + 스킵 안내 |
| TC-5 | 카메라 스킵 | Step 4 | "나중에" 클릭 | 대시보드 이동 |
| TC-6 | 뒤로가기 | Step 3 | 이전 버튼 | Step 2, 입력 유지 |
| TC-7 | 분석 실패 | Step 5 | API 에러 | 재시도 버튼 |
| TC-8 | 브라우저 새로고침 | Step 3 | F5 | Step 1 재시작 |
| TC-9 | 재방문 (완료됨) | 온보딩 완료 사용자 | /onboarding 접근 | /dashboard 리다이렉트 |
| TC-10 | 카메라 없는 기기 | Step 4 | 카메라 미지원 | 에러 + 스킵 안내 |

---

## 5. 마이그레이션

### 5.1 DB 스키마 변경

```sql
-- supabase/migrations/20260123_onboarding_tracking.sql
-- users 테이블 확장
ALTER TABLE users ADD COLUMN IF NOT EXISTS
  onboarding_completed_at TIMESTAMPTZ;

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  onboarding_skipped_camera BOOLEAN DEFAULT false;

COMMENT ON COLUMN users.onboarding_completed_at IS '온보딩 완료 시점';
COMMENT ON COLUMN users.onboarding_skipped_camera IS '카메라 권한 건너뛰기 여부';
```

### 5.2 환경변수

없음 (기존 환경변수 사용)

---

## 6. 모니터링

### 6.1 핵심 지표

| 지표 | 목표 | 측정 방법 |
|------|------|----------|
| TTFV | < 2분 | 온보딩 시작 ~ PC-1 결과 시간 |
| 완료율 | > 70% | 시작 / 완료 비율 |
| 카메라 승인률 | > 75% | 권한 요청 / 승인 비율 |
| 단계별 이탈률 | < 15% | 각 단계 시작 / 완료 비율 |

### 6.2 로깅

```typescript
// 온보딩 이벤트 로깅
analytics.track('onboarding_step_completed', {
  step: currentStep,
  duration_seconds: stepDuration,
});

analytics.track('onboarding_camera_permission', {
  result: 'granted' | 'denied' | 'skipped',
});

analytics.track('onboarding_completed', {
  total_duration_seconds: totalDuration,
  skipped_camera: boolean,
});
```

---

## 7. 롤백 계획

### 7.1 기능 플래그

```typescript
// lib/feature-flags/config.ts
enableNewOnboarding: {
  id: 'enable-new-onboarding',
  name: '새 온보딩 플로우',
  type: 'release',
  defaultValue: false,
  rolloutPercentage: 0,
},
```

### 7.2 롤백 절차

1. Feature flag 비활성화 (`rolloutPercentage: 0`)
2. 기존 온보딩으로 fallback
3. 에러 원인 분석
4. 수정 후 점진적 재배포

---

## 8. 체크리스트

### 8.1 구현 완료 조건

- [ ] ATOM-1: OnboardingContext 구현
- [ ] ATOM-2: ProgressIndicator 구현
- [ ] ATOM-3: WelcomeStep 구현
- [ ] ATOM-4: BasicInfoStep 구현
- [ ] ATOM-5: AgreementStep 구현
- [ ] ATOM-6: CameraPermissionStep 구현
- [ ] ATOM-7: PC1AnalysisStep 구현
- [ ] ATOM-8: OnboardingFlow 통합
- [ ] ATOM-9: 라우트 페이지
- [ ] ATOM-10: 완료 체크 유틸리티
- [ ] ATOM-11: 테스트 작성

### 8.2 품질 기준

- [ ] TypeScript strict mode 통과
- [ ] ESLint 경고 없음
- [ ] 테스트 커버리지 80% 이상
- [ ] TTFV < 2분 확인
- [ ] 모바일 반응형 확인

---

## 9. 관련 문서

- [ADR-039](../adr/ADR-039-pc1-onboarding-stabilization.md) - 아키텍처 결정
- [ADR-022](../adr/ADR-022-age-verification.md) - 연령 확인
- [ADR-023](../adr/ADR-023-terms-agreement-flow.md) - 약관 동의
- [SDD-N-1-AGE-VERIFICATION](./SDD-N-1-AGE-VERIFICATION.md) - 연령 확인 구현
- [SDD-PERSONAL-COLOR-v2](./SDD-PERSONAL-COLOR-v2.md) - PC-1 분석

---

**Author**: Claude Code
**Created**: 2026-01-23
**Last Updated**: 2026-01-23
