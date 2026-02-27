/**
 * ScreenContainer — 화면 기본 컨테이너
 *
 * SafeAreaView + ScrollView + RefreshControl 통합.
 * 모든 탭/서브 화면에서 일관된 구조를 제공.
 */
import React, { useCallback, type ReactNode } from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '../../lib/theme';

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
  const { colors, brand } = useTheme();

  const refreshControl = onRefresh ? (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={brand.primary}
      colors={[brand.primary]}
    />
  ) : undefined;

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
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          {
            paddingHorizontal: contentPadding,
            paddingBottom: 24,
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
