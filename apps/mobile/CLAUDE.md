# 이룸 모바일 앱 (Expo React Native)

> apps/mobile 전용 Claude Code 규칙

## 기술 스택

- **Framework**: Expo 54 + Expo Router 6
- **UI**: React Native + NativeWind (Tailwind)
- **Auth**: Clerk (@clerk/clerk-expo)
- **DB**: Supabase (@supabase/supabase-js)
- **AI**: Google Gemini
- **State**: Zustand

## 핵심 규칙

### 웹과 다른 점

```typescript
// ❌ 웹 방식 (사용 금지)
import { useAuth } from '@clerk/nextjs';
<div className="p-4">

// ✅ 앱 방식
import { useAuth } from '@clerk/clerk-expo';
<View className="p-4">  // NativeWind
```

### 파일 구조

```
app/           # Expo Router 페이지
├── (tabs)/    # 5탭 네비게이션
├── (auth)/    # 인증 플로우
├── (analysis)/ # 분석 플로우
└── ...

components/    # React Native 컴포넌트
lib/           # 비즈니스 로직
```

### 공유 코드 사용

```typescript
// 타입, 알고리즘은 shared에서 import
import { WorkoutType, classifyWorkoutType } from '@yiroom/shared';

// 플랫폼 전용 코드는 로컬에서
import { useClerkSupabaseClient } from '@/lib/supabase';
```

## 명령어

```bash
npm start              # Expo 개발 서버
npm run ios            # iOS 시뮬레이터
npm run android        # Android 에뮬레이터
npm run build:dev:ios  # EAS 개발 빌드
npm run typecheck      # 타입 체크
```

## 카메라 분석 패턴

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

// 권한 요청 → 촬영 → Gemini 분석 → 결과 저장
```

## 주의사항

- `div`, `span` 사용 금지 → `View`, `Text` 사용
- `onClick` 사용 금지 → `onPress` 사용
- 웹 전용 Hook 사용 금지 (useRouter from next/navigation 등)
- StyleSheet 대신 NativeWind className 사용 권장
