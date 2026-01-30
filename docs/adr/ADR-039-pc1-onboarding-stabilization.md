# ADR-039: PC-1 온보딩 안정화 전략

## 상태

`accepted`

## 날짜

2026-01-23

## 0. 궁극의 형태 (P1)

### 이상적 최종 상태

"사용자가 앱 설치 후 1분 이내에 첫 번째 퍼스널컬러 분석 결과를 확인하고, 즉각적인 가치를 경험하는 상태"

- **즉각적 가치**: 가입 후 2분 이내 PC-1 분석 결과 확인
- **마찰 없는 경험**: 필수 단계만 포함, 스킵 가능한 선택 단계
- **높은 전환율**: 카메라 승인률 90%+, 온보딩 완료율 85%+
- **직관적 진행**: 명확한 진행 표시기, 남은 시간 예측

### 물리적 한계

| 항목 | 한계 |
|------|------|
| 법적 동의 필수 | 약관/개인정보 동의는 건너뛸 수 없음 |
| 연령 확인 필수 | 만 14세 확인은 법적 의무 |
| 카메라 권한 | OS 시스템 권한 요청 제어 불가 |
| AI 분석 시간 | 이미지 업로드 + AI 추론 최소 10-20초 |

### 100점 기준

| 지표 | 100점 기준 | 현재 | 비고 |
|------|-----------|------|------|
| TTFV (Time to First Value) | < 90초 | 3-5분 | 목표 2분 |
| 카메라 승인률 | > 90% | 50-60% | Pre-permission으로 개선 |
| 온보딩 완료율 | > 85% | 측정 필요 | 진행 표시기 효과 |
| 단계별 이탈률 | < 5% | 15-20% | 5단계 이하로 감소 |

### 현재 목표: 75%

### 의도적 제외

| 제외 항목 | 이유 | 재검토 시점 |
|----------|------|------------|
| 단일 페이지 폼 | 정보 과부하 (UX) | - |
| 7단계 분리 | TTFV 3분+ 초과 (PERFORMANCE) | - |
| 권한 요청 먼저 | 법적 동의 선행 필수 (LEGAL_ISSUE) | - |
| 스킵 불가 온보딩 | 재방문 사용자 불편 (UX) | - |

---

## 맥락 (Context)

PC-1 (퍼스널컬러 분석)은 이룸의 핵심 첫인상 기능입니다. 사용자가 최초 가입 후 PC-1 분석까지 도달하는 과정에서 다음 문제가 발생합니다:

### 현재 문제

1. **복잡한 온보딩 플로우**:
   - 현재: 연령 확인 → 약관 동의 → 프로필 설정 → 카메라 권한 → 분석 (5+ 단계)
   - 이탈률: 각 단계에서 15-20% 이탈 예상

2. **카메라 권한 승인률 저조**:
   - 맥락 없이 권한 요청 시: 50-60% 승인률
   - Pre-permission 화면 없음: 사용자 불안감

3. **TTFV (Time to First Value) 지연**:
   - 목표: 2분 이내
   - 현재: 3-5분 (측정 필요)

4. **진행 상황 불명확**:
   - 사용자가 현재 위치/남은 단계 모름
   - 포기 확률 증가

### 요구사항

| 요구사항 | 우선순위 | 근거 |
|---------|---------|------|
| 5단계 이하 온보딩 | P0 | UX 리서치: 5단계 초과 시 이탈률 급증 |
| TTFV < 2분 | P0 | 업계 표준 |
| 카메라 Pre-permission | P0 | 승인률 78-88% 달성 가능 |
| 진행 표시기 | P1 | 완료율 22% 향상 |
| 선택적 단계 스킵 | P1 | 재방문 사용자 편의 |

## 결정 (Decision)

**5단계 통합 온보딩 + Pre-permission 패턴**을 구현합니다.

### 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                    PC-1 온보딩 플로우 (5단계)                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Progress: [●○○○○] 1/5                                   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Step 1: 웰컴 + 서비스 소개 (10초)                             │
│       └── 핵심 가치 1문장, CTA "시작하기"                       │
│                           ↓                                     │
│  Step 2: 필수 정보 (30초)                                       │
│       └── 생년월일 (14세 확인) + 성별 (선택)                   │
│       └── 14세 미만 → 차단 화면                                │
│                           ↓                                     │
│  Step 3: 동의 (20초)                                            │
│       └── 통합 동의 화면 (전체 동의 버튼)                       │
│       └── 개별 확인 가능 (아코디언)                            │
│                           ↓                                     │
│  Step 4: Pre-permission (15초)                                  │
│       └── 카메라 사용 이유 설명 + 미리보기 이미지              │
│       └── "분석을 위해 얼굴 사진이 필요해요"                   │
│       └── CTA "카메라 허용하기" → 시스템 권한 요청             │
│                           ↓                                     │
│  Step 5: PC-1 분석 (45초)                                       │
│       └── 카메라 프리뷰 + 얼굴 가이드                          │
│       └── 촬영 → AI 분석 → 결과 표시                           │
│                                                                 │
│  총 예상 시간: 2분                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Pre-permission 화면 설계

```
┌─────────────────────────────────────────────────────────────────┐
│                    Pre-permission 화면                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│      ┌───────────────────────┐                                 │
│      │   [카메라 아이콘]     │                                 │
│      │   미리보기 이미지     │                                 │
│      └───────────────────────┘                                 │
│                                                                 │
│      퍼스널컬러 분석을 위해                                    │
│      카메라 접근이 필요해요                                    │
│                                                                 │
│      • 얼굴 톤 분석에 사용됩니다                               │
│      • 사진은 분석 후 즉시 삭제됩니다                          │
│      • 서버에 저장되지 않습니다 (옵션)                         │
│                                                                 │
│      ┌─────────────────────────────────┐                       │
│      │     카메라 허용하기             │  ← Primary CTA       │
│      └─────────────────────────────────┘                       │
│                                                                 │
│      나중에 하기 (건너뛰기)              ← Secondary           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 단계별 상세

| 단계 | 컴포넌트 | 예상 시간 | 스킵 가능 |
|------|---------|----------|----------|
| 1 | `WelcomeStep` | 10초 | ❌ |
| 2 | `BasicInfoStep` | 30초 | ❌ |
| 3 | `AgreementStep` | 20초 | ❌ |
| 4 | `CameraPermissionStep` | 15초 | ✅ (나중에) |
| 5 | `PC1AnalysisStep` | 45초 | ✅ (권한 거부 시) |

### 상태 관리

```typescript
interface OnboardingState {
  currentStep: 1 | 2 | 3 | 4 | 5;
  completedSteps: Set<number>;
  userInfo: {
    birthDate?: Date;
    gender?: 'male' | 'female' | 'other';
  };
  agreements: {
    terms: boolean;
    privacy: boolean;
    sensitive: boolean;
    marketing: boolean;
  };
  cameraPermission: 'granted' | 'denied' | 'prompt' | 'skipped';
  pc1Result?: PC1AnalysisResult;
}
```

## 대안 (Alternatives Considered)

| 대안 | 장점 | 단점 | 제외 사유 |
|------|------|------|----------|
| **단일 페이지 폼** | 빠름 | 압도적, 포기율 높음 | `UX` - 정보 과부하 |
| **7단계 분리** | 각 단계 명확 | TTFV 3분+ | `PERFORMANCE` - 목표 미달 |
| **권한 후 온보딩** | 이탈 방지 | 법적 동의 선행 필수 | `LEGAL_ISSUE` - 순서 위반 |
| **5단계 통합** ✅ | 균형잡힌 UX | 구현 복잡도 | **채택** |

### Pre-permission 효과 (리서치)

| 패턴 | 승인률 | 출처 |
|------|--------|------|
| 직접 요청 (맥락 없음) | 50-60% | Android Developer Guidelines |
| Pre-permission 화면 | 78-88% | Localytics 2023 |
| 기능 사용 시점 요청 | 70-80% | iOS Human Interface Guidelines |

## 결과 (Consequences)

### 긍정적 결과

- **TTFV 개선**: 3-5분 → 2분 목표
- **카메라 승인률**: 50-60% → 78-88% 예상
- **완료율**: 진행 표시기로 22% 향상 예상
- **법적 준수**: ADR-022, ADR-023 통합

### 부정적 결과

- **구현 복잡도**: 5단계 상태 관리 필요
- **테스트 범위**: 각 단계별 엣지 케이스 다수

### 리스크

- **권한 거부 시 플로우**: "나중에" 옵션으로 완화, 대시보드에서 재시도 유도
- **법적 순서 변경 시**: 약관이 항상 카메라보다 선행되도록 보장
- **기기 호환성**: 카메라 없는 기기 대응 필요

## 구현 가이드

### 1. 온보딩 컨텍스트

```typescript
// contexts/OnboardingContext.tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OnboardingState>({
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
  });

  const goToStep = (step: number) => {
    setState(prev => ({ ...prev, currentStep: step as 1|2|3|4|5 }));
  };

  const completeStep = (step: number) => {
    setState(prev => ({
      ...prev,
      completedSteps: new Set([...prev.completedSteps, step]),
      currentStep: Math.min(step + 1, 5) as 1|2|3|4|5,
    }));
  };

  return (
    <OnboardingContext.Provider value={{ state, goToStep, completeStep, setState }}>
      {children}
    </OnboardingContext.Provider>
  );
}
```

### 2. Progress Indicator

```tsx
// components/onboarding/ProgressIndicator.tsx
interface Props {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: Props) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-colors ${
            i < currentStep
              ? 'bg-primary'
              : i === currentStep
              ? 'bg-primary/50'
              : 'bg-gray-200'
          }`}
        />
      ))}
      <span className="text-sm text-muted-foreground ml-2">
        {currentStep}/{totalSteps}
      </span>
    </div>
  );
}
```

### 3. Pre-permission Step

```tsx
// components/onboarding/CameraPermissionStep.tsx
'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onGranted: () => void;
  onSkipped: () => void;
}

export function CameraPermissionStep({ onGranted, onSkipped }: Props) {
  const [isRequesting, setIsRequesting] = useState(false);

  const requestPermission = async () => {
    setIsRequesting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      onGranted();
    } catch (error) {
      // 사용자가 거부하거나 카메라 없음
      console.error('Camera permission denied:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <div className="flex flex-col items-center text-center p-6">
      <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
        <Camera className="w-12 h-12 text-primary" />
      </div>

      <h2 className="text-2xl font-bold mb-2">
        퍼스널컬러 분석을 위해
        <br />
        카메라 접근이 필요해요
      </h2>

      <ul className="text-sm text-muted-foreground mt-4 space-y-2 text-left">
        <li>• 얼굴 톤 분석에 사용됩니다</li>
        <li>• 사진은 분석 후 즉시 삭제됩니다</li>
        <li>• 동의 시에만 서버에 저장됩니다</li>
      </ul>

      <div className="mt-8 w-full space-y-3">
        <Button
          onClick={requestPermission}
          disabled={isRequesting}
          className="w-full"
          size="lg"
        >
          {isRequesting ? '권한 요청 중...' : '카메라 허용하기'}
        </Button>

        <button
          onClick={onSkipped}
          className="text-sm text-muted-foreground underline"
        >
          나중에 하기
        </button>
      </div>
    </div>
  );
}
```

### 4. 온보딩 페이지 라우트

```tsx
// app/(auth)/onboarding/page.tsx
import { OnboardingProvider } from '@/contexts/OnboardingContext';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

export default function OnboardingPage() {
  return (
    <OnboardingProvider>
      <OnboardingFlow />
    </OnboardingProvider>
  );
}
```

## 테스트 시나리오

| 시나리오 | 입력 | 예상 결과 |
|---------|------|----------|
| 정상 플로우 | 모든 단계 완료 | PC-1 결과 표시, 대시보드 이동 |
| 14세 미만 | 2006-01-24 이후 생년월일 | Step 2에서 차단 |
| 필수 동의 미체크 | terms만 체크 | Step 3에서 진행 불가 |
| 카메라 거부 | 권한 거부 | Step 4 "나중에" 활성화, 대시보드 이동 |
| 카메라 스킵 | "나중에" 클릭 | 대시보드 이동, 재시도 배너 표시 |
| 뒤로가기 | Step 3에서 뒤로 | Step 2로 이동, 입력 유지 |

## 관련 문서

### 원리 문서 (과학적 기초)
- [원리: 색채학](../principles/color-science.md) - PC-1 분석 기반

### 리서치 문서
- 리서치: UX Onboarding (예정) - 5단계 이론, TTFV

### 관련 ADR
- [ADR-022: 만 14세 회원가입 차단](./ADR-022-age-verification.md) - Step 2 연동
- [ADR-023: 약관/개인정보처리방침 동의](./ADR-023-terms-agreement-flow.md) - Step 3 연동
- [ADR-001: Core Image Engine](./ADR-001-core-image-engine.md) - PC-1 이미지 처리

### 관련 스펙
- [SDD-N-1-AGE-VERIFICATION](../specs/SDD-N-1-AGE-VERIFICATION.md)
- [SDD-LEGAL-SUPPORT](../specs/SDD-LEGAL-SUPPORT.md)

## 구현 스펙

이 ADR을 구현하는 스펙 문서:

| 스펙 | 상태 | 설명 |
|------|------|------|
| [SDD-PC1-ONBOARDING](../specs/SDD-PC1-ONBOARDING.md) | 📝 작성 예정 | 5단계 온보딩 상세 구현 스펙 |

---

**Author**: Claude Code
**Reviewed by**: -
