/**
 * 챌린지 상세 페이지
 * @description 챌린지 정보, 진행 상황, 참가자 순위 표시
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppPreferencesStore } from '@/lib/stores';

// 챌린지 타입 정의
interface ChallengeDetail {
  id: string;
  title: string;
  description: string;
  domain: 'nutrition' | 'workout' | 'water' | 'sleep' | 'wellness';
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
  milestones: Array<{
    day: number;
    target: number;
    completed: boolean;
  }>;
  leaderboard: Array<{
    rank: number;
    userId: string;
    userName: string;
    progress: number;
  }>;
}

// Mock 데이터
const MOCK_CHALLENGE: ChallengeDetail = {
  id: 'challenge_1',
  title: '30일 물 2L 챌린지',
  description: '매일 물 2L를 마시고 건강한 습관을 만들어보세요! 수분 섭취는 피부 건강, 체중 관리, 에너지 수준에 도움이 됩니다.',
  domain: 'water',
  difficulty: 'medium',
  startDate: '2026-01-01',
  endDate: '2026-01-30',
  targetValue: 2000,
  targetUnit: 'ml',
  currentValue: 1500,
  participants: 1234,
  isJoined: true,
  rewards: {
    points: 500,
    badge: '수분왕',
  },
  rules: [
    '매일 물 2L (2000ml) 이상 섭취',
    '카페인 음료는 물 섭취량에 포함되지 않음',
    '앱에서 매일 물 섭취량 기록 필수',
    '3일 연속 미달성 시 챌린지 실패',
  ],
  milestones: [
    { day: 7, target: 14000, completed: true },
    { day: 14, target: 28000, completed: false },
    { day: 21, target: 42000, completed: false },
    { day: 30, target: 60000, completed: false },
  ],
  leaderboard: [
    { rank: 1, userId: 'u1', userName: '물마스터', progress: 100 },
    { rank: 2, userId: 'u2', userName: '건강러버', progress: 95 },
    { rank: 3, userId: 'u3', userName: '웰니스킹', progress: 88 },
    { rank: 4, userId: 'u4', userName: '나', progress: 75 },
    { rank: 5, userId: 'u5', userName: '도전자', progress: 70 },
  ],
};

const DOMAIN_CONFIG = {
  nutrition: { icon: '🥗', color: '#22C55E', label: '영양' },
  workout: { icon: '💪', color: '#3B82F6', label: '운동' },
  water: { icon: '💧', color: '#06B6D4', label: '수분' },
  sleep: { icon: '😴', color: '#8B5CF6', label: '수면' },
  wellness: { icon: '✨', color: '#F59E0B', label: '웰니스' },
};

const DIFFICULTY_CONFIG = {
  easy: { label: '쉬움', color: '#22C55E' },
  medium: { label: '보통', color: '#F59E0B' },
  hard: { label: '어려움', color: '#EF4444' },
};

export default function ChallengeDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const hapticEnabled = useAppPreferencesStore((state) => state.hapticEnabled);

  const [challenge, setChallenge] = useState<ChallengeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    // TODO: API 연동
    setTimeout(() => {
      setChallenge({ ...MOCK_CHALLENGE, id: id || 'challenge_1' });
      setIsLoading(false);
    }, 500);
  }, [id]);

  const handleJoinToggle = async () => {
    if (!challenge) return;

    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (challenge.isJoined) {
      Alert.alert(
        '챌린지 포기',
        '정말 포기하시겠습니까? 진행 상황이 초기화됩니다.',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '포기',
            style: 'destructive',
            onPress: () => {
              setChallenge({ ...challenge, isJoined: false });
            },
          },
        ]
      );
    } else {
      setIsJoining(true);
      // TODO: API 연동
      setTimeout(() => {
        setChallenge({ ...challenge, isJoined: true, participants: challenge.participants + 1 });
        setIsJoining(false);
      }, 500);
    }
  };

  const handleLogProgress = () => {
    if (hapticEnabled) {
      Haptics.selectionAsync();
    }
    // TODO: 진행 상황 기록 화면으로 이동
    Alert.alert('준비 중', '진행 상황 기록 기능이 곧 추가됩니다.');
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B7280" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>챌린지를 찾을 수 없습니다.</Text>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>돌아가기</Text>
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

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 헤더 섹션 */}
        <View style={styles.headerSection}>
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

          <Text style={styles.title}>{challenge.title}</Text>
          <Text style={styles.description}>{challenge.description}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{challenge.participants.toLocaleString()}</Text>
              <Text style={styles.statLabel}>참가자</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{daysRemaining}일</Text>
              <Text style={styles.statLabel}>남음</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{challenge.rewards.points}P</Text>
              <Text style={styles.statLabel}>보상</Text>
            </View>
          </View>
        </View>

        {/* 진행 상황 */}
        {challenge.isJoined && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>내 진행 상황</Text>
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressValue}>
                  {challenge.currentValue.toLocaleString()} / {challenge.targetValue.toLocaleString()}
                  {challenge.targetUnit}
                </Text>
                <Text style={styles.progressPercent}>{progressPercent}%</Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${progressPercent}%`, backgroundColor: domain.color },
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
            </View>
          </View>
        )}

        {/* 마일스톤 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>마일스톤</Text>
          <View style={styles.milestones}>
            {challenge.milestones.map((milestone, index) => (
              <View key={index} style={styles.milestoneItem}>
                <View
                  style={[
                    styles.milestoneIcon,
                    milestone.completed && { backgroundColor: domain.color },
                  ]}
                >
                  <Text style={styles.milestoneIconText}>
                    {milestone.completed ? '✓' : index + 1}
                  </Text>
                </View>
                <View style={styles.milestoneContent}>
                  <Text style={styles.milestoneDay}>{milestone.day}일차</Text>
                  <Text style={styles.milestoneTarget}>
                    {milestone.target.toLocaleString()}{challenge.targetUnit} 달성
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* 규칙 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>챌린지 규칙</Text>
          <View style={styles.rulesCard}>
            {challenge.rules.map((rule, index) => (
              <View key={index} style={styles.ruleItem}>
                <Text style={styles.ruleBullet}>•</Text>
                <Text style={styles.ruleText}>{rule}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 리더보드 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>순위</Text>
          <View style={styles.leaderboard}>
            {challenge.leaderboard.map((entry) => (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardItem,
                  entry.rank <= 3 && styles.leaderboardItemTop,
                ]}
              >
                <Text
                  style={[
                    styles.leaderboardRank,
                    entry.rank === 1 && { color: '#FFD700' },
                    entry.rank === 2 && { color: '#C0C0C0' },
                    entry.rank === 3 && { color: '#CD7F32' },
                  ]}
                >
                  {entry.rank}
                </Text>
                <Text style={styles.leaderboardName}>{entry.userName}</Text>
                <Text style={styles.leaderboardProgress}>{entry.progress}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomBar}>
        <Pressable
          onPress={handleJoinToggle}
          disabled={isJoining}
          style={({ pressed }) => [
            styles.joinButton,
            challenge.isJoined ? styles.joinButtonLeave : { backgroundColor: domain.color },
            pressed && { opacity: 0.8 },
          ]}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.joinButtonText}>
              {challenge.isJoined ? '챌린지 포기' : '참가하기'}
            </Text>
          )}
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    color: '#6B7280',
    marginBottom: 16,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
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
    color: '#1F2937',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressValue: {
    fontSize: 14,
    color: '#4B5563',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  milestones: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  milestoneIconText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  milestoneContent: {
    flex: 1,
  },
  milestoneDay: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  milestoneTarget: {
    fontSize: 12,
    color: '#6B7280',
  },
  rulesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  ruleItem: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  ruleBullet: {
    color: '#6B7280',
    marginRight: 8,
  },
  ruleText: {
    flex: 1,
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  leaderboard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  leaderboardItemTop: {
    backgroundColor: '#FFFBEB',
  },
  leaderboardRank: {
    width: 32,
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  leaderboardName: {
    flex: 1,
    fontSize: 14,
    color: '#1F2937',
  },
  leaderboardProgress: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
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
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
