/**
 * 오늘 요약 위젯 미리보기
 * iOS/Android 위젯에 표시될 UI 미러링
 */

import { View, Text, StyleSheet } from 'react-native';

import { useTheme, typography, spacing, radii } from '../../lib/theme';
import { TodaySummaryData, DEFAULT_SUMMARY_DATA } from '../../lib/widgets/types';

interface TodaySummaryWidgetProps {
  data?: TodaySummaryData;
  size?: 'small' | 'medium' | 'large';
}

export function TodaySummaryWidget({
  data = DEFAULT_SUMMARY_DATA,
  size = 'medium',
}: TodaySummaryWidgetProps) {
  const { colors, brand, status, typography } = useTheme();

  // 진행률 계산
  const waterProgress = Math.min((data.waterIntake / data.waterGoal) * 100, 100);
  const caloriesProgress = Math.min((data.caloriesConsumed / data.caloriesGoal) * 100, 100);

  // 소형 위젯
  if (size === 'small') {
    return (
      <View style={[styles.containerSmall, { backgroundColor: colors.card }]}>
        <Text style={[styles.streakText, { color: colors.foreground }]}>
          {data.currentStreak > 0 ? `${data.currentStreak}일 연속` : '오늘 시작!'}
        </Text>
        <View style={styles.iconRow}>
          <Text style={styles.statusIcon}>{data.workoutCompleted ? '✅' : '🏃'}</Text>
          <Text style={styles.statusIcon}>{waterProgress >= 100 ? '✅' : '💧'}</Text>
        </View>
      </View>
    );
  }

  // 중형 위젯
  if (size === 'medium') {
    return (
      <View style={[styles.containerMedium, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.foreground }]}>오늘의 이룸</Text>
          {data.currentStreak > 0 && (
            <View style={[styles.streakBadge, { backgroundColor: brand.primary }]}>
              <Text style={[styles.streakBadgeText, { color: brand.primaryForeground }]}>{data.currentStreak}일</Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          {/* 운동 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>{data.workoutCompleted ? '✅' : '🏃'}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>운동</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {data.workoutCompleted ? `${data.workoutMinutes}분` : '대기'}
            </Text>
          </View>

          {/* 물 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>💧</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>물</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {(data.waterIntake / 1000).toFixed(1)}L
            </Text>
          </View>

          {/* 칼로리 */}
          <View style={styles.statItem}>
            <Text style={styles.statIcon}>🍽️</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>칼로리</Text>
            <Text style={[styles.statValue, { color: colors.foreground }]}>
              {data.caloriesConsumed}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // 대형 위젯
  return (
    <View
      testID="today-summary-widget"
      style={[styles.containerLarge, { backgroundColor: colors.card }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>오늘의 이룸</Text>
        {data.currentStreak > 0 && (
          <View style={[styles.streakBadge, { backgroundColor: brand.primary }]}>
            <Text style={[styles.streakBadgeText, { color: brand.primaryForeground }]}>{data.currentStreak}일 연속</Text>
          </View>
        )}
      </View>

      {/* 운동 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>🏃 운동</Text>
          <Text style={[styles.progressValue, { color: colors.mutedForeground }]}>
            {data.workoutCompleted ? `${data.workoutMinutes}분 완료` : '아직 안 함'}
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: data.workoutCompleted ? '100%' : '0%', backgroundColor: brand.primary },
              data.workoutCompleted && { backgroundColor: status.success },
            ]}
          />
        </View>
      </View>

      {/* 물 섭취 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>💧 물 섭취</Text>
          <Text style={[styles.progressValue, { color: colors.mutedForeground }]}>
            {data.waterIntake}ml / {data.waterGoal}ml
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${waterProgress}%`, backgroundColor: status.info },
              waterProgress >= 100 && { backgroundColor: status.success },
            ]}
          />
        </View>
      </View>

      {/* 칼로리 */}
      <View style={styles.progressRow}>
        <View style={styles.progressHeader}>
          <Text style={[styles.progressLabel, { color: colors.foreground }]}>🍽️ 칼로리</Text>
          <Text style={[styles.progressValue, { color: colors.mutedForeground }]}>
            {data.caloriesConsumed} / {data.caloriesGoal} kcal
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${caloriesProgress}%`, backgroundColor: status.warning },
              caloriesProgress > 100 && { backgroundColor: status.error },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  containerSmall: {
    width: 155,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerMedium: {
    width: 329,
    height: 155,
    borderRadius: 22,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  containerLarge: {
    width: 329,
    height: 345,
    borderRadius: 22,
    padding: spacing.mlg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 17,
    fontWeight: typography.weight.semibold,
  },
  streakBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: spacing.xs,
    borderRadius: radii.smx,
  },
  streakBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  streakText: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  iconRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statusIcon: {
    fontSize: 28,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flex: 1,
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statIcon: {
    fontSize: typography.size['2xl'],
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    marginBottom: spacing.xxs,
  },
  statValue: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
  },
  progressRow: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  progressLabel: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
  },
  progressValue: {
    fontSize: 13,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
