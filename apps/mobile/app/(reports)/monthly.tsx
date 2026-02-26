/**
 * 월간 리포트 상세 화면
 * 이번 달 운동/영양 데이터를 주차별로 시각화
 */
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, type TextStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMonthlyReport } from '../../hooks/useMonthlyReport';
import { useTheme } from '../../lib/theme';

export default function MonthlyReportScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography } = useTheme();
  const { report, isLoading, error } = useMonthlyReport();

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.center} testID="monthly-report-loading">
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            월간 리포트를 준비하고 있어요...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
            월간 리포트를 불러올 수 없어요
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['bottom']}
      testID="monthly-report-screen"
    >
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg }}>
        {/* 기간 헤더 */}
        <View style={[styles.periodCard, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.periodLabel, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
            이번 달
          </Text>
          <Text style={[styles.periodMonth, { color: colors.foreground, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
            {report.month.replace('-', '년 ')}월
          </Text>
        </View>

        {/* 운동 요약 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            운동 요약
          </Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.muted, borderRadius: radii.lg }]}>
              <Text style={[styles.statValue, { color: colors.foreground, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
                {report.workout.totalSessions}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                총 운동 횟수
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.muted, borderRadius: radii.lg }]}>
              <Text style={[styles.statValue, { color: colors.foreground, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
                {Math.round(report.workout.totalDuration / 60)}h
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                총 운동 시간
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.muted, borderRadius: radii.lg }]}>
              <Text style={[styles.statValue, { color: colors.foreground, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
                {report.workout.totalCalories}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                소모 칼로리
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.muted, borderRadius: radii.lg }]}>
              <Text style={[styles.statValue, { color: colors.foreground, fontSize: typography.size.xl, fontWeight: typography.weight.bold }]}>
                {report.workout.bestStreak}일
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                최장 연속
              </Text>
            </View>
          </View>
        </View>

        {/* 주간 트렌드 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            주간 트렌드
          </Text>
          {report.weeklyTrends.map((week) => (
            <View key={week.weekLabel} style={[styles.trendRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.trendWeek, { color: colors.foreground, fontSize: typography.size.sm, fontWeight: typography.weight.semibold }]}>
                {week.weekLabel}
              </Text>
              <View style={styles.trendStats}>
                <Text style={[styles.trendStat, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  운동 {week.workoutSessions}회
                </Text>
                <Text style={[styles.trendStat, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  {week.workoutCalories}kcal
                </Text>
                <Text style={[styles.trendStat, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                  영양 목표 {week.nutritionGoalRate}%
                </Text>
              </View>
              {/* 간단한 진행 바 */}
              <View style={[styles.miniTrack, { backgroundColor: colors.muted }]}>
                <View
                  style={[
                    styles.miniFill,
                    {
                      backgroundColor: brand.primary,
                      width: `${Math.min(week.nutritionGoalRate, 100)}%`,
                      borderRadius: radii.full,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* 영양 요약 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            영양 요약
          </Text>
          <View style={styles.nutritionGrid}>
            <NutritionStat label="평균 칼로리" value={`${report.nutrition.averageCalories}kcal`} colors={colors} typography={typography} />
            <NutritionStat label="평균 단백질" value={`${report.nutrition.averageProtein}g`} colors={colors} typography={typography} />
            <NutritionStat label="평균 탄수화물" value={`${report.nutrition.averageCarbs}g`} colors={colors} typography={typography} />
            <NutritionStat label="평균 지방" value={`${report.nutrition.averageFat}g`} colors={colors} typography={typography} />
            <NutritionStat label="기록 일수" value={`${report.nutrition.daysTracked}일`} colors={colors} typography={typography} />
            <NutritionStat label="목표 달성률" value={`${report.nutrition.goalAchievementRate}%`} colors={colors} typography={typography} />
          </View>
        </View>

        {/* 인사이트 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            이번 달 인사이트
          </Text>
          {report.insights.map((insight, i) => (
            <View key={i} style={styles.insightRow}>
              <Text style={[styles.insightDot, { color: brand.primary }]}>*</Text>
              <Text style={[styles.insightText, { color: colors.foreground, fontSize: typography.size.sm }]}>
                {insight}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NutritionStat({
  label,
  value,
  colors,
  typography,
}: {
  label: string;
  value: string;
  colors: Record<string, string>;
  typography: Record<string, unknown>;
}) {
  const typoSize = typography.size as Record<string, number>;
  const typoWeight = typography.weight as Record<string, TextStyle['fontWeight']>;
  return (
    <View style={styles.nutritionStatItem}>
      <Text style={[styles.nutritionStatValue, { color: colors.foreground, fontSize: typoSize.base, fontWeight: typoWeight.bold }]}>
        {value}
      </Text>
      <Text style={[styles.nutritionStatLabel, { color: colors.mutedForeground, fontSize: typoSize.xs }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12 },
  errorText: { textAlign: 'center' },
  periodCard: { marginHorizontal: 16, marginTop: 12, padding: 16, alignItems: 'center' },
  periodLabel: { marginBottom: 4 },
  periodMonth: {},
  card: { marginHorizontal: 16, marginTop: 12, padding: 16 },
  cardTitle: { marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statBox: { width: '48%', padding: 12, alignItems: 'center' },
  statValue: {},
  statLabel: { marginTop: 4 },
  trendRow: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  trendWeek: { marginBottom: 4 },
  trendStats: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  trendStat: {},
  miniTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  miniFill: { height: '100%' },
  nutritionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  nutritionStatItem: { width: '48%', paddingVertical: 8 },
  nutritionStatValue: {},
  nutritionStatLabel: { marginTop: 2 },
  insightRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 8 },
  insightDot: { fontSize: 16, marginRight: 8, lineHeight: 22 },
  insightText: { flex: 1, lineHeight: 22 },
});
