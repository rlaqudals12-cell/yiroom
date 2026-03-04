/**
 * GapCard — 갭 분석 카드
 *
 * 캡슐에서 부족한 아이템 카테고리를 표시하고
 * 재활용 또는 구매 CTA를 제공.
 * @see docs/adr/ADR-075-shopping-companion.md
 */
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '../../lib/theme';

interface GapItem {
  category: string;
  reason: string;
  canReuse: boolean;
}

interface GapCardProps {
  /** 부족 항목 */
  gap: GapItem;
  /** 재활용 CTA */
  onReuse?: () => void;
  /** 구매 CTA */
  onShop?: () => void;
  testID?: string;
}

export function GapCard({
  gap,
  onReuse,
  onShop,
  testID,
}: GapCardProps): React.JSX.Element {
  const { colors, brand, spacing, radii, typography, isDark } = useTheme();

  return (
    <View
      testID={testID}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderRadius: radii.lg,
          borderWidth: 1,
          borderColor: isDark ? colors.border : `${brand.primary}30`,
          padding: spacing.md,
        },
      ]}
    >
      <View style={styles.content}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: typography.size.sm,
            fontWeight: typography.weight.semibold,
          }}
        >
          {gap.category}
        </Text>
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: typography.size.xs,
            marginTop: 2,
            lineHeight: typography.size.xs * 1.4,
          }}
          numberOfLines={2}
        >
          {gap.reason}
        </Text>
      </View>

      <View style={styles.actions}>
        {gap.canReuse && onReuse ? (
          <Pressable
            onPress={onReuse}
            accessibilityRole="button"
            accessibilityLabel={`${gap.category} 재활용`}
            style={[
              styles.actionButton,
              {
                backgroundColor: isDark ? 'rgba(34,197,94,0.12)' : 'rgba(34,197,94,0.08)',
                borderRadius: radii.md,
              },
            ]}
          >
            <Text
              style={{
                color: '#22C55E',
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
              }}
            >
              재활용
            </Text>
          </Pressable>
        ) : null}
        {onShop ? (
          <Pressable
            onPress={onShop}
            accessibilityRole="button"
            accessibilityLabel={`${gap.category} 쇼핑`}
            style={{ borderRadius: radii.md, overflow: 'hidden' }}
          >
            <LinearGradient
              colors={[brand.primary, '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.actionButton, { borderRadius: radii.md }]}
            >
              <Text
                style={{
                  color: '#FFFFFF',
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                }}
              >
                추천 보기
              </Text>
            </LinearGradient>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  content: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
