/**
 * 공통 Badge 컴포넌트
 *
 * variant: default | secondary | destructive | outline | trust
 * module: 모듈별 색상 뱃지 (variant와 독립적으로 색상 오버라이드)
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';
import { moduleColors, brand as brandTokens, trustColors } from '../../lib/theme/tokens';

/** 기본 뱃지 스타일 variant */
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'trust';

/** 모듈별 색상 키 */
export type BadgeModule = keyof typeof moduleColors;

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  /** 모듈 색상 오버라이드 (설정 시 variant 색상 대신 모듈 색상 사용) */
  module?: BadgeModule;
  style?: ViewStyle;
  testID?: string;
}

export function Badge({
  children,
  variant = 'default',
  module: moduleProp,
  style,
  testID,
}: BadgeProps): React.JSX.Element {
  const { colors, brand, radii, typography, isDark } = useTheme();

  // 모듈 지정 시 모듈 색상 우선
  let bg: string;
  let fg: string;
  let borderColor = 'transparent';

  if (moduleProp) {
    const mod = moduleColors[moduleProp];
    // 모듈 뱃지: base 색상의 저투명도 배경 + base 색상 텍스트
    bg = hexToRgba(mod.base, isDark ? 0.2 : 0.15);
    fg = isDark ? mod.light : mod.dark;
    borderColor = hexToRgba(mod.base, isDark ? 0.3 : 0.2);
  } else if (variant === 'trust') {
    // 신뢰도 뱃지: 녹색 기반
    bg = isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)';
    fg = isDark ? trustColors.ai.dark : trustColors.ai.light;
    borderColor = isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)';
  } else {
    bg = getBadgeBackground(variant, colors, brand);
    fg = getBadgeForeground(variant, colors, brand);
    borderColor = variant === 'outline' ? colors.border : 'transparent';
  }

  const needsBorder = variant === 'outline' || variant === 'trust' || !!moduleProp;

  return (
    <View
      testID={testID}
      style={[
        styles.badge,
        {
          backgroundColor: bg,
          borderColor,
          borderRadius: radii.full,
        },
        needsBorder && styles.outlined,
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: fg,
            fontSize: typography.size.xs,
            fontWeight: typography.weight.medium,
          },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

function getBadgeBackground(
  variant: BadgeVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  brand: ReturnType<typeof useTheme>['brand'],
): string {
  switch (variant) {
    case 'default':
      return brand.primary;
    case 'secondary':
      return colors.secondary;
    case 'destructive':
      return colors.destructive;
    case 'outline':
      return 'transparent';
    case 'trust':
      return 'transparent';
  }
}

function getBadgeForeground(
  variant: BadgeVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  brand: ReturnType<typeof useTheme>['brand'],
): string {
  switch (variant) {
    case 'default':
      return brand.primaryForeground;
    case 'secondary':
      return colors.secondaryForeground;
    case 'destructive':
      return colors.destructiveForeground;
    case 'outline':
      return colors.foreground;
    case 'trust':
      return colors.foreground;
  }
}

/** hex 색상을 rgba 문자열로 변환 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  outlined: {
    borderWidth: 1,
  },
  text: {
    textAlign: 'center',
    lineHeight: 16,
  },
});
