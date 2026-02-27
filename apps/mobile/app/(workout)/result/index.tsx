/**
 * W-1 운동 타입 결과 화면
 * 분석 결과를 DB에 저장하고 주간 플랜을 생성
 */
import { useUser } from '@clerk/clerk-expo';
import type { WorkoutType } from '@yiroom/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { ScreenContainer, DataStateWrapper } from '@/components/ui';
import { GlassCard } from '@/components/ui/GlassCard';
import { staggeredEntry } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme, typography} from '@/lib/theme';
import { workoutLogger } from '@/lib/utils/logger';
import { generateWeeklyPlan, estimatePlanMinutes } from '@/lib/workout/planTemplates';

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

export default function WorkoutResultScreen() {
  const { colors, spacing, module: moduleColors, typography } = useTheme();
  const workoutColor = moduleColors.workout.base;
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

        // 1. workout_analyses에 저장
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

        // 2. 주간 플랜 생성
        const weeklyPlan = generateWeeklyPlan(type, freq);
        const totalMinutes = estimatePlanMinutes(weeklyPlan);

        // 이번 주 월요일 계산
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        const monday = new Date(today);
        monday.setDate(today.getDate() - diff);
        const weekStartDate = monday.toISOString().split('T')[0];

        // 3. workout_plans에 저장
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
    // 분석 진행 애니메이션용 딜레이
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const parsedGoals = JSON.parse(goals || '[]') as string[];
    const type = determineWorkoutType(parsedGoals);

    setWorkoutType(type);
    setIsLoading(false);

    // DB에 저장 (비동기, UI 블로킹 안 함)
    saveAnalysisAndPlan(type);
  }, [goals, determineWorkoutType, saveAnalysisAndPlan]);

  useEffect(() => {
    analyzeWorkoutType();
  }, [analyzeWorkoutType]);

  const handleStartSession = () => {
    router.push('/(workout)/session');
  };

  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  const typeData = workoutType ? WORKOUT_TYPE_DATA[workoutType] : null;

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={20}
      testID="workout-result-screen"
    >
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
        {/* 결과 헤더 */}
        <Animated.View entering={staggeredEntry(0)}>
          <GlassCard style={styles.resultHeader}>
            <Text style={styles.resultEmoji}>{typeData!.emoji}</Text>
            <Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>
              당신의 운동 타입은
            </Text>
            <Text style={[styles.resultType, { color: workoutColor }]}>{typeData!.name}</Text>
            <Text style={[styles.resultDescription, { color: colors.mutedForeground }]}>
              {typeData!.description}
            </Text>
          </GlassCard>
        </Animated.View>

        {/* 특성 */}
        <Animated.View entering={staggeredEntry(1)}>
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>나의 운동 특성</Text>
            <View style={styles.tagContainer}>
              {typeData!.characteristics.map((char, index) => (
                <View
                  key={index}
                  style={[styles.tag, { backgroundColor: `${workoutColor}20` }]}
                >
                  <Text style={[styles.tagText, { color: workoutColor }]}>{char}</Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* 추천 운동 */}
        <Animated.View entering={staggeredEntry(2)}>
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>추천 운동</Text>
            <View style={styles.exerciseList}>
              {typeData!.recommendedExercises.map((exercise, index) => (
                <View key={index} style={styles.exerciseItem}>
                  <View style={[styles.exerciseBullet, { backgroundColor: workoutColor }]} />
                  <Text style={[styles.exerciseName, { color: colors.foreground }]}>
                    {exercise}
                  </Text>
                </View>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* 설정 정보 */}
        <Animated.View entering={staggeredEntry(3)}>
          <GlassCard style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>운동 설정</Text>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>빈도</Text>
              <Text style={[styles.settingValue, { color: colors.foreground }]}>
                주 {frequency || '3-4'}회
              </Text>
            </View>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.settingLabel, { color: colors.mutedForeground }]}>시간</Text>
              <Text style={[styles.settingValue, { color: colors.foreground }]}>
                {duration || '30-45'}분
              </Text>
            </View>
          </GlassCard>
        </Animated.View>

        {/* 버튼 */}
        <Animated.View entering={staggeredEntry(4)} style={styles.buttons}>
          <Pressable
            style={[styles.primaryButton, { backgroundColor: workoutColor }]}
            onPress={handleStartSession}
          >
            <Text style={[styles.primaryButtonText, { color: colors.overlayForeground }]}>운동 시작하기</Text>
          </Pressable>
          <Pressable
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handleGoHome}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.mutedForeground }]}>
              홈으로 돌아가기
            </Text>
          </Pressable>
        </Animated.View>
      </DataStateWrapper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  resultType: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: typography.weight.semibold,
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    fontWeight: typography.weight.medium,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  settingLabel: {
    fontSize: 14,
  },
  settingValue: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: typography.weight.semibold,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
  },
});
