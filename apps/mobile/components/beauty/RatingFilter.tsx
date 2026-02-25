/**
 * RatingFilter — 평점 필터
 *
 * FilterChipGroup을 활용한 단일 선택 평점 필터.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { FilterChipGroup, type FilterChipItem } from '../ui/FilterChipGroup';
import { useTheme } from '../../lib/theme';

const RATING_OPTIONS: FilterChipItem[] = [
  { key: 'all', label: '전체' },
  { key: '3.5', label: '3.5+' },
  { key: '4.0', label: '4.0+' },
  { key: '4.5', label: '4.5+' },
];

interface RatingFilterProps {
  selected: string;
  onSelectionChange: (rating: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export function RatingFilter({
  selected,
  onSelectionChange,
  style,
  testID,
}: RatingFilterProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  return (
    <View style={style} testID={testID} accessibilityLabel="평점 필터">
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs + 2,
        }}
      >
        평점
      </Text>
      <FilterChipGroup
        items={RATING_OPTIONS}
        selected={selected}
        onSelectionChange={(sel) => onSelectionChange(sel as string)}
        multiSelect={false}
        activeColor="#F59E0B"
        testID={testID ? `${testID}-chips` : undefined}
      />
    </View>
  );
}

export { RATING_OPTIONS };
