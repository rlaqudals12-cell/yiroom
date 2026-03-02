/**
 * 주간 운동 플랜 화면
 *
 * 사용자의 운동 유형 결과 기반으로 주간 운동 계획을 표시한다.
 */
import { useRouter } from 'expo-router';
import { Platform, View, Text, ScrollView, Pressable } from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '../../../lib/theme';
import { staggeredEntry } from '../../../lib/animations';

interface DayPlan {
  day: string;
  dayShort: string;
  isToday: boolean;
  isRest: boolean;
  exercises: { name: string; duration: string; emoji: string }[];
}

const MOCK_WEEK_PLAN: DayPlan[] = [
  {
    day: '월요일',
    dayShort: '월',
    isToday: true,
    isRest: false,
    exercises: [
      { name: '러닝', duration: '30분', emoji: '🏃' },
      { name: '코어 운동', duration: '15분', emoji: '💪' },
    ],
  },
  {
    day: '화요일',
    dayShort: '화',
    isToday: false,
    isRest: false,
    exercises: [
      { name: '상체 웨이트', duration: '40분', emoji: '🏋️' },
      { name: '스트레칭', duration: '10분', emoji: '🧘' },
    ],
  },
  {
    day: '수요일',
    dayShort: '수',
    isToday: false,
    isRest: true,
    exercises: [],
  },
  {
    day: '목요일',
    dayShort: '목',
    isToday: false,
    isRest: false,
    exercises: [
      { name: '하체 웨이트', duration: '40분', emoji: '🦵' },
      { name: '유산소', duration: '20분', emoji: '🚴' },
    ],
  },
  {
    day: '금요일',
    dayShort: '금',
    isToday: false,
    isRest: false,
    exercises: [
      { name: '전신 서킷', duration: '30분', emoji: '⚡' },
      { name: '스트레칭', duration: '10분', emoji: '🧘' },
    ],
  },
  {
    day: '토요일',
    dayShort: '토',
    isToday: false,
    isRest: false,
    exercises: [{ name: '야외 활동', duration: '60분', emoji: '🌿' }],
  },
  {
    day: '일요일',
    dayShort: '일',
    isToday: false,
    isRest: true,
    exercises: [],
  },
];

export default function WorkoutPlanScreen(): React.ReactElement {
  const router = useRouter();
  const { colors, brand, spacing, radii, typography, status, shadows, isDark, module: moduleColors } = useTheme();

  return (
    <ScrollView
      testID="workout-plan-screen"
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.md }}
    >
      <Text
        style={{
          fontSize: typography.size['2xl'],
          fontWeight: typography.weight.bold,
          color: colors.foreground,
          marginBottom: spacing.xs,
        }}
      >
        주간 운동 플랜
      </Text>
      <Text
        style={{
          fontSize: typography.size.base,
          color: colors.mutedForeground,
          marginBottom: spacing.lg,
        }}
      >
        이번 주 운동 계획이에요
      </Text>

      {/* 요일 인디케이터 */}
      <View style={{ flexDirection: 'row', gap: spacing.xs, marginBottom: spacing.lg }}>
        {MOCK_WEEK_PLAN.map((day) => (
          <View
            key={day.day}
            style={[
              {
                flex: 1,
                alignItems: 'center',
                paddingVertical: spacing.smx,
                borderRadius: radii.xl,
                backgroundColor: day.isToday ? moduleColors.workout.base : day.isRest ? colors.secondary : colors.card,
                borderWidth: 1,
                borderColor: day.isToday ? moduleColors.workout.base : colors.border,
              },
              day.isToday && !isDark
                ? Platform.select({
                    ios: { shadowColor: moduleColors.workout.base, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.25, shadowRadius: 8 },
                    android: { elevation: 3 },
                  }) ?? {}
                : {},
            ]}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: day.isToday ? typography.weight.bold : typography.weight.normal,
                color: day.isToday ? colors.overlayForeground : colors.mutedForeground,
              }}
            >
              {day.dayShort}
            </Text>
            <Text style={{ fontSize: 10, marginTop: spacing.xxs, color: day.isToday ? colors.overlayForeground : colors.mutedForeground }}>
              {day.isRest ? '휴식' : `${day.exercises.length}개`}
            </Text>
          </View>
        ))}
      </View>

      {/* 일별 상세 */}
      <View style={{ gap: spacing.smx }}>
        {MOCK_WEEK_PLAN.map((day, index) => (
          <Animated.View
            key={day.day}
            entering={staggeredEntry(index)}
            style={[
              {
                backgroundColor: colors.card,
                borderRadius: radii.xl,
                padding: spacing.md,
                borderLeftWidth: day.isToday ? 3 : 0,
                borderLeftColor: day.isToday ? moduleColors.workout.base : undefined,
                borderWidth: 1,
                borderColor: colors.border,
                opacity: day.isRest ? 0.6 : 1,
              },
              !isDark
                ? Platform.select({
                    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 },
                    android: { elevation: 2 },
                  }) ?? {}
                : {},
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: day.isRest ? 0 : spacing.sm }}>
              <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.semibold, color: colors.foreground, flex: 1 }}>
                {day.day}
                {day.isToday && (
                  <Text style={{ color: moduleColors.workout.base, fontWeight: typography.weight.bold }}> (오늘)</Text>
                )}
              </Text>
              {day.isRest && (
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>🛌 휴식일</Text>
              )}
            </View>

            {day.exercises.map((ex, idx) => (
              <View
                key={idx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: spacing.xs,
                  borderTopWidth: idx > 0 ? 1 : 0,
                  borderTopColor: colors.border,
                }}
              >
                <Text style={{ fontSize: typography.size.lg, marginRight: spacing.smx }}>{ex.emoji}</Text>
                <Text style={{ flex: 1, fontSize: typography.size.sm, color: colors.foreground }}>{ex.name}</Text>
                <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>{ex.duration}</Text>
              </View>
            ))}
          </Animated.View>
        ))}
      </View>

      {/* 운동 시작 CTA */}
      <Pressable
        accessibilityLabel="오늘 운동 시작하기"
        onPress={() => router.push('/(workout)/session')}
        style={[
          {
            backgroundColor: moduleColors.workout.base,
            borderRadius: radii.full,
            paddingVertical: spacing.md,
            alignItems: 'center',
            marginTop: spacing.lg,
          },
          !isDark
            ? Platform.select({
                ios: { shadowColor: moduleColors.workout.base, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12 },
                android: { elevation: 4 },
              }) ?? {}
            : {},
        ]}
      >
        <Text style={{ fontSize: typography.size.base, fontWeight: typography.weight.bold, color: colors.overlayForeground }}>
          오늘 운동 시작하기
        </Text>
      </Pressable>
    </ScrollView>
  );
}
