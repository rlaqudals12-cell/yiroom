/**
 * 뷰티 인벤토리 화면 (내 화장대)
 *
 * 사용자의 뷰티 제품 관리.
 * useInventory('beauty') 훅 활용.
 * - 제품 목록 (카테고리별 필터)
 * - 제품 추가 (바코드 / 수동)
 * - 유통기한 관리
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Plus, Scan, Heart, Clock, Package } from 'lucide-react-native';
import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { BottomSheet, GlassCard, ScreenContainer } from '../../components/ui';

import { TIMING, staggeredEntry } from '@/lib/animations';
import { useInventory, type InventoryItem, type BeautyMetadata } from '@/lib/inventory';
import { useTheme, typography, spacing } from '@/lib/theme';

// 뷰티 서브 카테고리 필터
const BEAUTY_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'skincare', label: '스킨케어' },
  { key: 'makeup', label: '메이크업' },
  { key: 'haircare', label: '헤어케어' },
  { key: 'bodycare', label: '바디케어' },
  { key: 'suncare', label: '선케어' },
  { key: 'tool', label: '도구' },
];

// 유통기한 임박 여부 (30일 이내)
function isExpiringSoon(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  const diff = new Date(expiryDate).getTime() - Date.now();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
}

function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false;
  return new Date(expiryDate).getTime() < Date.now();
}

function formatExpiryLabel(expiryDate: string | null): string | null {
  if (!expiryDate) return null;
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff < 0) return '유통기한 만료';
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000));
  if (days <= 30) return `${days}일 남음`;
  return null;
}

export default function BeautyInventoryScreen(): React.JSX.Element {
  const { colors, radii, brand, status, shadows } = useTheme();
  const { items, isLoading, refetch, deleteItem, toggleFavorite, addItem } = useInventory('beauty');

  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductBrand, setNewProductBrand] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('skincare');

  // 필터링
  const filteredItems =
    selectedFilter === 'all' ? items : items.filter((item) => item.subCategory === selectedFilter);

  // 유통기한 임박 제품 수
  const expiringCount = items.filter(
    (i) => isExpiringSoon(i.expiryDate) || isExpired(i.expiryDate)
  ).length;

  const handleDelete = useCallback(
    (item: InventoryItem) => {
      Alert.alert('제품 삭제', `'${item.name}'을(를) 삭제할까요?`, [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteItem(item.id),
        },
      ]);
    },
    [deleteItem]
  );

  const handleToggleFavorite = useCallback(
    (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleFavorite(id);
    },
    [toggleFavorite]
  );

  const handleAddProduct = useCallback(async () => {
    if (!newProductName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await addItem({
      category: 'beauty',
      subCategory: newProductCategory,
      name: newProductName.trim(),
      brand: newProductBrand.trim() || null,
      imageUrl: '',
      originalImageUrl: null,
      tags: [],
      isFavorite: false,
      useCount: 0,
      lastUsedAt: null,
      expiryDate: null,
      metadata: {},
    });
    setNewProductName('');
    setNewProductBrand('');
    setNewProductCategory('skincare');
    setShowAddModal(false);
  }, [addItem, newProductName, newProductBrand, newProductCategory]);

  const renderItem = useCallback(
    ({ item, index }: { item: InventoryItem; index: number }) => {
      const meta = item.metadata as Partial<BeautyMetadata>;
      const expiryLabel = formatExpiryLabel(item.expiryDate);
      const expired = isExpired(item.expiryDate);

      return (
        <Animated.View
          entering={staggeredEntry(index)}
          style={[
            styles.itemCard,
            shadows.card,
            {
              backgroundColor: colors.card,
              borderRadius: radii.xl,
              borderColor: expired ? status.error + '40' : colors.border,
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
              onPress={() => handleToggleFavorite(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={item.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
            >
              <Heart
                size={18}
                color={item.isFavorite ? status.error : colors.mutedForeground}
                fill={item.isFavorite ? status.error : 'none'}
              />
            </Pressable>
          </View>

          {/* 메타데이터 */}
          <View style={[styles.metaRow, { marginTop: spacing.xs }]}>
            {meta.productType && (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                  }}
                >
                  {meta.productType}
                </Text>
              </View>
            )}
            {meta.volume && (
              <View
                style={[
                  styles.metaChip,
                  {
                    backgroundColor: colors.secondary,
                    borderRadius: radii.sm,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    color: colors.mutedForeground,
                  }}
                >
                  {meta.volume}
                </Text>
              </View>
            )}
          </View>

          {/* 유통기한 경고 */}
          {expiryLabel && (
            <View
              style={[
                styles.expiryBadge,
                {
                  backgroundColor: expired ? status.error + '20' : status.warning + '20',
                  borderRadius: radii.sm,
                  marginTop: spacing.xs,
                },
              ]}
            >
              <Clock size={12} color={expired ? status.error : status.warning} />
              <Text
                style={{
                  fontSize: typography.size.xs,
                  fontWeight: typography.weight.semibold,
                  color: expired ? status.error : status.warning,
                  marginLeft: spacing.xs,
                }}
              >
                {expiryLabel}
              </Text>
            </View>
          )}

          {/* 사용 횟수 + 삭제 */}
          <View style={[styles.itemFooter, { marginTop: spacing.xs }]}>
            <Text
              style={{
                fontSize: typography.size.xs,
                color: colors.mutedForeground,
              }}
            >
              사용 {item.useCount}회
            </Text>
            <Pressable
              onPress={() => handleDelete(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name} 삭제`}
            >
              <Text
                style={{
                  fontSize: typography.size.xs,
                  color: status.error,
                }}
              >
                삭제
              </Text>
            </Pressable>
          </View>
        </Animated.View>
      );
    },
    [colors, spacing, radii, typography, status, shadows, handleToggleFavorite, handleDelete]
  );

  return (
    <ScreenContainer
      testID="beauty-inventory-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
      backgroundGradient="beauty"
    >
      {/* 헤더 요약 */}
      <Animated.View entering={FadeInUp.duration(TIMING.normal)}>
        <GlassCard
          shadowSize="md"
          style={{
            ...styles.summaryRow,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          }}
        >
          <View style={styles.summaryItem}>
            <Package size={16} color={brand.primary} />
            <Text
              style={{
                fontSize: typography.size.sm,
                color: colors.foreground,
                fontWeight: typography.weight.semibold,
                marginLeft: spacing.xs,
              }}
            >
              {items.length}개
            </Text>
          </View>
          {expiringCount > 0 && (
            <View style={styles.summaryItem}>
              <Clock size={16} color={status.warning} />
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: status.warning,
                  fontWeight: typography.weight.semibold,
                  marginLeft: spacing.xs,
                }}
              >
                기한 임박 {expiringCount}개
              </Text>
            </View>
          )}
        </GlassCard>
      </Animated.View>

      {/* 필터 */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={BEAUTY_FILTERS}
        keyExtractor={(f) => f.key}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
        renderItem={({ item: f }) => (
          <Pressable
            style={[
              styles.filterChip,
              {
                backgroundColor: selectedFilter === f.key ? brand.primary : colors.card,
                borderColor: selectedFilter === f.key ? brand.primary : colors.border,
                borderRadius: radii.full,
              },
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedFilter(f.key);
            }}
            accessibilityRole="tab"
            accessibilityLabel={f.label + ' 필터'}
            accessibilityState={{ selected: selectedFilter === f.key }}
          >
            <Text
              style={{
                fontSize: typography.size.xs,
                fontWeight: typography.weight.semibold,
                color: selectedFilter === f.key ? colors.overlayForeground : colors.foreground,
              }}
            >
              {f.label}
            </Text>
          </Pressable>
        )}
      />

      {/* 목록 */}
      {isLoading ? (
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
          refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={{ fontSize: 48, marginBottom: spacing.md }}>💄</Text>
              <Text
                style={{
                  fontSize: typography.size.base,
                  fontWeight: typography.weight.semibold,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                }}
              >
                화장대가 비어있어요
              </Text>
              <Text
                style={{
                  fontSize: typography.size.sm,
                  color: colors.mutedForeground,
                  textAlign: 'center',
                }}
              >
                바코드 스캔이나 수동 입력으로{'\n'}제품을 추가해보세요
              </Text>
            </View>
          }
        />
      )}

      {/* FAB 버튼들 */}
      <View style={[styles.fabContainer, { bottom: spacing.lg, right: spacing.md }]}>
        {/* 바코드 스캔 */}
        <Pressable
          style={[
            styles.fabSmall,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              marginBottom: spacing.sm,
            },
            shadows.card,
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/(inventory)/barcode-scan');
          }}
          testID="barcode-scan-fab"
          accessibilityRole="button"
          accessibilityLabel="바코드 스캔"
        >
          <Scan size={20} color={brand.primary} />
        </Pressable>

        {/* 수동 추가 */}
        <Pressable
          style={[styles.fabMain, { backgroundColor: brand.primary }, shadows.card]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowAddModal(true);
          }}
          testID="add-product-fab"
          accessibilityRole="button"
          accessibilityLabel="제품 추가"
        >
          <Plus size={24} color={colors.overlayForeground} />
        </Pressable>
      </View>

      {/* 수동 추가 BottomSheet */}
      <BottomSheet
        isVisible={showAddModal}
        onClose={() => setShowAddModal(false)}
        snapPoints={['60%']}
        title="제품 추가"
        testID="add-product-sheet"
      >
        <View style={[styles.sheetContent, { padding: spacing.md, gap: spacing.md }]}>
          <View>
            <Text
              style={[
                styles.fieldLabel,
                {
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              제품명 *
            </Text>
            <TextInput
              style={[
                styles.addInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              placeholder="예: 토너, 크림, 세럼..."
              placeholderTextColor={colors.mutedForeground}
              value={newProductName}
              onChangeText={setNewProductName}
              accessibilityLabel="제품명 입력"
            />
          </View>

          <View>
            <Text
              style={[
                styles.fieldLabel,
                {
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              브랜드 (선택)
            </Text>
            <TextInput
              style={[
                styles.addInput,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderRadius: radii.xl,
                  color: colors.foreground,
                  fontSize: typography.size.sm,
                  paddingHorizontal: spacing.md,
                },
              ]}
              placeholder="브랜드명"
              placeholderTextColor={colors.mutedForeground}
              value={newProductBrand}
              onChangeText={setNewProductBrand}
              accessibilityLabel="브랜드 입력"
            />
          </View>

          <View>
            <Text
              style={[
                styles.fieldLabel,
                {
                  fontSize: typography.size.sm,
                  color: colors.foreground,
                  marginBottom: spacing.xs,
                },
              ]}
            >
              카테고리
            </Text>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={BEAUTY_FILTERS.filter((f) => f.key !== 'all')}
              keyExtractor={(f) => f.key}
              renderItem={({ item: f }) => {
                const isSelected = newProductCategory === f.key;
                return (
                  <Pressable
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: isSelected ? brand.primary : colors.card,
                        borderColor: isSelected ? brand.primary : colors.border,
                        borderRadius: radii.full,
                      },
                    ]}
                    onPress={() => setNewProductCategory(f.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          fontSize: typography.size.xs,
                          color: isSelected ? colors.overlayForeground : colors.foreground,
                        },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </View>

          <Pressable
            style={[
              styles.submitButton,
              {
                backgroundColor: newProductName.trim() ? brand.primary : colors.secondary,
                borderRadius: radii.xl,
                paddingVertical: spacing.md,
                marginTop: spacing.sm,
              },
            ]}
            onPress={handleAddProduct}
            disabled={!newProductName.trim()}
            accessibilityRole="button"
            accessibilityLabel="제품 추가하기"
          >
            <Text
              style={[
                styles.submitText,
                {
                  fontSize: typography.size.base,
                  color: newProductName.trim() ? colors.overlayForeground : colors.mutedForeground,
                },
              ]}
            >
              추가하기
            </Text>
          </Pressable>
        </View>
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryItem: {
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
    flexWrap: 'wrap',
    gap: 6,
  },
  metaChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    alignItems: 'center',
  },
  fabSmall: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  fabMain: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addInput: {
    borderWidth: 1,
    height: 44,
  },
  sheetContent: {},
  fieldLabel: {
    fontWeight: '600' as const,
  },
  chipText: {
    fontWeight: '600' as const,
  },
  submitButton: {
    alignItems: 'center' as const,
  },
  submitText: {
    fontWeight: '600' as const,
  },
});
