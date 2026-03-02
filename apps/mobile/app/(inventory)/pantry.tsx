/**
 * 팬트리 인벤토리 화면 (내 냉장고)
 *
 * 사용자의 식품/영양제 관리.
 * useInventory('pantry') + useInventory('supplement') 훅 활용.
 * - 식품/영양제 목록 (보관 위치별 필터)
 * - 유통기한 관리
 * - 재고 수량 표시
 */
import * as Haptics from 'expo-haptics';
import { Refrigerator, Pill, Clock, Trash2 } from 'lucide-react-native';
import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme, typography, spacing } from '@/lib/theme';
import { staggeredEntry } from '@/lib/animations';
import { ScreenContainer } from '../../components/ui';
import {
  useInventory,
  type InventoryItem,
  type PantryMetadata,
  type SupplementMetadata,
} from '@/lib/inventory';

// 탭
type PantryTab = 'pantry' | 'supplement';

// 보관 위치 필터
const STORAGE_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'refrigerator', label: '냉장' },
  { key: 'freezer', label: '냉동' },
  { key: 'room', label: '실온' },
];

function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7일 이내
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

function formatExpiryDate(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const d = new Date(expiryDate);
  const diff = d.getTime() - Date.now();
  if (diff < 0) return '만료됨';
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 7) return `${days}일 남음`;
  return `${d.getMonth() + 1}/${d.getDate()}까지`;
}

function getStorageLabel(type: string): string {
  const labels: Record<string, string> = {
    refrigerator: '🧊 냉장',
    freezer: '❄️ 냉동',
    room: '🏠 실온',
  };
  return labels[type] || type;
}

export default function PantryScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, status, shadows } = useTheme();

  const [activeTab, setActiveTab] = useState<PantryTab>('pantry');
  const [storageFilter, setStorageFilter] = useState('all');

  const pantry = useInventory('pantry');
  const supplements = useInventory('supplement');

  const activeItems = activeTab === 'pantry' ? pantry.items : supplements.items;
  const activeLoading = activeTab === 'pantry' ? pantry.isLoading : supplements.isLoading;
  const activeRefetch = activeTab === 'pantry' ? pantry.refetch : supplements.refetch;
  const activeDelete = activeTab === 'pantry' ? pantry.deleteItem : supplements.deleteItem;

  // 보관 위치 필터 (팬트리만)
  const filteredItems = useMemo(() => {
    if (activeTab !== 'pantry' || storageFilter === 'all') return activeItems;
    return activeItems.filter((item) => {
      const meta = item.metadata as Partial<PantryMetadata>;
      return meta.storageType === storageFilter;
    });
  }, [activeItems, activeTab, storageFilter]);

  // 통계
  const expiringCount = activeItems.filter(
    (i) => isExpiringSoon(i.expiryDate) || isExpired(i.expiryDate)
  ).length;

  const handleDelete = useCallback(
    (item: InventoryItem) => {
      Alert.alert('삭제', `'${item.name}'을(를) 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => activeDelete(item.id),
        },
      ]);
    },
    [activeDelete]
  );

  const renderItem = useCallback(
    ({ item, index }: { item: InventoryItem; index: number }) => {
      const pantryMeta = item.metadata as Partial<PantryMetadata>;
      const suppMeta = item.metadata as Partial<SupplementMetadata>;
      const expiryLabel = formatExpiryDate(item.expiryDate);
      const expired = isExpired(item.expiryDate);
      const expiring = isExpiringSoon(item.expiryDate);

      return (
        <Animated.View
          entering={staggeredEntry(index)}
          style={[
            styles.itemCard,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderRadius: radii.lg,
              borderColor: expired
                ? status.error + '40'
                : expiring
                  ? status.warning + '40'
                  : colors.border,
              padding: spacing.md,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <View style={styles.itemHeader}>
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: typography.size.sm,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                }}
              >
                {item.name}
              </Text>
              {item.brand && (
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                    marginTop: spacing.xxs,
                  }}
                >
                  {item.brand}
                </Text>
              )}
            </View>
            <Pressable
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Trash2 size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* 메타 정보 */}
          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            {activeTab === 'pantry' && pantryMeta.storageType && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {getStorageLabel(pantryMeta.storageType)}
              </Text>
            )}
            {activeTab === 'pantry' && pantryMeta.quantity != null && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {pantryMeta.quantity}
                {pantryMeta.unit || '개'}
              </Text>
            )}
            {activeTab === 'supplement' && suppMeta.dosage && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: colors.mutedForeground,
                }}
              >
                {suppMeta.dosage} · {suppMeta.frequency || '매일'}
              </Text>
            )}
            {activeTab === 'supplement' && suppMeta.remainingServings != null && (
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color:
                    suppMeta.remainingServings <= 5
                      ? status.warning
                      : colors.mutedForeground,
                }}
              >
                잔여 {suppMeta.remainingServings}회분
              </Text>
            )}
          </View>

          {/* 유통기한 */}
          {expiryLabel && (
            <View
              style={[
                styles.expiryBadge,
                {
                  backgroundColor: expired
                    ? status.error + '20'
                    : expiring
                      ? status.warning + '20'
                      : colors.secondary,
                  borderRadius: radii.sm,
                  marginTop: spacing.xs,
                },
              ]}
            >
              <Clock
                size={12}
                color={
                  expired
                    ? status.error
                    : expiring
                      ? status.warning
                      : colors.mutedForeground
                }
              />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color: expired
                    ? status.error
                    : expiring
                      ? status.warning
                      : colors.mutedForeground,
                  marginLeft: spacing.xs,
                }}
              >
                {expiryLabel}
              </Text>
            </View>
          )}
        </Animated.View>
      );
    },
    [activeTab, colors, spacing, radii, typography, status, shadows, handleDelete]
  );

  const emptyIcon = activeTab === 'pantry' ? '🍎' : '💊';
  const emptyTitle = activeTab === 'pantry' ? '냉장고가 비어있어요' : '영양제가 없어요';
  const emptyDesc =
    activeTab === 'pantry'
      ? '식품을 추가하고 유통기한을 관리해보세요'
      : '영양제를 추가하고 복용을 관리해보세요';

  return (
    <ScreenContainer
      testID="pantry-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 탭 전환 */}
      <View
        style={[
          styles.tabRow,
          {
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === 'pantry' ? brand.primary : 'transparent',
              borderRadius: radii.md,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('pantry');
          }}
        >
          <Refrigerator
            size={16}
            color={
              activeTab === 'pantry'
                ? colors.overlayForeground
                : colors.mutedForeground
            }
          />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color:
                activeTab === 'pantry'
                  ? colors.overlayForeground
                  : colors.mutedForeground,
              marginLeft: spacing.xs,
            }}
          >
            냉장고
          </Text>
        </Pressable>
        <Pressable
          style={[
            styles.tab,
            {
              backgroundColor:
                activeTab === 'supplement' ? brand.primary : 'transparent',
              borderRadius: radii.md,
            },
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            setActiveTab('supplement');
          }}
        >
          <Pill
            size={16}
            color={
              activeTab === 'supplement'
                ? colors.overlayForeground
                : colors.mutedForeground
            }
          />
          <Text
            style={{
              fontSize: typography.size.sm,
              fontWeight: typography.weight.semibold,
              color:
                activeTab === 'supplement'
                  ? colors.overlayForeground
                  : colors.mutedForeground,
              marginLeft: spacing.xs,
            }}
          >
            영양제
          </Text>
        </Pressable>
        <View style={{ flex: 1 }} />
        {expiringCount > 0 && (
          <View style={styles.warningBadge}>
            <Clock size={14} color={status.warning} />
            <Text
              style={{
                fontSize: typography.size.xs,
                color: status.warning,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              }}
            >
              {expiringCount}
            </Text>
          </View>
        )}
        <Text
          style={{
            fontSize: typography.size.xs,
            color: colors.mutedForeground,
            marginLeft: spacing.sm,
          }}
        >
          {activeItems.length}개
        </Text>
      </View>

      {/* 보관 위치 필터 (팬트리 탭만) */}
      {activeTab === 'pantry' && (
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={STORAGE_FILTERS}
          keyExtractor={(f) => f.key}
          contentContainerStyle={{
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
          renderItem={({ item: f }) => (
            <Pressable
              style={[
                styles.filterChip,
                {
                  backgroundColor:
                    storageFilter === f.key ? brand.primary : colors.card,
                  borderColor:
                    storageFilter === f.key ? brand.primary : colors.border,
                  borderRadius: radii.full,
                },
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setStorageFilter(f.key);
              }}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color:
                    storageFilter === f.key
                      ? colors.overlayForeground
                      : colors.foreground,
                }}
              >
                {f.label}
              </Text>
            </Pressable>
          )}
        />
      )}

      {/* 목록 */}
      {activeLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{
            padding: spacing.md,
            paddingBottom: spacing.xxl,
            flexGrow: filteredItems.length === 0 ? 1 : undefined,
          }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={activeRefetch} />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>{emptyIcon}</Text>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                {emptyTitle}
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                {emptyDesc}
              </Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.smx,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: spacing.smx,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: spacing.sm,
  },
  itemCard: {
    borderWidth: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.smx,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
