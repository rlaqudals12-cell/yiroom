/**
 * 통합 비주얼 리포트 카드
 *
 * 피부/체형/퍼스널컬러 분석 결과를 하나의 카드로 표시
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme, spacing, radii, typography } from '../../lib/theme';
import { GradeDisplay, getGrade } from './GradeDisplay';

export type AnalysisType = 'skin' | 'body' | 'personal-color';

export interface MetricItem {
  id: string;
  name: string;
  /** 0-100 */
  value: number;
  description?: string;
}

export interface VisualReportCardProps {
  analysisType: AnalysisType;
  overallScore: number;
  /** 피부 분석 메트릭 */
  skinMetrics?: MetricItem[];
  /** 체형 타입 */
  bodyType?: string;
  bodyTypeLabel?: string;
  bodyStrengths?: string[];
  /** 퍼스널컬러 시즌 */
  seasonType?: string;
  seasonLabel?: string;
  confidence?: number;
  bestColors?: Array<{ hex: string; name: string }>;
  /** 분석 시간 */
  analyzedAt?: Date;
}

const ANALYSIS_LABELS: Record<AnalysisType, string> = {
  skin: '피부 분석',
  body: '체형 분석',
  'personal-color': '퍼스널컬러 분석',
};

const ANALYSIS_ICONS: Record<AnalysisType, string> = {
  skin: '✨',
  body: '🧍',
  'personal-color': '🎨',
};

export function VisualReportCard({
  analysisType,
  overallScore,
  skinMetrics,
  bodyType,
  bodyTypeLabel,
  bodyStrengths,
  seasonType,
  seasonLabel,
  confidence,
  bestColors,
  analyzedAt,
}: VisualReportCardProps): React.ReactElement {
  const { colors, brand, module, grade, typography, radii } = useTheme();

  const moduleColor = analysisType === 'skin'
    ? module.skin.base
    : analysisType === 'body'
      ? module.body.base
      : module.personalColor.base;

  const displayScore = analysisType === 'personal-color' && confidence
    ? confidence
    : overallScore;

  const gradeInfo = getGrade(displayScore);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="visual-report-card"
      accessibilityLabel={`${ANALYSIS_LABELS[analysisType]} 결과: ${displayScore}점`}
    >
      {/* 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={styles.icon}>{ANALYSIS_ICONS[analysisType]}</Text>
        <Text style={[styles.title, { color: colors.foreground, fontSize: typography.size.lg }]}>
          {ANALYSIS_LABELS[analysisType]}
        </Text>
        <View style={[styles.typeBadge, { backgroundColor: `${moduleColor}20` }]}>
          <Text style={[styles.typeBadgeText, { color: moduleColor, fontSize: typography.size.xs }]}>
            {analysisType === 'skin' ? '피부' : analysisType === 'body' ? '체형' : '컬러'}
          </Text>
        </View>
      </View>

      {/* 점수 + 등급 */}
      <View style={styles.scoreSection}>
        <GradeDisplay confidence={displayScore} />
      </View>

      {/* 타입별 상세 */}
      {analysisType === 'skin' && skinMetrics && skinMetrics.length > 0 && (
        <View style={styles.detailSection}>
          {skinMetrics.slice(0, 4).map((metric) => (
            <View key={metric.id} style={styles.metricRow}>
              <Text style={[styles.metricName, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                {metric.name}
              </Text>
              <View style={[styles.metricBarOuter, { backgroundColor: `${colors.secondary}20` }]}>
                <View
                  style={[
                    styles.metricBarInner,
                    {
                      width: `${metric.value}%`,
                      backgroundColor: moduleColor,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground, fontSize: typography.size.sm }]}>
                {metric.value}
              </Text>
            </View>
          ))}
        </View>
      )}

      {analysisType === 'body' && bodyTypeLabel && (
        <View style={styles.detailSection}>
          <Text style={[styles.bodyType, { color: moduleColor, fontSize: typography.size.xl }]}>
            {bodyType} 타입
          </Text>
          <Text style={[styles.bodyLabel, { color: colors.foreground, fontSize: typography.size.sm }]}>
            {bodyTypeLabel}
          </Text>
          {bodyStrengths && bodyStrengths.length > 0 && (
            <View style={styles.strengthsList}>
              {bodyStrengths.slice(0, 3).map((s, i) => (
                <Text key={i} style={[styles.strengthItem, { color: colors.mutedForeground, fontSize: typography.size.sm }]}>
                  {s}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {analysisType === 'personal-color' && seasonLabel && (
        <View style={styles.detailSection}>
          <Text style={[styles.seasonLabel, { color: moduleColor, fontSize: typography.size.xl }]}>
            {seasonLabel}
          </Text>
          {bestColors && bestColors.length > 0 && (
            <View style={styles.colorRow}>
              {bestColors.slice(0, 6).map((c, i) => (
                <View
                  key={i}
                  style={[styles.colorDot, { backgroundColor: c.hex }]}
                  accessibilityLabel={c.name}
                />
              ))}
            </View>
          )}
        </View>
      )}

      {/* 분석 시간 */}
      {analyzedAt && (
        <Text style={[styles.timestamp, { color: colors.mutedForeground, fontSize: typography.size.xs }]}>
          {analyzedAt.toLocaleDateString('ko-KR')} 분석
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  icon: {
    fontSize: typography.size.xl,
    marginRight: spacing.sm,
  },
  title: {
    flex: 1,
    fontWeight: '700',
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.xl,
  },
  typeBadgeText: {
    fontWeight: '600',
  },
  scoreSection: {
    alignItems: 'center',
    paddingVertical: spacing.mlg,
  },
  detailSection: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metricName: {
    width: 60,
  },
  metricBarOuter: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginHorizontal: spacing.sm,
    overflow: 'hidden',
  },
  metricBarInner: {
    height: '100%',
    borderRadius: 3,
  },
  metricValue: {
    width: 28,
    textAlign: 'right',
    fontWeight: '600',
  },
  bodyType: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  bodyLabel: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  strengthsList: {
    marginTop: spacing.xs,
  },
  strengthItem: {
    marginBottom: spacing.xxs,
    paddingLeft: spacing.sm,
  },
  seasonLabel: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.smx,
  },
  colorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 28,
    height: 28,
    borderRadius: radii.xlg,
  },
  timestamp: {
    textAlign: 'center',
    paddingBottom: spacing.smx,
  },
});
