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
        name="personal-color/history"
        options={{ title: '퍼스널컬러 이력' }}
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
        name="skin/history"
        options={{ title: '피부 분석 이력' }}
      />
      <Stack.Screen
        name="skin/diary"
        options={{ title: '피부 다이어리' }}
      />
      <Stack.Screen
        name="skin/diary-entry"
        options={{
          title: '다이어리 기록',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="skin/consultation"
        options={{ title: '피부 상담' }}
      />
      <Stack.Screen
        name="skin/solution"
        options={{ title: '피부 솔루션' }}
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
      <Stack.Screen
        name="body/history"
        options={{ title: '체형 분석 이력' }}
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
      <Stack.Screen
        name="hair/history"
        options={{ title: '헤어 분석 이력' }}
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
      <Stack.Screen
        name="makeup/history"
        options={{ title: '메이크업 이력' }}
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
      <Stack.Screen
        name="oral-health/history"
        options={{ title: '구강건강 이력' }}
      />
      {/* 분석 이력 */}
      <Stack.Screen
        name="history/index"
        options={{
          title: '분석 이력',
        }}
      />
      {/* 분석 비교 (제네릭) */}
      <Stack.Screen
        name="compare"
        options={{
          title: '분석 비교',
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
      <Stack.Screen
        name="posture/history"
        options={{ title: '자세 분석 이력' }}
      />
    </Stack>
  );
}
