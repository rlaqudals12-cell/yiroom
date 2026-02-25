/**
 * W-1 운동 타입 결과 화면
 * 분석 결과를 DB에 저장하고 주간 플랜을 생성
 */
import { useUser } from '@clerk/clerk-expo';
import type { WorkoutType } from '@yiroom/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClerkSupabaseClient } from '@/lib/supabase';
import { useTheme } from '@/lib/theme';
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

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.containerDark]}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={[styles.loadingText, isDark && styles.textLight]}>
          운동 타입을 분석 중이에요...
        </Text>
      </View>
    );
  }

  if (!workoutType) {
    return (
      <View style={[styles.errorContainer, isDark && styles.containerDark]}>
        <Text style={[styles.errorText, isDark && styles.textLight]}>분석에 실패했습니다.</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => router.replace('/(workout)/onboarding')}
        >
          <Text style={styles.retryButtonText}>다시 시도하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const typeData = WORKOUT_TYPE_DATA[workoutType];

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
      testID="workout-result-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        {/* 결과 헤더 */}
        <View style={styles.resultHeader}>
          <Text style={styles.resultEmoji}>{typeData.emoji}</Text>
          <Text style={[styles.resultLabel, isDark && styles.textMuted]}>당신의 운동 타입은</Text>
          <Text style={[styles.resultType, isDark && styles.textLight]}>{typeData.name}</Text>
          <Text style={[styles.resultDescription, isDark && styles.textMuted]}>
            {typeData.description}
          </Text>
        </View>

        {/* 특성 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>나의 운동 특성</Text>
          <View style={styles.tagContainer}>
            {typeData.characteristics.map((char, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{char}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 추천 운동 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>추천 운동</Text>
          <View style={styles.exerciseList}>
            {typeData.recommendedExercises.map((exercise, index) => (
              <View key={index} style={styles.exerciseItem}>
                <View style={styles.exerciseBullet} />
                <Text style={[styles.exerciseName, isDark && styles.textLight]}>{exercise}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 설정 정보 */}
        <View style={[styles.section, isDark && styles.sectionDark]}>
          <Text style={[styles.sectionTitle, isDark && styles.textLight]}>운동 설정</Text>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, isDark && styles.textMuted]}>빈도</Text>
            <Text style={[styles.settingValue, isDark && styles.textLight]}>
              주 {frequency || '3-4'}회
            </Text>
          </View>
          <View style={styles.settingRow}>
            <Text style={[styles.settingLabel, isDark && styles.textMuted]}>시간</Text>
            <Text style={[styles.settingValue, isDark && styles.textLight]}>
              {duration || '30-45'}분
            </Text>
          </View>
        </View>

        {/* 버튼 */}
        <View style={styles.buttons}>
          <TouchableOpacity style={styles.primaryButton} onPress={handleStartSession}>
            <Text style={styles.primaryButtonText}>운동 시작하기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoHome}>
            <Text style={styles.secondaryButtonText}>홈으로 돌아가기</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fc',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  resultEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resultType: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 12,
  },
  resultDescription: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionDark: {
    backgroundColor: '#1a1a1a',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#fef2f2',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '500',
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
    backgroundColor: '#ef4444',
  },
  exerciseName: {
    fontSize: 15,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingLabel: {
    fontSize: 14,
    color: '#666',
  },
  settingValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  buttons: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#ef4444',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
  },
  textLight: {
    color: '#ffffff',
  },
  textMuted: {
    color: '#999',
  },
});
