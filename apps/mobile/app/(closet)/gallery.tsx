/**
 * 스타일 갤러리 화면
 *
 * 옷장 아이템을 그리드 형태로 탐색.
 * - 카테고리 필터 (상의, 하의, 아우터, 신발, 가방, 액세서리)
 * - 색상 필터
 * - 그리드/리스트 뷰 전환
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Grid3X3, List, Shirt, Search } from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { useTheme } from '@/lib/theme';
import { staggeredEntry } from '@/lib/animations';
import { ScreenContainer } from '../../components/ui';
import { useClerkSupabaseClient } from '@/lib/supabase';
import { closetLogger } from '../../lib/utils/logger';

interface ClosetItem {
  id: string;
  name: string;
  category: string;
  subCategory: string | null;
  imageUrl: string | null;
  brand: string | null;
  color: string | null;
  isFavorite: boolean;
}

const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'top', label: '상의' },
  { id: 'bottom', label: '하의' },
  { id: 'outer', label: '아우터' },
  { id: 'shoes', label: '신발' },
  { id: 'bag', label: '가방' },
  { id: 'accessory', label: '액세서리' },
];

type ViewMode = 'grid' | 'list';

export default function StyleGalleryScreen(): React.JSX.Element {
  const { colors, spacing, radii, typography, brand, shadows } = useTheme();
  const supabase = useClerkSupabaseClient();

  const [items, setItems] = useState<ClosetItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('inventory_items')
        .select('id, name, category, sub_category, image_url, brand, tags, is_favorite, metadata')
        .eq('category', 'closet')
        .order('created_at', { ascending: false });

      if (selectedCategory !== 'all') {
        query = query.eq('sub_category', selectedCategory);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        closetLogger.error('Gallery fetch failed:', error);
        setItems([]);
        return;
      }

      const mapped: ClosetItem[] = (data ?? []).map((item) => {
        const meta = (item.metadata ?? {}) as Record<string, unknown>;
        return {
          id: item.id,
          name: item.name,
          category: item.category,
          subCategory: item.sub_category,
          imageUrl: item.image_url,
          brand: item.brand,
          color: typeof meta.color === 'string' ? meta.color : null,
          isFavorite: item.is_favorite ?? false,
        };
      });

      setItems(mapped);
    } catch (err) {
      closetLogger.error('Gallery load error:', err);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, selectedCategory]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 검색 필터
  const filteredItems = searchQuery.trim()
    ? items.filter(
        (item) =>
          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : items;

  const handleItemPress = useCallback((itemId: string) => {
    Haptics.selectionAsync();
    router.push({ pathname: '/(closet)/[id]', params: { id: itemId } });
  }, []);

  const renderGridItem = useCallback(
    ({ item }: { item: ClosetItem }) => (
      <Pressable
        style={[
          styles.gridItem,
          shadows.card,
          {
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
          },
        ]}
        onPress={() => handleItemPress(item.id)}

      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.gridImage, { borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View
            style={[
              styles.gridImage,
              styles.gridPlaceholder,
              { backgroundColor: colors.muted, borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
            ]}
          >
            <Shirt size={32} color={colors.mutedForeground} />
          </View>
        )}
        <View style={{ padding: spacing.sm }}>
          <Text
            numberOfLines={1}
            style={{ fontSize: typography.size.xs, fontWeight: '600', color: colors.foreground }}
          >
            {item.name}
          </Text>
          {item.brand && (
            <Text
              numberOfLines={1}
              style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 1 }}
            >
              {item.brand}
            </Text>
          )}
        </View>
        {item.isFavorite && (
          <View style={styles.favBadge}>
            <Text style={{ fontSize: 10 }}>{'\u2764\uFE0F'}</Text>
          </View>
        )}
      </Pressable>
    ),
    [colors, radii, shadows, spacing, typography, handleItemPress]
  );

  const renderListItem = useCallback(
    ({ item }: { item: ClosetItem }) => (
      <Pressable
        style={[
          shadows.card,
          {
            backgroundColor: colors.card,
            borderRadius: radii.lg,
            borderWidth: 1,
            borderColor: colors.border,
            padding: spacing.sm,
            marginBottom: spacing.sm,
            flexDirection: 'row',
            alignItems: 'center',
          },
        ]}
        onPress={() => handleItemPress(item.id)}

      >
        {item.imageUrl ? (
          <Image
            source={{ uri: item.imageUrl }}
            style={[styles.listImage, { borderRadius: radii.md }]}
            contentFit="cover"
            transition={200}
          />
        ) : (
          <View style={[styles.listImage, styles.listPlaceholder, { backgroundColor: colors.muted, borderRadius: radii.md }]}>
            <Shirt size={20} color={colors.mutedForeground} />
          </View>
        )}
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text numberOfLines={1} style={{ fontSize: typography.size.sm, fontWeight: '600', color: colors.foreground }}>
            {item.name}
          </Text>
          <Text style={{ fontSize: typography.size.xs, color: colors.mutedForeground, marginTop: 2 }}>
            {item.brand ?? '브랜드 미지정'} {item.color ? `· ${item.color}` : ''}
          </Text>
        </View>
        {item.isFavorite && <Text style={{ fontSize: 14 }}>{'\u2764\uFE0F'}</Text>}
      </Pressable>
    ),
    [colors, radii, shadows, spacing, typography, handleItemPress]
  );

  return (
    <ScreenContainer
      testID="style-gallery-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 검색바 */}
      <Animated.View
        entering={staggeredEntry(0)}
        style={{ paddingHorizontal: spacing.md, paddingTop: spacing.sm }}
      >
        <View
          style={[
            styles.searchRow,
            {
              backgroundColor: colors.secondary,
              borderRadius: radii.lg,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Search size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontSize: typography.size.sm }]}
            placeholder="아이템 검색"
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {/* 뷰모드 토글 */}
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setViewMode((v) => (v === 'grid' ? 'list' : 'grid'));
            }}
          >
            {viewMode === 'grid' ? (
              <List size={20} color={colors.mutedForeground} />
            ) : (
              <Grid3X3 size={20} color={colors.mutedForeground} />
            )}
          </Pressable>
        </View>
      </Animated.View>

      {/* 카테고리 필터 */}
      <Animated.View entering={staggeredEntry(1)}>
        <FlatList
          horizontal
          data={CATEGORIES}
          keyExtractor={(c) => c.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs }}
          renderItem={({ item: cat }) => {
            const isActive = cat.id === selectedCategory;
            return (
              <Pressable
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isActive ? brand.primary : colors.secondary,
                    borderRadius: radii.full,
                    paddingHorizontal: spacing.md,
                    paddingVertical: spacing.xs,
                  },
                ]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setSelectedCategory(cat.id);
                }}
              >
                <Text
                  style={{
                    fontSize: typography.size.xs,
                    fontWeight: '600',
                    color: isActive ? brand.primaryForeground : colors.mutedForeground,
                  }}
                >
                  {cat.label}
                </Text>
              </Pressable>
            );
          }}
        />
      </Animated.View>

      {/* 아이템 목록 */}
      {isLoading ? (
        <View style={styles.centerFull}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.centerFull}>
          <Shirt size={48} color={colors.mutedForeground} />
          <Text
            style={{
              fontSize: typography.size.base,
              fontWeight: '600',
              color: colors.foreground,
              marginTop: spacing.md,
            }}
          >
            아이템이 없어요
          </Text>
          <Text
            style={{
              fontSize: typography.size.sm,
              color: colors.mutedForeground,
              marginTop: spacing.xs,
              textAlign: 'center',
            }}
          >
            옷장에 아이템을 추가해보세요
          </Text>
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.sm, paddingHorizontal: spacing.md }}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.xxl }}
          renderItem={renderGridItem}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xxl }}
          renderItem={renderListItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    height: 44,
  },
  filterChip: {},
  centerFull: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItem: {
    flex: 1,
    maxWidth: '49%',
    overflow: 'hidden',
  },
  gridImage: {
    width: '100%',
    aspectRatio: 1,
  },
  gridPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listImage: {
    width: 56,
    height: 56,
  },
  listPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
});
