/**
 * 제품 상세 화면
 * 제품 정보, 성분, 리뷰, 구매 링크
 */
import { useUser } from '@clerk/clerk-expo';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useTheme, typography} from '@/lib/theme';

import { ScreenContainer } from '../../components/ui';

import { EWGAnalysis } from '../../components/products/ingredients/EWGAnalysis';
import { SizeRecommendation } from '../../components/products/SizeRecommendation';
import { lookupIngredients } from '../../lib/ingredients/ewg-database';
import { useAffiliateClick, identifyPartner } from '../../lib/affiliate';
import type { ClothingCategory } from '../../lib/smart-matching';
import { useClerkSupabaseClient } from '../../lib/supabase';
import { shareLogger } from '../../lib/utils/logger';

interface ProductDetail {
  id: string;
  name: string;
  brand: string;
  brandId: string;
  category: string;
  clothingCategory?: ClothingCategory;
  price: number;
  rating: number;
  reviewCount: number;
  matchScore: number;
  description: string;
  ingredients: string[];
  benefits: string[];
  howToUse: string;
  images: string[];
  purchaseUrl: string;
  isFavorite: boolean;
  hasSize?: boolean;
}

// Mock 제품 상세 데이터
const MOCK_PRODUCT_DETAIL: Record<string, ProductDetail> = {
  '1': {
    id: '1',
    name: '수분 크림 리치',
    brand: '아이오페',
    brandId: 'iope',
    category: '스킨케어',
    price: 35000,
    rating: 4.5,
    reviewCount: 120,
    matchScore: 92,
    description:
      '건조한 피부에 깊은 보습을 선사하는 고농축 수분 크림입니다. 히알루론산과 세라마이드가 피부 장벽을 강화하고 촉촉함을 오래 유지시켜줍니다.',
    ingredients: ['히알루론산', '세라마이드', '판테놀', '나이아신아마이드', '알로에베라'],
    benefits: ['24시간 보습 지속', '피부 장벽 강화', '건조함 완화', '촉촉한 피부결'],
    howToUse: '세안 후 토너로 피부결을 정돈한 뒤, 적당량을 덜어 얼굴 전체에 부드럽게 펴 바릅니다.',
    images: [],
    purchaseUrl: 'https://example.com/product/1',
    isFavorite: false,
  },
  '2': {
    id: '2',
    name: '톤업 선크림 SPF50+',
    brand: '라운드랩',
    brandId: 'roundlab',
    category: '스킨케어',
    price: 18000,
    rating: 4.7,
    reviewCount: 89,
    matchScore: 88,
    description:
      '자연스러운 톤업 효과와 강력한 자외선 차단을 동시에. 가벼운 텍스처로 백탁 없이 산뜻하게 마무리됩니다.',
    ingredients: ['징크옥사이드', '티타늄디옥사이드', '히알루론산', '녹차추출물'],
    benefits: ['SPF50+ PA++++', '자연스러운 톤업', '무자극', '촉촉한 마무리'],
    howToUse: '스킨케어 마지막 단계에서 적당량을 덜어 얼굴과 목에 고르게 펴 바릅니다.',
    images: [],
    purchaseUrl: 'https://example.com/product/2',
    isFavorite: true,
  },
  '3': {
    id: '3',
    name: '코랄 립스틱',
    brand: '롬앤',
    brandId: 'romand',
    category: '메이크업',
    price: 12000,
    rating: 4.8,
    reviewCount: 256,
    matchScore: 95,
    description:
      '봄 웜톤에 완벽하게 어울리는 코랄 컬러 립스틱. 부드러운 발림성과 선명한 발색력으로 화사한 입술을 연출합니다.',
    ingredients: ['시어버터', '호호바오일', '비타민E'],
    benefits: ['고발색', '촉촉한 사용감', '오래 지속', '부드러운 발림성'],
    howToUse: '입술 중앙부터 바깥쪽으로 자연스럽게 펴 바릅니다.',
    images: [],
    purchaseUrl: 'https://example.com/product/3',
    isFavorite: false,
  },
  // 의류 제품 (사이즈 추천 테스트용)
  '4': {
    id: '4',
    name: '에어리즘 코튼 오버사이즈 티셔츠',
    brand: '유니클로',
    brandId: 'uniqlo',
    category: '의류',
    clothingCategory: 'top',
    hasSize: true,
    price: 19900,
    rating: 4.6,
    reviewCount: 342,
    matchScore: 88,
    description:
      '에어리즘 기술로 땀을 빠르게 흡수하고 건조시키는 쾌적한 오버사이즈 티셔츠입니다. 면 혼방 소재로 자연스러운 착용감을 제공합니다.',
    ingredients: ['면 60%', '폴리에스터 40%'],
    benefits: ['빠른 건조', '땀 흡수', '편안한 핏', '통기성'],
    howToUse: '세탁 시 30도 이하 찬물에서 중성세제로 세탁해주세요.',
    images: [],
    purchaseUrl: 'https://example.com/product/4',
    isFavorite: false,
  },
  '5': {
    id: '5',
    name: '와이드핏 데님 팬츠',
    brand: '무신사 스탠다드',
    brandId: 'musinsa-standard',
    category: '의류',
    clothingCategory: 'bottom',
    hasSize: true,
    price: 49900,
    rating: 4.4,
    reviewCount: 187,
    matchScore: 85,
    description:
      '트렌디한 와이드핏 실루엣의 데님 팬츠입니다. 적당한 두께감과 부드러운 촉감으로 사계절 착용 가능합니다.',
    ingredients: ['면 98%', '스판덱스 2%'],
    benefits: ['편안한 착용감', '와이드핏', '사계절 활용', '높은 허리'],
    howToUse: '첫 세탁 시 단독 세탁을 권장합니다. 건조기 사용을 피해주세요.',
    images: [],
    purchaseUrl: 'https://example.com/product/5',
    isFavorite: false,
  },
};

// 탭 타입
type TabType = 'info' | 'ingredients' | 'reviews';

// Mock 리뷰 데이터
interface Review {
  id: string;
  userName: string;
  rating: number;
  date: string;
  content: string;
  helpful: number;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: '1',
    userName: '민**',
    rating: 5,
    date: '2025-12-20',
    content: '정말 촉촉해요! 건조한 겨울에 필수템이에요.',
    helpful: 12,
  },
  {
    id: '2',
    userName: '지**',
    rating: 4,
    date: '2025-12-18',
    content: '발림성이 좋고 흡수도 빨라요.',
    helpful: 8,
  },
  {
    id: '3',
    userName: '서**',
    rating: 5,
    date: '2025-12-15',
    content: '피부가 훨씬 촉촉해졌어요. 재구매 의사 있습니다.',
    helpful: 5,
  },
];

export default function ProductDetailScreen() {
  const { colors, brand, status, typography } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useUser();
  const supabase = useClerkSupabaseClient();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [isFavorite, setIsFavorite] = useState(false);

  const { handleClick: affiliateClick } = useAffiliateClick({
    productId: id || '',
    productUrl: product?.purchaseUrl || '',
    partner: product?.purchaseUrl ? identifyPartner(product.purchaseUrl) || 'coupang' : 'coupang',
    sourcePage: 'product-detail',
    sourceComponent: 'purchase-button',
    recommendationType: 'general',
  });

  const [reviews, setReviews] = useState<Review[]>(MOCK_REVIEWS);

  // 제품 상세 조회 (DB 우선, mock fallback)
  const fetchProduct = useCallback(async () => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    try {
      // DB에서 조회 시도 (UUID 형식인 경우)
      if (id.includes('-') && user?.id) {
        const { data: dbProduct } = await supabase
          .from('cosmetic_products')
          .select(
            'id, name, brand, category, price_krw, rating, review_count, key_ingredients, purchase_url, image_url'
          )
          .eq('id', id)
          .eq('is_active', true)
          .single();

        if (dbProduct) {
          setProduct({
            id: dbProduct.id,
            name: dbProduct.name,
            brand: dbProduct.brand,
            brandId: dbProduct.brand.toLowerCase().replace(/\s/g, '-'),
            category: dbProduct.category,
            price: dbProduct.price_krw || 0,
            rating: Number(dbProduct.rating) || 0,
            reviewCount: dbProduct.review_count || 0,
            matchScore: 85,
            description: '',
            ingredients: dbProduct.key_ingredients || [],
            benefits: [],
            howToUse: '',
            images: dbProduct.image_url ? [dbProduct.image_url] : [],
            purchaseUrl: dbProduct.purchase_url || '',
            isFavorite: false,
          });
          setIsLoading(false);

          // 리뷰도 DB에서 조회 시도
          const { data: dbReviews } = await supabase
            .from('product_reviews')
            .select('id, user_name, rating, created_at, content, helpful_count')
            .eq('product_id', id)
            .order('created_at', { ascending: false })
            .limit(10);

          if (dbReviews && dbReviews.length > 0) {
            setReviews(
              dbReviews.map((r) => ({
                id: r.id,
                userName: r.user_name || '익명',
                rating: r.rating,
                date: r.created_at?.split('T')[0] || '',
                content: r.content || '',
                helpful: r.helpful_count || 0,
              }))
            );
          }
          return;
        }
      }
    } catch {
      // DB 조회 실패 시 mock fallback
    }

    // Mock fallback
    const productData = MOCK_PRODUCT_DETAIL[id] || MOCK_PRODUCT_DETAIL['1'];
    setProduct(productData);
    setIsFavorite(productData.isFavorite);
    setIsLoading(false);
  }, [id, user?.id, supabase]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // 찜하기 토글 (DB 저장 시도)
  const handleFavoriteToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newValue = !isFavorite;
    setIsFavorite(newValue);

    if (user?.id && product) {
      try {
        if (newValue) {
          await supabase.from('product_wishlist').upsert({
            clerk_user_id: user.id,
            product_id: product.id,
          });
        } else {
          await supabase
            .from('product_wishlist')
            .delete()
            .eq('clerk_user_id', user.id)
            .eq('product_id', product.id);
        }
      } catch {
        // DB 저장 실패 시 로컬 상태만 유지
      }
    }
  };

  // 공유하기
  const handleShare = async () => {
    if (!product) return;

    try {
      await Share.share({
        message: `${product.brand} ${product.name} - ₩${product.price.toLocaleString()}\n${product.purchaseUrl}`,
      });
    } catch (error) {
      shareLogger.error('Share error:', error);
    }
  };

  // 구매하기 (어필리에이트 클릭 훅 사용)
  const handlePurchase = async () => {
    if (!product?.purchaseUrl) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // 어필리에이트 훅으로 클릭 트래킹 + 딥링크 열기
    await affiliateClick();
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return `₩${price.toLocaleString()}`;
  };

  // 별점 렌더링
  const renderStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;
    const stars = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('★');
    }
    if (hasHalfStar) {
      stars.push('☆');
    }

    return stars.join('');
  };

  if (isLoading || !product) {
    return (
      <ScreenContainer scrollable={false} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={brand.primary} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer
      testID="product-detail-screen"
      scrollable={false}
      edges={['bottom']}
      contentPadding={0}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 이미지 영역 */}
        <View style={[styles.imageSection, { backgroundColor: colors.muted }]}>
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderEmoji}>
              {product.category === '스킨케어'
                ? '🧴'
                : product.category === '메이크업'
                  ? '💄'
                  : product.category === '영양제'
                    ? '💊'
                    : '🏋️'}
            </Text>
          </View>
          {/* 이미지 인디케이터 */}
          <View style={styles.imageIndicator}>
            <View style={[styles.indicatorDot, { backgroundColor: colors.card }]} />
            <View style={[styles.indicatorDot, { backgroundColor: `${colors.card}80` }]} />
            <View style={[styles.indicatorDot, { backgroundColor: `${colors.card}80` }]} />
          </View>
        </View>

        {/* 제품 정보 */}
        <View style={styles.infoSection}>
          <Text style={[styles.brand, { color: colors.mutedForeground }]}>{product.brand}</Text>
          <Text style={[styles.productName, { color: colors.foreground }]}>{product.name}</Text>

          {/* 평점 */}
          <View style={styles.ratingRow}>
            <Text style={[styles.ratingStars, { color: status.warning }]}>
              {renderStars(product.rating)}
            </Text>
            <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
              {product.rating.toFixed(1)} ({product.reviewCount}개 리뷰)
            </Text>
            <Text
              style={[
                styles.categoryBadge,
                { color: brand.primaryForeground, backgroundColor: `${brand.primary}30` },
              ]}
            >
              {product.category}
            </Text>
          </View>

          {/* 가격 */}
          <Text style={[styles.price, { color: colors.foreground }]}>
            {formatPrice(product.price)}
          </Text>

          {/* 매칭 점수 */}
          <View style={[styles.matchCard, { backgroundColor: colors.card }]}>
            <Text style={styles.matchIcon}>🎯</Text>
            <View style={styles.matchInfo}>
              <Text style={[styles.matchLabel, { color: colors.mutedForeground }]}>
                나와의 매칭
              </Text>
              <View style={[styles.matchBarContainer, { backgroundColor: colors.border }]}>
                <View
                  style={[
                    styles.matchBar,
                    { width: `${product.matchScore}%`, backgroundColor: brand.primary },
                  ]}
                />
              </View>
            </View>
            <Text style={[styles.matchScore, { color: brand.primaryForeground }]}>
              {product.matchScore}%
            </Text>
          </View>

          {/* 사이즈 추천 (의류 제품만) */}
          {product.hasSize && product.clothingCategory && (
            <SizeRecommendation
              brandId={product.brandId}
              brandName={product.brand}
              category={product.clothingCategory}
              productId={product.id}
            />
          )}
        </View>

        {/* 탭 */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(['info', 'ingredients', 'reviews'] as TabType[]).map((tab) => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && [styles.tabActive, { borderBottomColor: brand.primary }],
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                setActiveTab(tab);
              }}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedForeground },
                  activeTab === tab && {
                    color: brand.primaryForeground,
                    fontWeight: typography.weight.semibold,
                  },
                ]}
              >
                {tab === 'info'
                  ? '제품 정보'
                  : tab === 'ingredients'
                    ? '성분'
                    : `리뷰 ${product.reviewCount}`}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* 탭 컨텐츠 */}
        <View style={styles.tabContent}>
          {activeTab === 'info' && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>제품 설명</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {product.description}
              </Text>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>효과</Text>
              <View style={styles.benefitsList}>
                {product.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Text style={[styles.benefitDot, { color: status.success }]}>✓</Text>
                    <Text style={[styles.benefitText, { color: colors.mutedForeground }]}>
                      {benefit}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>사용 방법</Text>
              <Text style={[styles.description, { color: colors.mutedForeground }]}>
                {product.howToUse}
              </Text>
            </>
          )}

          {activeTab === 'ingredients' && (
            <EWGAnalysis ingredients={lookupIngredients(product.ingredients)} />
          )}

          {activeTab === 'reviews' && (
            <>
              {reviews.map((review) => (
                <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                  <View style={styles.reviewHeader}>
                    <Text style={[styles.reviewUser, { color: colors.foreground }]}>
                      {review.userName}
                    </Text>
                    <Text style={[styles.reviewRating, { color: status.warning }]}>
                      {'★'.repeat(review.rating)}
                    </Text>
                  </View>
                  <Text style={[styles.reviewDate, { color: colors.mutedForeground }]}>
                    {review.date}
                  </Text>
                  <Text style={[styles.reviewContent, { color: colors.mutedForeground }]}>
                    {review.content}
                  </Text>
                  <Text style={[styles.reviewHelpful, { color: colors.mutedForeground }]}>
                    👍 {review.helpful}명에게 도움이 됨
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* 하단 액션 바 */}
      <View
        style={[styles.actionBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}
      >
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={handleFavoriteToggle}
        >
          <Text style={styles.actionIcon}>{isFavorite ? '❤️' : '🤍'}</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, { backgroundColor: colors.muted }]}
          onPress={handleShare}
        >
          <Text style={styles.actionIcon}>📤</Text>
        </Pressable>
        <Pressable
          style={[styles.purchaseButton, { backgroundColor: brand.primary }]}
          onPress={handlePurchase}
        >
          <Text style={[styles.purchaseButtonText, { color: brand.primaryForeground }]}>
            구매하러 가기
          </Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageSection: {
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 80,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  infoSection: {
    padding: 20,
  },
  brand: {
    fontSize: typography.size.sm,
    marginBottom: 4,
  },
  productName: {
    fontSize: 22,
    fontWeight: typography.weight.bold,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingStars: {
    fontSize: typography.size.sm,
    marginRight: 6,
  },
  ratingText: {
    fontSize: 13,
    flex: 1,
  },
  categoryBadge: {
    fontSize: typography.size.xs,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  price: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    marginBottom: 16,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
  },
  matchIcon: {
    fontSize: typography.size['2xl'],
    marginRight: 12,
  },
  matchInfo: {
    flex: 1,
  },
  matchLabel: {
    fontSize: 13,
    marginBottom: 6,
  },
  matchBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  matchBar: {
    height: '100%',
    borderRadius: 3,
  },
  matchScore: {
    fontSize: 20,
    fontWeight: typography.weight.bold,
    marginLeft: 12,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
  },
  tabText: {
    fontSize: typography.size.sm,
  },
  tabContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
    marginBottom: 12,
    marginTop: 8,
  },
  description: {
    fontSize: typography.size.sm,
    lineHeight: 22,
    marginBottom: 20,
  },
  benefitsList: {
    marginBottom: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitDot: {
    fontSize: typography.size.sm,
    marginRight: 8,
  },
  benefitText: {
    fontSize: typography.size.sm,
  },
  reviewCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold,
  },
  reviewRating: {
    fontSize: typography.size.xs,
  },
  reviewDate: {
    fontSize: typography.size.xs,
    marginBottom: 8,
  },
  reviewContent: {
    fontSize: typography.size.sm,
    lineHeight: 20,
    marginBottom: 8,
  },
  reviewHelpful: {
    fontSize: typography.size.xs,
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 20,
  },
  purchaseButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  purchaseButtonText: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold,
  },
});
