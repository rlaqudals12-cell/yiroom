# 이룸 공유 패키지 (@yiroom/shared)

> packages/shared 전용 Claude Code 규칙

## 목적

웹(Next.js)과 앱(Expo)에서 공유하는 코드

## 포함 대상

```
✅ 포함:
├── 타입 정의 (TypeScript interfaces)
├── 분석 알고리즘 (순수 함수)
├── 계산 함수 (BMI, 칼로리 등)
├── 유효성 검사
├── 상수/설정값
└── 유틸리티 함수

❌ 제외:
├── UI 컴포넌트 (React/React Native 의존)
├── 라우팅 로직
├── Supabase 클라이언트 (플랫폼별 다름)
├── 플랫폼 API (카메라, 알림 등)
└── SSR/서버 전용 코드
```

## 핵심 규칙

### 플랫폼 의존성 금지

```typescript
// ❌ 금지
import { View } from 'react-native';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// ✅ 허용
export type WorkoutType = 'toner' | 'builder' | 'burner';
export function calculateBMI(weight: number, height: number): number {
  return weight / (height / 100) ** 2;
}
```

### 순수 함수만 작성

```typescript
// ✅ 좋은 예: 입력 → 출력, 부작용 없음
export function classifyWorkoutType(input: WorkoutInput): WorkoutType {
  // 계산 로직만
}

// ❌ 나쁜 예: 외부 상태 의존
export function getUser() {
  return supabase.from('users').select(); // Supabase 의존
}
```

## 폴더 구조

```
src/
├── index.ts          # 모든 export 통합
├── types/
│   ├── index.ts
│   ├── user.ts
│   ├── workout.ts
│   ├── nutrition.ts
│   └── products.ts
├── workout/
│   ├── index.ts
│   ├── classify.ts
│   └── tips.ts
├── products/
│   └── matching.ts
└── utils/
    ├── index.ts
    ├── validation.ts
    └── formatters.ts
```

## Export 규칙

```typescript
// src/index.ts에서 모든 것을 re-export
export * from './types';
export * from './workout';
export * from './products';
export * from './utils';

// 사용처에서는 단일 import
import { WorkoutType, classifyWorkoutType, formatPrice } from '@yiroom/shared';
```

## 테스트

```bash
# packages/shared 디렉토리에서
npm run test
```

모든 공유 함수는 테스트 필수.

## 주의사항

- 이 패키지를 수정하면 웹과 앱 모두에 영향
- 타입 변경 시 양쪽 빌드 확인 필요
- 새 함수 추가 시 index.ts에 export 추가
