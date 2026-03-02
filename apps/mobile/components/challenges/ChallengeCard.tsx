/**
 * ChallengeCard -- 챌린지 카드
 *
 * 개인/팀 챌린지 정보를 진행률 바, 참가자 수, 남은 일수와 함께 표시.
 * module.workout 색상 계열로 운동/웰니스 맥락 강조.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing, radii } from '../../lib/theme';

export type ChallengeType = 'personal' | 'team';

export interface ChallengeCardProps {
  /** 챌린지 ID */
  id: string;
  /** 챌린지 제목 */
  title: string;
  /** 챌린지 설명 */
  description: string;
  /** 진행률 (0-100) */
  progress: number;
  /** 참가자 수 */
  participants: number;
  /** 남은 일수 */
  daysLeft: number;
  /** 챌린지 유형 */
  type: ChallengeType;
  /** 카드 클릭 핸들러 */
  onPress?: (id: string) => void;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function ChallengeCard({
  id,
  title,
  description,
  progress,
  daysLeft,
  participants,
  type,
  onPress,
  style,
  testID = 'challenge-card',
}: ChallengeCardProps): React.JSX.Element {
  const { colors, module, typography, radii, spacing, shadows } = useTheme();
  const accentColor = module.workout.base;
  const accentLight = module.workout.light;

  // 진행률 0~100 클램프
  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  const typeLabel = type === 'team' ? '팀' : '개인';

  return (
    <Pressable
      testID={testID}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress?.(id);
      }}
      style={({ pressed }) => [
        styles.container,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${typeLabel} 챌린지: ${title}, 진행률 ${clampedProgress}%, ${daysLeft}일 남음`}
    >
      {/* 상단: 유형 뱃지 + 남은 일수 */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: type === 'team'
                ? `${accentColor}20`
                : `${module.workout.dark}20`,
              borderRadius: radii.full,
            },
          ]}
        >
          <Text
            style={{
              color: type === 'team' ? accentColor : module.workout.dark,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
            }}
          >
            {typeLabel}
          </Text>
        </View>

        <View style={styles.daysLeftContainer}>
          <Text
            style={{
              color: daysLeft <= 3 ? colors.destructive : colors.mutedForeground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
            }}
          >
            {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
          </Text>
        </View>
      </View>

      {/* 제목 + 설명 */}
      <Text
        style={[
          styles.title,
          {
            color: colors.foreground,
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
          },
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.mutedForeground,
            fontSize: typography.size.sm,
            lineHeight: typography.size.sm * typography.lineHeight.normal,
          },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>

      {/* 진행률 바 */}
      <View style={[styles.progressSection, { marginTop: spacing.smx }]}>
        <View style={styles.progressHeader}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
            }}
          >
            진행률
          </Text>
          <Text
            style={{
              color: accentColor,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.bold,
            }}
          >
            {clampedProgress}%
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.muted, borderRadius: radii.full },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${clampedProgress}%`,
                backgroundColor: accentColor,
                borderRadius: radii.full,
              },
            ]}
          />
        </View>
      </View>

      {/* 하단: 참가자 수 */}
      <View style={[styles.footer, { marginTop: spacing.sm }]}>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
          }}
        >
          {participants}명 참가 중
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  daysLeftContainer: {
    alignItems: 'flex-end',
  },
  title: {
    marginBottom: spacing.xxs,
  },
  description: {},
  progressSection: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
