/**
 * FriendProfileCard -- 친구 상세 프로필 카드
 *
 * 아바타, 이름, 레벨 뱃지, 웰니스 점수, 가입일, 공통 챌린지 수 표시.
 * 메시지 보내기, 친구 삭제 액션 버튼 제공.
 */
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { MessageCircle, UserMinus } from 'lucide-react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface FriendProfileCardProps {
  name: string;
  avatar?: string;
  level: number;
  score: number;
  joinDate: Date;
  commonChallenges: number;
  onMessage?: () => void;
  onRemove?: () => void;
  style?: ViewStyle;
}

/** 날짜를 "2026년 1월" 형식으로 변환 */
function formatJoinDate(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return `${year}년 ${month}월 가입`;
}

/** 레벨 뱃지 색상 결정 */
function getLevelColor(level: number): string {
  if (level >= 30) return '#F59E0B'; // 금
  if (level >= 20) return '#8B5CF6'; // 보라
  if (level >= 10) return '#3B82F6'; // 파랑
  return '#6B7280'; // 회색
}

export function FriendProfileCard({
  name,
  avatar,
  level,
  score,
  joinDate,
  commonChallenges,
  onMessage,
  onRemove,
  style,
}: FriendProfileCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand, status } = useTheme();
  const levelColor = getLevelColor(level);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="friend-profile-card"
      accessibilityLabel={`${name}님의 프로필, 레벨 ${level}, 웰니스 점수 ${score}점`}
    >
      {/* 상단: 아바타 + 기본 정보 */}
      <View style={styles.header}>
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.full,
            },
          ]}
        >
          {avatar ? (
            <Image
              source={{ uri: avatar }}
              style={[styles.avatarImage, { borderRadius: radii.full }]}
              accessibilityLabel={`${name}님의 프로필 사진`}
            />
          ) : (
            <Text style={{ fontSize: typography.size['2xl'], color: colors.foreground }}>
              {name.charAt(0)}
            </Text>
          )}
        </View>

        <View style={[styles.headerInfo, { marginLeft: spacing.md }]}>
          <View style={styles.nameRow}>
            <Text
              style={{
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
              }}
              numberOfLines={1}
            >
              {name}
            </Text>
            {/* 레벨 뱃지 */}
            <View
              style={[
                styles.levelBadge,
                {
                  backgroundColor: levelColor + '20',
                  borderRadius: radii.sm,
                  marginLeft: spacing.sm,
                  paddingHorizontal: spacing.xs,
                  paddingVertical: spacing.xxs,
                },
              ]}
              accessibilityLabel={`레벨 ${level}`}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.bold,
                  color: levelColor,
                }}
              >
                Lv.{level}
              </Text>
            </View>
          </View>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            {formatJoinDate(joinDate)}
          </Text>
        </View>
      </View>

      {/* 통계 행 */}
      <View
        style={[
          styles.statsRow,
          {
            marginTop: spacing.md,
            backgroundColor: colors.secondary,
            borderRadius: radii.xl,
            padding: spacing.smx,
          },
        ]}
      >
        <View style={styles.stat}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: brand.primary,
            }}
          >
            {score}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            웰니스 점수
          </Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.stat}>
          <Text
            style={{
              fontSize: typography.size.lg,
              fontWeight: typography.weight.bold,
              color: status.success,
            }}
          >
            {commonChallenges}
          </Text>
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: spacing.xxs,
            }}
          >
            공통 챌린지
          </Text>
        </View>
      </View>

      {/* 액션 버튼 */}
      {(onMessage || onRemove) && (
        <View style={[styles.actionRow, { marginTop: spacing.smx, gap: spacing.sm }]}>
          {onMessage && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: brand.primary,
                  borderRadius: radii.xl,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={onMessage}
              accessibilityLabel="메시지 보내기"
              accessibilityRole="button"
            >
              <MessageCircle size={16} color={brand.primaryForeground} />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: brand.primaryForeground,
                  marginLeft: spacing.xs,
                }}
              >
                메시지
              </Text>
            </Pressable>
          )}
          {onRemove && (
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.secondary,
                  borderRadius: radii.xl,
                  paddingVertical: spacing.sm,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={onRemove}
              accessibilityLabel="친구 삭제"
              accessibilityRole="button"
            >
              <UserMinus size={16} color={colors.destructive} />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.destructive,
                  marginLeft: spacing.xs,
                }}
              >
                삭제
              </Text>
            </Pressable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 56,
    height: 56,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {},
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: spacing.xl,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
