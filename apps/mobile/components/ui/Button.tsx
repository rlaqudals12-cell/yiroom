/**
 * 공통 Button 컴포넌트
 *
 * variant: default | secondary | ghost | destructive | outline
 * size: sm | md | lg
 */
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

type ButtonVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
  style?: ViewStyle;
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled = false,
  onPress,
  testID,
  style: externalStyle,
}: ButtonProps): React.JSX.Element {
  const { colors, brand, radii, typography } = useTheme();
  const isDisabled = disabled || isLoading;

  const bgColor = getBackgroundColor(variant, colors, brand);
  const textColor = getTextColor(variant, colors, brand);
  const borderColor = variant === 'outline' ? colors.border : 'transparent';
  const sizeStyle = getSizeStyle(size);

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          borderRadius: radii.lg,
          paddingHorizontal: sizeStyle.px,
          paddingVertical: sizeStyle.py,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'outline' && styles.outlined,
        externalStyle,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: isLoading }}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text
          style={[
            styles.text,
            {
              color: textColor,
              fontSize: sizeStyle.fontSize,
              fontWeight: typography.weight.semibold,
            },
          ]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}

function getBackgroundColor(
  variant: ButtonVariant,
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
    case 'ghost':
    case 'outline':
      return 'transparent';
  }
}

function getTextColor(
  variant: ButtonVariant,
  colors: ReturnType<typeof useTheme>['colors'],
  brand: ReturnType<typeof useTheme>['brand']
): string {
  switch (variant) {
    case 'default':
      return brand.primaryForeground;
    case 'secondary':
      return colors.secondaryForeground;
    case 'destructive':
      return '#FFFFFF';
    case 'ghost':
      return colors.foreground;
    case 'outline':
      return colors.foreground;
  }
}

function getSizeStyle(size: ButtonSize): {
  px: number;
  py: number;
  fontSize: number;
} {
  switch (size) {
    case 'sm':
      return { px: 12, py: 6, fontSize: 13 };
    case 'md':
      return { px: 20, py: 10, fontSize: 15 };
    case 'lg':
      return { px: 28, py: 14, fontSize: 17 };
  }
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  outlined: {
    borderWidth: 1,
  },
  text: {
    textAlign: 'center',
  },
});
