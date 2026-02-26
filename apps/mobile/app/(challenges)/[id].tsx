/**
 * 챌린지 상세 페이지
 * @description 챌린지 정보, 진행 상황, 참가자 순위 표시
 */

import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonText, SkeletonCard } from '@/components/ui/SkeletonLoader';
import {
  calculateProgress,
  DOMAIN_COLORS,
  DIFFICULTY_NAMES,
  DIFFICULTY_COLORS,
} from '@/lib/challenges';
import { useChallenges, useJoinChallenge } from '@/lib/challenges/useChallenges';
import { useAppPreferencesStore } from '@/lib/stores';
import { useTheme } from '@/lib/theme';

// 챌린지 상세 뷰 타입 (UI 표시용)
interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  domain: 'nutrition' | 'workout' | 'skin' | 'combined';
  difficulty: 'easy' | 'medium' | 'hard';
  startDate: string;
  endDate: string;
  targetValue: number;
  targetUnit: string;
  currentValue: number;
  participants: number;
  isJoined: boolean;
  rewards: {
    points: number;
    badge?: string;
  };
  rules: string[];
  milestones: {
    day: number;
    target: number;
    completed: boolean;
  }[];
  leaderboard: {
    rank: number;
    userId: string;
    userName: string;
    progress: number;
  }[];
}

const DOMAIN_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  nutrition: { icon: '🥗', color: DOMAIN_COLORS.nutrition, label: '영양' },
  workout: { icon: '💪', color: DOMAIN_COLORS.workout, label: '운동' },
  skin: { icon: '✨', color: DOMAIN_COLORS.skin, label: '피부' },
  combined: { icon: '🎯', color: DOMAIN_COLORS.combined, label: '복합' },
};

const DIFFICULTY_CONFIG: Record<string, { label: string; color: string }> = {
  easy: { label: DIFFICULTY_NAMES.easy, color: DIFFICULTY_COLORS.easy },
  medium: { label: DIFFICULTY_NAMES.medium, color: DIFFICULTY_COLORS.medium },
  hard: { label: DIFFICULTY_NAMES.hard, color: DIFFICULTY_COLORS.hard },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  // API 훅 사용
  const { challenges, userChallenges, isLoading: challengesLoading, refetch } = useChallenges();
  const { join, isJoining } = useJoinChallenge(() => {
    refetch(); // 참가 성공 후 목록 새로고침
  });

  // 현재 챌린지 찾기
  const currentChallenge = useMemo(() => {
    return challenges.find((c) => c.id === id);
  }, [challenges, id]);

  // 사용자 참여 정보 찾기
  const userChallenge = useMemo(() => {
    return userChallenges.find((uc) => uc.challengeId === id);
  }, [userChallenges, id]);

  // ChallengeDetail 형태로 변환
  const challenge = useMemo((): ChallengeDetail | null => {
    if (!currentChallenge) return null;

    const isJoined = !!userChallenge;
    const _progress = userChallenge ? calculateProgress(userChallenge) : 0;
    const durationDays = currentChallenge.durationDays;

    // 마일스톤 생성 (7일, 14일, 21일, 30일 단위)
    const milestones = [7, 14, 21, 30]
      .filter((day) => day <= durationDays)
      .map((day) => ({
        day,
        target: day,
        completed: userChallenge ? (userChallenge.progress.currentDays || 0) >= day : false,
      }));

    return {
      id: currentChallenge.id,
      title: currentChallenge.name,
      description: currentChallenge.description || '',
      domain: currentChallenge.domain,
      difficulty: currentChallenge.difficulty,
      startDate:
        userChallenge?.startedAt.toISOString().split('T')[0] ||
        new Date().toISOString().split('T')[0],
      endDate: userChallenge?.targetEndAt.toISOString().split('T')[0] || '',
      targetValue: currentChallenge.target.days || durationDays,
      targetUnit: '일',
      currentValue: userChallenge?.progress.currentDays || 0,
      participants: 0, // 참가자 수는 별도 API 필요
      isJoined,
      rewards: {
        points: currentChallenge.rewardXp,
        badge: currentChallenge.icon,
      },
      rules: [
        `${durationDays}일 동안 매일 목표 달성`,
        '앱에서 매일 진행 상황 기록 필수',
        '3일 연속 미달성 시 챌린지 실패',
      ],
      milestones,
      leaderboard: [], // 리더보드는 별도 API 필요
    };
  }, [currentChallenge, userChallenge]);

  const isLoading = challengesLoading;

  const handleJoinToggle = async () => {
    if (!challenge || !id) return;

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (challenge.isJoined) {
      Alert.alert('챌린지 포기', '정말 포기하시겠습니까? 진행 상황이 초기화됩니다.', [
        { text: '취소', style: 'cancel' },
        {
          text: '포기',
          style: 'destructive',
          onPress: async () => {
            // 포기 기능은 추후 추가 예정
            Alert.alert(
              '곧 추가될 예정이에요',
              '포기 기능을 준비하고 있어요. 조금만 기다려주세요!'
            );
          },
        },
      ]);
    } else {
      const result = await join(id);
      if (result.success) {
        Alert.alert('참가 완료', '챌린지에 참가했습니다!');
      } else {
        Alert.alert('참가 실패', result.error || '다시 시도해주세요.');
      }
    }
  };

  const handleLogProgress = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    // 진행 상황 기록 기능은 추후 추가 예정
    Alert.alert(
      '곧 추가될 예정이에요',
      '진행 상황 기록 기능을 준비하고 있어요. 조금만 기다려주세요!'
    );
  };

  // 남은 일수 계산
  const getDaysRemaining = () => {
    if (!challenge) return 0;
    const end = new Date(challenge.endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  // 진행률 계산
  const getProgressPercent = () => {
    if (!challenge) return 0;
    return Math.min(100, Math.round((challenge.currentValue / challenge.targetValue) * 100));
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <SkeletonText style={{ width: 200, height: 28, marginBottom: 12 }} />
        <SkeletonText style={{ width: 280, height: 16, marginBottom: 24 }} />
        <SkeletonCard style={{ height: 120, width: '90%', marginBottom: 16 }} />
        <SkeletonCard style={{ height: 80, width: '90%' }} />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>챌린지를 찾을 수 없습니다.</Text>
        <Pressable onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.foreground }]}>
          <Text style={[styles.backButtonText, { color: colors.background }]}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const domain = DOMAIN_CONFIG[challenge.domain];
  const difficulty = DIFFICULTY_CONFIG[challenge.difficulty];
  const daysRemaining = getDaysRemaining();
  const progressPercent = getProgressPercent();

  return (
    <>
      <Stack.Screen
        options={{
          title: challenge.title,
          headerBackTitle: '뒤로',
        }}
      />

      <ScrollView
        testID="challenge-detail-screen"
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 헤더 섹션 */}
        <Animated.View entering={FadeIn.duration(400)}>
          <GlassCard style={{ ...styles.headerSection, borderBottomColor: colors.border }}>
            <View style={styles.badgeRow}>
              <View style={[styles.badge, { backgroundColor: domain.color + '20' }]}>
                <Text>{domain.icon}</Text>
                <Text style={[styles.badgeText, { color: domain.color }]}>{domain.label}</Text>
              </View>
              <View style={[styles.badge, { backgroundColor: difficulty.color + '20' }]}>
                <Text style={[styles.badgeText, { color: difficulty.color }]}>
                  {difficulty.label}
                </Text>
              </View>
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>{challenge.title}</Text>
            <Text style={[styles.description, { color: colors.mutedForeground }]}>{challenge.description}</Text>

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{challenge.participants.toLocaleString()}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>참가자</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{daysRemaining}일</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>남음</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{challenge.rewards.points}P</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>보상</Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 진행 상황 */}
        {challenge.isJoined && (
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>내 진행 상황</Text>
            <GlassCard style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={[styles.progressValue, { color: colors.mutedForeground }]}>
                  {challenge.currentValue.toLocaleString()} /{' '}
                  {challenge.targetValue.toLocaleString()}
                  {challenge.targetUnit}
                </Text>
                <Text style={[styles.progressPercent, { color: colors.foreground }]}>{progressPercent}%</Text>
              </View>
              <View style={[styles.progressBarContainer, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.progressBar,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: domain.color,
                    },
                  ]}
                />
              </View>
              <Pressable
                onPress={handleLogProgress}
                style={({ pressed }) => [
                  styles.logButton,
                  { backgroundColor: domain.color },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.logButtonText}>오늘 기록하기</Text>
              </Pressable>
            </GlassCard>
          </Animated.View>
        )}

        {/* 마일스톤 */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>마일스톤</Text>
          <GlassCard style={styles.milestones}>
            {challenge.milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIcon,
                    { backgroundColor: colors.muted },
                    milestone.completed && { backgroundColor: domain.color },
                  ]}
                >
                  <Text style={styles.milestoneIconText}>
                    {milestone.completed ? '✓' : index + 1}
                  </Text>
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={[styles.milestoneDay, { color: colors.foreground }]}>{milestone.day}일차</Text>
                  <Text style={[styles.milestoneTarget, { color: colors.mutedForeground }]}>
                    {milestone.target.toLocaleString()}
                    {challenge.targetUnit} 달성
                  </Text>
                </View>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* 규칙 */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>챌린지 규칙</Text>
          <GlassCard style={styles.rulesCard}>
            {challenge.rules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <Text style={[styles.ruleBullet, { color: colors.mutedForeground }]}>•</Text>
                <Text style={[styles.ruleText, { color: colors.mutedForeground }]}>{rule}</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* 리더보드 */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>순위</Text>
          <GlassCard style={styles.leaderboard}>
            {challenge.leaderboard.map((entry) => (
              <View
                key={entry.userId}
                style={[styles.leaderboardItem, { borderBottomColor: colors.border }, entry.rank <= 3 && styles.leaderboardItemTop]}
              >
                <Text
                  style={[
                    styles.leaderboardRank,
                    { color: colors.foreground },
                    entry.rank === 1 && { color: '#FFD700' },
                    entry.rank === 2 && { color: '#C0C0C0' },
                    entry.rank === 3 && { color: '#CD7F32' },
                  ]}
                >
                  {entry.rank}
                </Text>
                <Text style={[styles.leaderboardName, { color: colors.foreground }]}>{entry.userName}</Text>
                <Text style={[styles.leaderboardProgress, { color: colors.mutedForeground }]}>{entry.progress}%</Text>
              </View>
            ))}
          </GlassCard>
        </Animated.View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleJoinToggle}
          disabled={isJoining}
          style={({ pressed }) => [
            styles.joinButton,
            challenge.isJoined ? styles.joinButtonLeave : { backgroundColor: domain.color },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.joinButtonText, isJoining && { opacity: 0.7 }]}>
            {isJoining ? '참가 중...' : challenge.isJoined ? '챌린지 포기' : '참가하기'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    fontWeight: '600',
  },
  headerSection: {
    padding: 20,
    borderBottomWidth: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  progressCard: {
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 14,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  logButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  logButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  milestones: {
    padding: 16,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  milestoneIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneIconText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDay: {
    fontSize: 14,
    fontWeight: '600',
  },
  milestoneTarget: {
    fontSize: 12,
  },
  rulesCard: {
    padding: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  ruleBullet: {
    marginRight: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  leaderboard: {
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  leaderboardItemTop: {
    backgroundColor: '#FFFBEB',
  },
  leaderboardRank: {
    width: 32,
    fontSize: 16,
    fontWeight: '700',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
  },
  leaderboardProgress: {
    fontSize: 14,
    fontWeight: '600',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
  },
  joinButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  joinButtonLeave: {
    backgroundColor: '#EF4444',
  },
  joinButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
