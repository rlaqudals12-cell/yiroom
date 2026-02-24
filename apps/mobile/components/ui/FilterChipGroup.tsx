/**
 * FilterChipGroup — FilterChip 그룹 관리
 *
 * 단일 선택 또는 다중 선택 모드. 가로 스크롤 지원.
 */
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

import { FilterChip } from './FilterChip';

export interface FilterChipItem {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface FilterChipGroupProps {
  items: FilterChipItem[];
  /** 현재 선택된 키 (단일 선택: string, 다중 선택: string[]) */
  selected: string | string[];
  /** 선택 변경 콜백 */
  onSelectionChange: (selected: string | string[]) => void;
  /** 다중 선택 모드 (기본 false) */
  multiSelect?: boolean;
  /** 선택 시 색상 */
  activeColor?: string;
  /** 가로 스크롤 (기본 true) */
  scrollable?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export function FilterChipGroup({
  items,
  selected,
  onSelectionChange,
  multiSelect = false,
  activeColor,
  scrollable = true,
  style,
  testID,
}: FilterChipGroupProps): React.JSX.Element {
  const { spacing } = useTheme();

  const isSelected = (key: string): boolean => {
    if (Array.isArray(selected)) {
      return selected.includes(key);
    }
    return selected === key;
  };

  const handlePress = (key: string): void => {
    if (multiSelect) {
      const arr = Array.isArray(selected) ? selected : selected ? [selected] : [];
      if (arr.includes(key)) {
        onSelectionChange(arr.filter((k) => k !== key));
      } else {
        onSelectionChange([...arr, key]);
      }
    } else {
      // 단일 선택: 같은 걸 누르면 해제
      onSelectionChange(selected === key ? '' : key);
    }
  };

  const chipContent = items.map((item) => (
    <FilterChip
      key={item.key}
      label={item.label}
      icon={item.icon}
      selected={isSelected(item.key)}
      onPress={() => handlePress(item.key)}
      activeColor={activeColor}
      style={{ marginRight: spacing.sm }}
      testID={testID ? `${testID}-${item.key}` : undefined}
    />
  ));

  if (scrollable) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, style]}
        testID={testID}
      >
        {chipContent}
      </ScrollView>
    );
  }

  return (
    <View style={[styles.wrapContent, style]} testID={testID}>
      {chipContent}
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingRight: 16,
  },
  wrapContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
