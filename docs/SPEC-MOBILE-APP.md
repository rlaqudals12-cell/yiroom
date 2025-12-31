# 이룸 모바일 앱 개발 스펙

> Expo React Native 기반 모바일 앱 개발 가이드

## 기술 스택

| 분야          | 기술               | 버전   |
| ------------- | ------------------ | ------ |
| Framework     | Expo               | 54.x   |
| Router        | Expo Router        | 6.x    |
| Runtime       | React Native       | 0.81.x |
| UI            | React              | 19.x   |
| Auth          | Clerk Expo         | 2.x    |
| Database      | Supabase           | 2.x    |
| State         | Zustand            | 5.x    |
| Camera        | expo-camera        | 17.x   |
| Notifications | expo-notifications | 0.32.x |

---

## 프로젝트 구조

```
apps/mobile/
├── app/                    # Expo Router 페이지
│   ├── _layout.tsx         # 루트 레이아웃
│   ├── (tabs)/             # 탭 네비게이션
│   │   ├── _layout.tsx
│   │   ├── index.tsx       # 홈 (대시보드, 오늘 할 일, 알림)
│   │   ├── beauty.tsx      # 뷰티 (PC-1, S-1)
│   │   ├── style.tsx       # 스타일 (C-1, 쇼핑)
│   │   ├── records.tsx     # 기록 (W-1, N-1)
│   │   └── profile.tsx     # 마이페이지
│   ├── (auth)/             # 인증 플로우
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── (analysis)/         # 분석 플로우
│   │   ├── personal-color/
│   │   ├── skin/
│   │   └── body/
│   ├── (workout)/          # 운동 플로우
│   └── (nutrition)/        # 영양 플로우
├── components/             # 공통 컴포넌트
├── lib/                    # 비즈니스 로직
│   ├── clerk.ts            # 인증 설정
│   ├── supabase.ts         # DB 클라이언트
│   ├── gemini.ts           # AI 분석
│   └── stores/             # Zustand 스토어
├── assets/                 # 이미지, 폰트
└── store-metadata.json     # 스토어 메타데이터
```

---

## 5탭 네비게이션 구조

```
┌────────────────────────────────────────┐
│                 콘텐츠                  │
├────────────────────────────────────────┤
│  홈  │  뷰티  │  스타일  │  기록  │  나  │
└────────────────────────────────────────┘
```

| 탭         | 아이콘   | 주요 기능                  |
| ---------- | -------- | -------------------------- |
| **홈**     | Home     | 대시보드, 오늘 할 일, 알림 |
| **뷰티**   | Sparkles | PC-1, S-1, 화장품 추천     |
| **스타일** | Shirt    | C-1, 의류/액세서리 추천    |
| **기록**   | Activity | W-1 운동, N-1 영양 트래킹  |
| **나**     | User     | 프로필, 설정, 리포트       |

---

## 핵심 기능 구현

### 1. 카메라 분석 (expo-camera)

```typescript
// app/(analysis)/personal-color/camera.tsx
import { CameraView, useCameraPermissions } from 'expo-camera';

export default function PersonalColorCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: true,
      });
      // Gemini AI 분석 호출
      const result = await analyzePersonalColor(photo.base64);
    }
  };

  return (
    <CameraView
      ref={cameraRef}
      facing="front"
      style={styles.camera}
    >
      {/* 조명 가이드 오버레이 */}
      <LightingGuide />
      <CaptureButton onPress={takePicture} />
    </CameraView>
  );
}
```

### 2. 푸시 알림 (expo-notifications)

```typescript
// lib/notifications.ts
import * as Notifications from 'expo-notifications';

export async function scheduleWorkoutReminder(time: Date) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '운동할 시간이에요!',
      body: '오늘의 운동 플랜을 확인하세요',
    },
    trigger: {
      hour: time.getHours(),
      minute: time.getMinutes(),
      repeats: true,
    },
  });
}

export async function sendWaterReminder() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '물 마실 시간',
      body: '수분 섭취를 잊지 마세요 💧',
    },
    trigger: {
      seconds: 60 * 60 * 2, // 2시간마다
      repeats: true,
    },
  });
}
```

### 3. 오프라인 지원

```typescript
// lib/offline.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export const offlineStore = {
  // 오프라인 데이터 저장
  saveOffline: async (key: string, data: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  },

  // 온라인 복귀 시 동기화
  syncWhenOnline: async () => {
    const state = await NetInfo.fetch();
    if (state.isConnected) {
      const pendingData = await AsyncStorage.getItem('pending_sync');
      if (pendingData) {
        await syncToSupabase(JSON.parse(pendingData));
        await AsyncStorage.removeItem('pending_sync');
      }
    }
  },
};
```

---

## 웹과 공유 코드

### packages/shared/ 활용

```typescript
// packages/shared/src/types.ts
export interface AnalysisResult {
  personalColor?: PersonalColorResult;
  skinAnalysis?: SkinAnalysisResult;
  bodyType?: BodyTypeResult;
}

// packages/shared/src/utils.ts
export function calculateBMI(weight: number, height: number): number {
  return weight / (height / 100) ** 2;
}
```

### 웹/앱 공통 로직

| 영역          | 공유       | 플랫폼별    |
| ------------- | ---------- | ----------- |
| 타입 정의     | ✅ shared  | -           |
| 분석 알고리즘 | ✅ shared  | -           |
| API 호출      | ❌         | fetch vs RN |
| UI 컴포넌트   | ❌         | React vs RN |
| 스토어 로직   | ✅ zustand | -           |

---

## 개발 단계

### Week 1: 환경 설정 ✅

- [x] Expo 프로젝트 구성 확인
- [x] EAS Build 설정 (eas.json)
- [x] 5탭 네비게이션 구현 (홈/뷰티/스타일/기록/나)
- [x] 디자인 시스템 (NativeWind v4 + StyleSheet 하이브리드)

### Week 2: 인증 + DB ✅

- [x] Clerk 로그인/회원가입 (sign-in, sign-up)
- [x] Supabase 연동 (useClerkSupabaseClient)
- [x] 사용자 프로필 동기화 (profile.tsx)
- [x] 온보딩 플로우 (personal-color/index.tsx)

### Week 3: 분석 기능 ✅

- [x] PC-1 카메라 분석 (문진 + 카메라 + 결과)
- [x] S-1 피부 분석 (index + camera + result)
- [x] C-1 체형 분석 (index + result)
- [x] Gemini AI 연동 (lib/gemini.ts)

### Week 4: 트래킹 🔄

- [x] 홈 탭 대시보드 (오늘의 요약, 오늘 할 일, 알림 요약)
- [x] 데이터 훅 (useWorkoutData, useNutritionData)
- [ ] W-1 운동 기록 상세 화면
- [ ] N-1 영양 기록 상세 화면 (카메라 음식 인식)
- [ ] 물 섭취 트래킹 UI

### Week 5: 쇼핑 + 알림 🔄

- [ ] 제품 추천 리스트 화면
- [ ] 어필리에이트 링크 연동
- [x] 푸시 알림 시스템 (lib/notifications.ts)
- [x] 알림 스케줄링 (workout, meal, streak)

### Week 6: 테스트 + 배포

- [ ] 단위 테스트
- [ ] E2E 테스트 (Detox)
- [ ] TestFlight 배포
- [ ] 내부 테스트

---

## 빌드 및 배포

### EAS Build 프로필

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "simulator": false
      }
    },
    "production": {
      "autoIncrement": true
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your@email.com",
        "ascAppId": "123456789"
      },
      "android": {
        "serviceAccountKeyPath": "./google-services.json"
      }
    }
  }
}
```

### 배포 명령어

```bash
# 개발 빌드 (시뮬레이터/실기기 디버깅)
npm run build:dev:ios
npm run build:dev:android

# 프리뷰 빌드 (내부 테스트)
npm run build:preview

# 프로덕션 빌드
npm run build:production
```

---

## 스토어 제출 준비

### iOS (App Store)

- [ ] Apple Developer 계정
- [ ] App Store Connect 앱 생성
- [ ] 스크린샷 10장 (6.5", 5.5", 12.9")
- [ ] 앱 설명 (한국어, 영어)
- [ ] 개인정보 처리방침 URL
- [ ] 심사 메모 (테스트 계정)

### Android (Play Store)

- [ ] Google Play Console 계정
- [ ] 앱 서명 키
- [ ] 스크린샷 8장
- [ ] 피처 그래픽 (1024x500)
- [ ] 개인정보 처리방침 URL
- [ ] 데이터 안전 섹션

### 메타데이터 (store-metadata.json)

```json
{
  "app": {
    "name": "이룸 - 온전한 나는?",
    "subtitle": "AI 퍼스널 컬러, 피부, 체형 분석"
  },
  "ios": {
    "category": "Health & Fitness",
    "ageRating": "4+"
  }
}
```

---

## 테스트 전략

### 단위 테스트 (Jest)

```typescript
// __tests__/analysis.test.ts
describe('Personal Color Analysis', () => {
  it('should classify warm tone correctly', () => {
    const result = classifyTone({ r: 255, g: 200, b: 180 });
    expect(result.undertone).toBe('warm');
  });
});
```

### E2E 테스트 (Detox)

```typescript
// e2e/analysis.e2e.ts
describe('Analysis Flow', () => {
  it('should complete personal color analysis', async () => {
    await element(by.id('start-analysis')).tap();
    await element(by.id('take-photo')).tap();
    await expect(element(by.id('result-screen'))).toBeVisible();
  });
});
```

---

## 문서 이력

| 버전 | 날짜       | 변경 내용                                     |
| ---- | ---------- | --------------------------------------------- |
| 1.0  | 2025-12-31 | 초기 작성                                     |
| 1.1  | 2026-01-01 | Week 1-3 완료, Week 4-5 진행 중 상태 업데이트 |

---

**현재 진행률**: Week 4 트래킹 (70% 완료)

**다음 단계**: 운동/영양 상세 화면 구현
