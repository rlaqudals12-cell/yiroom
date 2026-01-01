/**
 * 제품 추천 리스트 화면
 * 분석 결과 기반 맞춤 제품 추천
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useColorScheme,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useClerkSupabaseClient } from '../../lib/supabase';

// 카테고리
const CATEGORIES = [
  { id: 'all', label: '전체' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'supplement', label: '영양제' },
  { id: 'equipment', label: '운동용품' },
];

interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  rating: number;
  reviewCount: number;
  imageUrl: string;
  matchScore: number;
  tags: string[];
}

// Mock 제품 데이터
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: '수분 크림 리치',
    brand: '아이오페',
    category: 'skincare',
    price: 35000,
    rating: 4.5,
    reviewCount: 120,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 92,
    tags: ['건성', '보습', '히알루론산'],
  },
  {
    id: '2',
    name: '톤업 선크림 SPF50+',
    brand: '라운드랩',
    category: 'skincare',
    price: 18000,
    rating: 4.7,
    reviewCount: 89,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 88,
    tags: ['자외선차단', '무자극', '봄웜톤'],
  },
  {
    id: '3',
    name: '코랄 립스틱',
    brand: '롬앤',
    category: 'makeup',
    price: 12000,
    rating: 4.8,
    reviewCount: 256,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 95,
    tags: ['봄웜톤', '코랄', '데일리'],
  },
  {
    id: '4',
    name: '아이브로우 펜슬',
    brand: '에뛰드',
    category: 'makeup',
    price: 8000,
    rating: 4.3,
    reviewCount: 180,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 85,
    tags: ['자연스러운', '소프트브라운'],
  },
  {
    id: '5',
    name: '멀티비타민',
    brand: '센트룸',
    category: 'supplement',
    price: 28000,
    rating: 4.6,
    reviewCount: 340,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 90,
    tags: ['종합비타민', '에너지', '면역력'],
  },
  {
    id: '6',
    name: '오메가3',
    brand: '뉴트리원',
    category: 'supplement',
    price: 32000,
    rating: 4.4,
    reviewCount: 210,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 87,
    tags: ['혈행건강', 'EPA', 'DHA'],
  },
  {
    id: '7',
    name: '요가매트 6mm',
    brand: '만두카',
    category: 'equipment',
    price: 45000,
    rating: 4.9,
    reviewCount: 78,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 82,
    tags: ['요가', '필라테스', '미끄럼방지'],
  },
  {
    id: '8',
    name: '덤벨 세트 5kg',
    brand: '나이키',
    category: 'equipment',
    price: 55000,
    rating: 4.5,
    reviewCount: 92,
    imageUrl: 'https://via.placeholder.com/150',
    matchScore: 80,
    tags: ['근력운동', '홈트레이닝'],
  },
];

export default function ProductsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  // 분석 결과에서 넘어온 쿼리 파라미터
  const {
    skinType,
    concerns: _concerns, // TODO: 향후 고민 기반 필터링에 사용
    season: querySeason,
    category: initialCategory,
  } = useLocalSearchParams<{
    skinType?: string;
    concerns?: string;
    season?: string;
    category?: string;
  }>();

  const [selectedCategory, setSelectedCategory] = useState(
    initialCategory || 'all'
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userSeason, setUserSeason] = useState<string | null>(null);
  // 쿼리에서 온 필터 정보 표시용
  const [filterSource, setFilterSource] = useState<string | null>(null);

  // 사용자 분석 결과 조회
  const fetchUserData = useCallback(async () => {
    if (!user?.id) return;

    try {
      // 퍼스널 컬러 조회
      const { data: colorData } = await supabase
        .from('personal_color_assessments')
        .select('season')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (colorData) {
        setUserSeason(colorData.season);
      }
    } catch (error) {
      console.error('[Mobile] Failed to fetch user data:', error);
    }
  }, [user?.id, supabase]);

  // 쿼리 파라미터 기반 필터 소스 설정
  useEffect(() => {
    if (skinType) {
      setFilterSource('피부 분석 결과 기반');
    } else if (querySeason) {
      setFilterSource('퍼스널 컬러 분석 기반');
    } else {
      setFilterSource(null);
    }
  }, [skinType, querySeason]);

  // 제품 목록 조회
  const fetchProducts = useCallback(async () => {
    // 실제로는 API 호출
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 카테고리 필터링
    let filtered = MOCK_PRODUCTS;
    if (selectedCategory !== 'all') {
      filtered = MOCK_PRODUCTS.filter((p) => p.category === selectedCategory);
    }

    // 피부 타입 기반 필터링 (태그 매칭)
    if (skinType) {
      const skinTypeMap: Record<string, string[]> = {
        dry: ['건성', '보습', '수분'],
        oily: ['지성', '유분조절', '모공'],
        combination: ['복합성', '밸런싱'],
        sensitive: ['민감성', '저자극', '무자극'],
        normal: ['보통', '데일리'],
      };
      const matchTags = skinTypeMap[skinType] || [];
      if (matchTags.length > 0) {
        filtered = filtered.filter((p) =>
          p.tags.some((tag) =>
            matchTags.some((mt) => tag.toLowerCase().includes(mt))
          )
        );
      }
    }

    // 시즌 기반 필터링 (퍼스널 컬러)
    if (querySeason) {
      const seasonMap: Record<string, string> = {
        Spring: '봄웜톤',
        Summer: '여름쿨톤',
        Autumn: '가을웜톤',
        Winter: '겨울쿨톤',
      };
      const seasonTag = seasonMap[querySeason];
      if (seasonTag) {
        filtered = filtered.filter((p) =>
          p.tags.some(
            (tag) => tag.includes(seasonTag) || tag.includes('데일리')
          )
        );
      }
    }

    // 매칭 점수순 정렬
    filtered = [...filtered].sort((a, b) => b.matchScore - a.matchScore);

    setProducts(filtered);
    setIsLoading(false);
    setIsRefreshing(false);
  }, [selectedCategory, skinType, querySeason]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    setIsLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchProducts();
  };

  const handleProductPress = (productId: string) => {
    Haptics.selectionAsync();
    router.push(`/products/${productId}`);
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  // 시즌 라벨
  const getSeasonLabel = (season: string) => {
    const labels: Record<string, string> = {
      Spring: '봄 웜톤',
      Summer: '여름 쿨톤',
      Autumn: '가을 웜톤',
      Winter: '겨울 쿨톤',
    };
    return labels[season] || season;
  };

  return (
    <SafeAreaView
      style={[styles.container, isDark && styles.containerDark]}
      edges={['bottom']}
    >
      {/* 맞춤 추천 배너 */}
      {(filterSource || userSeason) && (
        <View style={[styles.banner, isDark && styles.bannerDark]}>
          <Text style={styles.bannerIcon}>{filterSource ? '🎯' : '✨'}</Text>
          <View style={styles.bannerContent}>
            <Text style={[styles.bannerTitle, isDark && styles.textLight]}>
              {filterSource ? '맞춤 제품 추천' : '나를 위한 추천'}
            </Text>
            <Text style={[styles.bannerSubtitle, isDark && styles.textMuted]}>
              {filterSource
                ? filterSource
                : `${getSeasonLabel(userSeason!)}에 맞는 제품을 추천해드려요`}
            </Text>
          </View>
        </View>
      )}

      {/* 카테고리 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
        contentContainerStyle={styles.categoryContent}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              isDark && styles.categoryChipDark,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedCategory(category.id);
            }}
          >
            <Text
              style={[
                styles.categoryText,
                isDark && styles.textMuted,
                selectedCategory === category.id && styles.categoryTextSelected,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 제품 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView
          style={styles.productScroll}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={isDark ? '#fff' : '#000'}
            />
          }
        >
          <View style={styles.productGrid}>
            {products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={[styles.productCard, isDark && styles.productCardDark]}
                onPress={() => handleProductPress(product.id)}
              >
                {/* 이미지 플레이스홀더 */}
                <View style={styles.productImageContainer}>
                  <View
                    style={[
                      styles.productImagePlaceholder,
                      isDark && styles.placeholderDark,
                    ]}
                  >
                    <Text style={styles.placeholderEmoji}>
                      {product.category === 'skincare'
                        ? '🧴'
                        : product.category === 'makeup'
                          ? '💄'
                          : product.category === 'supplement'
                            ? '💊'
                            : '🏋️'}
                    </Text>
                  </View>
                  {/* 매칭 점수 배지 */}
                  <View style={styles.matchBadge}>
                    <Text style={styles.matchBadgeText}>
                      {product.matchScore}%
                    </Text>
                  </View>
                </View>

                {/* 제품 정보 */}
                <View style={styles.productInfo}>
                  <Text
                    style={[styles.productBrand, isDark && styles.textMuted]}
                  >
                    {product.brand}
                  </Text>
                  <Text
                    style={[styles.productName, isDark && styles.textLight]}
                    numberOfLines={2}
                  >
                    {product.name}
                  </Text>
                  <View style={styles.ratingRow}>
                    <Text style={styles.ratingStar}>★</Text>
                    <Text
                      style={[styles.ratingText, isDark && styles.textMuted]}
                    >
                      {product.rating.toFixed(1)} ({product.reviewCount})
                    </Text>
                  </View>
                  <Text
                    style={[styles.productPrice, isDark && styles.textLight]}
                  >
                    {formatPrice(product.price)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f3ff',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
  },
  bannerDark: {
    backgroundColor: '#1a1a2e',
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerContent: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  categoryScroll: {
    marginTop: 16,
    maxHeight: 44,
  },
  categoryContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  categoryChipDark: {
    backgroundColor: '#1a1a1a',
    borderColor: '#333',
  },
  categoryChipSelected: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  categoryText: {
    fontSize: 14,
    color: '#333',
  },
  categoryTextSelected: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productScroll: {
    flex: 1,
    marginTop: 16,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  productCard: {
    width: '50%',
    padding: 4,
  },
  productCardDark: {},
  productImageContainer: {
    position: 'relative',
  },
  productImagePlaceholder: {
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderDark: {
    backgroundColor: '#1a1a1a',
  },
  placeholderEmoji: {
    fontSize: 48,
  },
  matchBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  productInfo: {
    padding: 8,
  },
  productBrand: {
    fontSize: 12,
    color: '#666',
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111',
    marginTop: 2,
    lineHeight: 18,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingStar: {
    fontSize: 12,
    color: '#f59e0b',
    marginRight: 4,
  },
  ratingText: {
    fontSize: 12,
    color: '#666',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginTop: 4,
  },
  textLight: {
    color: '#fff',
  },
  textMuted: {
    color: '#999',
  },
});
