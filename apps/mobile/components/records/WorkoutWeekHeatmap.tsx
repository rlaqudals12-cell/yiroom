/**
 * WorkoutWeekHeatmap — 7일 운동 히트맵
 *
 * GitHub 기여도 스타일로 7일간 운동 완료 여부를 색상 강도로 표시.
 */
import { View, Text, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface WeekDay {
  /** 요일 라벨 (예: "월") */
  label: string;
  /** 해당 일 날짜 문자열 (예: "2026-02-25") */
  date: string;
  /** 운동 완료 여부 */
  completed: boolean;
  /** 강도 레벨 0~3 (0=미운동, 1=가벼운, 2=보통, 3=고강도) */
  intensity?: number;
}

interface WorkoutWeekHeatmapProps {
  days: WeekDay[];
  style?: ViewStyle;
  testID?: string;
}

export function WorkoutWeekHeatmap({
  days,
  style,
  testID,
}: WorkoutWeekHeatmapProps): React.JSX.Element {
  const { colors, brand, spacing, typography, radii } = useTheme();

  const completedCount = days.filter((d) => d.completed).length;

  return (
    <View style={style} testID={testID} accessibilityLabel={`이번 주 운동 히트맵, ${completedCount}일 완료`}>
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          이번 주 운동
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          {completedCount}/7일 완료
        </Text>
      </View>

      <View style={styles.grid}>
        {days.map((day) => {
          const intensity = day.intensity ?? (day.completed ? 2 : 0);
          const bgColor = getHeatColor(intensity, brand.primary, colors.muted);

          return (
            <View key={day.date} style={styles.dayColumn}>
              <View
                style={[
                  styles.cell,
                  {
                    backgroundColor: bgColor,
                    borderRadius: radii.sm,
                  },
                ]}
                accessibilityLabel={`${day.label} ${day.completed ? '운동 완료' : '운동 없음'}`}
              />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {day.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// 강도별 색상 — 0: muted, 1~3: primary 투명도 단계
function getHeatColor(intensity: number, primaryColor: string, mutedColor: string): string {
  switch (intensity) {
    case 0: return mutedColor;
    case 1: return primaryColor + '40'; // 25%
    case 2: return primaryColor + '80'; // 50%
    case 3: return primaryColor;        // 100%
    default: return mutedColor;
  }
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    flex: 1,
  },
  cell: {
    width: 36,
    height: 36,
  },
});
