/**
 * 프로필 화면 (Clerk 인증 연동)
 * 그라디언트 헤더 + 웰니스 점수 + 레벨 + 업적 + 타임라인 + 기록/설정
 * D2-4: 그라디언트 배경, AnalysisTimeline 통합, GradientCard 적용
 */
import { useUser, useClerk } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Platform, View, Text, StyleSheet, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import { AnalysisTimeline } from '../../components/analysis';
import { WellnessScoreRing, LevelBadge, AchievementGrid } from '../../components/profile';
import { GlassCard, GradientBackground, GradientCard, ScreenContainer, SectionHeader } from '../../components/ui';
import { useUserAnalyses, useWorkoutData, useNutritionData, useWellnessScore } from '../../hooks';
import { staggeredEntry, TIMING } from '../../lib/animations';
import { useTheme, typography, spacing, radii, borderGlow } from '../../lib/theme';
import { profileLogger } from '../../lib/utils/logger';

export default function ProfileScreen(): React.JSX.Element {
  const { colors, brand, spacing, typography, status, isDark } = useTheme();
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
    <ScreenContainer testID="profile-screen" backgroundGradient="profile" contentContainerStyle={{ paddingBottom: spacing.xl + spacing.sm }} refreshing={refreshing} onRefresh={handleRefresh}>
        {/* 프로필 헤더 — 브랜드 그라디언트 + GlassCard */}
        <Animated.View entering={FadeIn.duration(TIMING.normal)}>
          <GradientBackground
            variant="brand"
            style={{
              borderRadius: radii.xl + spacing.xs,
              padding: spacing.sm,
              marginBottom: spacing.md,
            }}
            testID="profile-gradient-header"
          >
            <GlassCard
              intensity={35}
              shadowSize="xl"
              glowColor={brand.primary}
              style={{ padding: spacing.lg, alignItems: 'center' }}
            >
              {isSignedIn && user ? (
                <>
                  {/* 아바타 그라디언트 보더 링 (웹 from-purple-400 to-indigo-500 대응) */}
                  <LinearGradient
                    colors={['#C084FC', '#818CF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarRing}
                  >
                    <View style={[styles.avatarRingInner, { backgroundColor: colors.card }]}>
                      {user.imageUrl ? (
                        <Image source={{ uri: user.imageUrl }} style={styles.avatar} accessibilityLabel="프로필 사진" accessibilityRole="image" />
                      ) : (
                        <View
                          style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}
                        >
                          <Text style={{ fontSize: typography.size['3xl'] + 2, color: colors.mutedForeground }}>
                            {user.firstName?.[0] ||
                              user.emailAddresses[0]?.emailAddress[0]?.toUpperCase() ||
                              '?'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                  <Text
                    style={{
                      fontSize: typography.size.lg,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      marginBottom: spacing.xs,
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
                  {/* 로그아웃 — 약한 destructive 힌트 */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      {
                        backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.08)',
                        opacity: pressed ? 0.85 : 1,
                      },
                    ]}
                    onPress={handleSignOut}
                    accessibilityRole="button"
                    accessibilityLabel="로그아웃"
                  >
                    <Text
                      style={{
                        color: colors.destructive,
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
                  {/* 비로그인 아바타 그라디언트 링 */}
                  <LinearGradient
                    colors={['#C084FC', '#818CF8']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.avatarRing}
                  >
                    <View style={[styles.avatarRingInner, { backgroundColor: colors.card }]}>
                      <View
                        style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}
                      >
                        <Text style={{ fontSize: typography.size['3xl'] + 2, color: colors.mutedForeground }}>?</Text>
                      </View>
                    </View>
                  </LinearGradient>
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
                  {/* 로그인 CTA — 그라디언트 버튼 (Phase 21 패턴) */}
                  <Pressable
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                    onPress={handleSignIn}
                    accessibilityRole="button"
                    accessibilityLabel="로그인"
                  >
                    <LinearGradient
                      colors={[brand.primary, '#7C3AED']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.actionButton}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: typography.size.sm,
                          fontWeight: typography.weight.semibold,
                        }}
                      >
                        로그인
                      </Text>
                    </LinearGradient>
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
          style={{ marginBottom: spacing.md, ...borderGlow.pink }}
          testID="wellness-score"
        />

        {/* 업적 그리드 */}
        <AchievementGrid
          achievements={achievements}
          style={{ marginBottom: spacing.lg, ...borderGlow.pink }}
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
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
            <MenuItem
              title="피부 분석"
              completed={!!skinAnalysis}
              subtitle={skinAnalysis?.skinType || undefined}
              onPress={() => router.push('/(analysis)/skin')}
            />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
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
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
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
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
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
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
            <MenuItem
              title="목표 설정"
              subtitle="물, 칼로리, 운동 목표"
              onPress={() => router.push('/settings/goals')}
            />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
            <MenuItem
              title="위젯 설정"
              subtitle="홈 화면 위젯"
              onPress={() => router.push('/settings/widgets')}
            />
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginHorizontal: spacing.md }} />
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
  const { colors, spacing, typography, status, isDark } = useTheme();

  const handlePress = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.menuItem,
        { paddingHorizontal: spacing.md, paddingVertical: spacing.sm + spacing.xs + 2 },
        pressed && { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
      ]}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}${completed ? ', 완료됨' : ''}`}
      accessibilityHint={`${title} 화면으로 이동합니다`}
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
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
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
              marginTop: spacing.xs / 2,
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

const AVATAR_SIZE = spacing.xl * 2 + spacing.md; // 80
const AVATAR_RADIUS = AVATAR_SIZE / 2;
const AVATAR_RING_SIZE = AVATAR_SIZE + 8;

const styles = StyleSheet.create({
  avatarRing: {
    width: AVATAR_RING_SIZE,
    height: AVATAR_RING_SIZE,
    borderRadius: AVATAR_RING_SIZE / 2,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + spacing.xs,
  },
  avatarRingInner: {
    width: AVATAR_SIZE + 2,
    height: AVATAR_SIZE + 2,
    borderRadius: (AVATAR_SIZE + 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
  },
  avatarPlaceholder: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radii.full,
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
    gap: spacing.sm,
  },
});
