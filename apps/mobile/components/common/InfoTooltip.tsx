/**
 * InfoTooltip -- 도움말 툴팁
 *
 * children 옆에 (i) 아이콘을 표시하고 누르면 말풍선 툴팁을 토글.
 * FadeIn 애니메이션으로 부드럽게 표시/숨김.
 */
import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Info } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing } from '../../lib/theme';

export interface InfoTooltipProps {
  text: string;
  children: React.ReactNode;
  testID?: string;
}

export function InfoTooltip({
  text,
  children,
  testID = 'info-tooltip',
}: InfoTooltipProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  const toggleTooltip = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVisible((prev) => !prev);
  }, []);

  return (
    <View style={styles.wrapper} testID={testID}>
      {/* children + 아이콘 영역 */}
      <View style={styles.row}>
        {children}
        <Pressable
          style={[styles.iconBtn, { marginLeft: spacing.xs }]}
          onPress={toggleTooltip}
          accessibilityLabel="도움말 보기"
          accessibilityRole="button"
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Info
            size={16}
            color={isVisible ? colors.foreground : colors.mutedForeground}
          />
        </Pressable>
      </View>

      {/* 툴팁 말풍선 */}
      {isVisible && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.popover,
              borderRadius: radii.xl,
              padding: spacing.sm,
              marginTop: spacing.xs,
              borderWidth: 1,
              borderColor: colors.border,
              ...shadows.md,
            },
          ]}
        >
          {/* 말풍선 삼각형 */}
          <View
            style={[
              styles.arrow,
              {
                borderBottomColor: colors.popover,
              },
            ]}
          />
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.popoverForeground,
              lineHeight: typography.size.xs * typography.lineHeight.relaxed,
            }}
          >
            {text}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBtn: {
    padding: spacing.xxs,
  },
  tooltip: {
    position: 'relative',
  },
  arrow: {
    position: 'absolute',
    top: -6,
    right: 16,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
