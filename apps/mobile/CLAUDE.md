# 이룸 모바일 앱 (Expo React Native)

> apps/mobile 전용 Claude Code 규칙

## 기술 스택

- **Framework**: Expo SDK 54 + Expo Router 6
- **UI**: React Native + NativeWind (Tailwind)
- **Auth**: Clerk (@clerk/clerk-expo)
- **DB**: Supabase (@supabase/supabase-js)
- **AI**: Google Gemini (Flash)
- **State**: Zustand
- **Icons**: Lucide React Native (이모지 지양, 웹과 통일)
- **Primary Color**: `#EC4899` (웹과 동일)

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
# 개발
npm start              # Expo 개발 서버
npm run ios            # iOS 시뮬레이터
npm run android        # Android 에뮬레이터
npm run typecheck      # 타입 체크

# EAS 빌드 (클라우드)
eas build --profile development --platform android   # 개발 APK
eas build --profile preview --platform android       # QA APK
eas build --profile production --platform android    # 스토어 AAB

# 스토어 제출
eas submit --platform android --profile production   # Google Play
```

## EAS 빌드 주의사항

- **`.easignore`는 모노레포 루트**에 위치 (`apps/mobile/`이 아님)
- **`eas build --local`은 Windows 미지원** (macOS/Linux만 가능)
- **metro.config.js**: `watchFolders` 기본값 유지 + `extraNodeModules`로 React 핀 고정 필수
- **한글 파일명 docs/**: `.easignore`에서 제외 (Linux tar 추출 실패 방지)
- **Free 플랜**: Android 30회/월 제한. Production 종량제 $1/빌드 권장

## 카메라 분석 패턴

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';

// 권한 요청 → 촬영 → Gemini 분석 → 결과 저장
```

## 웹-모바일 동기화 원칙

> 상세: ADR-086 (웹-모바일 격차 해소), ADR-088 (VTO 모바일 렌더링)

| 항목                         | 원칙                                   |
| ---------------------------- | -------------------------------------- |
| 디자인 토큰 (색상/폰트/간격) | 웹 기준 100% 동기화                    |
| 아이콘                       | Lucide SVG 통일 (이모지 지양)          |
| Primary 색상                 | `#EC4899` (웹+모바일 통일)             |
| 텍스트 표기                  | 웹 기준 통일 ("퍼스널 컬러" 등)        |
| 레이아웃                     | 모바일 UX 우선 (CollapsibleSection 등) |
| 설명문 톤                    | 짧은 기능톤 유지 (P4 단순화)           |

## 주의사항

- `div`, `span` 사용 금지 → `View`, `Text` 사용
- `onClick` 사용 금지 → `onPress` 사용
- 웹 전용 Hook 사용 금지 (useRouter from next/navigation 등)
- StyleSheet 대신 NativeWind className 사용 권장
- 테스트에서 `useTheme()` 컴포넌트는 `ThemeContext.Provider` 래핑 필수

## 플랫폼 지원

| 플랫폼      | 상태         | 비고                                                     |
| ----------- | ------------ | -------------------------------------------------------- |
| **Android** | 출시 준비 중 | EAS production 빌드 + Google Play 제출 설정 완료         |
| **iOS**     | 향후 목표    | EAS 빌드 프로파일 존재, Apple Developer 계정/서명 미설정 |

> iOS `eas submit` 설정은 Apple Developer Program 가입 후 추가 예정.

## 현황

- **253+ 컴포넌트** | **131 라우트** | **92 lib 모듈** | **4,161 tests**
- 웹-모바일 디자인 동기화 95% 완료 (3/18)
- 버전: v1.0.0

---

**Version**: 2.0 | **Updated**: 2026-03-26
