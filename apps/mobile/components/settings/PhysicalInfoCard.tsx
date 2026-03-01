/**
 * PhysicalInfoCard — 신체 정보 카드
 *
 * 사용자의 키, 몸무게, 체형 등 기본 신체 정보를 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface PhysicalInfoCardProps {
  height?: number;
  weight?: number;
  bodyType?: string;
  gender?: string;
  onEdit?: () => void;
  style?: ViewStyle;
}

export function PhysicalInfoCard({
  height,
  weight,
  bodyType,
  gender,
  onEdit,
  style,
}: PhysicalInfoCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows } = useTheme();

  const hasData = height || weight || bodyType || gender;

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
      testID="physical-info-card"
      accessibilityLabel="신체 정보"
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>📏</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
            flex: 1,
          }}
        >
          신체 정보
        </Text>
        {onEdit && (
          <Pressable onPress={onEdit} accessibilityLabel="신체 정보 수정" accessibilityRole="button">
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>수정</Text>
          </Pressable>
        )}
      </View>

      {hasData ? (
        <View style={[styles.grid, { marginTop: spacing.sm, gap: spacing.sm }]}>
          {height !== undefined && (
            <View style={styles.infoItem}>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>키</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.foreground, marginTop: spacing.xxs }}>
                {height}cm
              </Text>
            </View>
          )}
          {weight !== undefined && (
            <View style={styles.infoItem}>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>몸무게</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.foreground, marginTop: spacing.xxs }}>
                {weight}kg
              </Text>
            </View>
          )}
          {bodyType && (
            <View style={styles.infoItem}>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>체형</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.foreground, marginTop: spacing.xxs }}>
                {bodyType}
              </Text>
            </View>
          )}
          {gender && (
            <View style={styles.infoItem}>
              <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground }}>성별</Text>
              <Text style={{ fontSize: typography.size.sm, fontWeight: typography.weight.medium, color: colors.foreground, marginTop: spacing.xxs }}>
                {gender}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
          신체 정보를 등록해주세요
        </Text>
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infoItem: {
    width: '48%',
  },
});
