/**
 * NutrientRadar — 영양소 레이더 차트
 *
 * 탄수화물/단백질/지방/수분/칼로리를 레이더 차트로 시각화.
 * 기존 RadarChart 컴포넌트를 활용.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { RadarChart, type RadarDataItem } from '../charts/RadarChart';
import { useTheme } from '../../lib/theme';

interface NutrientRadarProps {
  /** 현재 섭취 데이터 */
  nutrients: {
    carbs: number;
    protein: number;
    fat: number;
    water: number;
    calories: number;
  };
  /** 목표 데이터 */
  goals: {
    carbs: number;
    protein: number;
    fat: number;
    water: number;
    calories: number;
  };
  /** 차트 크기 (기본 220) */
  size?: number;
  style?: ViewStyle;
  testID?: string;
}

export function NutrientRadar({
  nutrients,
  goals,
  size = 220,
  style,
  testID,
}: NutrientRadarProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  // 목표 대비 비율로 변환 (0~100)
  const radarData: RadarDataItem[] = [
    {
      label: '탄수화물',
      value: Math.min((nutrients.carbs / Math.max(goals.carbs, 1)) * 100, 100),
    },
    {
      label: '단백질',
      value: Math.min((nutrients.protein / Math.max(goals.protein, 1)) * 100, 100),
    },
    {
      label: '지방',
      value: Math.min((nutrients.fat / Math.max(goals.fat, 1)) * 100, 100),
    },
    {
      label: '수분',
      value: Math.min((nutrients.water / Math.max(goals.water, 1)) * 100, 100),
    },
    {
      label: '칼로리',
      value: Math.min((nutrients.calories / Math.max(goals.calories, 1)) * 100, 100),
    },
  ];

  const avgAchievement = Math.round(
    radarData.reduce((sum, d) => sum + d.value, 0) / radarData.length
  );

  return (
    <View style={style} testID={testID} accessibilityLabel={`영양 균형 레이더 차트, 목표 달성률 ${avgAchievement}%`}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: spacing.sm }}>
        <Text
          style={{
            fontSize: typography.size.base,
            fontWeight: typography.weight.semibold,
            color: colors.foreground,
          }}
        >
          영양 균형
        </Text>
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          목표 달성률 {avgAchievement}%
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <RadarChart
          data={radarData}
          size={size}
          showLabels
          animated
          testID={testID ? `${testID}-radar` : undefined}
        />
      </View>
    </View>
  );
}
