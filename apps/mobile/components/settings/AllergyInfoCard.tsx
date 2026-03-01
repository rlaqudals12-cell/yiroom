/**
 * AllergyInfoCard — 알레르기 정보 카드
 *
 * 사용자 알레르기/민감 성분 정보를 표시.
 */
import React from 'react';
import { View, Text, Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface AllergyInfoCardProps {
  allergies: string[];
  onEdit?: () => void;
  style?: ViewStyle;
}

export function AllergyInfoCard({
  allergies,
  onEdit,
  style,
}: AllergyInfoCardProps): React.JSX.Element {
  const { colors, spacing, typography, radii, shadows, status } = useTheme();

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
      testID="allergy-info-card"
      accessibilityLabel={`알레르기 정보${allergies.length > 0 ? `, ${allergies.length}건` : ''}`}
    >
      <View style={styles.header}>
        <Text style={{ fontSize: typography.size.base }}>⚠️</Text>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            marginLeft: spacing.xs,
            flex: 1,
          }}
        >
          알레르기 / 민감 성분
        </Text>
        {onEdit && (
          <Pressable onPress={onEdit} accessibilityLabel="알레르기 정보 수정" accessibilityRole="button">
            <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground }}>수정</Text>
          </Pressable>
        )}
      </View>

      {allergies.length > 0 ? (
        <View style={[styles.tagRow, { marginTop: spacing.sm, gap: spacing.xs }]}>
          {allergies.map((allergy, i) => (
            <View
              key={i}
              style={{
                backgroundColor: status.error + '20',
                borderRadius: radii.full,
                paddingVertical: spacing.xxs,
                paddingHorizontal: spacing.sm,
              }}
            >
              <Text style={{ fontSize: typography.size.xs, color: status.error }}>{allergy}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={{ fontSize: typography.size.sm, color: colors.mutedForeground, marginTop: spacing.sm }}>
          등록된 알레르기 정보가 없습니다
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
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
