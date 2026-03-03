/**
 * 제품 검색 화면
 * 제품명/브랜드 검색
 */
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTheme, typography, radii , spacing } from '@/lib/theme';
import { ScreenContainer } from '../../components/ui';

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  matchScore: number;
}

// Mock 제품 데이터
const ALL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '수분 크림 리치',
    brand: '아이오페',
    category: 'skincare',
    price: 35000,
    rating: 4.5,
    reviewCount: 120,
    matchScore: 92,
  },
  {
    id: '2',
    name: '톤업 선크림 SPF50+',
    brand: '라운드랩',
    category: 'skincare',
    price: 18000,
    rating: 4.7,
    reviewCount: 89,
    matchScore: 88,
  },
  {
    id: '3',
    name: '코랄 립스틱',
    brand: '롬앤',
    category: 'makeup',
    price: 12000,
    rating: 4.8,
    reviewCount: 256,
    matchScore: 95,
  },
  {
    id: '4',
    name: '아이브로우 펜슬',
    brand: '에뛰드',
    category: 'makeup',
    price: 8000,
    rating: 4.3,
    reviewCount: 180,
    matchScore: 85,
  },
  {
    id: '5',
    name: '멀티비타민',
    brand: '센트룸',
    category: 'supplement',
    price: 28000,
    rating: 4.6,
    reviewCount: 340,
    matchScore: 90,
  },
  {
    id: '6',
    name: '오메가3',
    brand: '뉴트리원',
    category: 'supplement',
    price: 32000,
    rating: 4.4,
    reviewCount: 210,
    matchScore: 87,
  },
  {
    id: '7',
    name: '요가매트 6mm',
    brand: '만두카',
    category: 'equipment',
    price: 45000,
    rating: 4.9,
    reviewCount: 78,
    matchScore: 82,
  },
  {
    id: '8',
    name: '덤벨 세트 5kg',
    brand: '나이키',
    category: 'equipment',
    price: 55000,
    rating: 4.5,
    reviewCount: 92,
    matchScore: 80,
  },
  {
    id: '9',
    name: '클렌징 폼',
    brand: '이니스프리',
    category: 'skincare',
    price: 12000,
    rating: 4.4,
    reviewCount: 320,
    matchScore: 86,
  },
  {
    id: '10',
    name: '수분 에센스',
    brand: '코스알엑스',
    category: 'skincare',
    price: 22000,
    rating: 4.6,
    reviewCount: 150,
    matchScore: 89,
  },
  {
    id: '11',
    name: '파운데이션',
    brand: '에스티로더',
    category: 'makeup',
    price: 65000,
    rating: 4.7,
    reviewCount: 95,
    matchScore: 91,
  },
  {
    id: '12',
    name: '비타민C',
    brand: '솔가',
    category: 'supplement',
    price: 25000,
    rating: 4.5,
    reviewCount: 280,
    matchScore: 88,
  },
];

// 인기 검색어
const POPULAR_SEARCHES = ['수분크림', '선크림', '립스틱', '비타민', '요가매트'];

// 최근 검색어 (실제로는 AsyncStorage에서 가져옴)
const RECENT_SEARCHES = ['아이오페', '롬앤 립스틱'];

export default function ProductSearchScreen() {
  const { colors, brand, status, typography, spacing, radii} = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // 검색 결과
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    setIsSearching(true);

    const query = searchQuery.toLowerCase();
    const results = ALL_PRODUCTS.filter(
      (product) =>
        product.name.toLowerCase().includes(query) || product.brand.toLowerCase().includes(query)
    );

    // 시뮬레이션된 딜레이 후 결과 표시
    setTimeout(() => setIsSearching(false), 200);

    return results;
  }, [searchQuery]);

  // 제품 선택
  const handleProductPress = (productId: string) => {
    Haptics.selectionAsync();
    router.push(`/products/${productId}`);
  };

  // 검색어 선택
  const handleSearchTermPress = (term: string) => {
    Haptics.selectionAsync();
    setSearchQuery(term);
  };

  // 검색어 삭제
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  // 카테고리 이모지
  const getCategoryEmoji = (category: string) => {
    switch (category) {
      case 'skincare':
        return '🧴';
      case 'makeup':
        return '💄';
      case 'supplement':
        return '💊';
      case 'equipment':
        return '🏋️';
      default:
        return '📦';
    }
  };

  return (
    <ScreenContainer
      testID="products-search-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      {/* 검색 바 */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchInputContainer,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="제품명 또는 브랜드 검색"
            placeholderTextColor={colors.mutedForeground}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={handleClearSearch}>
              <Text style={[styles.clearButton, { color: colors.mutedForeground }]}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {searchQuery.length === 0 ? (
          // 검색어 없을 때: 인기/최근 검색어
          <>
            {/* 최근 검색어 */}
            {RECENT_SEARCHES.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>최근 검색</Text>
                  <Pressable>
                    <Text style={[styles.clearAllText, { color: colors.mutedForeground }]}>
                      전체 삭제
                    </Text>
                  </Pressable>
                </View>
                <View style={styles.tagList}>
                  {RECENT_SEARCHES.map((term, index) => (
                    <Pressable
                      key={index}
                      style={[
                        styles.searchTag,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                      onPress={() => handleSearchTermPress(term)}
                    >
                      <Text style={styles.tagIcon}>🕐</Text>
                      <Text style={[styles.tagText, { color: colors.foreground }]}>{term}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 인기 검색어 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>인기 검색어</Text>
              <View style={styles.tagList}>
                {POPULAR_SEARCHES.map((term, index) => (
                  <Pressable
                    key={index}
                    style={[
                      styles.searchTag,
                      { backgroundColor: brand.primary + '10', borderColor: brand.primary + '20' },
                    ]}
                    onPress={() => handleSearchTermPress(term)}
                  >
                    <Text style={[styles.popularRank, { color: brand.primary }]}>{index + 1}</Text>
                    <Text style={[styles.tagText, { color: colors.foreground }]}>{term}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        ) : isSearching ? (
          // 검색 중
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color={brand.primary} />
          </View>
        ) : searchResults.length === 0 ? (
          // 검색 결과 없음
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              "{searchQuery}"에 대한 검색 결과가 없습니다
            </Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              다른 검색어를 입력해보세요
            </Text>
          </View>
        ) : (
          // 검색 결과
          <View style={styles.resultsSection}>
            <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
              {searchResults.length}개의 결과
            </Text>
            {searchResults.map((product) => (
              <Pressable
                key={product.id}
                style={[styles.productItem, { backgroundColor: colors.card }]}
                onPress={() => handleProductPress(product.id)}
              >
                <View style={[styles.productImagePlaceholder, { backgroundColor: colors.muted }]}>
                  <Text style={styles.productEmoji}>{getCategoryEmoji(product.category)}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productBrand, { color: colors.mutedForeground }]}>
                    {product.brand}
                  </Text>
                  <Text
                    style={[styles.productName, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {product.name}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={[styles.productRating, { color: status.warning }]}>
                      ★ {product.rating.toFixed(1)}
                    </Text>
                    <Text style={[styles.productReviews, { color: colors.mutedForeground }]}>
                      ({product.reviewCount})
                    </Text>
                  </View>
                  <Text style={[styles.productPrice, { color: colors.foreground }]}>
                    {formatPrice(product.price)}
                  </Text>
                </View>
                <View style={[styles.matchBadge, { backgroundColor: brand.primary }]}>
                  <Text style={[styles.matchBadgeText, { color: brand.primaryForeground }]}>
                    {product.matchScore}%
                  </Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: spacing.md,
    paddingBottom: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  searchIcon: {
    fontSize: typography.size.base,
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: typography.size.base,
  },
  clearButton: {
    fontSize: typography.size.base,
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.smx,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: spacing.smx,
  },
  clearAllText: {
    fontSize: 13,
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  searchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: spacing.smd,
    borderRadius: radii.circle,
    borderWidth: 1,
    gap: 6,
  },
  tagIcon: {
    fontSize: typography.size.xs,
  },
  popularRank: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.bold,
    marginRight: spacing.xxs,
  },
  tagText: {
    fontSize: typography.size.sm,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: typography.size.base,
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: typography.size.sm,
  },
  resultsSection: {
    padding: spacing.md,
  },
  resultCount: {
    fontSize: 13,
    marginBottom: spacing.smx,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radii.xl,
    padding: spacing.smx,
    marginBottom: spacing.sm,
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productEmoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.smx,
  },
  productBrand: {
    fontSize: typography.size.xs,
  },
  productName: {
    fontSize: 15,
    fontWeight: typography.weight.medium,
    marginTop: spacing.xxs,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  productRating: {
    fontSize: typography.size.xs,
  },
  productReviews: {
    fontSize: typography.size.xs,
    marginLeft: spacing.xs,
  },
  productPrice: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
    marginTop: spacing.xs,
  },
  matchBadge: {
    paddingHorizontal: spacing.smd,
    paddingVertical: 6,
    borderRadius: radii.xl,
  },
  matchBadgeText: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
  },
});
