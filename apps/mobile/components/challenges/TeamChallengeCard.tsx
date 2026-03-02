/**
 * TeamChallengeCard -- 팀 챌린지 카드
 *
 * 팀 이름, 멤버별 진행률 바, 전체 진행률을 표시.
 * 각 멤버의 개별 기여도를 시각적으로 확인 가능.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface TeamMember {
  /** 멤버 이름 */
  name: string;
  /** 아바타 URL (선택) */
  avatar?: string;
  /** 개별 진행률 (0-100) */
  progress: number;
}

export interface TeamChallengeCardProps {
  /** 챌린지 ID */
  id: string;
  /** 챌린지 제목 */
  title: string;
  /** 팀 이름 */
  teamName: string;
  /** 팀 멤버 목록 */
  members: TeamMember[];
  /** 전체 팀 진행률 (0-100) */
  totalProgress: number;
  /** 카드 클릭 핸들러 */
  onPress?: (id: string) => void;
  /** 추가 스타일 */
  style?: ViewStyle;
  /** 테스트 ID */
  testID?: string;
}

export function TeamChallengeCard({
  id,
  title,
  teamName,
  members,
  totalProgress,
  onPress,
  style,
  testID = 'team-challenge-card',
}: TeamChallengeCardProps): React.JSX.Element {
  const { colors, module, typography, radii, spacing, shadows } = useTheme();
  const accentColor = module.workout.base;

  // 진행률 클램프
  const clampedTotal = Math.min(Math.max(totalProgress, 0), 100);

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
      accessibilityLabel={`팀 챌린지: ${title}, 팀 ${teamName}, 전체 진행률 ${clampedTotal}%`}
    >
      {/* 팀 뱃지 + 제목 */}
      <View style={styles.header}>
        <View
          style={[
            styles.teamBadge,
            { backgroundColor: `${accentColor}20`, borderRadius: radii.full },
          ]}
        >
          <Text
            style={{
              color: accentColor,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
            }}
          >
            팀
          </Text>
        </View>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.medium,
          }}
        >
          {teamName}
        </Text>
      </View>

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

      {/* 전체 팀 진행률 */}
      <View style={[styles.totalSection, { marginTop: spacing.smx }]}>
        <View style={styles.totalHeader}>
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.xs,
              fontWeight: typography.weight.medium,
            }}
          >
            팀 전체
          </Text>
          <Text
            style={{
              color: accentColor,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
            }}
          >
            {clampedTotal}%
          </Text>
        </View>
        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.muted, borderRadius: radii.full, height: 8 },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${clampedTotal}%`,
                backgroundColor: accentColor,
                borderRadius: radii.full,
                height: 8,
              },
            ]}
          />
        </View>
      </View>

      {/* 멤버별 진행률 */}
      <View style={[styles.membersSection, { marginTop: spacing.smx }]}>
        {members.map((member, index) => {
          const memberProgress = Math.min(Math.max(member.progress, 0), 100);
          return (
            <View
              key={`${member.name}-${index}`}
              style={styles.memberRow}
              accessibilityLabel={`${member.name}: ${memberProgress}% 달성`}
            >
              {/* 아바타 이니셜 */}
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: colors.secondary, borderRadius: radii.full },
                ]}
              >
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: typography.size.xs,
                    fontWeight: typography.weight.semibold,
                  }}
                >
                  {member.name.charAt(0)}
                </Text>
              </View>

              {/* 이름 + 진행률 바 */}
              <View style={styles.memberInfo}>
                <View style={styles.memberHeader}>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: typography.size.xs,
                      fontWeight: typography.weight.medium,
                    }}
                    numberOfLines={1}
                  >
                    {member.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: typography.size.xs,
                    }}
                  >
                    {memberProgress}%
                  </Text>
                </View>
                <View
                  style={[
                    styles.memberTrack,
                    { backgroundColor: colors.muted, borderRadius: radii.full },
                  ]}
                >
                  <View
                    style={[
                      styles.memberFill,
                      {
                        width: `${memberProgress}%`,
                        backgroundColor: module.workout.light,
                        borderRadius: radii.full,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  teamBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  title: {},
  totalSection: {
    gap: spacing.xs,
  },
  totalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    overflow: 'hidden',
  },
  progressFill: {},
  membersSection: {
    gap: spacing.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInfo: {
    flex: 1,
    gap: spacing.xxs,
  },
  memberHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberTrack: {
    height: 4,
    overflow: 'hidden',
  },
  memberFill: {
    height: 4,
  },
});
