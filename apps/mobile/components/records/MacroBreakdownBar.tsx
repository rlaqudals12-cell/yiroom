/**
 * MacroBreakdownBar — 탄수화물/단백질/지방 비율 바
 *
 * 가로 단일 바에 3개 영양소 비율을 색상으로 표시.
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

interface MacroBreakdownBarProps {
  /** 탄수화물 g */
  carbs: number;
  /** 단백질 g */
  protein: number;
  /** 지방 g */
  fat: number;
  /** 바 높이 (기본 20) */
  barHeight?: number;
  style?: ViewStyle;
  testID?: string;
}

// 영양소별 색상
const MACRO_COLORS = {
  carbs: '#60a5fa',   // 파란
  protein: '#34d399',  // 초록
  fat: '#fbbf24',      // 노란
} as const;

export function MacroBreakdownBar({
  carbs,
  protein,
  fat,
  barHeight = 20,
  style,
  testID,
}: MacroBreakdownBarProps): React.JSX.Element {
  const { colors, spacing, typography, radii } = useTheme();

  const total = carbs + protein + fat;
  const carbsPct = total > 0 ? (carbs / total) * 100 : 33.3;
  const proteinPct = total > 0 ? (protein / total) * 100 : 33.3;
  const fatPct = total > 0 ? (fat / total) * 100 : 33.3;

  const carbsCal = carbs * 4;
  const proteinCal = protein * 4;
  const fatCal = fat * 9;

  return (
    <View
      style={style}
      testID={testID}
      accessibilityLabel={`영양소 비율: 탄수화물 ${Math.round(carbsPct)}%, 단백질 ${Math.round(proteinPct)}%, 지방 ${Math.round(fatPct)}%`}
    >
      {/* 비율 바 */}
      <View
        style={[
          styles.barContainer,
          {
            height: barHeight,
            borderRadius: radii.sm,
            backgroundColor: colors.muted,
          },
        ]}
      >
        {total > 0 && (
          <>
            <View
              style={[
                styles.segment,
                {
                  width: `${carbsPct}%` as unknown as number,
                  backgroundColor: MACRO_COLORS.carbs,
                  borderTopLeftRadius: radii.sm,
                  borderBottomLeftRadius: radii.sm,
                },
              ]}
              accessibilityLabel={`탄수화물 ${Math.round(carbsPct)}%`}
            />
            <View
              style={[
                styles.segment,
                {
                  width: `${proteinPct}%` as unknown as number,
                  backgroundColor: MACRO_COLORS.protein,
                },
              ]}
              accessibilityLabel={`단백질 ${Math.round(proteinPct)}%`}
            />
            <View
              style={[
                styles.segment,
                {
                  width: `${fatPct}%` as unknown as number,
                  backgroundColor: MACRO_COLORS.fat,
                  borderTopRightRadius: radii.sm,
                  borderBottomRightRadius: radii.sm,
                },
              ]}
              accessibilityLabel={`지방 ${Math.round(fatPct)}%`}
            />
          </>
        )}
      </View>

      {/* 범례 */}
      <View style={[styles.legend, { marginTop: spacing.sm }]}>
        <LegendItem
          color={MACRO_COLORS.carbs}
          label="탄수화물"
          value={`${carbs}g (${carbsCal}kcal)`}
          pct={Math.round(carbsPct)}
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
          typography={typography}
        />
        <LegendItem
          color={MACRO_COLORS.protein}
          label="단백질"
          value={`${protein}g (${proteinCal}kcal)`}
          pct={Math.round(proteinPct)}
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
          typography={typography}
        />
        <LegendItem
          color={MACRO_COLORS.fat}
          label="지방"
          value={`${fat}g (${fatCal}kcal)`}
          pct={Math.round(fatPct)}
          textColor={colors.foreground}
          mutedColor={colors.mutedForeground}
          typography={typography}
        />
      </View>
    </View>
  );
}

interface LegendItemProps {
  color: string;
  label: string;
  value: string;
  pct: number;
  textColor: string;
  mutedColor: string;
  typography: ReturnType<typeof useTheme>['typography'];
}

function LegendItem({ color, label, value, pct, textColor, mutedColor, typography }: LegendItemProps): React.JSX.Element {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={{ fontSize: typography.size.xs, color: textColor, fontWeight: typography.weight.medium }}>
        {label} {pct}%
      </Text>
      <Text style={{ fontSize: typography.size.xs, color: mutedColor, marginLeft: 4 }}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    flexDirection: 'row',
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  legend: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
});
