/**
 * 공통 Badge 컴포넌트
 *
 * variant: default | secondary | destructive | outline
 */
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
  testID?: string;
}

export function Badge({
  children,
  variant = 'default',
  style,
  testID,
}: BadgeProps): React.JSX.Element {
  const { colors, brand, radii, typography } = useTheme();

  const bg = getBadgeBackground(variant, colors, brand);
  const fg = getBadgeForeground(variant, colors, brand);
  const borderColor = variant === 'outline' ? colors.border : 'transparent';

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
        variant === 'outline' && styles.outlined,
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
  brand: ReturnType<typeof useTheme>['brand']
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
  }
}

function getBadgeForeground(
  variant: BadgeVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  brand: ReturnType<typeof useTheme>['brand']
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
  }
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
