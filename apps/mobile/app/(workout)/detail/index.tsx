/**
 * 운동 세션 상세 화면
 *
 * 히스토리에서 선택한 운동 세션의 상세 정보.
 * - 운동 요약 (날짜, 시간, 칼로리)
 * - 운동별 세트/반복/난이도
 * - 메모/기분
 */
import { useLocalSearchParams } from 'expo-router';
import { Clock, Flame, Dumbbell, MessageSquare, TrendingUp } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';
import { TIMING } from '@/lib/animations';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { workoutLogger } from '../../../lib/utils/logger';

interface ExerciseLog {
  exercise_name: string;
  sets: number;
  reps: number;
  weight?: number;
  duration?: number;
  difficulty: number;
}

interface WorkoutDetail {
  id: string;
  workoutDate: string;
  actualDuration: number | null;
  actualCalories: number | null;
  perceivedEffort: number | null;
  mood: string | null;
  notes: string | null;
  exerciseLogs: ExerciseLog[];
}

function getMoodLabel(mood: string | null): string {
  if (!mood) return '';
  const labels: Record<string, string> = {
    great: '최고',
    good: '좋음',
    okay: '보통',
    tired: '피곤',
    bad: '안좋음',
  };
  return labels[mood] || mood;
}

function getMoodEmoji(mood: string | null): string {
  if (!mood) return '';
  const emojis: Record<string, string> = {
    great: '\u{1F929}',
    good: '\u{1F60A}',
    okay: '\u{1F610}',
    tired: '\u{1F634}',
    bad: '\u{1F61E}',
  };
  return emojis[mood] || '';
}

function getEffortLabel(effort: number | null): string {
  if (effort == null) return '';
  if (effort <= 3) return '가벼움';
  if (effort <= 5) return '보통';
  if (effort <= 7) return '힘듦';
  return '매우 힘듦';
}

function getDifficultyColor(difficulty: number, status: { success: string; warning: string; error: string }): string {
  if (difficulty <= 3) return status.success;
  if (difficulty <= 6) return status.warning;
  return status.error;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export default function WorkoutDetailScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status, shadows, module: moduleColors } = useTheme();
  const workoutColor = moduleColors.workout.base;
  const params = useLocalSearchParams<{ id?: string }>();
  const supabase = useClerkSupabaseClient();

  const [detail, setDetail] = useState<WorkoutDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDetail = useCallback(async () => {
    if (!params.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('workout_logs')
        .select('id, workout_date, actual_duration, actual_calories, perceived_effort, mood, notes, exercise_logs')
        .eq('id', params.id)
        .single();

      if (error || !data) {
        workoutLogger.warn('Workout detail not found:', params.id);
        setIsLoading(false);
        return;
      }

      setDetail({
        id: data.id,
        workoutDate: data.workout_date,
        actualDuration: data.actual_duration,
        actualCalories: data.actual_calories,
        perceivedEffort: data.perceived_effort,
        mood: data.mood,
        notes: data.notes,
        exerciseLogs: Array.isArray(data.exercise_logs) ? data.exercise_logs : [],
      });
    } catch (err) {
      workoutLogger.error('Workout detail fetch failed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [params.id, supabase]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  if (isLoading) {
    return (
      <SafeAreaView
        testID="workout-detail-screen"
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ActivityIndicator size="large" color={workoutColor} />
        <Text style={{ marginTop: spacing.sm, fontSize: typography.size.sm, color: colors.mutedForeground }}>
          운동 기록을 불러오고 있어요
        </Text>
      </SafeAreaView>
    );
  }

  if (!detail) {
    return (
      <SafeAreaView
        testID="workout-detail-screen"
        style={[styles.center, { flex: 1, backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <Dumbbell size={48} color={colors.mutedForeground} />
        <Text style={{ marginTop: spacing.md, fontSize: typography.size.base, fontWeight: '600', color: colors.foreground }}>
          운동 기록을 찾을 수 없어요
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      testID="workout-detail-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['bottom']}
    >
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={fetchDetail} />}
      >
        {/* 날짜 + 요약 */}
        <Animated.View
          entering={FadeInUp.duration(TIMING.normal)}
          style={[
            shadows.card,
            {
              backgroundColor: workoutColor,
              borderRadius: radii.xl,
              padding: spacing.lg,
              marginBottom: spacing.lg,
            },
          ]}
        >
          <Text style={{ fontSize: typography.size.lg, fontWeight: typography.weight.bold, color: '#fff' }}>
            {formatDate(detail.workoutDate)}
          </Text>
          <View style={[styles.summaryRow, { marginTop: spacing.md }]}>
            {detail.actualDuration != null && (
              <View style={styles.summaryItem}>
                <Clock size={16} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.summaryValue, { color: '#fff' }]}>{detail.actualDuration}분</Text>
                <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>운동 시간</Text>
              </View>
            )}
            {detail.actualCalories != null && (
              <View style={styles.summaryItem}>
                <Flame size={16} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.summaryValue, { color: '#fff' }]}>{detail.actualCalories}kcal</Text>
                <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>소모 칼로리</Text>
              </View>
            )}
            {detail.exerciseLogs.length > 0 && (
              <View style={styles.summaryItem}>
                <Dumbbell size={16} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.summaryValue, { color: '#fff' }]}>{detail.exerciseLogs.length}종목</Text>
                <Text style={[styles.summaryLabel, { color: 'rgba(255,255,255,0.7)' }]}>운동 수</Text>
              </View>
            )}
          </View>
        </Animated.View>

        {/* 운동 종목 */}
        {detail.exerciseLogs.length > 0 && (
          <Animated.View entering={FadeInUp.delay(80).duration(TIMING.normal)}>
            <Text
              style={{
                fontSize: typography.size.base,
                fontWeight: typography.weight.bold,
                color: colors.foreground,
                marginBottom: spacing.sm,
              }}
            >
              운동 종목
            </Text>
            {detail.exerciseLogs.map((ex, idx) => (
              <View
                key={`${ex.exercise_name}-${idx}`}
                style={[
                  styles.exerciseCard,
                  shadows.card,
                  {
                    backgroundColor: colors.card,
                    borderRadius: radii.lg,
                    borderColor: colors.border,
                    padding: spacing.md,
                    marginBottom: spacing.sm,
                  },
                ]}
              >
                <View style={styles.exerciseHeader}>
                  <Text
                    style={{
                      fontSize: typography.size.sm,
                      fontWeight: typography.weight.semibold,
                      color: colors.foreground,
                      flex: 1,
                    }}
                  >
                    {ex.exercise_name}
                  </Text>
                  <View
                    style={[
                      styles.diffBadge,
                      {
                        backgroundColor: getDifficultyColor(ex.difficulty, status) + '20',
                        borderRadius: radii.sm,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        fontSize: typography.size.xs,
                        fontWeight: '600',
                        color: getDifficultyColor(ex.difficulty, status),
                      }}
                    >
                      난이도 {ex.difficulty}/10
                    </Text>
                  </View>
                </View>
                <View style={[styles.exerciseMeta, { marginTop: spacing.xs }]}>
                  {ex.sets > 0 && (
                    <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                      {ex.sets}세트
                    </Text>
                  )}
                  {ex.reps > 0 && (
                    <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                      {ex.reps}회
                    </Text>
                  )}
                  {ex.weight != null && ex.weight > 0 && (
                    <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                      {ex.weight}kg
                    </Text>
                  )}
                  {ex.duration != null && ex.duration > 0 && (
                    <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
                      {ex.duration}분
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        {/* 체감/기분 */}
        {(detail.perceivedEffort != null || detail.mood) && (
          <Animated.View
            entering={FadeInUp.delay(160).duration(TIMING.normal)}
            style={[
              shadows.card,
              {
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                borderColor: colors.border,
                borderWidth: 1,
                padding: spacing.md,
                marginTop: spacing.sm,
                marginBottom: spacing.sm,
              },
            ]}
          >
            <View style={styles.feelRow}>
              {detail.perceivedEffort != null && (
                <View style={styles.feelItem}>
                  <TrendingUp size={16} color={workoutColor} />
                  <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.foreground, marginLeft: spacing.xs }}>
                    체감 강도
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginLeft: spacing.xs }}>
                    {detail.perceivedEffort}/10 ({getEffortLabel(detail.perceivedEffort)})
                  </Text>
                </View>
              )}
              {detail.mood && (
                <View style={[styles.feelItem, { marginTop: detail.perceivedEffort != null ? spacing.sm : 0 }]}>
                  <Text style={{ fontSize: 16 }}>{getMoodEmoji(detail.mood)}</Text>
                  <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.foreground, marginLeft: spacing.xs }}>
                    기분
                  </Text>
                  <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginLeft: spacing.xs }}>
                    {getMoodLabel(detail.mood)}
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        )}

        {/* 메모 */}
        {detail.notes && (
          <Animated.View
            entering={FadeInUp.delay(240).duration(TIMING.normal)}
            style={[
              shadows.card,
              {
                backgroundColor: colors.card,
                borderRadius: radii.lg,
                borderColor: colors.border,
                borderWidth: 1,
                padding: spacing.md,
                marginTop: spacing.sm,
              },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
              <MessageSquare size={14} color={colors.mutedForeground} />
              <Text style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.foreground, marginLeft: spacing.xs }}>
                메모
              </Text>
            </View>
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, lineHeight: 20 }}>
              {detail.notes}
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  summaryLabel: {
    fontSize: 11,
  },
  exerciseCard: {
    borderWidth: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 12,
  },
  feelRow: {},
  feelItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
