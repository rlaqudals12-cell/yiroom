/**
 * ScreenContainer — 화면 기본 컨테이너
 *
 * SafeAreaView + ScrollView + RefreshControl 통합.
 * 모든 탭/서브 화면에서 일관된 구조를 제공.
 * 배경 그라디언트: 라이트 모드는 반투명 파스텔, 다크 모드는 미묘한 색조로 깊이감 부여.
 */
import { LinearGradient } from 'expo-linear-gradient';
import React, { type ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme , spacing } from '../../lib/theme';

/** 페이지 배경 그라디언트 변형 */
export type BackgroundGradientVariant = 'home' | 'beauty' | 'style' | 'records' | 'profile';

// 웹의 bg-gradient-to-br 패턴 매칭 — 반투명 파스텔 색조
// 다크 모드: 미묘한 색조로 깊이감 부여 (웹 dark:from-slate-950 via-blue-950/20 매칭)
const PAGE_GRADIENTS: Record<BackgroundGradientVariant, { light: readonly string[]; dark: readonly string[] }> = {
  home:    { light: ['#FDFCFB', 'rgba(240,244,255,0.5)', 'rgba(238,240,255,0.5)'], dark: ['#0F0F0F', '#0F1015', '#0F0F18'] },
  beauty:  { light: ['#FDFCFB', 'rgba(255,240,245,0.5)', 'rgba(253,242,248,0.5)'], dark: ['#0F0F0F', '#150F12', '#180F15'] },
  style:   { light: ['#FDFCFB', 'rgba(238,242,255,0.5)', 'rgba(224,231,255,0.5)'], dark: ['#0F0F0F', '#0F0F15', '#0F0E18'] },
  records: { light: ['#FDFCFB', 'rgba(236,253,245,0.5)', 'rgba(220,252,231,0.5)'], dark: ['#0F0F0F', '#0F1510', '#0F1810'] },
  profile: { light: ['#FDFCFB', 'rgba(245,243,255,0.5)', 'rgba(237,233,254,0.5)'], dark: ['#0F0F0F', '#110F15', '#120E18'] },
};

interface ScreenContainerProps {
  /** 콘텐츠 */
  children: ReactNode;
  /** 스크롤 가능 여부 (기본: true) */
  scrollable?: boolean;
  /** Pull-to-Refresh 새로고침 상태 */
  refreshing?: boolean;
  /** Pull-to-Refresh 핸들러 */
  onRefresh?: () => void;
  /** SafeArea edges (기본: top만) */
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  /** 내부 패딩 (기본: horizontal 16) */
  contentPadding?: number;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** ScrollView 추가 스타일 */
  contentContainerStyle?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
  /** 페이지 배경 그라디언트 (라이트: 반투명 파스텔, 다크: 미묘한 색조) */
  backgroundGradient?: BackgroundGradientVariant;
}

export function ScreenContainer({
  children,
  scrollable = true,
  refreshing = false,
  onRefresh,
  edges = ['top'],
  contentPadding = 16,
  style,
  contentContainerStyle,
  testID = 'screen-container',
  backgroundGradient,
}: ScreenContainerProps): React.JSX.Element {
  const { colors, brand: brandColors, isDark } = useTheme();

  // 배경 그라디언트 — 라이트 모드에서만 반투명 파스텔, 다크 모드는 단색
  const gradientColors = backgroundGradient
    ? (isDark ? PAGE_GRADIENTS[backgroundGradient].dark : PAGE_GRADIENTS[backgroundGradient].light)
    : null;

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={brandColors.primary}
      colors={[brandColors.primary]}
    />
  ) : undefined;

  // 배경 그라디언트 레이어 (pointerEvents="none"으로 터치 이벤트 통과)
  const backgroundLayer = gradientColors ? (
    <LinearGradient
      colors={gradientColors as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  ) : null;

  if (!scrollable) {
    return (
      <SafeAreaView
        edges={edges}
        testID={testID}
        style={[
          styles.container,
          { backgroundColor: colors.background },
          style,
        ]}
      >
        {backgroundLayer}
        <View style={[{ paddingHorizontal: contentPadding, flex: 1 }, contentContainerStyle]}>
          {children}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      edges={edges}
      testID={testID}
      style={[
        styles.container,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      {backgroundLayer}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingHorizontal: contentPadding,
            paddingBottom: spacing.lg,
          },
          contentContainerStyle,
        ]}
        refreshControl={refreshControl}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
