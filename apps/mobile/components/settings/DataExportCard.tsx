/**
 * DataExportCard — 데이터 내보내기 카드
 *
 * 사용자 데이터를 내보내는 CTA.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface DataExportCardProps {
  lastExportDate?: string;
  onExport?: () => void;
  isExporting?: boolean;
  style?: ViewStyle;
}

export function DataExportCard({
  lastExportDate,
  onExport,
  isExporting = false,
  style,
}: DataExportCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, brand } = useTheme();

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
      testID="data-export-card"
      accessibilityLabel="데이터 내보내기"
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>📤</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
          }}
        >
          데이터 내보내기
        </Text>
      </View>

      <Text
        style={{
          fontSize: typography.size.xs,
          color: colors.mutedForeground,
          marginTop: spacing.sm,
          lineHeight: 18,
        }}
      >
        분석 기록, 운동·영양 데이터를 JSON 형식으로 내보냅니다.
      </Text>

      {lastExportDate && (
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xs }}>
          마지막 내보내기: {lastExportDate}
        </Text>
      )}

      {onExport && (
        <Pressable
          style={[
            styles.exportBtn,
            {
              backgroundColor: brand.primary,
              borderRadius: radii.xl,
              paddingVertical: spacing.smd,
              marginTop: spacing.md,
            },
          ]}
          onPress={onExport}
          disabled={isExporting}
          accessibilityLabel={isExporting ? '내보내기 중...' : '내보내기'}
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
            {isExporting ? '내보내는 중...' : '내보내기'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  exportBtn: {},
});
