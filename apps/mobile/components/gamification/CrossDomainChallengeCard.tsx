/**
 * 크로스도메인 챌린지 진행 카드 컴포넌트
 *
 * 뷰티+운동+영양+웰니스 멀티도메인 챌린지 진행률 시각화
 * react-native-svg 원형 프로그레스 + 도메인별 프로그레스 바
 *
 * @see lib/gamification/cross-domain-challenges.ts
 */

import { Sparkles, Dumbbell, Apple, Heart, Star, Trophy, Zap } from 'lucide-react-native';
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import type {
  CrossDomainProgressView,
  DomainProgress,
  CrossDomainChallengeDefinition,
  CrossChallengeDomain,
} from '@/lib/gamification/cross-domain-challenges';

import { useTheme } from '../../lib/theme';

// ============================================
// 도메인별 아이콘/색상 매핑
// ============================================

const DOMAIN_ICON_MAP: Record<CrossChallengeDomain, typeof Sparkles> = {
  beauty: Sparkles,
  workout: Dumbbell,
  nutrition: Apple,
  wellness: Heart,
};

const DOMAIN_DISPLAY: Record<
  CrossChallengeDomain,
  { color: string; bgColor: string; label: string }
> = {
  beauty: { color: '#ec4899', bgColor: '#fce7f3', label: '뷰티' },
  workout: { color: '#f97316', bgColor: '#fff7ed', label: '운동' },
  nutrition: { color: '#22c55e', bgColor: '#f0fdf4', label: '식단' },
  wellness: { color: '#a855f7', bgColor: '#faf5ff', label: '웰니스' },
};

// 난이도 배지 색상
const DIFFICULTY_DISPLAY: Record<string, { label: string; color: string; bgColor: string }> = {
  easy: { label: '입문', color: '#15803d', bgColor: '#dcfce7' },
  medium: { label: '보통', color: '#1d4ed8', bgColor: '#dbeafe' },
  hard: { label: '고급', color: '#dc2626', bgColor: '#fee2e2' },
};

// ============================================
// 원형 프로그레스 (react-native-svg)
// ============================================

function CircularProgress({
  percent,
  size = 64,
}: {
  percent: number;
  size?: number;
}): React.JSX.Element {
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // 색상: 완료=초록, 진행중=파랑
  const strokeColor = percent >= 100 ? '#22c55e' : '#3b82f6';

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        {/* 배경 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* 진행 원 */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill}>
        <View style={styles.circularCenter}>
          <Text style={styles.circularText}>{percent}%</Text>
        </View>
      </View>
    </View>
  );
}

// ============================================
// 도메인별 프로그레스 바
// ============================================

function DomainProgressBar({ progress }: { progress: DomainProgress }): React.JSX.Element | null {
  const { colors } = useTheme();
  const display = DOMAIN_DISPLAY[progress.domain];
  if (!display) return null;

  const Icon = DOMAIN_ICON_MAP[progress.domain];
  const percent = progress.target > 0 ? Math.round((progress.current / progress.target) * 100) : 0;

  return (
    <View style={styles.domainRow} testID="domain-progress-bar">
      {/* 아이콘 */}
      <View style={[styles.domainIcon, { backgroundColor: display.bgColor }]}>
        <Icon size={16} color={display.color} />
      </View>

      {/* 라벨 + 바 */}
      <View style={styles.domainBarContainer}>
        <View style={styles.domainLabelRow}>
          <Text style={[styles.domainLabel, { color: colors.foreground }]}>{display.label}</Text>
          <Text style={[styles.domainCount, { color: colors.mutedForeground }]}>
            {progress.current}/{progress.target}
          </Text>
        </View>
        <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${percent}%` as unknown as number,
                backgroundColor: display.color,
              },
            ]}
          />
        </View>
      </View>

      {/* 완료 트로피 */}
      {progress.completed && <Trophy size={16} color="#eab308" />}
    </View>
  );
}

// ============================================
// 챌린지 카드 메인
// ============================================

export interface CrossDomainChallengeCardProps {
  /** 챌린지 진행 뷰 데이터 */
  view: CrossDomainProgressView;
  /** 챌린지 정의 (난이도, 기간 등) */
  definition?: CrossDomainChallengeDefinition;
  /** "도전하기" 클릭 핸들러 */
  onJoin?: (challengeId: string) => void;
  /** 이미 참여 중 여부 */
  isJoined?: boolean;
  /** 스타일 */
  style?: ViewStyle;
}

export function CrossDomainChallengeCard({
  view,
  definition,
  onJoin,
  isJoined = false,
  style,
}: CrossDomainChallengeCardProps): React.JSX.Element {
  const { colors, brand, shadows } = useTheme();

  const difficulty = definition?.difficulty ?? 'medium';
  const diffConfig = DIFFICULTY_DISPLAY[difficulty] ?? DIFFICULTY_DISPLAY.medium;
  const durationDays = definition?.durationDays ?? 7;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, ...shadows.card }, style]}
      testID="cross-domain-challenge-card"
      accessibilityLabel={`${view.name} 크로스도메인 챌린지, ${view.overallPercent}% 진행`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* 이름 + 난이도 */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.foreground }]}>{view.name}</Text>
            <View style={[styles.diffBadge, { backgroundColor: diffConfig.bgColor }]}>
              <Text style={[styles.diffBadgeText, { color: diffConfig.color }]}>
                {diffConfig.label}
              </Text>
            </View>
          </View>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {view.description}
          </Text>
        </View>
        <CircularProgress percent={view.overallPercent} />
      </View>

      {/* 메타 정보 */}
      <View style={styles.metaRow}>
        <View style={[styles.metaBadge, { borderColor: colors.border }]}>
          <Star size={12} color={colors.mutedForeground} />
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {view.xpReward} XP
          </Text>
        </View>
        <View style={[styles.metaBadge, { borderColor: colors.border }]}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{durationDays}일</Text>
        </View>
      </View>

      {/* 도메인별 진행 바 */}
      <View style={styles.domainsContainer}>
        {view.domainProgress.map((dp) => (
          <DomainProgressBar key={dp.domain} progress={dp} />
        ))}
      </View>

      {/* 완료 상태 */}
      {view.allCompleted && (
        <View style={styles.completedBanner}>
          <Trophy size={20} color="#16a34a" />
          <Text style={styles.completedText}>챌린지 완료! {view.xpReward} XP 획득</Text>
        </View>
      )}

      {/* 도전하기 버튼 */}
      {!view.allCompleted && onJoin && !isJoined && (
        <Pressable
          style={[styles.joinButton, { backgroundColor: brand.primary }]}
          onPress={() => onJoin(view.challengeId)}
          testID="cross-domain-join-button"
        >
          <Zap size={16} color={brand.primaryForeground} />
          <Text style={[styles.joinButtonText, { color: brand.primaryForeground }]}>도전하기</Text>
        </Pressable>
      )}

      {/* 참여 중 안내 */}
      {!view.allCompleted && isJoined && (
        <Text style={[styles.inProgressText, { color: colors.mutedForeground }]}>
          진행 중이에요! 계속 활동을 기록해보세요.
        </Text>
      )}
    </View>
  );
}

export default CrossDomainChallengeCard;

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 100,
  },
  diffBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  metaText: {
    fontSize: 11,
  },
  domainsContainer: {
    gap: 10,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  domainIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainBarContainer: {
    flex: 1,
    gap: 4,
  },
  domainLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  domainCount: {
    fontSize: 12,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  completedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    marginTop: 14,
  },
  completedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803d',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 14,
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  inProgressText: {
    textAlign: 'center',
    fontSize: 13,
    paddingVertical: 6,
    marginTop: 10,
  },
  circularCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circularText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
