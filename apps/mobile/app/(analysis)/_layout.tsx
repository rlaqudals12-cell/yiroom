/**
 * 분석 모듈 레이아웃
 * 슬라이드/페이드 전환 애니메이션 + 반투명 헤더
 */
import { FEATURE_FLAGS } from '@yiroom/shared';
import { Redirect, Stack, useSegments } from 'expo-router';
import { Platform } from 'react-native';

import { BiometricRouteGate } from '@/components/analysis/BiometricRouteGate';
import { VISIBLE_ANALYSIS_MODULES } from '@/lib/analysis/visible-modules';

import { useTheme } from '../../lib/theme';

const STANDALONE_BIOMETRIC_AXES = new Set<string>(VISIBLE_ANALYSIS_MODULES);

function analysisRouteParts(segments: readonly string[]): {
  module: string | undefined;
  screen: string | undefined;
} {
  const groupIndex = segments.indexOf('(analysis)');
  const moduleIndex = groupIndex >= 0 ? groupIndex + 1 : 0;
  return { module: segments[moduleIndex], screen: segments[moduleIndex + 1] };
}

/** 사진 입력·분석 실행 화면만 선제 게이트한다. 이력·루틴 등 조회 표면은 범위 밖이다. */
export function requiresStandaloneAnalysisGate(segments: readonly string[]): boolean {
  const { module, screen } = analysisRouteParts(segments);
  if (!module || !STANDALONE_BIOMETRIC_AXES.has(module)) return false;
  return screen === undefined || screen === 'index' || screen === 'camera' || screen === 'result';
}

function isPostureRoute(segments: readonly string[]): boolean {
  return analysisRouteParts(segments).module === 'posture';
}

export default function AnalysisLayout(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();
  const segments = useSegments();

  // 자세는 출시 범위 밖이다. 하위 파일을 유지하면서도 index/camera/result/history를
  // 포함한 모든 직접 딥링크를 레이아웃 경계에서 먼저 차단한다.
  if (isPostureRoute(segments) && !FEATURE_FLAGS.WELLNESS_PHASE2) {
    return <Redirect href="/(tabs)" />;
  }

  const stack = (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.card,
        },
        headerTintColor: colors.foreground,
        headerTitleStyle: {
          fontWeight: typography.weight.semibold,
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
      <Stack.Screen name="personal-color/history" options={{ title: '퍼스널컬러 이력' }} />
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
      <Stack.Screen name="skin/history" options={{ title: '피부 분석 이력' }} />
      {/* 피부 다이어리·상담·솔루션은 출시 후 재배선 전까지 라우트 등록에서 제외한다. */}
      <Stack.Screen name="skin/diary" redirect options={{ title: '피부 다이어리' }} />
      <Stack.Screen
        name="skin/diary-entry"
        redirect
        options={{
          title: '다이어리 기록',
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="skin/consultation" redirect options={{ title: '피부 상담' }} />
      <Stack.Screen name="skin/solution" redirect options={{ title: '피부 솔루션' }} />
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
      <Stack.Screen name="body/history" options={{ title: '체형 분석 이력' }} />
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
      <Stack.Screen name="hair/history" options={{ title: '헤어 분석 이력' }} />
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
      <Stack.Screen name="makeup/history" options={{ title: '메이크업 이력' }} />
      {/* 통합 분석 (ADR-102) — 미등록 시 헤더에 raw 라우트명(integrated/index) 노출 */}
      <Stack.Screen
        name="integrated/index"
        options={{
          title: '5축 통합 분석',
        }}
      />
      <Stack.Screen
        name="integrated/result/[sessionId]"
        options={{
          title: '통합 분석 결과',
          animation: 'fade_from_bottom',
        }}
      />
      {/* 분석 허브 */}
      <Stack.Screen name="hub" options={{ title: '분석' }} />
      {/* OH-1 구강건강: ADR-098로 완전 제거됨 — 화면 파일이 없으므로 등록하지 않음 */}
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
      {/* 축별 구형 비교 화면은 제네릭 비교 화면으로 통합되어 직접 등록하지 않는다. */}
      <Stack.Screen name="skin/compare" redirect />
      <Stack.Screen name="body/compare" redirect />
      <Stack.Screen name="hair/compare" redirect />
      <Stack.Screen name="makeup/compare" redirect />
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
      <Stack.Screen name="posture/history" options={{ title: '자세 분석 이력' }} />
    </Stack>
  );

  // 통합 분석은 자체 화면에서 연령·동의를 수집하므로 이 게이트의 대상이 아니다.
  return requiresStandaloneAnalysisGate(segments) ? (
    <BiometricRouteGate
      loadingColor={colors.foreground}
      loadingTestID="standalone-analysis-gate-loading"
    >
      {stack}
    </BiometricRouteGate>
  ) : (
    stack
  );
}
