/**
 * IngredientFilter — 성분 기반 필터
 *
 * FilterChipGroup을 활용한 다중 선택 필터.
 * K-뷰티 주요 성분 태그를 선택하면 제품 목록이 필터링됨.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { FilterChipGroup, type FilterChipItem } from '../ui/FilterChipGroup';
import { useTheme } from '../../lib/theme';

const INGREDIENTS: FilterChipItem[] = [
  { key: 'niacinamide', label: '나이아신아마이드' },
  { key: 'retinol', label: '레티놀' },
  { key: 'vitaminC', label: '비타민C' },
  { key: 'hyaluronicAcid', label: '히알루론산' },
  { key: 'centella', label: '센텔라' },
  { key: 'ceramide', label: '세라마이드' },
  { key: 'aha_bha', label: 'AHA/BHA' },
  { key: 'snailMucin', label: '달팽이뮤신' },
];

interface IngredientFilterProps {
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  style?: ViewStyle;
  testID?: string;
}

export function IngredientFilter({
  selected,
  onSelectionChange,
  style,
  testID,
}: IngredientFilterProps): React.JSX.Element {
  const { colors, spacing, typography, module: moduleColors } = useTheme();

  return (
    <View style={style} testID={testID} accessibilityLabel="성분 필터">
      <Text
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs + 2,
        }}
      >
        성분
      </Text>
      <FilterChipGroup
        items={INGREDIENTS}
        selected={selected}
        onSelectionChange={(sel) => onSelectionChange(sel as string[])}
        multiSelect
        activeColor={moduleColors.skin.dark}
        testID={testID ? `${testID}-chips` : undefined}
      />
    </View>
  );
}

export { INGREDIENTS };
