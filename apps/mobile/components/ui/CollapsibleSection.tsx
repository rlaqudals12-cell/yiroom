/**
 * CollapsibleSection — 접이식 섹션
 *
 * 제목 + 펼침/접기 토글. LayoutAnimation으로 부드러운 전환.
 * 긴 대시보드에서 영역 접기에 사용.
 */
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import {
  LayoutAnimation,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../lib/theme';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  /** 초기 펼침 여부 (기본 true) */
  defaultOpen?: boolean;
  /** 우측 보조 텍스트 (예: "3/5") */
  trailing?: string;
  /** 헤더 우측 아이콘 */
  trailingIcon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function CollapsibleSection({
  title,
  children,
  defaultOpen = true,
  trailing,
  trailingIcon,
  style,
  testID,
}: CollapsibleSectionProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const handleToggle = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen((prev) => !prev);
  };

  return (
    <View style={style} testID={testID}>
      <Pressable
        style={({ pressed }) => [
          styles.header,
          { paddingVertical: spacing.sm + 2 },
          pressed && styles.pressed,
        ]}
        onPress={handleToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        accessibilityLabel={`${title} 섹션 ${isOpen ? '접기' : '펼치기'}`}
      >
        <View style={styles.headerLeft}>
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: typography.weight.semibold,
              color: colors.foreground,
            }}
          >
            {title}
          </Text>
          {trailing && (
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.mutedForeground,
                marginLeft: spacing.sm,
              }}
            >
              {trailing}
            </Text>
          )}
        </View>
        <View style={styles.headerRight}>
          {trailingIcon}
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginLeft: 4 }}>
            {isOpen ? '▲' : '▼'}
          </Text>
        </View>
      </Pressable>
      {isOpen && <View style={{ paddingBottom: spacing.sm }}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});
