/**
 * 쿠폰 섹션 컴포넌트
 * 사용 가능한 쿠폰 목록 + 적용 버튼
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  expiresAt: string;
  isApplied?: boolean;
}

interface CouponSectionProps {
  coupons: Coupon[];
  onApply: (couponId: string) => void;
  onRemove: (couponId: string) => void;
}

export function CouponSection({ coupons, onApply, onRemove }: CouponSectionProps): React.ReactElement {
  if (coupons.length === 0) {
    return (
      <View style={styles.empty} testID="coupon-section-empty">
        <Text style={styles.emptyText}>사용 가능한 쿠폰이 없어요.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container} testID="coupon-section">
      <Text style={styles.title}>쿠폰</Text>
      {coupons.map((coupon) => (
        <View key={coupon.id} style={styles.couponCard} testID={`coupon-${coupon.id}`}>
          <View style={styles.couponInfo}>
            <Text style={styles.discount}>
              {coupon.discountType === 'percent'
                ? `${coupon.discountValue}% 할인`
                : `${coupon.discountValue.toLocaleString()}원 할인`}
            </Text>
            <Text style={styles.description}>{coupon.description}</Text>
            {coupon.minOrderAmount && (
              <Text style={styles.condition}>
                {coupon.minOrderAmount.toLocaleString()}원 이상 구매 시
              </Text>
            )}
          </View>
          <Pressable
            style={[styles.applyButton, coupon.isApplied && styles.appliedButton]}
            onPress={() => (coupon.isApplied ? onRemove(coupon.id) : onApply(coupon.id))}
            testID={`coupon-apply-${coupon.id}`}
          >
            <Text style={[styles.applyText, coupon.isApplied && styles.appliedText]}>
              {coupon.isApplied ? '적용됨' : '적용'}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  empty: { padding: 24, alignItems: 'center' as const },
  emptyText: { fontSize: 14, color: '#9ca3af' },
  title: { fontSize: 16, fontWeight: '600' as const, marginBottom: 12 },
  couponCard: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 8,
  },
  couponInfo: { flex: 1 },
  discount: { fontSize: 16, fontWeight: '700' as const, color: '#ec4899' },
  description: { fontSize: 13, color: '#d1d5db', marginTop: 2 },
  condition: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#ec4899',
  },
  appliedButton: { backgroundColor: '#374151' },
  applyText: { fontSize: 13, fontWeight: '600' as const, color: '#fff' },
  appliedText: { color: '#9ca3af' },
});
