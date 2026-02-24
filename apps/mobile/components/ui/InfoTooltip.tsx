/**
 * InfoTooltip — 정보 툴팁
 *
 * (i) 아이콘을 누르면 설명 텍스트가 토글 표시.
 * 점수 설명, 분석 기준 안내 등에 사용.
 */
import { Info } from 'lucide-react-native';
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

interface InfoTooltipProps {
  /** 툴팁 텍스트 */
  text: string;
  /** 아이콘 크기 (기본 16) */
  iconSize?: number;
  /** 아이콘 색상 (기본 mutedForeground) */
  iconColor?: string;
  /** 인라인 배치 시 children과 함께 표시 */
  children?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function InfoTooltip({
  text,
  iconSize = 16,
  iconColor,
  children,
  style,
  testID,
}: InfoTooltipProps): React.JSX.Element {
  const { colors, spacing, radii, typography } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const color = iconColor ?? colors.mutedForeground;

  const handleToggle = (): void => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsVisible((prev) => !prev);
  };

  return (
    <View style={style} testID={testID}>
      <View style={styles.row}>
        {children}
        <Pressable
          onPress={handleToggle}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="정보 보기"
          accessibilityState={{ expanded: isVisible }}
        >
          <Info size={iconSize} color={color} />
        </Pressable>
      </View>
      {isVisible && (
        <View
          style={[
            styles.tooltip,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.md,
              padding: spacing.sm + 2,
              marginTop: spacing.xs,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              color: colors.mutedForeground,
              lineHeight: 18,
            }}
          >
            {text}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 4,
    padding: 2,
  },
  tooltip: {},
});
