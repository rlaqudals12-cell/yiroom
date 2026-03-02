/**
 * SkinConcernFilter — 피부 고민 필터
 *
 * FilterChipGroup을 활용한 다중 선택 필터.
 * 피부 고민 태그를 선택하면 제품 목록이 필터링됨.
 */
import { View, Text, type ViewStyle } from 'react-native';

import { FilterChipGroup, type FilterChipItem } from '../ui/FilterChipGroup';
import { useTheme } from '../../lib/theme';

const SKIN_CONCERNS: FilterChipItem[] = [
  { key: 'dryness', label: '건조' },
  { key: 'acne', label: '여드름' },
  { key: 'wrinkles', label: '주름' },
  { key: 'pores', label: '모공' },
  { key: 'pigmentation', label: '색소침착' },
  { key: 'sensitivity', label: '민감' },
  { key: 'oiliness', label: '피지' },
  { key: 'darkCircles', label: '다크서클' },
];

interface SkinConcernFilterProps {
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
  style?: ViewStyle;
  testID?: string;
}

export function SkinConcernFilter({
  selected,
  onSelectionChange,
  style,
  testID,
}: SkinConcernFilterProps): React.JSX.Element {
  const { colors, spacing, typography, module: moduleColors } = useTheme();

  return (
    <View style={style} testID={testID} accessibilityLabel="피부 고민 필터">
      <Text
        accessibilityRole="header"
        style={{
          fontSize: typography.size.sm,
          fontWeight: typography.weight.semibold,
          color: colors.foreground,
          marginBottom: spacing.xs + 2,
        }}
      >
        피부 고민
      </Text>
      <FilterChipGroup
        items={SKIN_CONCERNS}
        selected={selected}
        onSelectionChange={(sel) => onSelectionChange(sel as string[])}
        multiSelect
        activeColor={moduleColors.skin.base}
        testID={testID ? `${testID}-chips` : undefined}
      />
    </View>
  );
}

export { SKIN_CONCERNS };
