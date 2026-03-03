/**
 * DeleteAccountDialog — 계정 삭제 확인 다이얼로그
 *
 * 계정 삭제 전 확인 및 경고를 표시하는 다이얼로그 콘텐츠.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface DeleteAccountDialogProps {
  onConfirm?: () => void;
  onCancel?: () => void;
  isDeleting?: boolean;
  style?: ViewStyle;
}

export function DeleteAccountDialog({
  onConfirm,
  onCancel,
  isDeleting = false,
  style,
}: DeleteAccountDialogProps): React.JSX.Element {
  const { colors, spacing, typography, radii, status } = useTheme();

  return (
    <View
      style={[{ padding: spacing.md }, style]}
      testID="delete-account-dialog"
      accessibilityLabel="계정 삭제 확인"
    >
      <Text style={{ fontSize: typography.size['2xl'], textAlign: 'center' }}>⚠️</Text>
      <Text
        style={{
          fontSize: typography.size.lg,
          fontWeight: typography.weight.bold,
          color: status.error,
          textAlign: 'center',
          marginTop: spacing.sm,
        }}
      >
        계정을 삭제하시겠습니까?
      </Text>

      <Text
        style={{
          fontSize: typography.size.sm,
          color: colors.mutedForeground,
          textAlign: 'center',
          marginTop: spacing.sm,
          lineHeight: 20,
        }}
      >
        삭제된 데이터는 복구할 수 없습니다.{'\n'}
        분석 기록, 운동·영양 데이터가 모두 삭제됩니다.
      </Text>

      <View style={[styles.btnRow, { marginTop: spacing.lg, gap: spacing.sm }]}>
        {onCancel && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onCancel}
            accessibilityLabel="취소"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.medium,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              취소
            </Text>
          </Pressable>
        )}
        {onConfirm && (
          <Pressable
            style={[
              styles.btn,
              {
                backgroundColor: status.error,
                borderRadius: radii.xl,
                paddingVertical: spacing.smd,
              },
            ]}
            onPress={onConfirm}
            disabled={isDeleting}
            accessibilityLabel={isDeleting ? '삭제 중...' : '계정 삭제'}
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: colors.overlayForeground,
                textAlign: 'center',
              }}
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  btnRow: {
    flexDirection: 'row',
  },
  btn: {
    flex: 1,
  },
});
