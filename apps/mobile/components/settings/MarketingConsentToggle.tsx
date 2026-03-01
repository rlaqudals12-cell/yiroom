/**
 * MarketingConsentToggle — 마케팅 동의 토글
 *
 * 마케팅 수신 동의/거부를 위한 스위치 카드.
 */
import React from 'react';
import { View, Text, Switch, StyleSheet, type ViewStyle } from 'react-native';

import { useTheme } from '../../lib/theme';

export interface MarketingConsentToggleProps {
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
  lastUpdated?: string;
  style?: ViewStyle;
}

export function MarketingConsentToggle({
  isEnabled,
  onToggle,
  lastUpdated,
  style,
}: MarketingConsentToggleProps): React.JSX.Element {
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
      testID="marketing-consent-toggle"
      accessibilityLabel={`마케팅 수신 동의${isEnabled ? ', 활성화됨' : ', 비활성화됨'}`}
    >
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.bold,
              color: colors.foreground,
            }}
          >
            마케팅 수신 동의
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.xxs }}>
            새로운 기능 소식과 뷰티 팁을 받아보세요
          </Text>
        </View>
        <Switch
          value={isEnabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.secondary, true: brand.primary }}
          thumbColor={isEnabled ? brand.primaryForeground : colors.mutedForeground}
          testID="marketing-switch"
          accessibilityLabel="마케팅 수신 동의 스위치"
        />
      </View>

      {lastUpdated && (
        <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: spacing.sm }}>
          마지막 변경: {lastUpdated}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
