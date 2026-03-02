/**
 * LeaderboardTabs -- 리더보드 기간 탭 바
 *
 * 주간/월간/전체 등 리더보드 기간 전환용 탭 바.
 * Reanimated 인디케이터 슬라이드 애니메이션 + 햅틱 피드백.
 */
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface LeaderboardTab {
  /** 탭 식별 키 */
  key: string;
  /** 탭 라벨 (한국어) */
  label: string;
}

export interface LeaderboardTabsProps {
  /** 현재 활성 탭 키 */
  activeTab: string;
  /** 탭 변경 핸들러 */
  onTabChange: (key: string) => void;
  /** 탭 목록 */
  tabs: LeaderboardTab[];
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

const SPRING_CONFIG = { damping: 20, stiffness: 200 };

export function LeaderboardTabs({
  activeTab,
  onTabChange,
  tabs,
  style,
  testID = 'leaderboard-tabs',
}: LeaderboardTabsProps): React.JSX.Element {
  const { colors, brand, typography, radii, spacing } = useTheme();

  // 현재 활성 탭 인덱스
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);
  const tabWidth = useSharedValue(0);
  const indicatorX = useSharedValue(0);

  // 탭 클릭 핸들러
  const handleTabPress = useCallback(
    (key: string, index: number) => {
      if (key === activeTab) return;
      Haptics.selectionAsync();
      onTabChange(key);
    },
    [activeTab, onTabChange],
  );

  return (
    <View
      testID={testID}
      style={[styles.container, { backgroundColor: colors.secondary, borderRadius: radii.lg }, style]}
      accessibilityRole="tablist"
    >
      {tabs.map((tab, index) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => handleTabPress(tab.key, index)}
            style={[
              styles.tab,
              {
                borderRadius: radii.md,
                backgroundColor: isActive ? colors.card : 'transparent',
              },
              isActive && styles.activeTab,
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={tab.label}
          >
            <Text
              style={{
                color: isActive ? colors.foreground : colors.mutedForeground,
                fontSize: typography.size.sm,
                fontWeight: isActive ? typography.weight.semibold : typography.weight.normal,
                textAlign: 'center',
              }}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: spacing.xxs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
});
