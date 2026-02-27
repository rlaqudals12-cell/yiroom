/**
 * 저장된 코디 목록 화면
 * 코디 목록 + 상세 보기 + 착용 기록 + 삭제
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import {
  Plus,
  Shirt,
  Calendar,
  Trash2,
  CheckCircle,
} from 'lucide-react-native';
import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { ScreenContainer } from '@/components/ui';
import { useTheme, brand, typography, spacing, radii } from '../../lib/theme';
import { useSavedOutfits } from '../../lib/inventory/useInventory';
import { useCloset } from '../../lib/inventory/useInventory';
import type { SavedOutfit, InventoryItem, Season, Occasion } from '../../lib/inventory/types';
import { SEASON_LABELS, OCCASION_LABELS } from '../../lib/inventory/types';

export default function OutfitsScreen(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();
  const router = useRouter();
  const { outfits, isLoading, deleteOutfit, recordWear } = useSavedOutfits();
  const { items: closetItems } = useCloset();

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 아이템 ID → 아이템 객체 매핑
  const itemMap = useMemo(() => {
    const map = new Map<string, InventoryItem>();
    for (const item of closetItems) {
      map.set(item.id, item);
    }
    return map;
  }, [closetItems]);

  const handleDelete = useCallback(
    (outfit: SavedOutfit) => {
      Alert.alert(
        '코디 삭제',
        `"${outfit.name || '이름 없음'}"을(를) 삭제할까요?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              const ok = await deleteOutfit(outfit.id);
              if (ok) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    },
    [deleteOutfit]
  );

  const handleRecordWear = useCallback(
    async (outfit: SavedOutfit) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const ok = await recordWear(outfit.id);
      if (ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    },
    [recordWear]
  );

  const toggleExpand = useCallback((id: string) => {
    Haptics.selectionAsync();
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderOutfit = ({ item: outfit }: { item: SavedOutfit }): React.JSX.Element => {
    const isExpanded = expandedId === outfit.id;
    const outfitItems = outfit.itemIds
      .map((id) => itemMap.get(id))
      .filter(Boolean) as InventoryItem[];

    const dateStr = new Date(outfit.createdAt).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });

    return (
      <Pressable
        style={[
          styles.outfitCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => toggleExpand(outfit.id)}
        testID="outfit-card"
      >
        {/* 헤더 */}
        <View style={styles.outfitHeader}>
          <View style={styles.outfitInfo}>
            <Text style={[styles.outfitName, { color: colors.foreground }]} numberOfLines={1}>
              {outfit.name || '이름 없는 코디'}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.metaText, { color: colors.muted }]}>
                {dateStr}
              </Text>
              {outfit.occasion && (
                <View style={[styles.metaChip, { backgroundColor: isDark ? colors.card : colors.muted + '20' }]}>
                  <Text style={[styles.metaChipText, { color: colors.foreground }]}>
                    {OCCASION_LABELS[outfit.occasion as Occasion] || outfit.occasion}
                  </Text>
                </View>
              )}
              {outfit.season.length > 0 && (
                <Text style={[styles.metaText, { color: colors.muted }]}>
                  {outfit.season.map((s) => SEASON_LABELS[s as Season] || s).join('/')}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.wearBadge}>
            <Text style={[styles.wearCount, { color: colors.foreground }]}>
              {outfit.wearCount}
            </Text>
            <Text style={[styles.wearLabel, { color: colors.muted }]}>회</Text>
          </View>
        </View>

        {/* 아이템 미리보기 (항상 표시) */}
        <ScrollableItemPreview items={outfitItems} colors={colors} />

        {/* 확장 영역 */}
        {isExpanded && (
          <View style={[styles.expandedSection, { borderTopColor: colors.border }]}>
            {outfit.description && (
              <Text style={[styles.description, { color: colors.muted }]}>
                {outfit.description}
              </Text>
            )}

            {outfit.lastWornAt && (
              <View style={styles.lastWornRow}>
                <Calendar size={14} color={colors.muted} />
                <Text style={[styles.lastWornText, { color: colors.muted }]}>
                  마지막 착용:{' '}
                  {new Date(outfit.lastWornAt).toLocaleDateString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
            )}

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: brand.primary }]}
                onPress={() => handleRecordWear(outfit)}
              >
                <CheckCircle size={16} color={brand.primaryForeground} />
                <Text style={[styles.actionBtnText, { color: brand.primaryForeground }]}>
                  오늘 입었어요
                </Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.destructive + '15' }]}
                onPress={() => handleDelete(outfit)}
              >
                <Trash2 size={16} color={colors.destructive} />
                <Text style={[styles.actionBtnText, { color: colors.destructive }]}>삭제</Text>
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    );
  };

  const renderEmpty = (): React.JSX.Element => (
    <View style={styles.emptyContainer}>
      <Shirt size={48} color={colors.muted} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        아직 저장된 코디가 없어요
      </Text>
      <Text style={[styles.emptyDesc, { color: colors.muted }]}>
        코디 빌더에서 직접 만들거나{'\n'}추천 코디를 저장해보세요
      </Text>
      <Pressable
        style={[styles.emptyBtn, { backgroundColor: brand.primary }]}
        onPress={() => router.push('/(closet)/outfit-builder')}
      >
        <Plus size={18} color={brand.primaryForeground} />
        <Text style={[styles.emptyBtnText, { color: brand.primaryForeground }]}>
          코디 만들기
        </Text>
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} contentPadding={0} testID="outfits-screen">
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="outfits-screen">
      <FlatList
        data={outfits}
        keyExtractor={(item) => item.id}
        renderItem={renderOutfit}
        ListEmptyComponent={renderEmpty}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={styles.listContent}
      />

      {/* 새 코디 만들기 FAB */}
      {outfits.length > 0 && (
        <Pressable
          style={[styles.fab, { backgroundColor: brand.primary }]}
          onPress={() => router.push('/(closet)/outfit-builder')}
        >
          <Plus size={24} color={brand.primaryForeground} />
        </Pressable>
      )}
    </ScreenContainer>
  );
}

// 아이템 미리보기 컴포넌트 (가로 스크롤)
function ScrollableItemPreview({
  items,
  colors,
}: {
  items: InventoryItem[];
  colors: { border: string; muted: string };
}): React.JSX.Element {
  if (items.length === 0) {
    return (
      <Text style={[styles.noItemsText, { color: colors.muted }]}>
        아이템 정보 없음
      </Text>
    );
  }

  return (
    <View style={styles.previewStrip}>
      {items.slice(0, 6).map((item) => (
        <View key={item.id} style={styles.previewThumb}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.thumbImage}
              contentFit="cover"
              transition={200}
            />
          ) : (
            <View style={[styles.thumbPlaceholder, { backgroundColor: colors.border }]}>
              <Text style={styles.thumbEmoji}>👕</Text>
            </View>
          )}
        </View>
      ))}
      {items.length > 6 && (
        <View style={[styles.moreIndicator, { backgroundColor: colors.border }]}>
          <Text style={[styles.moreText, { color: colors.muted }]}>+{items.length - 6}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  // 코디 카드
  outfitCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  outfitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  outfitInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  outfitName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: typography.size.xs,
  },
  metaChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.full,
  },
  metaChipText: {
    fontSize: typography.size.xs,
  },
  wearBadge: {
    alignItems: 'center',
  },
  wearCount: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.bold,
  },
  wearLabel: {
    fontSize: typography.size.xs,
  },
  // 미리보기
  previewStrip: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  previewThumb: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    overflow: 'hidden',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  thumbPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbEmoji: {
    fontSize: typography.size.lg,
  },
  moreIndicator: {
    width: 44,
    height: 44,
    borderRadius: radii.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
  noItemsText: {
    fontSize: typography.size.xs,
  },
  // 확장 영역
  expandedSection: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
  },
  description: {
    fontSize: typography.size.sm,
    marginBottom: spacing.sm,
    lineHeight: 20,
  },
  lastWornRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  lastWornText: {
    fontSize: typography.size.xs,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
  },
  actionBtnText: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
  },
  // 빈 상태
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    fontSize: typography.size.base,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  emptyBtnText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
