/**
 * SectionHeader 공통 컴포넌트
 *
 * 제목 + 부제목(선택) + 우측 액션(선택) 헤더 패턴.
 * 홈/기록 탭의 섹션 구분에 사용.
 * gradient prop 사용 시 타이틀에 GradientText 적용.
 */
import { Pressable, StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { GradientText, type GradientTextVariant } from './GradientText';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onPress: () => void;
  };
  style?: ViewStyle;
  /** 타이틀 텍스트 커스텀 스타일 (히어로 헤더 등) */
  titleStyle?: TextStyle;
  /** 그래디언트 텍스트 variant (지정 시 타이틀에 GradientText 사용) */
  gradient?: GradientTextVariant;
  testID?: string;
}

export function SectionHeader({
  title,
  subtitle,
  action,
  style,
  titleStyle,
  gradient,
  testID,
}: SectionHeaderProps): React.JSX.Element {
  const { colors, brand, typography } = useTheme();

  return (
    <View testID={testID} style={[styles.container, style]} accessibilityRole="header">
      <View style={styles.textGroup}>
        {gradient ? (
          <GradientText
            variant={gradient}
            fontSize={titleStyle?.fontSize as number ?? typography.size.lg}
            fontWeight={titleStyle?.fontWeight ?? typography.weight.bold}
          >
            {title}
          </GradientText>
        ) : (
          <Text
            style={[
              {
                color: colors.foreground,
                fontSize: typography.size.lg,
                fontWeight: typography.weight.bold,
              },
              titleStyle,
            ]}
          >
            {title}
          </Text>
        )}
        {subtitle ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: typography.size.sm,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable onPress={action.onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={action.label}>
          <Text
            style={{
              color: brand.primary,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
            }}
          >
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textGroup: {
    flex: 1,
  },
});
