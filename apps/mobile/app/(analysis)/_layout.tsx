/**
 * 분석 모듈 레이아웃
 * 슬라이드/페이드 전환 애니메이션 + 반투명 헤더
 */
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

import { useTheme } from '../../lib/theme';

export default function AnalysisLayout(): React.JSX.Element {
  const { colors, isDark } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerBackTitle: '뒤로',
        // 전환 애니메이션
        animation: 'slide_from_right',
        animationDuration: 280,
        // iOS 헤더 블러 효과
        ...(Platform.OS === 'ios' && {
          headerBlurEffect: isDark ? 'dark' : 'light',
          headerTransparent: true,
        }),
      }}
    >
      <Stack.Screen
        name="personal-color/index"
        options={{
          title: '퍼스널 컬러 진단',
        }}
      />
      <Stack.Screen
        name="personal-color/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="personal-color/result"
        options={{
          title: '진단 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/index"
        options={{
          title: '피부 분석',
        }}
      />
      <Stack.Screen
        name="skin/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/routine"
        options={{
          title: '스킨케어 루틴',
        }}
      />
      <Stack.Screen
        name="body/index"
        options={{
          title: '체형 분석',
        }}
      />
      <Stack.Screen
        name="body/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* H-1 헤어 분석 */}
      <Stack.Screen
        name="hair/index"
        options={{
          title: '헤어 분석',
        }}
      />
      <Stack.Screen
        name="hair/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="hair/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* M-1 메이크업 분석 */}
      <Stack.Screen
        name="makeup/index"
        options={{
          title: '메이크업 분석',
        }}
      />
      <Stack.Screen
        name="makeup/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="makeup/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* OH-1 구강건강 분석 */}
      <Stack.Screen
        name="oral-health/index"
        options={{
          title: '구강건강 분석',
        }}
      />
      <Stack.Screen
        name="oral-health/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="oral-health/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* Posture 자세 분석 */}
      <Stack.Screen
        name="posture/index"
        options={{
          title: '자세 분석',
        }}
      />
      <Stack.Screen
        name="posture/camera"
        options={{
          title: '사진 촬영',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="posture/result"
        options={{
          title: '분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
    </Stack>
  );
}
