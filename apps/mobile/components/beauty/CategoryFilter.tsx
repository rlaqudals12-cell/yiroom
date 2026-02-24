/**
 * CategoryFilter — 뷰티 카테고리 가로 스크롤 필터
 *
 * FilterChipGroup을 활용한 단일 선택 카테고리 필터.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { FilterChipGroup, type FilterChipItem } from '../ui/FilterChipGroup';
import { useTheme } from '../../lib/theme';

const BEAUTY_CATEGORIES: FilterChipItem[] = [
  { key: 'all', label: '전체' },
  { key: 'skincare', label: '스킨케어' },
  { key: 'makeup', label: '메이크업' },
  { key: 'bodycare', label: '바디케어' },
  { key: 'haircare', label: '헤어케어' },
  { key: 'suncare', label: '선케어' },
];

interface CategoryFilterProps {
  selected: string;
  onSelectionChange: (category: string) => void;
  style?: ViewStyle;
  testID?: string;
}

export function CategoryFilter({
  selected,
  onSelectionChange,
  style,
  testID,
}: CategoryFilterProps): React.JSX.Element {
  const { colors, spacing, typography, module: moduleColors } = useTheme();

  return (
    <View style={style} testID={testID} accessibilityLabel="카테고리 필터">
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs + 2,
        }}
      >
        카테고리
      </Text>
      <FilterChipGroup
        items={BEAUTY_CATEGORIES}
        selected={selected}
        onSelectionChange={(sel) => onSelectionChange(sel as string)}
        multiSelect={false}
        activeColor={moduleColors.personalColor.base}
        testID={testID ? `${testID}-chips` : undefined}
      />
    </View>
  );
}

export { BEAUTY_CATEGORIES };
