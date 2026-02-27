/**
 * W-1 운동 세션 화면 (타이머 포함)
 * DB의 workout_plans에서 오늘의 운동을 로드
 */
import { router } from 'expo-router';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { ScreenContainer } from '@/components/ui';

import { staggeredEntry } from '@/lib/animations';

import { GlassCard } from '@/components/ui/GlassCard';
import { SkeletonText } from '@/components/ui/SkeletonLoader';
import { useWorkoutData, type WorkoutExercise } from '@/hooks/useWorkoutData';
import { useTheme, typography, radii , spacing } from '@/lib/theme';

// 플랜이 없을 때 사용하는 기본 운동
const DEFAULT_EXERCISES: WorkoutExercise[] = [
  { id: '1', name: '스쿼트', sets: 3, reps: 15, restTime: 60, category: 'lower' },
  { id: '2', name: '푸쉬업', sets: 3, reps: 12, restTime: 45, category: 'upper' },
  { id: '3', name: '런지', sets: 3, reps: 12, restTime: 60, category: 'lower' },
  { id: '4', name: '플랭크', sets: 3, reps: 30, restTime: 30, category: 'core' },
];

type SessionState = 'ready' | 'exercising' | 'resting' | 'completed';

export default function WorkoutSessionScreen() {
  const { colors, isDark, spacing, module: moduleColors, typography } = useTheme();
  const workoutColor = moduleColors.workout.base;
  const { todayWorkout, isLoading: workoutLoading } = useWorkoutData();

  // DB 플랜이 있으면 사용, 없으면 기본 운동
  const exercises = useMemo(
    () => (todayWorkout?.exercises.length ? todayWorkout.exercises : DEFAULT_EXERCISES),
    [todayWorkout]
  );

  const [sessionState, setSessionState] = useState<SessionState>('ready');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [timer, setTimer] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [caloriesBurned, setCaloriesBurned] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentExercise = exercises[currentExerciseIndex];

  // handleRestEnd를 먼저 정의 (useEffect에서 사용)
  const handleRestEnd = useCallback(() => {
    if (currentSet < currentExercise.sets) {
      setCurrentSet((prev) => prev + 1);
      setSessionState('exercising');
    } else if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setSessionState('exercising');
    } else {
      setSessionState('completed');
    }
    setTimer(0);
  }, [currentSet, currentExercise.sets, currentExerciseIndex]);

  // 타이머 효과
  useEffect(() => {
    if (sessionState === 'exercising' || sessionState === 'resting') {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (sessionState === 'resting' && prev <= 1) {
            // 휴식 끝
            handleRestEnd();
            return 0;
          }
          return sessionState === 'resting' ? prev - 1 : prev + 1;
        });
        setTotalTime((prev) => prev + 1);
        // 칼로리 계산 (MET 기반 단순화)
        setCaloriesBurned((prev) => prev + 0.1);
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [sessionState, handleRestEnd]);

  const handleStartSession = () => {
    setSessionState('exercising');
    setTimer(0);
  };

  const handleCompleteSet = () => {
    if (currentSet < currentExercise.sets) {
      // 다음 세트로, 휴식 시작
      setSessionState('resting');
      setTimer(currentExercise.restTime);
    } else if (currentExerciseIndex < exercises.length - 1) {
      // 다음 운동으로, 휴식 시작
      setSessionState('resting');
      setTimer(currentExercise.restTime);
    } else {
      // 운동 완료
      setSessionState('completed');
    }
  };

  const handleSkipRest = () => {
    handleRestEnd();
  };

  const handleEndSession = () => {
    Alert.alert('운동 종료', '운동을 종료하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '종료',
        style: 'destructive',
        onPress: () => router.replace('/(tabs)/records'),
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 로딩 화면
  if (workoutLoading && sessionState === 'ready') {
    return (
      <ScreenContainer scrollable={false} contentPadding={0} testID="workout-session-screen">
        <View style={styles.mainContent}>
          <SkeletonText style={{ width: 120, height: 32, marginBottom: spacing.md }} />
          <SkeletonText style={{ width: 200, height: 16 }} />
        </View>
      </ScreenContainer>
    );
  }

  // 준비 화면
  if (sessionState === 'ready') {
    return (
      <ScreenContainer scrollable={false} contentPadding={0} testID="workout-session-screen">
        <View style={styles.readyContent}>
          <Animated.View entering={FadeInUp.duration(400)}>
            <Text style={[styles.readyTitle, { color: colors.foreground }]}>운동 준비</Text>
            <Text style={[styles.readySubtitle, { color: colors.mutedForeground }]}>
              {todayWorkout?.exercises.length
                ? `오늘의 플랜: ${exercises.length}개 운동`
                : `기본 운동 ${exercises.length}개가 준비되어 있어요`}
            </Text>
          </Animated.View>

          <View style={styles.exercisePreview}>
            {exercises.map((ex, index) => (
              <Animated.View key={ex.id} entering={staggeredEntry(index)}>
                <GlassCard style={styles.previewItem}>
                  <Text style={[styles.previewNumber, { color: colors.mutedForeground }]}>
                    {index + 1}
                  </Text>
                  <Text style={[styles.previewName, { color: colors.foreground }]}>{ex.name}</Text>
                  <Text style={[styles.previewSets, { color: colors.mutedForeground }]}>
                    {ex.sets}세트 x {ex.reps}회
                  </Text>
                </GlassCard>
              </Animated.View>
            ))}
          </View>

          <Pressable
            style={[styles.startButton, { backgroundColor: workoutColor }]}
            onPress={handleStartSession}
          >
            <Text style={[styles.startButtonText, { color: colors.overlayForeground }]}>운동 시작</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // 완료 화면
  if (sessionState === 'completed') {
    return (
      <ScreenContainer scrollable={false} contentPadding={0}>
        <View style={styles.completedContent}>
          <Animated.View entering={FadeIn.duration(500)} style={{ alignItems: 'center' }}>
            <Text style={styles.completedEmoji}>🎉</Text>
            <Text style={[styles.completedTitle, { color: colors.foreground }]}>운동 완료!</Text>
            <Text style={[styles.completedSubtitle, { color: colors.mutedForeground }]}>
              오늘도 열심히 했어요
            </Text>
          </Animated.View>

          <Animated.View entering={staggeredEntry(1)}>
            <GlassCard style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {formatTime(totalTime)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>총 시간</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {Math.round(caloriesBurned)}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>칼로리</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: workoutColor }]}>
                  {exercises.length}
                </Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>운동 수</Text>
              </View>
            </GlassCard>
          </Animated.View>

          <Pressable
            style={[styles.finishButton, { backgroundColor: workoutColor }]}
            onPress={() => router.replace('/(tabs)/records')}
          >
            <Text style={[styles.finishButtonText, { color: colors.overlayForeground }]}>완료</Text>
          </Pressable>
        </View>
      </ScreenContainer>
    );
  }

  // 운동 중 / 휴식 중 화면
  return (
    <ScreenContainer scrollable={false} contentPadding={0}>
      {/* 상단 정보 */}
      <View style={styles.header}>
        <Pressable onPress={handleEndSession}>
          <Text style={[styles.endText, { color: colors.mutedForeground }]}>종료</Text>
        </Pressable>
        <Text style={[styles.totalTimeText, { color: colors.mutedForeground }]}>
          {formatTime(totalTime)}
        </Text>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.mainContent}>
        {sessionState === 'resting' ? (
          <>
            <Text style={[styles.stateLabel, { color: colors.mutedForeground }]}>휴식 중</Text>
            <Text style={[styles.timerText, { color: workoutColor }]}>{formatTime(timer)}</Text>
            <Text style={[styles.nextExerciseText, { color: colors.mutedForeground }]}>
              다음:{' '}
              {currentSet < currentExercise.sets
                ? `${currentExercise.name} ${currentSet + 1}세트`
                : currentExerciseIndex < exercises.length - 1
                  ? exercises[currentExerciseIndex + 1].name
                  : '마지막 운동 완료!'}
            </Text>
            <Pressable
              style={[styles.skipButton, { borderColor: colors.border }]}
              onPress={handleSkipRest}
            >
              <Text style={[styles.skipButtonText, { color: colors.mutedForeground }]}>
                휴식 건너뛰기
              </Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={[styles.exerciseName, { color: colors.foreground }]}>
              {currentExercise.name}
            </Text>
            <Text style={[styles.setInfo, { color: colors.mutedForeground }]}>
              {currentSet} / {currentExercise.sets} 세트
            </Text>
            <Text style={[styles.repsText, { color: workoutColor }]}>
              {currentExercise.reps}회
            </Text>
            <Text style={[styles.timerSmall, { color: colors.mutedForeground }]}>
              {formatTime(timer)}
            </Text>
          </>
        )}
      </View>

      {/* 하단 버튼 */}
      {sessionState === 'exercising' && (
        <View style={styles.footer}>
          <Pressable
            style={[styles.completeButton, { backgroundColor: workoutColor }]}
            onPress={handleCompleteSet}
          >
            <Text style={[styles.completeButtonText, { color: colors.overlayForeground }]}>세트 완료</Text>
          </Pressable>
        </View>
      )}

      {/* 진행 표시 */}
      <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: workoutColor,
              width: `${((currentExerciseIndex * 3 + currentSet) / (exercises.length * 3)) * 100}%`,
            },
          ]}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: spacing.md,
  },
  endText: {
    fontSize: typography.size.base,
  },
  totalTimeText: {
    fontSize: typography.size.base,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  stateLabel: {
    fontSize: typography.size.lg,
    marginBottom: spacing.md,
  },
  timerText: {
    fontSize: 72,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.md,
  },
  timerSmall: {
    fontSize: typography.size['2xl'],
    marginTop: spacing.lg,
  },
  nextExerciseText: {
    fontSize: typography.size.base,
    marginBottom: spacing.xl,
  },
  skipButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: radii.md,
  },
  skipButtonText: {
    fontSize: typography.size.sm,
  },
  exerciseName: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  setInfo: {
    fontSize: typography.size.lg,
    marginBottom: spacing.xl,
  },
  repsText: {
    fontSize: 72,
    fontWeight: typography.weight.bold,
  },
  footer: {
    padding: 20,
  },
  completeButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  progressBar: {
    height: 4,
  },
  progressFill: {
    height: '100%',
  },
  readyContent: {
    flex: 1,
    padding: 20,
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  readySubtitle: {
    fontSize: typography.size.base,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  exercisePreview: {
    gap: 12,
    marginBottom: spacing.xl,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  previewNumber: {
    width: 32,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  previewName: {
    flex: 1,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  previewSets: {
    fontSize: typography.size.sm,
  },
  startButton: {
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  completedContent: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  completedTitle: {
    fontSize: 32,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.sm,
  },
  completedSubtitle: {
    fontSize: typography.size.base,
    marginBottom: spacing.xl,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    marginBottom: spacing.xxl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: typography.weight.bold,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.sm,
  },
  finishButton: {
    borderRadius: 12,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
  },
  finishButtonText: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
});
