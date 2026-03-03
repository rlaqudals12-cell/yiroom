/**
 * 공통 Input 컴포넌트
 *
 * 라벨, 에러 메시지, 다크 모드 지원.
 */
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '../../lib/theme';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  testID?: string;
}

export function Input({
  label,
  error,
  containerStyle,
  testID,
  ...inputProps
}: InputProps): React.JSX.Element {
  const { colors, radii, typography, spacing } = useTheme();

  return (
    <View style={containerStyle}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: colors.foreground,
              fontSize: typography.size.sm,
              fontWeight: typography.weight.medium,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <TextInput
        testID={testID}
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: error ? colors.destructive : colors.input,
            borderRadius: radii.xl,
            color: colors.foreground,
            fontSize: typography.size.base,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm + 2,
          },
        ]}
        accessibilityLabel={label}
        {...inputProps}
      />

      {error && (
        <Text
          style={[
            styles.error,
            {
              color: colors.destructive,
              fontSize: typography.size.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    // 동적 스타일은 인라인으로
  },
  input: {
    borderWidth: 1,
    minHeight: 44,
  },
  error: {
    // 동적 스타일은 인라인으로
  },
});
