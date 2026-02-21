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
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTheme } from '@/lib/theme';

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
  const { colors, isDark } = useTheme();

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
    <SafeAreaView style={[styles.container, isDark && styles.containerDark]} edges={['bottom']}>
      {/* 검색 바 */}
      <View style={styles.searchSection}>
        <View style={[styles.searchInputContainer, isDark && styles.searchInputContainerDark]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="제품명 또는 브랜드 검색"
            placeholderTextColor={isDark ? '#666' : '#999'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch}>
              <Text style={styles.clearButton}>✕</Text>
            </TouchableOpacity>
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
                  <Text style={[styles.sectionTitle, isDark && styles.textLight]}>최근 검색</Text>
                  <TouchableOpacity>
                    <Text style={[styles.clearAllText, isDark && styles.textMuted]}>전체 삭제</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.tagList}>
                  {RECENT_SEARCHES.map((term, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[styles.searchTag, isDark && styles.searchTagDark]}
                      onPress={() => handleSearchTermPress(term)}
                    >
                      <Text style={styles.tagIcon}>🕐</Text>
                      <Text style={[styles.tagText, isDark && styles.textLight]}>{term}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* 인기 검색어 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, isDark && styles.textLight]}>인기 검색어</Text>
              <View style={styles.tagList}>
                {POPULAR_SEARCHES.map((term, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.searchTag, styles.popularTag, isDark && styles.popularTagDark]}
                    onPress={() => handleSearchTermPress(term)}
                  >
                    <Text style={styles.popularRank}>{index + 1}</Text>
                    <Text style={[styles.tagText, isDark && styles.textLight]}>{term}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        ) : isSearching ? (
          // 검색 중
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#8b5cf6" />
          </View>
        ) : searchResults.length === 0 ? (
          // 검색 결과 없음
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyText, isDark && styles.textMuted]}>
              "{searchQuery}"에 대한 검색 결과가 없습니다
            </Text>
            <Text style={[styles.emptyHint, isDark && styles.textMuted]}>
              다른 검색어를 입력해보세요
            </Text>
          </View>
        ) : (
          // 검색 결과
          <View style={styles.resultsSection}>
            <Text style={[styles.resultCount, isDark && styles.textMuted]}>
              {searchResults.length}개의 결과
            </Text>
            {searchResults.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productItem, isDark && styles.productItemDark]}
                onPress={() => handleProductPress(product.id)}
              >
                <View style={[styles.productImagePlaceholder, isDark && styles.placeholderDark]}>
                  <Text style={styles.productEmoji}>{getCategoryEmoji(product.category)}</Text>
                </View>
                <View style={styles.productInfo}>
                  <Text style={[styles.productBrand, isDark && styles.textMuted]}>
                    {product.brand}
                  </Text>
                  <Text style={[styles.productName, isDark && styles.textLight]} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <View style={styles.productMeta}>
                    <Text style={styles.productRating}>★ {product.rating.toFixed(1)}</Text>
                    <Text style={[styles.productReviews, isDark && styles.textMuted]}>
                      ({product.reviewCount})
                    </Text>
                  </View>
                  <Text style={[styles.productPrice, isDark && styles.textLight]}>
                    {formatPrice(product.price)}
                  </Text>
                </View>
                <View style={styles.matchBadge}>
                  <Text style={styles.matchBadgeText}>{product.matchScore}%</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  containerDark: {
    backgroundColor: '#0a0a0a',
  },
  searchSection: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInputContainerDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111',
  },
  searchInputDark: {
    color: '#fff',
  },
  clearButton: {
    fontSize: 16,
    color: '#999',
    padding: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
  },
  clearAllText: {
    fontSize: 13,
    color: '#666',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    gap: 6,
  },
  searchTagDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  popularTag: {
    backgroundColor: '#f5f3ff',
    borderColor: '#e9e5ff',
  },
  popularTagDark: {
    backgroundColor: '#1a1a2e',
    borderColor: '#2a2a4e',
  },
  tagIcon: {
    fontSize: 12,
  },
  popularRank: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
    marginRight: 2,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
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
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    color: '#999',
  },
  resultsSection: {
    padding: 16,
  },
  resultCount: {
    fontSize: 13,
    color: '#666',
    marginBottom: 12,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  productItemDark: {
    backgroundColor: '#1a1a1a',
  },
  productImagePlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#2a2a2a',
  },
  productEmoji: {
    fontSize: 28,
  },
  productInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productBrand: {
    fontSize: 12,
    color: '#666',
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111',
    marginTop: 2,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  productRating: {
    fontSize: 12,
    color: '#f59e0b',
  },
  productReviews: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
    marginTop: 4,
  },
  matchBadge: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
