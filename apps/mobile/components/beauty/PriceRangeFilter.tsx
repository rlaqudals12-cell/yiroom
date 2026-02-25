/**
 * PriceRangeFilter — 가격대 필터
 *
 * FilterChipGroup을 활용한 단일 선택 가격대 필터.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { FilterChipGroup, type FilterChipItem } from '../ui/FilterChipGroup';
import { useTheme } from '../../lib/theme';

const PRICE_RANGES: FilterChipItem[] = [
  { key: 'all', label: '전체' },
  { key: 'budget', label: '~1만원' },
  { key: 'mid', label: '1~3만원' },
  { key: 'premium', label: '3~5만원' },
  { key: 'luxury', label: '5만원~' },
];

/** 가격대 키에 대응하는 min/max 범위 (원) */
export const PRICE_RANGE_MAP: Record<string, { min: number; max: number }> = {
  all: { min: 0, max: Infinity },
  budget: { min: 0, max: 10000 },
  mid: { min: 10000, max: 30000 },
  premium: { min: 30000, max: 50000 },
  luxury: { min: 50000, max: Infinity },
};

interface PriceRangeFilterProps {
  selected: string;
  onSelectionChange: (priceRange: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export function PriceRangeFilter({
  selected,
  onSelectionChange,
  style,
  testID,
}: PriceRangeFilterProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={style} testID={testID} accessibilityLabel="가격대 필터">
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs + 2,
        }}
      >
        가격대
      </Text>
      <FilterChipGroup
        items={PRICE_RANGES}
        selected={selected}
        onSelectionChange={(sel) => onSelectionChange(sel as string)}
        multiSelect={false}
        activeColor="#22C55E"
        testID={testID ? `${testID}-chips` : undefined}
      />
    </View>
  );
}

export { PRICE_RANGES };
