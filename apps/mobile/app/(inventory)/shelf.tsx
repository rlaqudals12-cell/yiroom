/**
 * 내 제품함 (선반) 목록
 * user_product_shelf의 실제 상태 기준 목록과 필터
 */
import { useAuth } from '@clerk/clerk-expo';
import { router } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { GlassCard, ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import {
  getProductShelf,
  type ProductShelfItem,
  type ProductShelfStatus,
} from '@/lib/api/product-shelf';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

type ShelfStatusFilter = 'all' | ProductShelfStatus;

const STATUS_FILTERS: { id: ShelfStatusFilter; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'owned', label: '보유중' },
  { id: 'wishlist', label: '관심' },
  { id: 'used_up', label: '다 씀' },
];

const STATUS_LABELS: Record<ProductShelfStatus, { label: string; color: string }> = {
  owned: { label: '보유중', color: '#10B981' },
  wishlist: { label: '관심', color: '#3B82F6' },
  used_up: { label: '다 씀', color: '#9CA3AF' },
  archived: { label: '보관', color: '#6B7280' },
};

function formatExpiry(value: string | undefined): string {
  if (!value) return '미등록';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '미등록';
  return date.toLocaleDateString('ko-KR');
}

export default function ShelfScreen(): React.JSX.Element {
  const { colors } = useTheme();
  const { getToken } = useAuth();
  const [statusFilter, setStatusFilter] = useState<ShelfStatusFilter>('all');
  const [items, setItems] = useState<ProductShelfItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error('로그인이 필요합니다.');
      const result = await getProductShelf(token);
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '제품함을 불러오지 못했어요.');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void fetchItems();
  }, [fetchItems]);

  const filteredItems =
    statusFilter === 'all' ? items : items.filter((item) => item.status === statusFilter);

  const handleItemPress = useCallback((id: string) => {
    router.push({ pathname: '/(inventory)/shelf-detail/[id]', params: { id } });
  }, []);

  return (
    <ScreenContainer
      edges={['bottom']}
      contentPadding={0}
      testID="shelf-screen"
      backgroundGradient="beauty"
    >
      {/* 상태 필터 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard shadowSize="md" style={{ ...styles.filterRow, paddingHorizontal: spacing.mlg }}>
          {STATUS_FILTERS.map((f) => (
            <Pressable
              key={f.id}
              style={[
                styles.filterChip,
                {
                  backgroundColor: statusFilter === f.id ? colors.foreground : colors.card,
                  borderColor: colors.border,
                  borderWidth: statusFilter === f.id ? 0 : 1,
                },
              ]}
              onPress={() => setStatusFilter(f.id)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  { color: statusFilter === f.id ? colors.background : colors.foreground },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </GlassCard>
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="바코드로 제품함에 추가"
        onPress={() => router.push('/(inventory)/barcode-scan')}
        style={[styles.addButton, { borderColor: colors.border }]}
        testID="shelf-add-product"
      >
        <Text style={[styles.filterLabel, { color: colors.foreground }]}>바코드로 제품 추가</Text>
      </Pressable>

      {/* 제품 목록 */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.mlg, paddingBottom: spacing.xl }}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        renderItem={({ item, index }) => {
          const statusInfo = STATUS_LABELS[item.status];
          return (
            <Animated.View entering={FadeInUp.delay(index * 50).duration(TIMING.normal)}>
              <Pressable
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 },
                ]}
                onPress={() => handleItemPress(item.id)}
              >
                <View style={[styles.itemIcon, { backgroundColor: `${statusInfo.color}15` }]}>
                  <Text style={{ fontSize: 22 }}>🧴</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text style={[styles.itemName, { color: colors.foreground }]}>
                    {item.productName || '이름 없음'}
                  </Text>
                  <Text style={[styles.itemBrand, { color: colors.mutedForeground }]}>
                    {item.productBrand || '브랜드 미등록'}
                  </Text>
                  <Text style={[styles.itemExpiry, { color: colors.mutedForeground }]}>
                    사용기한: {formatExpiry(item.expiresAt)}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${statusInfo.color}20` }]}>
                  <Text style={[styles.statusText, { color: statusInfo.color }]}>
                    {statusInfo.label}
                  </Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, marginBottom: spacing.md }}>📦</Text>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {isLoading ? '제품함을 불러오고 있어요' : error || '제품함이 비어있어요'}
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              {error ? '잠시 후 다시 시도해주세요.' : '아직 저장한 제품이 없어요.'}
            </Text>
            {error ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="제품함 다시 불러오기"
                onPress={() => void fetchItems()}
                style={[styles.retryButton, { borderColor: colors.border }]}
                testID="shelf-retry"
              >
                <Text style={[styles.filterLabel, { color: colors.foreground }]}>다시 시도</Text>
              </Pressable>
            ) : null}
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    gap: spacing.xxs,
  },
  filterLabel: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radii.xl,
    gap: spacing.smx,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: { flex: 1 },
  itemName: {
    fontSize: 15,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xxs,
  },
  itemBrand: { fontSize: 13, marginBottom: spacing.xxs },
  itemExpiry: { fontSize: 11 },
  statusBadge: {
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.xxs,
    borderRadius: radii.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: typography.weight.semibold,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  emptyDesc: { fontSize: typography.size.sm },
  retryButton: {
    minHeight: 44,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  addButton: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.mlg,
    marginBottom: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
  },
});
