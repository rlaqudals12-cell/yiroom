/**
 * LevelUpModal — 레벨업 모달
 *
 * 레벨업 시 표시되는 축하 카드. 새 레벨과 해금된 보상 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface LevelUpModalProps {
  newLevel: number;
  rewards?: string[];
  onClose?: () => void;
  style?: ViewStyle;
}

export function LevelUpModal({
  newLevel,
  rewards = [],
  onClose,
  style,
}: LevelUpModalProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand, grade } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.xl,
          ...shadows.lg,
        },
        style,
      ]}
      testID="level-up-modal"
      accessibilityLabel={`레벨업! 레벨 ${newLevel} 달성`}
    >
      <Text style={{ fontSize: typography.size['4xl'], textAlign: 'center' }}>🎉</Text>
      <Text
        style={{
          fontSize: typography.size.xl,
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        레벨업!
      </Text>
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: grade.gold.text,
          textAlign: 'center',
          marginTop: spacing.xs,
        }}
      >
        Lv.{newLevel}
      </Text>

      {rewards.length > 0 && (
        <View style={{ marginTop: spacing.md }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              textAlign: 'center',
              marginBottom: spacing.xs,
            }}
          >
            보상
          </Text>
          {rewards.map((reward, i) => (
            <Text
              key={i}
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                textAlign: 'center',
                marginTop: spacing.xxs,
              }}
            >
              🎁 {reward}
            </Text>
          ))}
        </View>
      )}

      {onClose && (
        <Pressable
          style={[
            styles.closeBtn,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.lg,
              paddingVertical: spacing.smd,
              marginTop: spacing.lg,
            },
          ]}
          onPress={onClose}
          accessibilityLabel="확인"
          accessibilityRole="button"
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: brand.primaryForeground,
              textAlign: 'center',
            }}
          >
            확인
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
  },
  closeBtn: {
    alignSelf: 'stretch',
  },
});
