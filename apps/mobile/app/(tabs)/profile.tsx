/**
 * 프로필 화면 (Clerk 인증 연동)
 * 그라디언트 헤더 + 웰니스 점수 + 레벨 + 업적 + 타임라인 + 기록/설정
 * D2-4: 그라디언트 배경, AnalysisTimeline 통합, GradientCard 적용
 */
import { useUser, useClerk } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { AnalysisTimeline } from '../../components/analysis';
import { WellnessScoreRing, LevelBadge, AchievementGrid } from '../../components/profile';
import { GlassCard, GradientBackground, GradientCard, ScreenContainer, SectionHeader } from '../../components/ui';
import { useUserAnalyses, useWorkoutData, useNutritionData, useWellnessScore } from '../../hooks';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useTheme } from '../../lib/theme';
import { profileLogger } from '../../lib/utils/logger';

export default function ProfileScreen(): React.JSX.Element {
  const { colors, brand, spacing, typography, status } = useTheme();
  const { user, isSignedIn } = useUser();
  const { signOut } = useClerk();

  // 데이터 훅
  const { analyses, personalColor, skinAnalysis, bodyAnalysis, refetch: refetchAnalyses } = useUserAnalyses();
  const { analysis: workoutAnalysis, streak: workoutStreak, refetch: refetchWorkout } = useWorkoutData();
  const { streak: nutritionStreak, refetch: refetchNutrition } = useNutritionData();

  // Pull-to-refresh
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchAnalyses(), refetchWorkout(), refetchNutrition()]);
    } finally {
      setRefreshing(false);
    }
  }, [refetchAnalyses, refetchWorkout, refetchNutrition]);

  // 웰니스 점수 계산
  const { score, breakdown, level, achievements } = useWellnessScore({
    personalColor,
    skinAnalysis,
    bodyAnalysis,
    workoutStreak,
    nutritionStreak,
  });

  const analysisCount = [personalColor, skinAnalysis, bodyAnalysis].filter(Boolean).length;

  const handleSignIn = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/sign-in');
  };

  const handleSignOut = async (): Promise<void> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await signOut();
    } catch (error) {
      profileLogger.error('Sign out error:', error);
    }
  };

  return (
    <ScreenContainer testID="profile-screen" contentContainerStyle={{ paddingBottom: 40 }} refreshing={refreshing} onRefresh={handleRefresh}>
        {/* 프로필 헤더 — 브랜드 그라디언트 + GlassCard */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <GradientBackground
            variant="brand"
            style={{
              borderRadius: 20,
              padding: spacing.sm,
              marginBottom: spacing.md,
            }}
            testID="profile-gradient-header"
          >
            <GlassCard
              intensity={35}
              style={{ padding: spacing.lg, alignItems: 'center' }}
            >
              {isSignedIn && user ? (
                <>
                  {user.imageUrl ? (
                    <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
                  ) : (
                    <View
                      style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}
                    >
                      <Text style={{ fontSize: 32, color: colors.mutedForeground }}>
                        {user.firstName?.[0] ||
                          user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                          '?'}
                      </Text>
                    </View>
                  )}
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      marginBottom: 4,
                    }}
                  >
                    {user.fullName || user.emailAddresses[0]?.emailAddress || '사용자'}
                  </Text>
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      color: colors.mutedForeground,
                      marginBottom: spacing.md,
                    }}
                  >
                    {analysisCount}/3 분석 완료
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: colors.muted,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    onPress={handleSignOut}
                  >
                    <Text
                      style={{
                        color: colors.mutedForeground,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                      }}
                    >
                      로그아웃
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <View
                    style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}
                  >
                    <Text style={{ fontSize: 32, color: colors.mutedForeground }}>?</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      marginBottom: spacing.md,
                    }}
                  >
                    로그인이 필요합니다
                  </Text>
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: brand.primary,
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    onPress={handleSignIn}
                  >
                    <Text
                      style={{
                        color: brand.primaryForeground,
                        fontSize: typography.size.sm,
                        fontWeight: typography.weight.semibold,
                      }}
                    >
                      로그인
                    </Text>
                  </Pressable>
                </>
              )}
            </GlassCard>
          </GradientBackground>
        </Animated.View>

        {/* 레벨 뱃지 */}
        <Animated.View entering={FadeInUp.delay(50).duration(TIMING.normal)}>
          <LevelBadge
            level={level}
            style={{ marginBottom: spacing.md }}
            testID="wellness-level"
          />
        </Animated.View>

        {/* 웰니스 점수 링 */}
        <WellnessScoreRing
          score={score}
          breakdown={breakdown}
          style={{ marginBottom: spacing.md }}
          testID="wellness-score"
        />

        {/* 업적 그리드 */}
        <AchievementGrid
          achievements={achievements}
          style={{ marginBottom: spacing.lg }}
          testID="achievement-grid"
        />

        {/* 분석 이력 타임라인 */}
        <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
          <AnalysisTimeline
            analyses={analyses}
            onItemPress={(item) => {
              const routeMap: Record<string, string> = {
                'personal-color': '/(analysis)/personal-color',
                skin: '/(analysis)/skin',
                body: '/(analysis)/body',
              };
              const route = routeMap[item.type];
              if (route) router.push(route as never);
            }}
            style={{ marginBottom: spacing.lg }}
            testID="analysis-timeline"
          />
        </Animated.View>

        {/* 분석 결과 */}
        <Animated.View entering={staggeredEntry(0)}>
          <SectionHeader title="분석 결과" style={{ marginBottom: spacing.sm + 4 }} />
          <GlassCard intensity={20} style={{ padding: 0, marginBottom: spacing.lg, overflow: 'hidden' }}>
            <MenuItem
              title="퍼스널 컬러"
              completed={!!personalColor}
              subtitle={personalColor?.season ? `${personalColor.season}` : undefined}
              onPress={() => router.push('/(analysis)/personal-color')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="피부 분석"
              completed={!!skinAnalysis}
              subtitle={skinAnalysis?.skinType || undefined}
              onPress={() => router.push('/(analysis)/skin')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="체형 분석"
              completed={!!bodyAnalysis}
              subtitle={bodyAnalysis?.bodyType || undefined}
              onPress={() => router.push('/(analysis)/body')}
            />
          </GlassCard>
        </Animated.View>

        {/* 기록 */}
        <Animated.View entering={staggeredEntry(1)}>
          <SectionHeader title="기록" style={{ marginBottom: spacing.sm + 4 }} />
          <GlassCard intensity={20} style={{ padding: 0, marginBottom: spacing.lg, overflow: 'hidden' }}>
            <MenuItem
              title="운동 기록"
              completed={!!workoutAnalysis}
              subtitle={
                workoutStreak?.currentStreak
                  ? `${workoutStreak.currentStreak}일 연속`
                  : undefined
              }
              onPress={() => router.push('/(tabs)/records')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="식단 기록"
              completed={!!nutritionStreak}
              subtitle={
                nutritionStreak?.currentStreak
                  ? `${nutritionStreak.currentStreak}일 연속`
                  : undefined
              }
              onPress={() => router.push('/(tabs)/records')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="주간 리포트"
              onPress={() => router.push('/reports')}
            />
          </GlassCard>
        </Animated.View>

        {/* 설정 */}
        <Animated.View entering={staggeredEntry(2)}>
          <SectionHeader title="설정" style={{ marginBottom: spacing.sm + 4 }} />
          <GlassCard intensity={20} style={{ padding: 0, overflow: 'hidden' }}>
            <MenuItem
              title="알림 설정"
              subtitle="물, 운동, 식사 알림"
              onPress={() => router.push('/settings/notifications')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="목표 설정"
              subtitle="물, 칼로리, 운동 목표"
              onPress={() => router.push('/settings/goals')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="위젯 설정"
              subtitle="홈 화면 위젯"
              onPress={() => router.push('/settings/widgets')}
            />
            <View style={{ height: 1, backgroundColor: colors.border }} />
            <MenuItem
              title="전체 설정"
              onPress={() => router.push('/settings')}
            />
          </GlassCard>
        </Animated.View>
    </ScreenContainer>
  );
}

// --- 내부 서브 컴포넌트 ---

function MenuItem({
  title,
  completed,
  subtitle,
  onPress,
}: {
  title: string;
  completed?: boolean;
  subtitle?: string;
  onPress?: () => void;
}): React.JSX.Element {
  const { colors, spacing, typography, status } = useTheme();

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { paddingHorizontal: spacing.md, paddingVertical: 14 },
        pressed && { opacity: 0.7 },
      ]}
      onPress={handlePress}
    >
      <View style={styles.menuItemContent}>
        <View style={styles.menuItemTitleRow}>
          <Text
            style={{
              fontSize: typography.size.base,
              color: colors.foreground,
            }}
          >
            {title}
          </Text>
          {completed && (
            <Text
              style={{
                fontSize: 12,
                fontWeight: '600',
                color: status.success,
              }}
            >
              ✓
            </Text>
          )}
        </View>
        {subtitle ? (
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={16} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
