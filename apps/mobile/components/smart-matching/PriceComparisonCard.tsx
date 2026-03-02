/**
 * PriceComparisonCard -- 가격 비교 카드
 *
 * 동일 제품의 여러 판매처 가격을 비교하여 표시.
 * 최저가 항목은 하이라이트 처리.
 */
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { useTheme, spacing, radii, typography, statusColors } from '../../lib/theme';

export interface StorePrice {
  store: string;
  price: number;
  url?: string;
  isBest?: boolean;
}

interface PriceComparisonCardProps {
  productName: string;
  prices: StorePrice[];
  currency?: string;
  style?: ViewStyle;
}

export function PriceComparisonCard({
  productName,
  prices,
  currency = '원',
  style,
}: PriceComparisonCardProps): React.JSX.Element {
  const { colors, shadows } = useTheme();

  // 최저가 자동 계산 (isBest가 명시되지 않은 경우 price 기준)
  const bestPrice = Math.min(...prices.map((p) => p.price));

  return (
    <View
      testID="price-comparison-card"
      style={[
        styles.card,
        shadows.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: radii.xl,
        },
        style,
      ]}
      accessibilityLabel={`${productName} 가격 비교`}
      accessibilityRole="summary"
    >
      {/* 헤더 */}
      <View style={[styles.header, { paddingBottom: spacing.smx }]}>
        <Text
          style={{
            fontSize: typography.size.sm,
            fontWeight: typography.weight.bold,
            color: colors.foreground,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <View
          style={[
            styles.compareTag,
            {
              backgroundColor: `${statusColors.info}18`,
              borderRadius: radii.sm,
            },
          ]}
        >
          <Text
            style={{
              fontSize: typography.size.xs,
              fontWeight: typography.weight.semibold,
              color: statusColors.info,
            }}
          >
            {prices.length}곳 비교
          </Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* 가격 목록 */}
      <View style={[styles.priceList, { paddingTop: spacing.smx }]}>
        {prices.map((item, index) => {
          const isBest = item.isBest ?? item.price === bestPrice;
          return (
            <View
              key={`${item.store}-${index}`}
              style={[
                styles.priceRow,
                {
                  paddingVertical: spacing.sm,
                  backgroundColor: isBest ? `${statusColors.success}08` : 'transparent',
                  borderRadius: isBest ? radii.md : 0,
                  paddingHorizontal: isBest ? spacing.sm : 0,
                },
              ]}
              accessibilityLabel={`${item.store}: ${item.price.toLocaleString()}${currency}${isBest ? ', 최저가' : ''}`}
            >
              <View style={styles.storeInfo}>
                <Text
                  style={{
                    fontSize: typography.size.sm,
                    fontWeight: isBest ? typography.weight.bold : typography.weight.normal,
                    color: colors.foreground,
                  }}
                  numberOfLines={1}
                >
                  {item.store}
                </Text>
                {isBest && (
                  <View
                    style={[
                      styles.bestBadge,
                      {
                        backgroundColor: statusColors.success,
                        borderRadius: radii.sm,
                        marginLeft: spacing.sm,
                      },
                    ]}
                  >
                    <Text style={styles.bestBadgeText}>
                      최저가
                    </Text>
                  </View>
                )}
              </View>

              <Text
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.bold,
                  color: isBest ? statusColors.success : colors.foreground,
                }}
              >
                {item.price.toLocaleString()}{currency}
              </Text>
            </View>
          );
        })}
      </View>

      {/* 최저가 요약 */}
      <View
        style={[
          styles.summaryRow,
          {
            backgroundColor: `${statusColors.success}10`,
            borderRadius: radii.lg,
            marginTop: spacing.smx,
            padding: spacing.smx,
          },
        ]}
      >
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
          }}
        >
          최저가
        </Text>
        <Text
          style={{
            fontSize: typography.size.lg,
            fontWeight: typography.weight.bold,
            color: statusColors.success,
          }}
        >
          {bestPrice.toLocaleString()}{currency}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  compareTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    marginLeft: spacing.sm,
  },
  divider: {
    height: 1,
  },
  priceList: {
    // 정적 리스트 (판매처 수 < 10 예상)
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bestBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  bestBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
