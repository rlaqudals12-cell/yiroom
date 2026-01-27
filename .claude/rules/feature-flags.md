# 피처 플래그 규칙

> 기능 점진적 출시 및 롤백 전략

## 피처 플래그 유형

### 분류

| 유형           | 용도                 | 수명                     |
| -------------- | -------------------- | ------------------------ |
| **Release**    | 기능 점진적 출시     | 단기 (출시 후 제거)      |
| **Experiment** | A/B 테스트           | 중기 (실험 종료 후 제거) |
| **Ops**        | 운영 토글 (킬스위치) | 장기 (상시 유지)         |
| **Permission** | 사용자별 기능 접근   | 장기 (권한 시스템)       |

## 피처 플래그 구현

### 설정 파일

```typescript
// lib/feature-flags/config.ts
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  type: 'release' | 'experiment' | 'ops' | 'permission';
  defaultValue: boolean;
  rolloutPercentage?: number; // 0-100
  enabledForUsers?: string[]; // 특정 사용자
  expiresAt?: string; // ISO 날짜
}

export const FEATURE_FLAGS: Record<string, FeatureFlag> = {
  // 출시 플래그
  enableCoreImageEngine: {
    id: 'enable-core-image-engine',
    name: 'Core Image Engine',
    description: 'CIE-1~4 이미지 처리 파이프라인',
    type: 'release',
    defaultValue: false,
    rolloutPercentage: 0,
  },

  // 운영 플래그 (킬스위치)
  enableAIAnalysis: {
    id: 'enable-ai-analysis',
    name: 'AI 분석 활성화',
    description: 'Gemini API 호출 활성화',
    type: 'ops',
    defaultValue: true,
  },

  // 실험 플래그
  experimentNewOnboarding: {
    id: 'experiment-new-onboarding',
    name: '새 온보딩 플로우',
    description: '간소화된 온보딩 테스트',
    type: 'experiment',
    defaultValue: false,
    rolloutPercentage: 50,
    expiresAt: '2026-02-28',
  },

  // Mock Fallback 허용
  allowMockFallback: {
    id: 'allow-mock-fallback',
    name: 'Mock Fallback 허용',
    description: 'AI 실패 시 Mock 데이터 사용',
    type: 'ops',
    defaultValue: true,
  },

  // Fallback 알림
  notifyOnFallback: {
    id: 'notify-on-fallback',
    name: 'Fallback 알림',
    description: 'Mock 사용 시 사용자 알림',
    type: 'ops',
    defaultValue: true,
  },

  // 롤백 임계값
  rollbackThreshold: {
    id: 'rollback-threshold',
    name: '롤백 임계값',
    description: '에러율 % 초과 시 자동 롤백',
    type: 'ops',
    defaultValue: true, // 10% 기본값
  },
};
```

### 훅 구현

```typescript
// hooks/useFeatureFlag.ts
import { useMemo } from 'react';
import { useAuth } from '@clerk/nextjs';
import { FEATURE_FLAGS, FeatureFlag } from '@/lib/feature-flags/config';

export function useFeatureFlag(flagId: string): boolean {
  const { userId } = useAuth();

  return useMemo(() => {
    const flag = FEATURE_FLAGS[flagId];
    if (!flag) return false;

    // 기본값
    if (!flag.defaultValue) return false;

    // 특정 사용자 활성화
    if (flag.enabledForUsers?.includes(userId || '')) {
      return true;
    }

    // 롤아웃 퍼센티지
    if (flag.rolloutPercentage !== undefined) {
      const hash = hashUserId(userId || '');
      const bucket = hash % 100;
      return bucket < flag.rolloutPercentage;
    }

    return flag.defaultValue;
  }, [flagId, userId]);
}

function hashUserId(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

### 서버 사이드

```typescript
// lib/feature-flags/server.ts
import { auth } from '@clerk/nextjs/server';
import { FEATURE_FLAGS } from './config';

export async function isFeatureEnabled(flagId: string): Promise<boolean> {
  const { userId } = await auth();
  const flag = FEATURE_FLAGS[flagId];

  if (!flag) return false;
  if (!flag.defaultValue) return false;

  // 특정 사용자
  if (flag.enabledForUsers?.includes(userId || '')) {
    return true;
  }

  // 롤아웃 퍼센티지
  if (flag.rolloutPercentage !== undefined && userId) {
    const hash = hashUserId(userId);
    const bucket = hash % 100;
    return bucket < flag.rolloutPercentage;
  }

  return flag.defaultValue;
}
```

## 사용 패턴

### 클라이언트 컴포넌트

```tsx
// components/NewFeature.tsx
'use client';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';

export function NewFeature() {
  const isEnabled = useFeatureFlag('enableCoreImageEngine');

  if (!isEnabled) {
    return <LegacyFeature />;
  }

  return <NewFeatureImplementation />;
}
```

### 서버 컴포넌트

```tsx
// app/(main)/analysis/page.tsx
import { isFeatureEnabled } from '@/lib/feature-flags/server';

export default async function AnalysisPage() {
  const useNewEngine = await isFeatureEnabled('enableCoreImageEngine');

  return <div>{useNewEngine ? <NewAnalysisEngine /> : <LegacyAnalysisEngine />}</div>;
}
```

### API 라우트

```typescript
// app/api/analyze/skin/route.ts
import { isFeatureEnabled } from '@/lib/feature-flags/server';

export async function POST(request: Request) {
  const useNewPipeline = await isFeatureEnabled('enableCoreImageEngine');

  if (useNewPipeline) {
    return handleWithNewPipeline(request);
  }

  return handleWithLegacyPipeline(request);
}
```

### 조건부 래퍼

```tsx
// components/FeatureGate.tsx
interface FeatureGateProps {
  flag: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  const isEnabled = useFeatureFlag(flag);

  if (!isEnabled) {
    return fallback;
  }

  return <>{children}</>;
}

// 사용
<FeatureGate flag="experimentNewOnboarding" fallback={<OldOnboarding />}>
  <NewOnboarding />
</FeatureGate>;
```

## 롤아웃 전략

### 점진적 롤아웃

```typescript
// 롤아웃 스케줄 예시
const ROLLOUT_SCHEDULE = {
  'enable-core-image-engine': [
    { date: '2026-01-20', percentage: 5 }, // 5% 시작
    { date: '2026-01-25', percentage: 25 }, // 문제 없으면 25%
    { date: '2026-01-30', percentage: 50 }, // 50%
    { date: '2026-02-05', percentage: 100 }, // 전체 출시
  ],
};
```

### 롤백 트리거

```typescript
// 자동 롤백 조건
const ROLLBACK_CRITERIA = {
  errorRateThreshold: 10, // 에러율 10% 초과
  latencyThreshold: 5000, // 응답 5초 초과
  fallbackRateThreshold: 20, // Fallback 20% 초과
};

// 모니터링에서 자동 비활성화
if (errorRate > ROLLBACK_CRITERIA.errorRateThreshold) {
  await disableFeatureFlag('enable-core-image-engine');
  await sendAlert('Feature auto-disabled due to high error rate');
}
```

## 정리 규칙

### 플래그 수명 관리

```typescript
// 만료된 플래그 확인 스크립트
// scripts/check-expired-flags.ts
Object.entries(FEATURE_FLAGS).forEach(([key, flag]) => {
  if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) {
    console.warn(`⚠️ Flag "${key}" has expired on ${flag.expiresAt}`);
  }
});
```

### 제거 체크리스트

```markdown
피처 플래그 제거 전:

1. [ ] 롤아웃 100% 완료
2. [ ] 2주간 안정적 운영 확인
3. [ ] 플래그 참조 코드 전부 제거
4. [ ] 레거시 코드 경로 제거
5. [ ] 설정에서 플래그 삭제
```

## 네이밍 규칙

```typescript
// 명확한 의도 표현
enableXxx; // 기능 활성화
experimentXxx; // A/B 테스트
disableXxx; // 기능 비활성화 (킬스위치)
allowXxx; // 허용 여부
useNewXxx; // 새 구현 사용

// 예시
enableCoreImageEngine; // ✅ 명확
coreImageEngine; // ❌ 불명확
flag1; // ❌ 의미 없음
```

---

**Version**: 1.0 | **Updated**: 2026-01-15 | ADR-021 보완
