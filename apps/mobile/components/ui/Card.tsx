/**
 * 공통 Card 컴포넌트
 *
 * Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
 * shadcn/ui Card와 동일한 구조.
 */
import { StyleSheet, Text, View, type TextStyle, type ViewStyle } from 'react-native';

import { useTheme , spacing } from '../../lib/theme';

// --- Card ---

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export function Card({ children, style, testID }: CardProps): React.JSX.Element {
  const { colors, isDark, radii, shadows } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.card,
        !isDark && shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// --- CardHeader ---

interface CardHeaderProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardHeader({ children, style }: CardHeaderProps): React.JSX.Element {
  return <View style={[styles.header, style]}>{children}</View>;
}

// --- CardTitle ---

interface CardTitleProps {
  children: string;
  style?: TextStyle;
}

export function CardTitle({ children, style }: CardTitleProps): React.JSX.Element {
  const { colors, typography } = useTheme();

  return (
    <Text
      accessibilityRole="header"
      style={[
        styles.title,
        {
          color: colors.cardForeground,
          fontSize: typography.size.lg,
          fontWeight: typography.weight.semibold,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// --- CardDescription ---

interface CardDescriptionProps {
  children: string;
  style?: TextStyle;
}

export function CardDescription({ children, style }: CardDescriptionProps): React.JSX.Element {
  const { colors, typography } = useTheme();

  return (
    <Text
      style={[
        {
          color: colors.mutedForeground,
          fontSize: typography.size.sm,
          lineHeight: typography.size.sm * typography.lineHeight.normal,
          marginTop: spacing.xs,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

// --- CardContent ---

interface CardContentProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardContent({ children, style }: CardContentProps): React.JSX.Element {
  return <View style={[styles.content, style]}>{children}</View>;
}

// --- CardFooter ---

interface CardFooterProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function CardFooter({ children, style }: CardFooterProps): React.JSX.Element {
  return <View style={[styles.footer, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    lineHeight: 24,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
