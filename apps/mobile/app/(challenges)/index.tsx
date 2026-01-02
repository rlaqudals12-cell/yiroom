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
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
import {
  useChallenges,
  useJoinChallenge,
} from '../../lib/challenges/useChallenges';

type TabType = 'explore' | 'my';

export default function ChallengesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<TabType>('explore');
  const { challenges, userChallenges, stats, isLoading, refetch } =
    useChallenges();

  const { join, isJoining } = useJoinChallenge((newChallenge) => {
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
    userChallenges.some(
      (uc) => uc.challengeId === challengeId && uc.status === 'in_progress'
    );

  // 진행 중인 챌린지
  const activeChallenges = userChallenges.filter(
    (uc) => uc.status === 'in_progress'
  );

  // 완료된 챌린지
  const completedChallenges = userChallenges.filter(
    (uc) => uc.status === 'completed'
  );

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const participating = isParticipating(item.id);
    const userChallenge = userChallenges.find(
      (uc) => uc.challengeId === item.id
    );
    const progress = userChallenge ? calculateProgress(userChallenge) : 0;

    return (
      <TouchableOpacity
        style={[styles.challengeCard, isDark && styles.challengeCardDark]}
        onPress={() => handleView(item.id)}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardIcon}>{item.icon}</Text>
          <View style={styles.cardBadges}>
            <View
              style={[
                styles.domainBadge,
                { backgroundColor: DOMAIN_COLORS[item.domain] + '20' },
              ]}
            >
              <Text
                style={[
                  styles.domainBadgeText,
                  { color: DOMAIN_COLORS[item.domain] },
                ]}
              >
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
                style={[
                  styles.difficultyBadgeText,
                  { color: DIFFICULTY_COLORS[item.difficulty] },
                ]}
              >
                {DIFFICULTY_NAMES[item.difficulty]}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.cardTitle, isDark && styles.textLight]}>
          {item.name}
        </Text>
        {item.description && (
          <Text
            style={[styles.cardDescription, isDark && styles.textMuted]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        )}

        <View style={styles.cardMeta}>
          <Text style={[styles.metaText, isDark && styles.textMuted]}>
            {item.durationDays}일 · {item.rewardXp} XP
          </Text>
        </View>

        {participating ? (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={[styles.progressText, isDark && styles.textMuted]}>
              {progress}% 완료
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={() => handleJoin(item.id)}
            disabled={isJoining}
          >
            <Text style={styles.joinButtonText}>
              {isJoining ? '참여 중...' : '참여하기'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderUserChallenge = ({ item }: { item: UserChallenge }) => {
    const challenge = item.challenge;
    if (!challenge) return null;

    const progress = calculateProgress(item);
    const daysRemaining = getDaysRemaining(item.targetEndAt);

    return (
      <TouchableOpacity
        style={[styles.challengeCard, isDark && styles.challengeCardDark]}
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
              <Text
                style={[
                  styles.domainBadgeText,
                  { color: DOMAIN_COLORS[challenge.domain] },
                ]}
              >
                {DOMAIN_NAMES[challenge.domain]}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.cardTitle, isDark && styles.textLight]}>
          {challenge.name}
        </Text>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <View style={styles.progressMeta}>
            <Text style={[styles.progressText, isDark && styles.textMuted]}>
              {progress}% 완료
            </Text>
            <Text style={[styles.daysText, isDark && styles.textMuted]}>
              {daysRemaining}일 남음
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.containerDark]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      {/* 통계 카드 */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <Text style={styles.statIcon}>🔥</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {stats.inProgress}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>
              진행 중
            </Text>
          </View>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {stats.completed}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>
              완료
            </Text>
          </View>
          <View style={[styles.statCard, isDark && styles.statCardDark]}>
            <Text style={styles.statIcon}>🎯</Text>
            <Text style={[styles.statValue, isDark && styles.textLight]}>
              {stats.total}
            </Text>
            <Text style={[styles.statLabel, isDark && styles.textMuted]}>
              전체
            </Text>
          </View>
        </View>
      )}

      {/* 탭 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.tabActive]}
          onPress={() => handleTabChange('explore')}
        >
          <Text
            style={[
              styles.tabText,
              isDark && styles.textMuted,
              activeTab === 'explore' && styles.tabTextActive,
            ]}
          >
            탐색
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'my' && styles.tabActive]}
          onPress={() => handleTabChange('my')}
        >
          <Text
            style={[
              styles.tabText,
              isDark && styles.textMuted,
              activeTab === 'my' && styles.tabTextActive,
            ]}
          >
            내 챌린지{' '}
            {activeChallenges.length > 0 && `(${activeChallenges.length})`}
          </Text>
        </TouchableOpacity>
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
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>
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
              <Text style={[styles.emptyText, isDark && styles.textMuted]}>
                진행 중인 챌린지가 없어요
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => handleTabChange('explore')}
              >
                <Text style={styles.emptyButtonText}>챌린지 탐색하기</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statCardDark: {
    backgroundColor: '#1a1a1a',
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  tabTextActive: {
    color: '#8b5cf6',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  challengeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  challengeCardDark: {
    backgroundColor: '#1a1a1a',
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
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  difficultyBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 10,
  },
  cardMeta: {
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e5e5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#8b5cf6',
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  daysText: {
    fontSize: 12,
    color: '#666',
  },
  joinButton: {
    backgroundColor: '#8b5cf6',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  joinButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
