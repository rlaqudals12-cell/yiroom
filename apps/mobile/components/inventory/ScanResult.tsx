/**
 * ScanResult — 스캔 결과 카드
 *
 * 바코드/QR 스캔으로 식별된 제품 정보 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface ScanResultProps {
  productName: string;
  brand: string;
  barcode: string;
  matchConfidence?: number;
  onAdd?: () => void;
  onDismiss?: () => void;
  style?: ViewStyle;
}

export function ScanResult({
  productName,
  brand: productBrand,
  barcode,
  matchConfidence,
  onAdd,
  onDismiss,
  style,
}: ScanResultProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status, brand } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: radii.xl,
          padding: spacing.md,
          ...shadows.card,
        },
        style,
      ]}
      testID="scan-result"
      accessibilityLabel={`스캔 결과: ${productBrand} ${productName}`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.xl }}>📦</Text>
        <View style={{ marginLeft: spacing.sm, flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            {productName}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
            {productBrand}
          </Text>
        </View>
      </View>

      <View style={[styles.infoRow, { marginTop: spacing.sm }]}>
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>
          바코드: {barcode}
        </Text>
        {matchConfidence !== undefined && (
          <Text
            style={{
              fontSize: typography.size.xs,
              color: matchConfidence >= 90 ? status.success : status.warning,
              fontWeight: typography.weight.medium,
            }}
          >
            매칭 {matchConfidence}%
          </Text>
        )}
      </View>

      <View style={[styles.actions, { marginTop: spacing.sm, gap: spacing.sm }]}>
        {onAdd && (
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: brand.primary,
                borderRadius: radii.xl,
                paddingVertical: spacing.sm,
              },
            ]}
            onPress={onAdd}
            accessibilityLabel="인벤토리에 추가"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                fontWeight: typography.weight.bold,
                color: brand.primaryForeground,
                textAlign: 'center',
              }}
            >
              추가
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            style={[
              styles.actionBtn,
              {
                backgroundColor: colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.sm,
              },
            ]}
            onPress={onDismiss}
            accessibilityLabel="닫기"
            accessibilityRole="button"
          >
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                textAlign: 'center',
              }}
            >
              닫기
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actions: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex: 1,
  },
});
