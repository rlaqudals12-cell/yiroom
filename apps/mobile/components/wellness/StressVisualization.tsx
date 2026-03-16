/**
 * 스트레스 시각화 컴포넌트 (React Native)
 *
 * @description 스트레스 레벨을 게이지 차트, 피부 영향, 주간 트렌드, 권장사항으로 시각화
 * @see lib/wellness/stress-visualization.ts
 */
import {
  TrendingDown,
  TrendingUp,
  Minus,
  AlertTriangle,
  CheckCircle,
  Info,
} from 'lucide-react-native';
import React from 'react';
import { View, Text, FlatList, StyleSheet, type ViewStyle } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

import { useTheme, spacing, typography, radii } from '../../lib/theme';
import type {
  StressVisualizationData,
  StressTrendAnalysis,
  SkinImpactItem,
} from '../../lib/wellness/stress-visualization';

// ============================================
// SVG 게이지 차트
// ============================================

interface StressGaugeProps {
  /** 게이지 퍼센트 (0-100, 높을수록 좋음) */
  percent: number;
  /** 게이지 색상 */
  color: string;
  /** 등급 라벨 */
  gradeLabel: string;
  /** 스트레스 레벨 (1-10) */
  stressLevel: number;
}

function StressGauge({
  percent,
  color,
  gradeLabel,
  stressLevel,
}: StressGaugeProps): React.JSX.Element {
  const { colors } = useTheme();

  // 반원 게이지 SVG 계산
  const size = 180;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius;

  const clampedPercent = Math.max(0, Math.min(100, percent));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <View
      style={styles.gaugeContainer}
      testID="stress-gauge"
      accessibilityLabel={`스트레스 게이지: ${gradeLabel} (${clampedPercent}%)`}
    >
      <Svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
        {/* 배경 트랙 */}
        <Path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={colors.border}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          opacity={0.3}
        />
        {/* 활성 트랙 */}
        <Path
          d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
        {/* 중앙 숫자 */}
        <SvgText
          x={size / 2}
          y={size / 2 - 10}
          textAnchor="middle"
          fill={colors.foreground}
          fontSize={32}
          fontWeight="bold"
        >
          {stressLevel}
        </SvgText>
        {/* / 10 라벨 */}
        <SvgText
          x={size / 2}
          y={size / 2 + 14}
          textAnchor="middle"
          fill={colors.mutedForeground}
          fontSize={13}
        >
          / 10
        </SvgText>
      </Svg>

      {/* 등급 뱃지 */}
      <View style={[styles.gradeBadge, { backgroundColor: `${color}20` }]}>
        <Text style={[styles.gradeBadgeText, { color }]}>{gradeLabel}</Text>
      </View>
    </View>
  );
}

// ============================================
// 피부 영향 카드
// ============================================

// severity에 따른 색상 매핑
const SEVERITY_COLORS: Record<
  number,
  { bg: string; border: string; badgeBg: string; badgeText: string; label: string }
> = {
  3: { bg: '#fef2f2', border: '#fecaca', badgeBg: '#fee2e2', badgeText: '#b91c1c', label: '심각' },
  2: { bg: '#fff7ed', border: '#fed7aa', badgeBg: '#ffedd5', badgeText: '#c2410c', label: '주의' },
  1: { bg: '#fefce8', border: '#fde68a', badgeBg: '#fef9c3', badgeText: '#a16207', label: '경미' },
};

function SkinImpactCard({ impact }: { impact: SkinImpactItem }): React.JSX.Element {
  const style = SEVERITY_COLORS[impact.severity] ?? SEVERITY_COLORS[1];

  return (
    <View
      style={[styles.impactCard, { backgroundColor: style.bg, borderColor: style.border }]}
      testID="skin-impact-card"
    >
      <View style={styles.impactHeader}>
        <Text style={styles.impactArea}>{impact.area}</Text>
        <View style={[styles.severityBadge, { backgroundColor: style.badgeBg }]}>
          <Text style={[styles.severityText, { color: style.badgeText }]}>{style.label}</Text>
        </View>
      </View>
      <Text style={styles.impactDescription}>{impact.impact}</Text>
    </View>
  );
}

// ============================================
// 주간 트렌드 표시
// ============================================

function WeeklyTrend({ trend }: { trend: StressTrendAnalysis }): React.JSX.Element {
  const { colors } = useTheme();

  const trendConfig = {
    improving: {
      Icon: TrendingDown,
      color: '#16a34a',
      bg: '#f0fdf4',
    },
    worsening: {
      Icon: TrendingUp,
      color: '#dc2626',
      bg: '#fef2f2',
    },
    stable: {
      Icon: Minus,
      color: '#2563eb',
      bg: '#eff6ff',
    },
  };

  const config = trendConfig[trend.trend];
  const { Icon } = config;

  return (
    <View style={[styles.trendContainer, { backgroundColor: config.bg }]} testID="weekly-trend">
      <View style={[styles.trendIconBg, { backgroundColor: config.bg }]}>
        <Icon size={20} color={config.color} />
      </View>
      <View style={styles.trendContent}>
        <Text style={[styles.trendTitle, { color: config.color }]}>
          주간 평균 {trend.averageLevel}
        </Text>
        <Text style={[styles.trendMessage, { color: colors.mutedForeground }]}>
          {trend.trendMessage}
        </Text>
      </View>
    </View>
  );
}

// ============================================
// 메인 컴포넌트
// ============================================

export interface StressVisualizationProps {
  /** 스트레스 시각화 데이터 */
  data: StressVisualizationData;
  /** 주간 트렌드 분석 (선택적) */
  trend?: StressTrendAnalysis;
  /** 스타일 */
  style?: ViewStyle;
  /** 컴팩트 모드 */
  compact?: boolean;
}

export function StressVisualization({
  data,
  trend,
  style,
  compact = false,
}: StressVisualizationProps): React.JSX.Element {
  const { colors, shadows } = useTheme();

  const hasImpacts = data.skinImpacts.length > 0;
  const hasRecommendations = data.recommendations.length > 0;
  const recommendations = compact ? data.recommendations.slice(0, 2) : data.recommendations;

  return (
    <View style={style} testID="stress-visualization">
      {/* 게이지 카드 */}
      <View style={[styles.card, { backgroundColor: colors.card, ...shadows.card }]}>
        <View style={styles.cardHeader}>
          <AlertTriangle size={20} color={colors.foreground} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>스트레스 수준</Text>
        </View>
        <StressGauge
          percent={data.gaugePercent}
          color={data.color}
          gradeLabel={data.gradeLabel}
          stressLevel={data.stressLevel}
        />
      </View>

      {/* 주간 트렌드 */}
      {trend != null && (
        <View style={{ marginTop: spacing.md }}>
          <WeeklyTrend trend={trend} />
        </View>
      )}

      {/* 피부 영향 */}
      {hasImpacts && !compact && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, marginTop: spacing.md, ...shadows.card },
          ]}
        >
          <View style={styles.cardHeader}>
            <Info size={20} color={colors.foreground} />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>피부에 미치는 영향</Text>
          </View>
          {data.skinImpacts.map((impact, i) => (
            <View key={i} style={i > 0 ? { marginTop: spacing.sm } : undefined}>
              <SkinImpactCard impact={impact} />
            </View>
          ))}
        </View>
      )}

      {/* 권장사항 */}
      {hasRecommendations && (
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, marginTop: spacing.md, ...shadows.card },
          ]}
        >
          <View style={styles.cardHeader}>
            <CheckCircle size={20} color="#16a34a" />
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>이렇게 해보세요</Text>
          </View>
          {recommendations.map((rec, i) => (
            <View key={i} style={styles.recRow}>
              <View style={styles.recDot} />
              <Text style={[styles.recText, { color: colors.mutedForeground }]}>{rec}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default StressVisualization;

// ============================================
// 스타일
// ============================================

const styles = StyleSheet.create({
  // 게이지
  gaugeContainer: {
    alignItems: 'center',
  },
  gradeBadge: {
    marginTop: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  gradeBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  // 카드
  card: {
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  cardTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
  },
  // 피부 영향
  impactCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  impactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  impactArea: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    color: '#1f2937',
  },
  severityBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  severityText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  impactDescription: {
    fontSize: typography.size.sm,
    color: '#6b7280',
    lineHeight: 20,
  },
  // 트렌드
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.xl,
  },
  trendIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendContent: {
    flex: 1,
  },
  trendTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  trendMessage: {
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  // 권장사항
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  recDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginTop: 6,
  },
  recText: {
    fontSize: typography.size.sm,
    flex: 1,
    lineHeight: 20,
  },
});
