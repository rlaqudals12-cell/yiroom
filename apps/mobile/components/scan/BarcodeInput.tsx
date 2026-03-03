/**
 * BarcodeInput -- 수동 바코드 입력 필드
 *
 * 카메라 스캔이 어려운 경우 바코드 번호를 직접 입력할 수 있는
 * 텍스트 입력 + 제출 버튼 컴포넌트.
 */
import { Pressable, StyleSheet, Text, TextInput, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography } from '../../lib/theme';

interface BarcodeInputProps {
  value: string;
  onChange: (text: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  style?: ViewStyle;
}

export function BarcodeInput({
  value,
  onChange,
  onSubmit,
  placeholder = '바코드 번호를 입력하세요',
  style,
}: BarcodeInputProps): React.JSX.Element {
  const { colors, brand: brandColors, shadows } = useTheme();

  const isSubmitDisabled = value.trim().length === 0;

  return (
    <View
      testID="barcode-input"
      style={[styles.container, style]}
      accessibilityLabel="바코드 입력"
    >
      <View
        style={[
          styles.inputRow,
          shadows.sm,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radii.xl,
          },
        ]}
      >
        <TextInput
          testID="barcode-input-field"
          style={[
            styles.textInput,
            {
              color: colors.foreground,
              fontSize: typography.size.base,
            },
          ]}
          value={value}
          onChangeText={onChange}
          onSubmitEditing={onSubmit}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType="numeric"
          returnKeyType="search"
          maxLength={20}
          accessibilityLabel="바코드 번호 입력란"
          accessibilityHint="숫자로 바코드를 입력한 뒤 조회 버튼을 누르세요"
        />

        <Pressable
          testID="barcode-input-submit"
          style={({ pressed }) => [
            styles.submitButton,
            {
              backgroundColor: isSubmitDisabled
                ? colors.muted
                : pressed
                  ? '#E8B4C8'
                  : brandColors.primary,
              borderRadius: radii.xl,
              opacity: isSubmitDisabled ? 0.5 : 1,
            },
          ]}
          onPress={onSubmit}
          disabled={isSubmitDisabled}
          accessibilityRole="button"
          accessibilityLabel="바코드 조회"
          accessibilityState={{ disabled: isSubmitDisabled }}
        >
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color: isSubmitDisabled ? colors.mutedForeground : '#0A0A0A',
            }}
          >
            조회
          </Text>
        </Pressable>
      </View>

      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: spacing.xs,
          textAlign: 'center',
        }}
      >
        제품 뒷면의 바코드 숫자를 직접 입력할 수 있어요
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // 외부에서 레이아웃 제어
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
  },
  textInput: {
    flex: 1,
    paddingVertical: spacing.sm,
  },
  submitButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.smd,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
