/**
 * 코디 빌더 화면
 * 옷장에서 아이템을 직접 선택해서 코디 조합을 만들고 저장
 */
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Check, X, Save, ChevronDown, ChevronUp } from 'lucide-react-native';
import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';

import { ScreenContainer, SuccessCheckmark } from '@/components/ui';
import { useTheme, brand, typography, spacing, radii } from '../../lib/theme';
import { useCloset, useSavedOutfits } from '../../lib/inventory/useInventory';
import type {
  ClothingCategory,
  Season,
  Occasion,
  InventoryItem,
} from '../../lib/inventory/types';
import {
  CLOTHING_CATEGORY_LABELS,
  SEASON_LABELS,
  OCCASION_LABELS,
} from '../../lib/inventory/types';

const CATEGORY_ORDER: ClothingCategory[] = [
  'outer',
  'top',
  'bottom',
  'dress',
  'shoes',
  'bag',
  'accessory',
];

const CATEGORY_EMOJIS: Record<ClothingCategory, string> = {
  outer: '🧥',
  top: '👕',
  bottom: '👖',
  dress: '👗',
  shoes: '👟',
  bag: '👜',
  accessory: '💍',
};

export default function OutfitBuilderScreen(): React.JSX.Element {
  const { colors, isDark, typography } = useTheme();
  const router = useRouter();
  const { items, isLoading } = useCloset();
  const { saveOutfit } = useSavedOutfits();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedCategory, setExpandedCategory] = useState<ClothingCategory | null>('top');
  const [outfitName, setOutfitName] = useState('');
  const [occasion, setOccasion] = useState<Occasion>('casual');
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // 카테고리별 아이템 그룹
  const groupedItems = useMemo(() => {
    const groups: Record<ClothingCategory, InventoryItem[]> = {
      outer: [],
      top: [],
      bottom: [],
      dress: [],
      shoes: [],
      bag: [],
      accessory: [],
    };
    for (const item of items) {
      const cat = (item.subCategory || 'top') as ClothingCategory;
      if (groups[cat]) {
        groups[cat].push(item);
      }
    }
    return groups;
  }, [items]);

  // 선택된 아이템 목록
  const selectedItems = useMemo(
    () => items.filter((item) => selectedIds.has(item.id)),
    [items, selectedIds]
  );

  const toggleItem = useCallback(
    (id: string) => {
      Haptics.selectionAsync();
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    },
    []
  );

  const toggleCategory = useCallback((cat: ClothingCategory) => {
    setExpandedCategory((prev) => (prev === cat ? null : cat));
  }, []);

  const toggleSeason = useCallback((s: Season) => {
    setSeasons((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }, []);

  const handleSave = useCallback(async () => {
    if (selectedIds.size < 2) {
      Alert.alert('알림', '최소 2개 아이템을 선택해주세요.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const name =
      outfitName.trim() ||
      `${new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} 코디`;

    const result = await saveOutfit({
      name,
      description: null,
      itemIds: Array.from(selectedIds),
      collageImageUrl: null,
      occasion,
      season: seasons.length > 0 ? seasons : getCurrentSeasons(),
      wearCount: 0,
      lastWornAt: null,
    });

    setIsSaving(false);

    if (result) {
      setShowSuccess(true);
    } else {
      Alert.alert('오류', '코디 저장에 실패했어요.');
    }
  }, [selectedIds, outfitName, occasion, seasons, saveOutfit, router]);

  if (isLoading) {
    return (
      <ScreenContainer scrollable={false} contentPadding={0} testID="outfit-builder-screen">
        <View style={[styles.container, styles.center]}>
          <ActivityIndicator size="large" color={brand.primary} />
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            옷장을 불러오고 있어요...
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scrollable={false} contentPadding={0} testID="outfit-builder-screen">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 선택된 아이템 미리보기 */}
        {selectedItems.length > 0 && (
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              선택한 아이템 ({selectedItems.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.previewRow}>
                {selectedItems.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.previewItem}
                    onPress={() => toggleItem(item.id)}
                  >
                    {item.imageUrl ? (
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={styles.previewImage}
                        contentFit="cover"
                        transition={200}
                      />
                    ) : (
                      <View style={[styles.previewPlaceholder, { backgroundColor: colors.border }]}>
                        <Text style={styles.previewEmoji}>
                          {CATEGORY_EMOJIS[(item.subCategory || 'top') as ClothingCategory]}
                        </Text>
                      </View>
                    )}
                    <View style={[styles.removeIcon, { backgroundColor: colors.destructive }]}>
                      <X size={10} color={colors.overlayForeground} />
                    </View>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* 코디 이름 입력 */}
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>코디 이름</Text>
          <TextInput
            style={[styles.textInput, { color: colors.foreground, borderColor: colors.border }]}
            value={outfitName}
            onChangeText={setOutfitName}
            placeholder="예: 출근룩, 주말 나들이"
            placeholderTextColor={colors.muted}
          />
        </View>

        {/* 상황 선택 */}
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>상황</Text>
          <View style={styles.chipRow}>
            {(Object.keys(OCCASION_LABELS) as Occasion[]).map((o) => (
              <Pressable
                key={o}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      occasion === o ? brand.primary : isDark ? colors.card : colors.muted + '20',
                    borderColor: occasion === o ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => setOccasion(o)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: occasion === o ? brand.primaryForeground : colors.foreground },
                  ]}
                >
                  {OCCASION_LABELS[o]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 계절 선택 */}
        <View style={[styles.inputCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.inputLabel, { color: colors.foreground }]}>계절 (선택)</Text>
          <View style={styles.chipRow}>
            {(Object.keys(SEASON_LABELS) as Season[]).map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.chip,
                  {
                    backgroundColor:
                      seasons.includes(s) ? brand.primary : isDark ? colors.card : colors.muted + '20',
                    borderColor: seasons.includes(s) ? brand.primary : colors.border,
                  },
                ]}
                onPress={() => toggleSeason(s)}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: seasons.includes(s) ? brand.primaryForeground : colors.foreground },
                  ]}
                >
                  {SEASON_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 카테고리별 아이템 선택 */}
        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>아이템 선택</Text>
        {CATEGORY_ORDER.map((cat) => {
          const catItems = groupedItems[cat];
          if (catItems.length === 0) return null;
          const isExpanded = expandedCategory === cat;
          const selectedCount = catItems.filter((i) => selectedIds.has(i.id)).length;

          return (
            <View key={cat}>
              <Pressable
                style={[styles.categoryHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => toggleCategory(cat)}
              >
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                  <Text style={[styles.categoryName, { color: colors.foreground }]}>
                    {CLOTHING_CATEGORY_LABELS[cat]}
                  </Text>
                  <Text style={[styles.categoryCount, { color: colors.muted }]}>
                    {catItems.length}
                  </Text>
                  {selectedCount > 0 && (
                    <View style={[styles.selectedBadge, { backgroundColor: brand.primary }]}>
                      <Text style={[styles.selectedBadgeText, { color: brand.primaryForeground }]}>
                        {selectedCount}
                      </Text>
                    </View>
                  )}
                </View>
                {isExpanded ? (
                  <ChevronUp size={18} color={colors.muted} />
                ) : (
                  <ChevronDown size={18} color={colors.muted} />
                )}
              </Pressable>

              {isExpanded && (
                <View style={styles.itemGrid}>
                  {catItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                      <Pressable
                        key={item.id}
                        style={[
                          styles.itemCard,
                          {
                            backgroundColor: colors.card,
                            borderColor: isSelected ? brand.primary : colors.border,
                            borderWidth: isSelected ? 2 : 1,
                          },
                        ]}
                        onPress={() => toggleItem(item.id)}
                      >
                        {item.imageUrl ? (
                          <Image
                            source={{ uri: item.imageUrl }}
                            style={styles.itemImage}
                            contentFit="cover"
                            transition={200}
                          />
                        ) : (
                          <View style={[styles.itemPlaceholder, { backgroundColor: colors.border }]}>
                            <Text style={styles.itemPlaceholderEmoji}>{CATEGORY_EMOJIS[cat]}</Text>
                          </View>
                        )}
                        <Text
                          style={[styles.itemName, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </Text>
                        {isSelected && (
                          <View style={[styles.checkMark, { backgroundColor: brand.primary }]}>
                            <Check size={12} color={brand.primaryForeground} />
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* 저장 버튼 */}
      <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <Pressable
          style={[
            styles.saveButton,
            {
              backgroundColor: selectedIds.size >= 2 ? brand.primary : colors.muted,
            },
          ]}
          onPress={handleSave}
          disabled={isSaving || selectedIds.size < 2}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={brand.primaryForeground} />
          ) : (
            <>
              <Save size={18} color={brand.primaryForeground} />
              <Text style={[styles.saveButtonText, { color: brand.primaryForeground }]}>
                코디 저장 ({selectedIds.size}개)
              </Text>
            </>
          )}
        </Pressable>
      </View>

      {/* 저장 완료 애니메이션 */}
      {showSuccess && (
        <View style={[styles.successOverlay]}>
          <SuccessCheckmark visible size={80} onComplete={() => router.back()} />
        </View>
      )}
    </ScreenContainer>
  );
}

function getCurrentSeasons(): Season[] {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return ['spring'];
  if (month >= 5 && month <= 7) return ['summer'];
  if (month >= 8 && month <= 10) return ['autumn'];
  return ['winter'];
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  loadingText: {
    fontSize: typography.size.sm,
    marginTop: spacing.sm,
  },
  // 미리보기
  previewCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.sm,
  },
  previewRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  previewItem: {
    position: 'relative',
  },
  previewImage: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
  },
  previewPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewEmoji: {
    fontSize: typography.size['2xl'],
  },
  removeIcon: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 입력 카드
  inputCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.xs,
  },
  textInput: {
    fontSize: typography.size.base,
    borderWidth: 1,
    borderRadius: radii.xl,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
  },
  // 카테고리
  sectionHeader: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.xs,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryEmoji: {
    fontSize: typography.size.lg,
  },
  categoryName: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  categoryCount: {
    fontSize: typography.size.xs,
  },
  selectedBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  selectedBadgeText: {
    fontSize: 11,
    fontWeight: typography.weight.bold,
  },
  // 아이템 그리드
  itemGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.sm,
  },
  itemCard: {
    width: '30%',
    borderRadius: radii.xl,
    overflow: 'hidden',
    position: 'relative',
  },
  itemImage: {
    width: '100%',
    aspectRatio: 1,
  },
  itemPlaceholder: {
    width: '100%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemPlaceholderEmoji: {
    fontSize: 28,
  },
  itemName: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.medium,
    padding: 6,
  },
  checkMark: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 푸터
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
  },
  saveButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
});
