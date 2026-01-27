# 모바일 패턴

> Expo/React Native 개발 규칙 (apps/mobile)

## 기술 스택

| 분야      | 기술                         |
| --------- | ---------------------------- |
| Framework | Expo SDK 54 + React Native   |
| 라우팅    | Expo Router                  |
| 인증      | @clerk/clerk-expo            |
| DB        | Supabase (웹과 동일)         |
| 스타일링  | NativeWind (Tailwind for RN) |
| 상태 관리 | React Context + Hooks        |
| 푸시 알림 | Expo Notifications           |

## 폴더 구조

### 전체 구조

```
apps/mobile/
├── app/                    # Expo Router
│   ├── (tabs)/             # 하단 5탭
│   │   ├── index.tsx       # 홈
│   │   ├── workout.tsx     # 운동
│   │   ├── nutrition.tsx   # 영양
│   │   ├── records.tsx     # 기록
│   │   └── profile.tsx     # 프로필
│   ├── (auth)/             # 인증 플로우
│   ├── (analysis)/         # AI 분석
│   └── _layout.tsx         # 루트 레이아웃
├── components/             # RN 컴포넌트
├── lib/                    # 비즈니스 로직
├── hooks/                  # 커스텀 훅
└── constants/              # 상수
```

### 상세 디렉토리 구조

```
apps/mobile/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx          # 탭 레이아웃
│   │   ├── index.tsx            # 홈 (대시보드)
│   │   ├── workout.tsx          # 운동 탭
│   │   ├── nutrition.tsx        # 영양 탭
│   │   ├── records.tsx          # 기록/리포트 탭
│   │   └── profile.tsx          # 프로필 탭
│   ├── (auth)/
│   │   ├── _layout.tsx          # 인증 레이아웃
│   │   ├── sign-in.tsx          # 로그인
│   │   ├── sign-up.tsx          # 회원가입
│   │   └── onboarding.tsx       # 온보딩
│   ├── (analysis)/
│   │   ├── _layout.tsx          # 분석 레이아웃
│   │   ├── camera.tsx           # 카메라 촬영
│   │   ├── personal-color.tsx   # 퍼스널컬러
│   │   ├── skin.tsx             # 피부 분석
│   │   ├── body.tsx             # 체형 분석
│   │   └── result/
│   │       └── [id].tsx         # 분석 결과
│   └── _layout.tsx              # 루트 레이아웃
├── components/
│   ├── analysis/                # 분석 관련 컴포넌트
│   │   ├── CameraOverlay.tsx
│   │   ├── FaceGuide.tsx
│   │   └── AnalysisResult.tsx
│   ├── common/                  # 공통 UI
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── LoadingSpinner.tsx
│   ├── workout/                 # 운동 관련
│   └── nutrition/               # 영양 관련
├── lib/
│   ├── api/                     # API 클라이언트
│   │   ├── client.ts
│   │   └── endpoints.ts
│   ├── camera/                  # 카메라 유틸리티
│   │   ├── permissions.ts
│   │   └── image-processing.ts
│   ├── supabase/                # Supabase 클라이언트
│   └── utils/                   # 유틸리티
├── hooks/
│   ├── useCamera.ts             # 카메라 훅
│   ├── useAnalysis.ts           # 분석 훅
│   └── useOfflineSync.ts        # 오프라인 동기화
├── contexts/
│   ├── AuthContext.tsx
│   └── OfflineContext.tsx
├── constants/
│   ├── colors.ts                # 색상 상수
│   ├── layout.ts                # 레이아웃 상수
│   └── api.ts                   # API 상수
└── types/
    ├── navigation.ts            # 네비게이션 타입
    └── analysis.ts              # 분석 타입
```

## 컴포넌트 패턴

### 기본 컴포넌트 구조

```tsx
// components/workout/WorkoutCard.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { styled } from 'nativewind';

const StyledPressable = styled(Pressable);
const StyledView = styled(View);
const StyledText = styled(Text);

interface WorkoutCardProps {
  workout: Workout;
  onPress: () => void;
}

export function WorkoutCard({ workout, onPress }: WorkoutCardProps) {
  return (
    <StyledPressable
      className="bg-white rounded-xl p-4 shadow-sm"
      onPress={onPress}
      testID="workout-card"
    >
      <StyledView className="flex-row items-center">
        <StyledText className="text-lg font-bold">{workout.name}</StyledText>
      </StyledView>
    </StyledPressable>
  );
}
```

### 리스트 컴포넌트

```tsx
// FlatList 사용 필수 (ScrollView 내 map 금지)
import { FlatList } from 'react-native';

export function WorkoutList({ workouts }: Props) {
  return (
    <FlatList
      data={workouts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <WorkoutCard workout={item} onPress={() => {}} />}
      ItemSeparatorComponent={() => <View className="h-3" />}
      contentContainerStyle={{ padding: 16 }}
    />
  );
}
```

## 네비게이션 패턴

### 탭 네비게이션

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Home, Dumbbell, Apple, Calendar, User } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color }) => <Home color={color} size={24} />,
        }}
      />
      {/* ... */}
    </Tabs>
  );
}
```

### 스택 네비게이션

```tsx
// app/(analysis)/_layout.tsx
import { Stack } from 'expo-router';

export default function AnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: '뒤로',
      }}
    >
      <Stack.Screen name="personal-color" options={{ title: '퍼스널컬러 분석' }} />
    </Stack>
  );
}
```

### 프로그래매틱 네비게이션

```tsx
import { router } from 'expo-router';

// 이동
router.push('/analysis/personal-color');

// 교체 (뒤로가기 불가)
router.replace('/dashboard');

// 뒤로가기
router.back();

// 파라미터 전달
router.push({
  pathname: '/analysis/result/[id]',
  params: { id: 'analysis_123' },
});
```

## 상태 관리

### Context 패턴

```tsx
// contexts/AuthContext.tsx
import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-expo';

interface AuthContextType {
  userId: string | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { userId, isLoaded } = useAuth();

  return (
    <AuthContext.Provider value={{ userId, isLoading: !isLoaded }}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
```

## 오프라인 지원

### 오프라인 Context

```tsx
// contexts/OfflineContext.tsx
import NetInfo from '@react-native-community/netinfo';

export function OfflineProvider({ children }: Props) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingOps, setPendingOps] = useState<OfflineOperation[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
      if (state.isConnected) {
        syncPendingOperations();
      }
    });
    return unsubscribe;
  }, []);

  return (
    <OfflineContext.Provider value={{ isOnline, pendingOps }}>{children}</OfflineContext.Provider>
  );
}
```

### AsyncStorage 캐싱

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

// 캐시 저장
async function cacheData<T>(key: string, data: T, ttlMs = 86400000) {
  await AsyncStorage.setItem(
    key,
    JSON.stringify({
      data,
      expiresAt: Date.now() + ttlMs,
    })
  );
}

// 캐시 조회
async function getCachedData<T>(key: string): Promise<T | null> {
  const cached = await AsyncStorage.getItem(key);
  if (!cached) return null;

  const { data, expiresAt } = JSON.parse(cached);
  if (Date.now() > expiresAt) {
    await AsyncStorage.removeItem(key);
    return null;
  }
  return data;
}
```

## 푸시 알림

### 알림 설정

```tsx
// lib/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Push notifications require physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
```

### 알림 처리

```tsx
// app/_layout.tsx
useEffect(() => {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const { screen, id } = response.notification.request.content.data;
    if (screen) {
      router.push({ pathname: screen, params: { id } });
    }
  });
  return () => subscription.remove();
}, []);
```

## 성능 최적화

### 메모이제이션

```tsx
// 비용이 큰 컴포넌트만 memo 사용
import { memo } from 'react';

export const HeavyComponent = memo(function HeavyComponent({ data }: Props) {
  // ...
});

// useMemo: 복잡한 계산
const sortedData = useMemo(() => {
  return data.sort((a, b) => b.score - a.score);
}, [data]);

// useCallback: 자식에게 전달하는 콜백
const handlePress = useCallback((id: string) => {
  router.push(`/detail/${id}`);
}, []);
```

### 이미지 최적화

```tsx
import { Image } from 'expo-image';

// expo-image 사용 (캐싱 자동)
<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  style={{ width: 100, height: 100 }}
/>;
```

## 테스트

```bash
# Jest 테스트
cd apps/mobile
npm run test

# 특정 파일
npm run test -- WorkoutCard.test.tsx
```

```tsx
// components/__tests__/WorkoutCard.test.tsx
import { render, fireEvent } from '@testing-library/react-native';
import { WorkoutCard } from '../WorkoutCard';

describe('WorkoutCard', () => {
  it('should render workout name', () => {
    const { getByText } = render(
      <WorkoutCard workout={{ id: '1', name: '스쿼트' }} onPress={() => {}} />
    );
    expect(getByText('스쿼트')).toBeTruthy();
  });
});
```

## 빌드 및 배포

```bash
# 개발 빌드
eas build --profile development --platform ios
eas build --profile development --platform android

# 프로덕션 빌드
eas build --profile production --platform all

# 스토어 제출
eas submit --platform ios
eas submit --platform android
```

## 카메라/이미지 처리

### 카메라 권한 요청

```tsx
// lib/camera/permissions.ts
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

export async function requestCameraPermissions(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync();
  return status === 'granted';
}

export async function requestMediaLibraryPermissions(): Promise<boolean> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
}
```

### 이미지 촬영/선택 훅

```tsx
// hooks/useCamera.ts
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface UseCameraResult {
  image: string | null;
  isLoading: boolean;
  takePhoto: () => Promise<void>;
  pickImage: () => Promise<void>;
  resetImage: () => void;
}

export function useCamera(): UseCameraResult {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const processImage = useCallback(async (uri: string) => {
    // 이미지 리사이즈 및 압축 (AI 분석용)
    const processed = await manipulateAsync(uri, [{ resize: { width: 1024 } }], {
      compress: 0.8,
      format: SaveFormat.JPEG,
    });
    return processed.uri;
  }, []);

  const takePhoto = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4], // 얼굴 분석용 비율
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedUri = await processImage(result.assets[0].uri);
        setImage(processedUri);
      }
    } finally {
      setIsLoading(false);
    }
  }, [processImage]);

  const pickImage = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const processedUri = await processImage(result.assets[0].uri);
        setImage(processedUri);
      }
    } finally {
      setIsLoading(false);
    }
  }, [processImage]);

  const resetImage = useCallback(() => {
    setImage(null);
  }, []);

  return { image, isLoading, takePhoto, pickImage, resetImage };
}
```

### 실시간 카메라 프리뷰

```tsx
// components/analysis/CameraPreview.tsx
import { Camera, CameraType } from 'expo-camera';
import { View, StyleSheet } from 'react-native';

interface CameraPreviewProps {
  onCapture: (uri: string) => void;
}

export function CameraPreview({ onCapture }: CameraPreviewProps) {
  const cameraRef = useRef<Camera>(null);

  const handleCapture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      onCapture(photo.uri);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <Camera ref={cameraRef} style={StyleSheet.absoluteFill} type={CameraType.front} ratio="3:4" />
      {/* 얼굴 가이드 오버레이 */}
      <FaceGuideOverlay />
    </View>
  );
}
```

## 플랫폼별 코드 패턴

### Platform.select 사용

```tsx
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.select({
      ios: 44, // iOS 노치 고려
      android: 24, // Android 상태바
      default: 0,
    }),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

### 플랫폼별 파일 분리

```
components/
├── Button.tsx          # 공통 인터페이스
├── Button.ios.tsx      # iOS 구현
└── Button.android.tsx  # Android 구현
```

```tsx
// Button.tsx (공통 인터페이스)
export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}

// Button.ios.tsx
import { ButtonProps } from './Button';
export function Button({ title, onPress, variant }: ButtonProps) {
  // iOS 특화 구현 (SF Symbols, 햅틱 등)
}

// Button.android.tsx
import { ButtonProps } from './Button';
export function Button({ title, onPress, variant }: ButtonProps) {
  // Android 특화 구현 (Material Design)
}
```

### Safe Area 처리

```tsx
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// 방법 1: SafeAreaView 컴포넌트
export function Screen({ children }: Props) {
  return <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>;
}

// 방법 2: useSafeAreaInsets 훅 (더 세밀한 제어)
export function CustomHeader() {
  const insets = useSafeAreaInsets();

  return <View style={{ paddingTop: insets.top }}>{/* 헤더 내용 */}</View>;
}
```

## 제스처 처리

### React Native Gesture Handler

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export function SwipeableCard({ onSwipe }: Props) {
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 100) {
        // 스와이프 완료
        onSwipe(event.translationX > 0 ? 'right' : 'left');
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={animatedStyle}>{/* 카드 내용 */}</Animated.View>
    </GestureDetector>
  );
}
```

---

**Version**: 2.0 | **Updated**: 2026-01-20 | 상세 폴더 구조, 카메라/이미지 처리, 플랫폼별 코드 패턴 추가
**관련 규칙**: [code-style.md](./code-style.md)
