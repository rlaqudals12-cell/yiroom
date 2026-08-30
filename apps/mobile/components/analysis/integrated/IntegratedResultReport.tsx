import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ReportAttrRow,
  ReportColorBand,
  ReportHero,
  ReportRowTable,
  REPORT_COLORS,
} from '@/components/analysis/report';
import type { AxisCode, AxisResult, IntegratedAnalysisResult } from '@/lib/api';
import { composeActionPlan } from '@/lib/integrated/action-plan';
import {
  bodySummary,
  hairSummary,
  makeupSummary,
  pcSummary,
  skinSummary,
} from '@/lib/integrated/axis-summary';
import { composeCrossInsights } from '@/lib/integrated/cross-insights';
import { composeCuration } from '@/lib/integrated/curation';
import { extractPalette } from '@/lib/integrated/palette';
import { radii, shadows, spacing, typography } from '@/lib/theme';

import { IntegratedResultSections } from './IntegratedResultSections';
import { IntegratedShareCard } from './IntegratedShareCard';

const AXIS_LABELS: Record<AxisCode, string> = {
  personal_color: '퍼스널컬러',
  skin: '피부',
  body: '체형',
  hair: '헤어',
  makeup: '메이크업',
};

export interface IntegratedResultReportProps {
  result: IntegratedAnalysisResult;
  hasClosetItems?: boolean;
  stale?: boolean;
}

function axisDataOrNull<T>(axis: AxisResult<T>): T | null {
  return axis.success ? axis.data : null;
}

/** 5축 통합 결과를 크림 고정 진단지 한 장과 접힌 근거로 제시한다. */
export function IntegratedResultReport({
  result,
  hasClosetItems,
  stale = false,
}: IntegratedResultReportProps): React.JSX.Element {
  const palette = extractPalette(result.axes.personalColor);
  const persona = result.persona;
  const fallbackLabels = result.usedFallback.map((axis) => AXIS_LABELS[axis]).filter(Boolean);
  const failedLabels = result.axesFailed.map((axis) => AXIS_LABELS[axis]).filter(Boolean);
  const actionPlan = composeActionPlan(result.axes);
  const insights = composeCrossInsights(result.axes);
  const curation = composeCuration(result.axes, result.sessionId, { hasClosetItems });

  return (
    <SafeAreaView edges={['top']} style={styles.ground} testID="integrated-result-screen">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.sheet}>
          {stale ? (
            <View accessibilityRole="alert" style={styles.notice} testID="integrated-stale-banner">
              <Text style={styles.noticeTitle}>오프라인 — 마지막 결과예요</Text>
              <Text style={styles.noticeText}>연결되면 최신 결과를 다시 확인할 수 있어요.</Text>
            </View>
          ) : null}

          <View testID="persona-narrative-card">
            <ReportHero
              eyebrow="통합 분석 결과"
              subtitle={persona?.narrative}
              testID="integrated-result-verdict"
              title={persona?.oneLine ?? '완료된 분석 결과를 정리했어요'}
            />
          </View>

          {fallbackLabels.length > 0 ? (
            <View accessibilityRole="alert" style={styles.notice} testID="axis-fallback-notice">
              <Text style={styles.noticeTitle}>일부 축은 샘플 결과예요</Text>
              <Text style={styles.noticeText}>
                <Text style={styles.noticeLabel}>{fallbackLabels.join(', ')}</Text> 축은 예시
                결과이므로 참고용으로만 봐주세요.
              </Text>
            </View>
          ) : null}

          {result.status === 'partial' && failedLabels.length > 0 ? (
            <View accessibilityRole="alert" style={styles.notice} testID="partial-success-banner">
              <Text style={styles.noticeTitle}>일부 분석이 완료되지 않았어요</Text>
              <Text style={styles.noticeText}>미완료: {failedLabels.join(', ')}</Text>
              <Text
                accessibilityRole="link"
                onPress={() =>
                  router.replace(
                    `/(analysis)/integrated?retryAxes=${encodeURIComponent(
                      result.axesFailed.join(',')
                    )}` as never
                  )
                }
                style={styles.retryLink}
              >
                미완료 축 다시 분석
              </Text>
            </View>
          ) : null}

          <View style={styles.attributes}>
            <ReportRowTable testID="integrated-axis-summary">
              <ReportAttrRow
                label="퍼스널컬러"
                value={pcSummary(axisDataOrNull(result.axes.personalColor))}
              />
              <ReportAttrRow label="피부" value={skinSummary(axisDataOrNull(result.axes.skin))} />
              <ReportAttrRow label="체형" value={bodySummary(axisDataOrNull(result.axes.body))} />
              <ReportAttrRow label="헤어" value={hairSummary(axisDataOrNull(result.axes.hair))} />
              <ReportAttrRow
                label="메이크업"
                value={makeupSummary(axisDataOrNull(result.axes.makeup))}
              />
            </ReportRowTable>
          </View>

          {palette.length > 0 ? (
            <View style={styles.palette}>
              <ReportColorBand
                colors={palette}
                testID="integrated-my-palette"
                title="나만의 컬러 팔레트"
              />
            </View>
          ) : null}

          <IntegratedResultSections
            actionPlan={actionPlan}
            axesCompleted={result.axesCompleted}
            curation={curation}
            insights={insights}
            persona={persona}
          />

          {persona?.usedFallback ? (
            <Text style={styles.trustText}>AI 합성 대신 분석 요약으로 만든 프로필이에요.</Text>
          ) : null}
          <Text style={styles.trustText}>
            분석 결과는 참고 정보이며, 의학적 진단을 대체하지 않아요.
          </Text>
        </View>

        <IntegratedShareCard result={result} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ground: {
    backgroundColor: REPORT_COLORS.ground,
    flex: 1,
  },
  scrollContent: {
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sheet: {
    ...shadows.card,
    backgroundColor: REPORT_COLORS.paper,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.mlg,
  },
  notice: {
    backgroundColor: REPORT_COLORS.warningWash,
    borderColor: REPORT_COLORS.rule,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.smd,
  },
  noticeTitle: {
    color: REPORT_COLORS.warningInk,
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  noticeText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
  },
  noticeLabel: {
    fontWeight: typography.weight.semibold,
  },
  retryLink: {
    color: REPORT_COLORS.ink,
    fontSize: typography.size.sm,
    minHeight: 44,
    paddingTop: spacing.sm,
    textDecorationLine: 'underline',
  },
  attributes: {
    marginTop: spacing.mlg,
  },
  palette: {
    marginVertical: spacing.lg,
  },
  trustText: {
    color: REPORT_COLORS.mutedInk,
    fontSize: typography.size.xs,
    lineHeight: 18,
    marginTop: spacing.md,
  },
});
