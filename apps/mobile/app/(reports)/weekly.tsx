/**
 * 주간 리포트 상세 화면
 * 이번 주 운동/영양 데이터를 일별로 시각화
 */
import { View, Text, StyleSheet, type TextStyle } from 'react-native';

import { ScreenContainer, DataStateWrapper } from '@/components/ui';

import { useWeeklyReport } from '../../hooks/useWeeklyReport';
import { useTheme } from '../../lib/theme';

export default function WeeklyReportScreen(): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, status } = useTheme();
  const { report, isLoading, error } = useWeeklyReport();

  const maxCal = report ? Math.max(
    ...report.dailyData.map((d) => d.workout.calories),
    1
  ) : 1;

  return (
    <ScreenContainer
      edges={['bottom']}
      testID="weekly-report-screen"
    >
      <DataStateWrapper
        isLoading={isLoading}
        isEmpty={!!error || !report}
        emptyConfig={{
          icon: <Text style={{ fontSize: 48 }}>📊</Text>,
          title: '리포트를 불러올 수 없어요',
          description: '잠시 후 다시 시도해주세요',
        }}
      >
        {report && (<>
        {/* 기간 헤더 */}
        <View style={[styles.periodCard, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.periodLabel, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
            이번 주
          </Text>
          <Text style={[styles.periodDates, { color: colors.foreground, fontSize: typography.size.base }]}>
            {report.startDate.slice(5)} ~ {report.endDate.slice(5)}
          </Text>
        </View>

        {/* 운동 요약 카드 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            운동
          </Text>
          <View style={styles.statsRow}>
            <StatItem
              label="운동 횟수"
              value={`${report.workout.totalSessions}회`}
              colors={colors}
              typography={typography}
            />
            <StatItem
              label="총 시간"
              value={`${report.workout.totalDuration}분`}
              colors={colors}
              typography={typography}
            />
            <StatItem
              label="소모 칼로리"
              value={`${report.workout.totalCalories}kcal`}
              colors={colors}
              typography={typography}
            />
          </View>

          {/* 완수율 바 */}
          <View style={[styles.progressContainer, { marginTop: spacing.md }]}>
            <View style={styles.progressHeader}>
              <Text style={[styles.progressLabel, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                완수율
              </Text>
              <Text style={[styles.progressValue, { color: brand.primary, fontWeight: typography.weight.bold, fontSize: typography.size.sm }]}>
                {report.workout.completionRate}%
              </Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: brand.primary,
                    width: `${Math.min(report.workout.completionRate, 100)}%`,
                    borderRadius: radii.full,
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 일별 운동 차트 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            일별 운동 칼로리
          </Text>
          <View style={styles.chartContainer}>
            {report.dailyData.map((day) => {
              const barHeight = maxCal > 0 ? (day.workout.calories / maxCal) * 100 : 0;
              return (
                <View key={day.date} style={styles.barCol}>
                  <Text style={[styles.barValue, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                    {day.workout.calories > 0 ? day.workout.calories : ''}
                  </Text>
                  <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          backgroundColor: day.workout.completed ? brand.primary : colors.mutedForeground,
                          height: `${Math.max(barHeight, 4)}%`,
                          borderRadius: radii.sm,
                          opacity: day.workout.completed ? 1 : 0.3,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
                    {day.dayLabel}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* 영양 요약 카드 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            영양
          </Text>
          <View style={styles.statsRow}>
            <StatItem
              label="평균 칼로리"
              value={`${report.nutrition.averageCalories}kcal`}
              colors={colors}
              typography={typography}
            />
            <StatItem
              label="기록 일수"
              value={`${report.nutrition.daysTracked}일`}
              colors={colors}
              typography={typography}
            />
            <StatItem
              label="목표 달성률"
              value={`${report.nutrition.goalAchievementRate}%`}
              colors={colors}
              typography={typography}
            />
          </View>

          {/* 매크로 평균 */}
          <View style={[styles.macroRow, { marginTop: spacing.md }]}>
            <MacroChip label="단백질" value={`${report.nutrition.averageProtein}g`} color={status.error} bg={colors.muted} typography={typography} />
            <MacroChip label="탄수화물" value={`${report.nutrition.averageCarbs}g`} color={status.warning} bg={colors.muted} typography={typography} />
            <MacroChip label="지방" value={`${report.nutrition.averageFat}g`} color={status.info} bg={colors.muted} typography={typography} />
          </View>
        </View>

        {/* 인사이트 */}
        <View style={[styles.card, { backgroundColor: colors.card, borderRadius: radii.xl }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontSize: typography.size.lg, fontWeight: typography.weight.bold }]}>
            이번 주 인사이트
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
        </>)}
      </DataStateWrapper>
    </ScreenContainer>
  );
}

// 통계 아이템
function StatItem({
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
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color: colors.foreground, fontSize: typoSize.lg, fontWeight: typoWeight.bold }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground, fontSize: typoSize.xs }]}>
        {label}
      </Text>
    </View>
  );
}

// 매크로 칩
function MacroChip({
  label,
  value,
  color,
  bg,
  typography,
}: {
  label: string;
  value: string;
  color: string;
  bg: string;
  typography: Record<string, unknown>;
}) {
  const typoSize = typography.size as Record<string, number>;
  const typoWeight = typography.weight as Record<string, TextStyle['fontWeight']>;
  return (
    <View style={[styles.macroChip, { backgroundColor: bg }]}>
      <View style={[styles.macroDot, { backgroundColor: color }]} />
      <Text style={[styles.macroLabel, { color, fontSize: typoSize.xs }]}>{label}</Text>
      <Text style={[styles.macroValue, { color, fontWeight: typoWeight.semibold, fontSize: typoSize.sm }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  periodCard: { marginHorizontal: 16, marginTop: 12, padding: 16, alignItems: 'center' },
  periodLabel: { marginBottom: 4 },
  periodDates: {},
  card: { marginHorizontal: 16, marginTop: 12, padding: 16 },
  cardTitle: { marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: {},
  statLabel: { marginTop: 4 },
  progressContainer: {},
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: {},
  progressValue: {},
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%' },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-between', height: 140, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center' },
  barValue: { marginBottom: 4, height: 16 },
  barTrack: { width: 20, height: 100, borderRadius: 4, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%' },
  barLabel: { marginTop: 4 },
  macroRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  macroChip: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, gap: 4 },
  macroDot: { width: 8, height: 8, borderRadius: 4 },
  macroLabel: {},
  macroValue: { marginLeft: 'auto' },
  insightRow: { flexDirection: 'row', marginBottom: 8, paddingRight: 8 },
  insightDot: { fontSize: 16, marginRight: 8, lineHeight: 22 },
  insightText: { flex: 1, lineHeight: 22 },
});
