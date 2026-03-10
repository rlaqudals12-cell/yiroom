/**
 * 내 제품함 (선반) 목록
 * 상태 필터: 보관중/사용중/다씀
 */
import { router } from 'expo-router';
import { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { ScreenContainer } from '@/components/ui';
import { TIMING } from '@/lib/animations';
import { useTheme, typography, spacing, radii } from '@/lib/theme';

type ShelfStatus = 'all' | 'stored' | 'in_use' | 'finished';

const STATUS_FILTERS: { id: ShelfStatus; label: string; emoji: string }[] = [
  { id: 'all', label: '전체', emoji: '📦' },
  { id: 'stored', label: '보관중', emoji: '🗄️' },
  { id: 'in_use', label: '사용중', emoji: '✨' },
  { id: 'finished', label: '다 씀', emoji: '✅' },
];

// 목업 데이터 (API 연동 전)
const MOCK_SHELF_ITEMS = [
  {
    id: '1',
    name: '아이소이 수분 크림',
    brand: '아이소이',
    status: 'in_use' as const,
    expiresAt: '2026-08',
    category: 'skincare',
  },
  {
    id: '2',
    name: '라운드랩 자작나무 토너',
    brand: '라운드랩',
    status: 'in_use' as const,
    expiresAt: '2026-12',
    category: 'skincare',
  },
  {
    id: '3',
    name: '달바 선크림',
    brand: '달바',
    status: 'stored' as const,
    expiresAt: '2027-03',
    category: 'suncare',
  },
  {
    id: '4',
    name: '이니스프리 그린티 세럼',
    brand: '이니스프리',
    status: 'finished' as const,
    expiresAt: '2026-01',
    category: 'skincare',
  },
];

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  stored: { label: '보관중', color: '#3B82F6' },
  in_use: { label: '사용중', color: '#10B981' },
  finished: { label: '다 씀', color: '#9CA3AF' },
};

export default function ShelfScreen() {
  const { colors, isDark } = useTheme();
  const [statusFilter, setStatusFilter] = useState<ShelfStatus>('all');

  const filteredItems =
    statusFilter === 'all'
      ? MOCK_SHELF_ITEMS
      : MOCK_SHELF_ITEMS.filter((item) => item.status === statusFilter);

  const handleItemPress = useCallback((id: string) => {
    router.push({ pathname: '/(inventory)/shelf-detail/[id]', params: { id } });
  }, []);

  return (
    <ScreenContainer edges={['bottom']} contentPadding={0} testID="shelf-screen">
      {/* 상태 필터 */}
      <View style={[styles.filterRow, { paddingHorizontal: spacing.mlg }]}>
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
            <Text style={{ fontSize: 14 }}>{f.emoji}</Text>
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
      </View>

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
                  <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
                  <Text style={[styles.itemBrand, { color: colors.mutedForeground }]}>
                    {item.brand}
                  </Text>
                  <Text style={[styles.itemExpiry, { color: colors.mutedForeground }]}>
                    사용기한: {item.expiresAt}
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
              제품함이 비어있어요
            </Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              바코드 스캔으로 제품을 추가해보세요
            </Text>
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
});
