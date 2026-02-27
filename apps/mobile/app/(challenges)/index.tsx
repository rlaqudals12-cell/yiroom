/**
 * 챌린지 목록 페이지
 */

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonText, SkeletonCard } from '@/components/ui/SkeletonLoader';
import { staggeredEntry } from '@/lib/animations';
import { useTheme, typography} from '@/lib/theme';

import { ScreenContainer } from '../../components/ui';

import {
  DOMAIN_NAMES,
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
  calculateProgress,
  getDaysRemaining,
  type Challenge,
  type UserChallenge,
} from '../../lib/challenges';
import { useChallenges, useJoinChallenge } from '../../lib/challenges/useChallenges';

type TabType = 'explore' | 'my';

export default function ChallengesScreen() {
  const { colors, brand } = useTheme();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const { challenges, userChallenges, stats, isLoading, refetch } = useChallenges();

  const { join, isJoining } = useJoinChallenge((_newChallenge) => {
    // 참여 후 목록 새로고침
    refetch();
    Alert.alert('성공', '챌린지에 참여했습니다!');
  });

  const handleTabChange = (tab: TabType) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
  };

  const handleJoin = async (challengeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const result = await join(challengeId);
    if (!result.success) {
      Alert.alert('오류', result.error || '참여에 실패했습니다');
    }
  };

  const handleView = (challengeId: string) => {
    Haptics.selectionAsync();
    router.push(`/(challenges)/${challengeId}`);
  };

  // 참여 여부 확인
  const isParticipating = (challengeId: string) =>
    userChallenges.some((uc) => uc.challengeId === challengeId && uc.status === 'in_progress');

  // 진행 중인 챌린지
  const activeChallenges = userChallenges.filter((uc) => uc.status === 'in_progress');

  // 완료된 챌린지 (향후 통계 표시용)
  const _completedChallenges = userChallenges.filter((uc) => uc.status === 'completed');

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const participating = isParticipating(item.id);
    const userChallenge = userChallenges.find((uc) => uc.challengeId === item.id);
    const progress = userChallenge ? calculateProgress(userChallenge) : 0;

    return (
      <Pressable
        style={[styles.challengeCard, { backgroundColor: colors.card }]}
        onPress={() => handleView(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <View style={styles.cardBadges}>
            <View
              style={[styles.domainBadge, { backgroundColor: DOMAIN_COLORS[item.domain] + '20' }]}
            >
              <Text style={[styles.domainBadgeText, { color: DOMAIN_COLORS[item.domain] }]}>
                {DOMAIN_NAMES[item.domain]}
              </Text>
            </View>
            <View
              style={[
                styles.difficultyBadge,
                { backgroundColor: DIFFICULTY_COLORS[item.difficulty] + '20' },
              ]}
            >
              <Text
                style={[styles.difficultyBadgeText, { color: DIFFICULTY_COLORS[item.difficulty] }]}
              >
                {DIFFICULTY_NAMES[item.difficulty]}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.name}</Text>
        {item.description && (
          <Text style={[styles.cardDescription, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.cardMeta}>
          <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
            {item.durationDays}일 · {item.rewardXp} XP
          </Text>
        </View>

        {participating ? (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: brand.primary }]} />
            </View>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{progress}% 완료</Text>
          </View>
        ) : (
          <Pressable
            style={[styles.joinButton, { backgroundColor: brand.primary }]}
            onPress={() => handleJoin(item.id)}
            disabled={isJoining}
          >
            <Text style={[styles.joinButtonText, { color: brand.primaryForeground }]}>{isJoining ? '참여 중...' : '참여하기'}</Text>
          </Pressable>
        )}
      </Pressable>
    );
  };

  const renderUserChallenge = ({ item }: { item: UserChallenge }) => {
    const challenge = item.challenge;
    if (!challenge) return null;

    const progress = calculateProgress(item);
    const daysRemaining = getDaysRemaining(item.targetEndAt);

    return (
      <Pressable
        style={[styles.challengeCard, { backgroundColor: colors.card }]}
        onPress={() => handleView(item.challengeId)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{challenge.icon}</Text>
          <View style={styles.cardBadges}>
            <View
              style={[
                styles.domainBadge,
                { backgroundColor: DOMAIN_COLORS[challenge.domain] + '20' },
              ]}
            >
              <Text style={[styles.domainBadgeText, { color: DOMAIN_COLORS[challenge.domain] }]}>
                {DOMAIN_NAMES[challenge.domain]}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{challenge.name}</Text>

        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressText, { color: colors.mutedForeground }]}>{progress}% 완료</Text>
            <Text style={[styles.daysText, { color: colors.mutedForeground }]}>
              {daysRemaining}일 남음
            </Text>
          </View>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <View style={styles.statsContainer}>
            <SkeletonCard style={{ flex: 1, height: 80 }} />
            <SkeletonCard style={{ flex: 1, height: 80 }} />
            <SkeletonCard style={{ flex: 1, height: 80 }} />
          </View>
          <SkeletonText style={{ width: 200, height: 40, alignSelf: 'center', marginTop: 16 }} />
          <SkeletonCard style={{ height: 120, marginHorizontal: 16, marginTop: 16 }} />
          <SkeletonCard style={{ height: 120, marginHorizontal: 16, marginTop: 12 }} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="challenges-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 통계 카드 */}
      {stats && (
        <Animated.View entering={staggeredEntry(0)} style={styles.statsContainer}>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.inProgress}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>진행 중</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.completed}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>완료</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{stats.total}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>전체</Text>
          </GlassCard>
        </Animated.View>
      )}

      {/* 탭 */}
      <View style={[styles.tabContainer, { backgroundColor: colors.muted }]}>
        <Pressable
          style={[styles.tab, activeTab === 'explore' && [styles.tabActive, { backgroundColor: colors.card }]]}
          onPress={() => handleTabChange('explore')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.mutedForeground },
              activeTab === 'explore' && { color: brand.primary },
            ]}
          >
            탐색
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'my' && [styles.tabActive, { backgroundColor: colors.card }]]}
          onPress={() => handleTabChange('my')}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.mutedForeground },
              activeTab === 'my' && { color: brand.primary },
            ]}
          >
            내 챌린지 {activeChallenges.length > 0 && `(${activeChallenges.length})`}
          </Text>
        </Pressable>
      </View>

      {/* 목록 */}
      {activeTab === 'explore' ? (
        <FlatList
          data={challenges}
          keyExtractor={(item) => item.id}
          renderItem={renderChallenge}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎯</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                현재 참여 가능한 챌린지가 없어요
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={activeChallenges}
          keyExtractor={(item) => item.id}
          renderItem={renderUserChallenge}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔥</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                진행 중인 챌린지가 없어요
              </Text>
              <Pressable
                style={[styles.emptyButton, { backgroundColor: brand.primary }]}
                onPress={() => handleTabChange('explore')}
              >
                <Text style={[styles.emptyButtonText, { color: brand.primaryForeground }]}>챌린지 탐색하기</Text>
              </Pressable>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {},
  tabText: {
    fontSize: 14,
    fontWeight: typography.weight.semibold,
  },
  tabTextActive: {},
  listContent: {
    padding: 16,
    gap: 12,
  },
  challengeCard: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardIcon: {
    fontSize: 32,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  domainBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  domainBadgeText: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: typography.weight.semibold,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: typography.weight.bold,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 10,
  },
  cardMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
  },
  daysText: {
    fontSize: 12,
  },
  joinButton: {
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
});
