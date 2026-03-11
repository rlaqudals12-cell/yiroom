/**
 * W-1 운동 타입 결과 화면
 * UX v3: GlassCard + GradientText + CelebrationEffect + backgroundGradient + coloredShadow + a11y
 */
import { useUser } from '@clerk/clerk-expo';
import type { WorkoutType } from '@yiroom/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  CelebrationEffect,
  GlassCard,
  GradientText,
  ScreenContainer,
  DataStateWrapper,
} from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, typography, spacing, radii } from '@/lib/theme';
import { workoutLogger } from '@/lib/utils/logger';
import { generateWeeklyPlan, estimatePlanMinutes } from '@/lib/workout/planTemplates';

const WORKOUT_ACCENT = '#10B981';

// 운동 타입 데이터
const WORKOUT_TYPE_DATA: Record<
  WorkoutType,
  {
    name: string;
    emoji: string;
    description: string;
    characteristics: string[];
    recommendedExercises: string[];
  }
> = {
  toner: {
    name: '토너',
    emoji: '🎯',
    description: '균형 잡힌 몸매를 만들고 싶은 당신! 전신 근력과 유연성을 동시에 키워요.',
    characteristics: ['균형 잡힌 운동', '전신 운동 선호', '유연성 중시'],
    recommendedExercises: ['필라테스', '요가', '바디웨이트 트레이닝'],
  },
  builder: {
    name: '빌더',
    emoji: '💪',
    description: '근육량 증가가 목표인 당신! 무게를 늘려가며 근력을 키워요.',
    characteristics: ['근육량 증가', '고중량 선호', '분할 운동'],
    recommendedExercises: ['웨이트 트레이닝', '데드리프트', '벤치프레스'],
  },
  burner: {
    name: '버너',
    emoji: '🔥',
    description: '체지방 감소가 목표인 당신! 고강도 운동으로 칼로리를 태워요.',
    characteristics: ['체지방 감소', '고강도 선호', 'HIIT'],
    recommendedExercises: ['버피', '마운틴 클라이머', '점프 스쿼트'],
  },
  mover: {
    name: '무버',
    emoji: '🏃',
    description: '심폐 지구력 향상이 목표인 당신! 꾸준한 유산소로 체력을 키워요.',
    characteristics: ['심폐 지구력', '유산소 선호', '장시간 운동'],
    recommendedExercises: ['러닝', '사이클', '수영'],
  },
  flexer: {
    name: '플렉서',
    emoji: '🧘',
    description: '유연성과 이완이 목표인 당신! 스트레칭으로 몸과 마음을 풀어요.',
    characteristics: ['유연성 향상', '스트레스 해소', '이완 중시'],
    recommendedExercises: ['요가', '스트레칭', '폼롤링'],
  },
};

export default function WorkoutResultScreen(): React.JSX.Element {
  const { colors, isDark } = useTheme();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();
  const { goals, frequency, duration } = useLocalSearchParams<{
    goals: string;
    frequency: string;
    duration: string;
  }>();

  const [isLoading, setIsLoading] = useState(true);
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // 목표 기반 운동 타입 결정
  const determineWorkoutType = useCallback((parsedGoals: string[]): WorkoutType => {
    if (parsedGoals.includes('muscle_gain')) return 'builder';
    if (parsedGoals.includes('weight_loss')) return 'burner';
    if (parsedGoals.includes('endurance')) return 'mover';
    if (parsedGoals.includes('flexibility') || parsedGoals.includes('stress')) return 'flexer';
    return 'toner';
  }, []);

  // 분석 결과 DB 저장 + 주간 플랜 생성
  const saveAnalysisAndPlan = useCallback(
    async (type: WorkoutType) => {
      if (!user?.id || isSaved) return;

      try {
        const parsedGoals = JSON.parse(goals || '[]') as string[];
        const freq = parseInt(frequency || '3', 10);

        const { data: analysisData, error: analysisError } = await supabase
          .from('workout_analyses')
          .insert({
            workout_type: type,
            fitness_level: 'beginner',
            goals: parsedGoals,
            frequency: freq,
          })
          .select('id')
          .single();

        if (analysisError) {
          workoutLogger.error('분석 저장 실패:', analysisError);
          return;
        }

        const weeklyPlan = generateWeeklyPlan(type, freq);
        const totalMinutes = estimatePlanMinutes(weeklyPlan);

        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);
        const weekStartDate = monday.toISOString().split('T')[0];

        const { error: planError } = await supabase.from('workout_plans').insert({
          analysis_id: analysisData.id,
          week_start_date: weekStartDate,
          week_number: 1,
          weekly_plan: weeklyPlan,
          total_workout_days: freq,
          total_estimated_minutes: totalMinutes,
        });

        if (planError) {
          workoutLogger.error('플랜 저장 실패:', planError);
          return;
        }

        setIsSaved(true);
        workoutLogger.info('분석 + 플랜 저장 완료', { type, frequency: freq });
      } catch (err) {
        workoutLogger.error('저장 중 오류:', err);
      }
    },
    [user?.id, supabase, goals, frequency, isSaved]
  );

  // 운동 타입 분석
  const analyzeWorkoutType = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const parsedGoals = JSON.parse(goals || '[]') as string[];
    const type = determineWorkoutType(parsedGoals);

    setWorkoutType(type);
    setIsLoading(false);
    setShowCelebration(true);

    saveAnalysisAndPlan(type);
  }, [goals, determineWorkoutType, saveAnalysisAndPlan]);

  useEffect(() => {
    analyzeWorkoutType();
  }, [analyzeWorkoutType]);

  const handleStartSession = (): void => {
    router.push('/(workout)/session');
  };

  const handleGoHome = (): void => {
    router.replace('/(tabs)');
  };

  const typeData = workoutType ? WORKOUT_TYPE_DATA[workoutType] : null;

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      contentContainerStyle={{ paddingBottom: 100 }}
      backgroundGradient="workout"
      testID="workout-result-screen"
    >
      {/* 분석 완료 축하 이펙트 */}
      <CelebrationEffect
        type="analysis_complete"
        visible={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={!workoutType}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>🏋️</Text>,
          title: '분석에 실패했어요',
          description: '다시 시도해주세요',
        }}
        onRetry={() => router.replace('/(workout)/onboarding')}
      >
        {/* 글래스모피즘 히어로 결과 헤더 */}
        <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
          <GlassCard shadowSize="xl" glowColor={WORKOUT_ACCENT} style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>{typeData!.emoji}</Text>
            <Text
              style={[styles.resultLabel, { color: colors.mutedForeground }]}
              accessibilityLabel="당신의 운동 타입 결과"
            >
              당신의 운동 타입은
            </Text>
            <GradientText
              variant="extended"
              fontSize={32}
              fontWeight="700"
              style={styles.resultTypeText}
            >
              {typeData!.name}
            </GradientText>
            <Text
              style={[styles.resultDescription, { color: colors.mutedForeground }]}
              accessibilityLabel={typeData!.description}
            >
              {typeData!.description}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* 특성 카드 */}
        <Animated.View entering={FadeInUp.delay(100).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>나의 운동 특성</Text>
            <View style={styles.tagContainer}>
              {typeData!.characteristics.map((char) => (
                <View
                  key={char}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: `${WORKOUT_ACCENT}20`,
                      borderWidth: 1,
                      borderColor: `${WORKOUT_ACCENT}40`,
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: WORKOUT_ACCENT }]}>{char}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* 추천 운동 카드 */}
        <Animated.View entering={FadeInUp.delay(200).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>추천 운동</Text>
            <View style={styles.exerciseList}>
              {typeData!.recommendedExercises.map((exercise) => (
                <View key={exercise} style={styles.exerciseItem}>
                  <View style={[styles.exerciseBullet, { backgroundColor: WORKOUT_ACCENT }]} />
                  <Text style={[styles.exerciseName, { color: colors.foreground }]}>
                    {exercise}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* 설정 정보 카드 */}
        <Animated.View entering={FadeInUp.delay(300).duration(TIMING.normal)}>
          <GlassCard shadowSize="md" style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>운동 설정</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>빈도</Text>
              <Text style={[styles.settingValue, { color: WORKOUT_ACCENT }]}>
                주 {frequency || '3-4'}회
              </Text>
            </View>
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>시간</Text>
              <Text style={[styles.settingValue, { color: WORKOUT_ACCENT }]}>
                {duration || '30-45'}분
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 그라디언트 CTA 버튼 */}
        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Pressable
            style={[
              styles.primaryButton,
              { overflow: 'hidden' },
              !isDark
                ? (Platform.select({
                    ios: {
                      shadowColor: WORKOUT_ACCENT,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                    },
                    android: { elevation: 4 },
                  }) ?? {})
                : {},
            ]}
            onPress={handleStartSession}
            accessibilityRole="button"
            accessibilityLabel="운동 시작하기"
          >
            <LinearGradient
              colors={[WORKOUT_ACCENT, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>운동 시작하기</Text>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryButton,
              { borderColor: colors.border, backgroundColor: colors.card },
            ]}
            onPress={handleGoHome}
            accessibilityRole="button"
            accessibilityLabel="홈으로 돌아가기"
          >
            <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>
              홈으로 돌아가기
            </Text>
          </Pressable>
        </View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    padding: spacing.xl,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  resultLabel: {
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
  },
  resultTypeText: {
    marginBottom: spacing.smx,
  },
  resultDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: spacing.mlg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.md,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  tagText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  exerciseList: {
    gap: spacing.smx,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smx,
  },
  exerciseBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  exerciseName: {
    fontSize: 15,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  settingLabel: {
    fontSize: typography.size.sm,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.mlg,
    borderTopWidth: 1,
    gap: spacing.smx,
  },
  primaryButton: {
    borderRadius: radii.full,
  },
  buttonGradient: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: typography.size.base,
  },
});
