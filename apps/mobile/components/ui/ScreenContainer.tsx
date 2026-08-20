/**
 * ScreenContainer — 화면 기본 컨테이너
 *
 * SafeAreaView + ScrollView + RefreshControl 통합.
 * 모든 탭/서브 화면에서 일관된 구조를 제공.
 * ADR-120에 따라 배경은 테마의 단색 지면만 사용한다.
 */
import React, { type ReactNode } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme, spacing } from '../../lib/theme';

/** 페이지 배경 그라디언트 변형 */
export type BackgroundGradientVariant =
  | 'home'
  | 'beauty'
  | 'style'
  | 'records'
  | 'profile'
  | 'nutrition'
  | 'workout'
  | 'analysis'
  | 'social';

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
  /** @deprecated 호출부 호환용. 모든 변형은 테마 단색 지면으로 렌더한다. */
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
}: ScreenContainerProps): React.JSX.Element {
  const { colors, brand: brandColors } = useTheme();

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={brandColors.primary}
      colors={[brandColors.primary]}
    />
  ) : undefined;

  const bgColor = colors.background;

  if (!scrollable) {
    return (
      <SafeAreaView
        edges={edges}
        testID={testID}
        style={[styles.container, { backgroundColor: bgColor }, style]}
      >
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
      style={[styles.container, { backgroundColor: bgColor }, style]}
    >
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
        nestedScrollEnabled
        removeClippedSubviews
        overScrollMode="always"
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
