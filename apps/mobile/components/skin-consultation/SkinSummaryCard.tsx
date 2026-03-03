/**
 * SkinSummaryCard -- 피부 분석 요약 카드
 *
 * 피부 타입, 수분/유분/민감도 지표를 미니 프로그레스 바로 표시.
 * 채팅 상단이나 사이드바에 컴팩트하게 배치.
 */
import React from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Droplets } from 'lucide-react-native';

import { useTheme, spacing, radii } from '../../lib/theme';

export interface SkinSummaryCardProps {
  skinType: string;
  hydration: number;
  oiliness: number;
  sensitivity: number;
  lastAnalyzedAt?: Date;
  style?: ViewStyle;
}

/** 피부 타입을 한국어로 변환 */
function getSkinTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    dry: '건성',
    oily: '지성',
    combination: '복합성',
    normal: '중성',
    sensitive: '민감성',
  };
  return labels[type] ?? type;
}

/** 점수에 따른 색상 반환 */
function getScoreColor(value: number, status: { success: string; warning: string; error: string }): string {
  if (value >= 70) return status.success;
  if (value >= 40) return status.warning;
  return status.error;
}

/** 날짜를 "1월 15일 분석" 형식으로 변환 */
function formatAnalysisDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}월 ${day}일 분석`;
}

/** 미니 프로그레스 바 */
function MiniProgressBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}): React.JSX.Element {
  const { colors, spacing, typography, radii } = useTheme();

  return (
    <View
      style={[progressStyles.row, { marginTop: spacing.sm }]}
      accessibilityLabel={`${label} ${value}점`}
    >
      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          width: 44,
        }}
      >
        {label}
      </Text>
      <View
        style={[
          progressStyles.track,
          {
            backgroundColor: colors.secondary,
            borderRadius: radii.full,
            marginHorizontal: spacing.sm,
          },
        ]}
      >
        <View
          style={[
            progressStyles.fill,
            {
              width: `${Math.min(Math.max(value, 0), 100)}%`,
              backgroundColor: color,
              borderRadius: radii.full,
            },
          ]}
        />
      </View>
      <Text
        style={{
          fontSize: typography.size.xs,
          fontWeight: typography.weight.semibold,
          color: color,
          width: 28,
          textAlign: 'right',
        }}
      >
        {value}
      </Text>
    </View>
  );
}

const progressStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  track: {
    flex: 1,
    height: 6,
    overflow: 'hidden',
  },
  fill: {
    height: 6,
  },
});

export function SkinSummaryCard({
  skinType,
  hydration,
  oiliness,
  sensitivity,
  lastAnalyzedAt,
  style,
}: SkinSummaryCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, module, status } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          borderWidth: 1,
          borderColor: module.skin.light + '40',
          ...shadows.sm,
        },
        style,
      ]}
      testID="skin-summary-card"
      accessibilityLabel={`피부 요약: ${getSkinTypeLabel(skinType)}, 수분 ${hydration}, 유분 ${oiliness}, 민감도 ${sensitivity}`}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconBg,
            {
              backgroundColor: module.skin.light + '30',
              borderRadius: radii.xl,
              padding: spacing.xs,
            },
          ]}
        >
          <Droplets size={16} color={module.skin.base} />
        </View>
        <View style={[styles.headerText, { marginLeft: spacing.sm }]}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            내 피부: {getSkinTypeLabel(skinType)}
          </Text>
          {lastAnalyzedAt && (
            <Text
              style={{
                fontSize: typography.size.xs - 1,
                color: colors.mutedForeground,
                marginTop: spacing.xxs,
              }}
            >
              {formatAnalysisDate(lastAnalyzedAt)}
            </Text>
          )}
        </View>
      </View>

      {/* 지표 바 */}
      <MiniProgressBar
        label="수분"
        value={hydration}
        color={getScoreColor(hydration, status)}
      />
      <MiniProgressBar
        label="유분"
        value={oiliness}
        color={getScoreColor(100 - oiliness, status)}
      />
      <MiniProgressBar
        label="민감도"
        value={sensitivity}
        color={getScoreColor(100 - sensitivity, status)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {},
  headerText: {
    flex: 1,
  },
});
