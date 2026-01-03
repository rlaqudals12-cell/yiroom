'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import {
  FlaskConical,
  Palette,
  AlertTriangle,
  Star,
  Pill,
  ChevronDown,
  Sparkles,
  Droplets,
  Sun,
  Shield,
  Zap,
  Check,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  Crown,
  Trophy,
  X,
} from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { IngredientFavoriteFilter } from '@/components/beauty/IngredientFavoriteFilter';
import { AgeGroupFilter } from '@/components/beauty/AgeGroupFilter';
import { SkinAgeCalculator } from '@/components/beauty/SkinAgeCalculator';
import { SkincareRoutineCard } from '@/components/beauty/SkincareRoutineCard';
import type { FavoriteItem, AgeGroup, RoutineItem } from '@/types/hybrid';

/**
 * 뷰티 탭 - 화해 스타일 제품 피드
 * - 내 피부 프로필 표시
 * - 피부타입 필터 (건성/지성/복합성/민감성/중성)
 * - 피부고민 필터 (보습/미백/모공/진정/여드름)
 * - 카테고리 필터 (토너/세럼/크림/선케어/마스크팩)
 * - 정렬 옵션 (매칭률순/리뷰순/평점순)
 */

// 피부 타입
type SkinType = 'dry' | 'oily' | 'combination' | 'sensitive' | 'normal';
const skinTypes: { id: SkinType; label: string }[] = [
  { id: 'dry', label: '건성' },
  { id: 'oily', label: '지성' },
  { id: 'combination', label: '복합성' },
  { id: 'sensitive', label: '민감성' },
  { id: 'normal', label: '중성' },
];

// 피부 고민
type SkinConcern =
  | 'hydration'
  | 'whitening'
  | 'pore'
  | 'soothing'
  | 'acne'
  | 'wrinkle'
  | 'elasticity';
const skinConcerns: { id: SkinConcern; label: string; icon: React.ReactNode }[] = [
  { id: 'hydration', label: '보습', icon: <Droplets className="w-3.5 h-3.5" /> },
  { id: 'whitening', label: '미백', icon: <Sun className="w-3.5 h-3.5" /> },
  { id: 'pore', label: '모공', icon: <Shield className="w-3.5 h-3.5" /> },
  { id: 'soothing', label: '진정', icon: <Zap className="w-3.5 h-3.5" /> },
  { id: 'acne', label: '여드름', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { id: 'wrinkle', label: '주름', icon: <Sparkles className="w-3.5 h-3.5" /> },
  { id: 'elasticity', label: '탄력', icon: <Flame className="w-3.5 h-3.5" /> },
];

// 대분류 카테고리 (화해 스타일)
type MainCategory = 'all' | 'cleansing' | 'skincare' | 'suncare' | 'mask';
const mainCategories: { id: MainCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'cleansing', label: '클렌징' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'suncare', label: '선케어' },
  { id: 'mask', label: '마스크/팩' },
];

// 세부 카테고리 (대분류별)
type SubCategory = string;
const subCategories: Record<MainCategory, { id: SubCategory; label: string }[]> = {
  all: [],
  cleansing: [
    { id: 'cleansing_foam', label: '클렌징폼' },
    { id: 'cleansing_oil', label: '클렌징오일' },
    { id: 'cleansing_water', label: '클렌징워터' },
    { id: 'cleansing_gel', label: '클렌징젤' },
    { id: 'cleansing_balm', label: '클렌징밤' },
    { id: 'scrub_peeling', label: '스크럽/필링' },
  ],
  skincare: [
    { id: 'toner', label: '스킨/토너' },
    { id: 'essence', label: '에센스' },
    { id: 'serum', label: '세럼/앰플' },
    { id: 'lotion', label: '로션/에멀전' },
    { id: 'cream', label: '크림' },
    { id: 'eye_cream', label: '아이크림' },
    { id: 'mist', label: '미스트' },
  ],
  suncare: [
    { id: 'sun_cream', label: '선크림' },
    { id: 'sun_stick', label: '선스틱' },
    { id: 'sun_spray', label: '선스프레이' },
    { id: 'sun_cushion', label: '선쿠션' },
  ],
  mask: [
    { id: 'sheet_mask', label: '시트마스크' },
    { id: 'wash_off', label: '워시오프팩' },
    { id: 'sleeping_pack', label: '슬리핑팩' },
    { id: 'peel_off', label: '필오프팩' },
  ],
};

// 정렬 옵션 (실시간 인기 추가)
type SortOption = 'realtime' | 'match' | 'review' | 'rating' | 'price_low' | 'price_high';
const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'realtime', label: '실시간 인기' },
  { id: 'match', label: '매칭률순' },
  { id: 'review', label: '리뷰순' },
  { id: 'rating', label: '평점순' },
  { id: 'price_low', label: '가격 낮은순' },
  { id: 'price_high', label: '가격 높은순' },
];

// 랭킹 변동 타입
type RankChange = 'up' | 'down' | 'same' | 'new';

// 피부타입별 랭킹 데이터 (화해 스타일)
interface RankingProduct {
  id: string;
  name: string;
  brand: string;
  rating: number;
  reviews: number;
  rank: number;
  change: RankChange;
  changeAmount?: number;
  imageUrl: string;
}

// 피부타입별 TOP 5 랭킹 데이터
const rankingBySkinType: Record<SkinType, RankingProduct[]> = {
  dry: [
    {
      id: 'r1',
      name: '수분 폭탄 크림',
      brand: '아비브',
      rating: 4.9,
      reviews: 8923,
      rank: 1,
      change: 'same',
      imageUrl: '/images/products/cream-1.jpg',
    },
    {
      id: 'r2',
      name: '히알루론산 세럼',
      brand: '토리든',
      rating: 4.8,
      reviews: 6721,
      rank: 2,
      change: 'up',
      changeAmount: 2,
      imageUrl: '/images/products/serum-1.jpg',
    },
    {
      id: 'r3',
      name: '세라마이드 토너',
      brand: '코스알엑스',
      rating: 4.7,
      reviews: 5432,
      rank: 3,
      change: 'down',
      changeAmount: 1,
      imageUrl: '/images/products/toner-1.jpg',
    },
    {
      id: 'r4',
      name: '오일 세럼',
      brand: '클리오',
      rating: 4.6,
      reviews: 4211,
      rank: 4,
      change: 'new',
      imageUrl: '/images/products/oil-1.jpg',
    },
    {
      id: 'r5',
      name: '수분 앰플',
      brand: '마녀공장',
      rating: 4.6,
      reviews: 3987,
      rank: 5,
      change: 'up',
      changeAmount: 3,
      imageUrl: '/images/products/ampoule-1.jpg',
    },
  ],
  oily: [
    {
      id: 'r6',
      name: 'BHA 블랙헤드 토너',
      brand: '코스알엑스',
      rating: 4.8,
      reviews: 12453,
      rank: 1,
      change: 'same',
      imageUrl: '/images/products/toner-2.jpg',
    },
    {
      id: 'r7',
      name: '티트리 진정 세럼',
      brand: '아이소이',
      rating: 4.7,
      reviews: 8932,
      rank: 2,
      change: 'up',
      changeAmount: 1,
      imageUrl: '/images/products/serum-2.jpg',
    },
    {
      id: 'r8',
      name: '노세범 선크림',
      brand: '라로슈포제',
      rating: 4.9,
      reviews: 7654,
      rank: 3,
      change: 'down',
      changeAmount: 2,
      imageUrl: '/images/products/sun-1.jpg',
    },
    {
      id: 'r9',
      name: 'AHA/BHA 필링젤',
      brand: '메디힐',
      rating: 4.5,
      reviews: 5432,
      rank: 4,
      change: 'same',
      imageUrl: '/images/products/peeling-1.jpg',
    },
    {
      id: 'r10',
      name: '워터 젤 크림',
      brand: '벨리프',
      rating: 4.6,
      reviews: 4321,
      rank: 5,
      change: 'new',
      imageUrl: '/images/products/gel-1.jpg',
    },
  ],
  combination: [
    {
      id: 'r11',
      name: '밸런싱 토너',
      brand: '달바',
      rating: 4.8,
      reviews: 9876,
      rank: 1,
      change: 'up',
      changeAmount: 1,
      imageUrl: '/images/products/toner-3.jpg',
    },
    {
      id: 'r12',
      name: '나이아신 앰플',
      brand: '마녀공장',
      rating: 4.9,
      reviews: 8234,
      rank: 2,
      change: 'down',
      changeAmount: 1,
      imageUrl: '/images/products/ampoule-2.jpg',
    },
    {
      id: 'r13',
      name: '멀티 세럼',
      brand: '아이소이',
      rating: 4.7,
      reviews: 6543,
      rank: 3,
      change: 'same',
      imageUrl: '/images/products/serum-3.jpg',
    },
    {
      id: 'r14',
      name: '수분 젤 크림',
      brand: '라운드랩',
      rating: 4.6,
      reviews: 5421,
      rank: 4,
      change: 'up',
      changeAmount: 2,
      imageUrl: '/images/products/gel-2.jpg',
    },
    {
      id: 'r15',
      name: 'T존 세범 컨트롤',
      brand: '이니스프리',
      rating: 4.5,
      reviews: 4532,
      rank: 5,
      change: 'new',
      imageUrl: '/images/products/control-1.jpg',
    },
  ],
  sensitive: [
    {
      id: 'r16',
      name: '시카 크림',
      brand: '닥터지',
      rating: 4.9,
      reviews: 15432,
      rank: 1,
      change: 'same',
      imageUrl: '/images/products/cica-1.jpg',
    },
    {
      id: 'r17',
      name: '마데카 세럼',
      brand: '아비브',
      rating: 4.8,
      reviews: 11234,
      rank: 2,
      change: 'same',
      imageUrl: '/images/products/madeca-1.jpg',
    },
    {
      id: 'r18',
      name: '센텔라 토너',
      brand: '토리든',
      rating: 4.7,
      reviews: 8765,
      rank: 3,
      change: 'up',
      changeAmount: 1,
      imageUrl: '/images/products/centella-1.jpg',
    },
    {
      id: 'r19',
      name: '진정 마스크팩',
      brand: '메디힐',
      rating: 4.6,
      reviews: 6543,
      rank: 4,
      change: 'down',
      changeAmount: 1,
      imageUrl: '/images/products/mask-1.jpg',
    },
    {
      id: 'r20',
      name: '무자극 클렌저',
      brand: '라운드랩',
      rating: 4.5,
      reviews: 5432,
      rank: 5,
      change: 'new',
      imageUrl: '/images/products/cleanser-1.jpg',
    },
  ],
  normal: [
    {
      id: 'r21',
      name: '비타민C 세럼',
      brand: '클레어스',
      rating: 4.8,
      reviews: 10234,
      rank: 1,
      change: 'up',
      changeAmount: 2,
      imageUrl: '/images/products/vitaminc-1.jpg',
    },
    {
      id: 'r22',
      name: '글로우 토너',
      brand: '아이소이',
      rating: 4.7,
      reviews: 7654,
      rank: 2,
      change: 'down',
      changeAmount: 1,
      imageUrl: '/images/products/glow-1.jpg',
    },
    {
      id: 'r23',
      name: '수분 크림',
      brand: '벨리프',
      rating: 4.9,
      reviews: 6543,
      rank: 3,
      change: 'down',
      changeAmount: 1,
      imageUrl: '/images/products/moisture-1.jpg',
    },
    {
      id: 'r24',
      name: '멀티 에센스',
      brand: '달바',
      rating: 4.6,
      reviews: 5432,
      rank: 4,
      change: 'same',
      imageUrl: '/images/products/essence-1.jpg',
    },
    {
      id: 'r25',
      name: '선 에센스',
      brand: '라로슈포제',
      rating: 4.7,
      reviews: 4321,
      rank: 5,
      change: 'new',
      imageUrl: '/images/products/sun-2.jpg',
    },
  ],
};

// 제품 타입 정의
interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  rating: number;
  reviews: number;
  matchRate: number;
  price: number;
  imageUrl: string;
  category?: string;
}

// 이미지 placeholder 생성
function getProductImageUrl(imageUrl: string | null | undefined, brand: string): string {
  if (imageUrl) return imageUrl;
  // 브랜드 첫글자 해시 기반 파스텔 컬러 (텍스트 없이)
  const colors = ['fce7f3', 'dbeafe', 'd1fae5', 'fef3c7', 'ede9fe', 'ffedd5'];
  const colorIndex = brand.charCodeAt(0) % colors.length;
  return `https://placehold.co/400x400/${colors[colorIndex]}/${colors[colorIndex]}`;
}

export default function BeautyPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();

  // 필터 상태
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<SkinType[]>(['combination']);
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>(['hydration']);
  const [mainCategory, setMainCategory] = useState<MainCategory>('all');
  const [subCategory, setSubCategory] = useState<SubCategory | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [matchFilterOn, setMatchFilterOn] = useState(true);

  // 분석 결과 상태
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [userSkinType, setUserSkinType] = useState<SkinType>('combination');
  const [userSkinConcerns, setUserSkinConcerns] = useState<SkinConcern[]>([]);

  // 하이브리드 UX 상태
  const [favoriteIngredients, setFavoriteIngredients] = useState<FavoriteItem[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<FavoriteItem[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>([]);

  // 제품 데이터 상태
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [morningRoutine] = useState<RoutineItem[]>([
    {
      order: 1,
      category: 'cleanser',
      productName: '젠틀 클렌저',
      timing: 'morning',
      duration: '1분',
    },
    {
      order: 2,
      category: 'toner',
      productName: '히알루론산 토너',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 3,
      category: 'serum',
      productName: '비타민C 세럼',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 4,
      category: 'moisturizer',
      productName: '수분 크림',
      timing: 'morning',
      duration: '30초',
    },
    {
      order: 5,
      category: 'sunscreen',
      productName: 'SPF50+ 선크림',
      timing: 'morning',
      duration: '30초',
    },
  ]);
  const [eveningRoutine] = useState<RoutineItem[]>([
    {
      order: 1,
      category: 'cleanser',
      productName: '클렌징 오일',
      timing: 'evening',
      duration: '2분',
    },
    {
      order: 2,
      category: 'cleanser',
      productName: '폼 클렌저',
      timing: 'evening',
      duration: '1분',
    },
    {
      order: 3,
      category: 'toner',
      productName: '각질 케어 토너',
      timing: 'evening',
      duration: '30초',
    },
    {
      order: 4,
      category: 'serum',
      productName: '레티놀 세럼',
      timing: 'evening',
      duration: '30초',
    },
    {
      order: 5,
      category: 'moisturizer',
      productName: '나이트 크림',
      timing: 'evening',
      duration: '30초',
    },
  ]);

  // 분석 결과 가져오기
  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const [skinResult, pcResult] = await Promise.all([
          supabase
            .from('skin_analyses')
            .select('skin_type, concerns')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('personal_color_assessments')
            .select('result_season, result_tone')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        if (skinResult.data || pcResult.data) {
          setHasAnalysis(true);

          if (skinResult.data) {
            // skin_type을 SkinType으로 매핑
            const skinTypeMap: Record<string, SkinType> = {
              건성: 'dry',
              지성: 'oily',
              복합성: 'combination',
              민감성: 'sensitive',
              중성: 'normal',
            };
            const mappedType = skinTypeMap[skinResult.data.skin_type] || 'combination';
            setUserSkinType(mappedType);
            setSelectedSkinTypes([mappedType]);

            // concerns를 SkinConcern으로 매핑
            const concernsData = skinResult.data.concerns as string[] | null;
            if (concernsData && Array.isArray(concernsData)) {
              const concernMap: Record<string, SkinConcern> = {
                수분부족: 'hydration',
                미백: 'whitening',
                모공: 'pore',
                진정: 'soothing',
                여드름: 'acne',
                주름: 'wrinkle',
                탄력: 'elasticity',
              };
              const mappedConcerns = concernsData
                .map((c) => concernMap[c])
                .filter((c): c is SkinConcern => c !== undefined);
              setUserSkinConcerns(mappedConcerns);
              if (mappedConcerns.length > 0) {
                setSelectedConcerns(mappedConcerns);
              }
            }
          }

          if (pcResult.data) {
            setPersonalColor(`${pcResult.data.result_season} ${pcResult.data.result_tone}`);
          }
        }
      } catch (err) {
        console.error('[Beauty] Analysis fetch error:', err);
      }
    };

    fetchAnalysis();
  }, [isLoaded, user?.id, supabase]);

  // 제품 데이터 조회
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        // 카테고리 매핑 (mainCategory → DB category)
        const categoryMap: Record<MainCategory, string | null> = {
          all: null,
          cleansing: 'cleanser',
          skincare: 'toner', // 스킨케어는 기본적으로 토너부터
          suncare: 'sunscreen',
          mask: 'mask',
        };

        let query = supabase
          .from('cosmetic_products')
          .select(
            'id, name, brand, category, price_krw, rating, review_count, image_url, skin_types, concerns'
          )
          .eq('is_active', true)
          .limit(20);

        // 카테고리 필터
        if (mainCategory !== 'all') {
          if (subCategory) {
            query = query.eq('subcategory', subCategory);
          } else {
            const dbCategory = categoryMap[mainCategory];
            if (dbCategory) {
              query = query.eq('category', dbCategory);
            }
          }
        }

        // 피부타입 필터 (선택된 것 중 하나라도 포함)
        if (selectedSkinTypes.length > 0) {
          query = query.overlaps('skin_types', selectedSkinTypes);
        }

        // 피부고민 필터
        if (selectedConcerns.length > 0) {
          query = query.overlaps('concerns', selectedConcerns);
        }

        // 정렬
        switch (sortBy) {
          case 'rating':
            query = query.order('rating', { ascending: false });
            break;
          case 'review':
            query = query.order('review_count', { ascending: false });
            break;
          case 'price_low':
            query = query.order('price_krw', { ascending: true });
            break;
          case 'price_high':
            query = query.order('price_krw', { ascending: false });
            break;
          default:
            query = query.order('rating', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Beauty] 제품 조회 실패:', error);
          return;
        }

        // 매칭률 계산 (피부타입/고민 기반)
        const mappedProducts: BeautyProduct[] = (data || []).map((row) => {
          const skinTypes = row.skin_types as string[] | null;
          const concerns = row.concerns as string[] | null;

          // 피부타입 매칭 점수
          const skinTypeMatch = skinTypes
            ? selectedSkinTypes.filter((t) => skinTypes.includes(t)).length /
              selectedSkinTypes.length
            : 0.5;

          // 피부고민 매칭 점수
          const concernMatch = concerns
            ? selectedConcerns.filter((c) => concerns.includes(c)).length /
              Math.max(selectedConcerns.length, 1)
            : 0.5;

          // 종합 매칭률 (70-100%)
          const matchRate = Math.round(70 + skinTypeMatch * 15 + concernMatch * 15);

          return {
            id: row.id,
            name: row.name,
            brand: row.brand,
            category: row.category,
            rating: row.rating ?? 4.0,
            reviews: row.review_count ?? 0,
            matchRate,
            price: row.price_krw ?? 0,
            imageUrl: getProductImageUrl(row.image_url, row.brand),
          };
        });

        // 매칭 필터 적용 (90% 이상만)
        const filteredProducts =
          matchFilterOn && hasAnalysis
            ? mappedProducts.filter((p) => p.matchRate >= 90)
            : mappedProducts;

        setProducts(filteredProducts);
      } catch (err) {
        console.error('[Beauty] 제품 조회 오류:', err);
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProducts();
  }, [
    supabase,
    mainCategory,
    subCategory,
    selectedSkinTypes,
    selectedConcerns,
    sortBy,
    matchFilterOn,
    hasAnalysis,
  ]);

  // 대분류 변경 시 세부 카테고리 초기화
  const handleMainCategoryChange = (cat: MainCategory) => {
    setMainCategory(cat);
    setSubCategory(null);
  };

  // 피부타입 한글 라벨
  const getSkinTypeLabel = (type: SkinType) => {
    return skinTypes.find((t) => t.id === type)?.label || type;
  };

  // 피부고민 한글 라벨
  const getSkinConcernLabel = (concern: SkinConcern) => {
    return skinConcerns.find((c) => c.id === concern)?.label || concern;
  };

  // 피부타입 토글
  const toggleSkinType = (type: SkinType) => {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  // 피부고민 토글
  const toggleConcern = (concern: SkinConcern) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  // 가격 포맷
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="beauty-page">
      <h1 className="sr-only">뷰티 - 피부 맞춤 제품 추천</h1>

      {/* 내 피부 프로필 */}
      {hasAnalysis ? (
        <FadeInUp>
          <section
            className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/30 dark:to-rose-900/20 px-4 py-4 border-b"
            aria-label="내 피부 프로필"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center">
                  <FlaskConical className="w-5 h-5 text-pink-500" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-medium text-foreground">내 피부</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Palette className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">{personalColor}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/profile/analysis')}
                className="text-sm text-primary hover:underline px-3 py-1.5 rounded-lg hover:bg-primary/5 transition-colors"
                aria-label="피부 프로필 수정"
              >
                수정
              </button>
            </div>
            {/* AI 진단 결과: 피부타입 및 피부고민 */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs bg-pink-200 dark:bg-pink-800/50 text-pink-800 dark:text-pink-200 px-2.5 py-1 rounded-full font-medium">
                {getSkinTypeLabel(userSkinType)}
              </span>
              {userSkinConcerns.map((concern) => (
                <span
                  key={concern}
                  className="text-xs bg-rose-100 dark:bg-rose-800/30 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-full"
                >
                  {getSkinConcernLabel(concern)}
                </span>
              ))}
            </div>
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <section className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20 px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                  피부 분석하면 98% 맞춤 추천!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 내 피부에 맞는 제품을 찾아드려요
                </p>
              </div>
              <button
                onClick={() => router.push('/onboarding/skin')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 피부타입 필터 칩 */}
      <FadeInUp delay={1}>
        <section className="px-4 py-3 border-b" aria-label="피부타입 필터">
          <p className="text-xs text-muted-foreground mb-2 font-medium">피부타입</p>
          <div className="flex gap-2 flex-wrap">
            {skinTypes.map((type) => {
              const isSelected = selectedSkinTypes.includes(type.id);
              return (
                <button
                  key={type.id}
                  onClick={() => toggleSkinType(type.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                  aria-pressed={isSelected}
                >
                  {isSelected && <Check className="w-3 h-3 inline mr-1" aria-hidden="true" />}
                  {type.label}
                </button>
              );
            })}
          </div>
        </section>
      </FadeInUp>

      {/* 피부고민 필터 */}
      <FadeInUp delay={2}>
        <section className="px-4 py-3 border-b overflow-x-auto" aria-label="피부고민 필터">
          <p className="text-xs text-muted-foreground mb-2 font-medium">피부고민</p>
          <div className="flex gap-2 pb-1">
            {skinConcerns.map((concern) => {
              const isSelected = selectedConcerns.includes(concern.id);
              return (
                <button
                  key={concern.id}
                  onClick={() => toggleConcern(concern.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                    isSelected
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                  aria-pressed={isSelected}
                >
                  {concern.icon}
                  {concern.label}
                </button>
              );
            })}
          </div>
        </section>
      </FadeInUp>

      {/* 성분 즐겨찾기 & 연령대 필터 (하이브리드 UX) */}
      <FadeInUp delay={3}>
        <section
          className="px-4 py-3 border-b flex flex-wrap items-center gap-3"
          aria-label="추가 필터"
        >
          <IngredientFavoriteFilter
            favorites={favoriteIngredients}
            avoids={avoidIngredients}
            onFavoritesChange={setFavoriteIngredients}
            onAvoidsChange={setAvoidIngredients}
          />
          <AgeGroupFilter
            selectedAgeGroups={selectedAgeGroups}
            onAgeGroupChange={setSelectedAgeGroups}
            multiple={true}
            className="flex-1 min-w-[200px]"
          />
        </section>
      </FadeInUp>

      {/* 대분류 카테고리 탭 */}
      <FadeInUp delay={3}>
        <nav className="px-4 py-3 border-b overflow-x-auto" aria-label="대분류 카테고리">
          <div className="flex gap-1" role="tablist" aria-label="제품 대분류">
            {mainCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleMainCategoryChange(cat.id)}
                role="tab"
                aria-selected={mainCategory === cat.id}
                aria-controls={`category-panel-${cat.id}`}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200',
                  mainCategory === cat.id
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>
      </FadeInUp>

      {/* 세부 카테고리 (대분류 선택 시) */}
      {mainCategory !== 'all' && subCategories[mainCategory].length > 0 && (
        <FadeInUp delay={4}>
          <nav
            className="px-4 py-2 border-b overflow-x-auto bg-muted/30"
            aria-label="세부 카테고리"
          >
            <div className="flex gap-2 pb-1">
              <button
                onClick={() => setSubCategory(null)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
                  subCategory === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground hover:bg-muted border'
                )}
              >
                전체
              </button>
              {subCategories[mainCategory].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSubCategory(sub.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
                    subCategory === sub.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted border'
                  )}
                >
                  {sub.label}
                </button>
              ))}
            </div>
          </nav>
        </FadeInUp>
      )}

      {/* 정렬 및 매칭 필터 */}
      <FadeInUp delay={5}>
        <div className="px-4 py-3 border-b flex items-center justify-between">
          {/* 정렬 버튼 (Bottom Sheet 트리거) */}
          <button
            onClick={() => setShowSortSheet(true)}
            className="flex items-center gap-1 text-sm text-foreground"
            aria-haspopup="dialog"
          >
            {sortOptions.find((s) => s.id === sortBy)?.label}
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* 매칭 필터 토글 */}
          {hasAnalysis && (
            <button
              onClick={() => setMatchFilterOn(!matchFilterOn)}
              className="flex items-center gap-2"
              role="switch"
              aria-checked={matchFilterOn}
              aria-label="90% 이상 매칭 제품만 표시"
            >
              <span className="text-sm text-muted-foreground">90%+ 매칭</span>
              <div
                className={cn(
                  'w-10 h-6 rounded-full transition-colors relative',
                  matchFilterOn ? 'bg-primary' : 'bg-muted'
                )}
                aria-hidden="true"
              >
                <div
                  className={cn(
                    'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
                    matchFilterOn ? 'translate-x-5' : 'translate-x-1'
                  )}
                />
              </div>
            </button>
          )}
        </div>
      </FadeInUp>

      {/* 정렬 Bottom Sheet (화해 스타일) */}
      {showSortSheet && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="정렬 기준 선택"
        >
          {/* 배경 오버레이 */}
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowSortSheet(false)}
            aria-hidden="true"
          />
          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300">
            {/* 핸들 바 */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            {/* 헤더 */}
            <div className="flex items-center justify-between px-4 pb-3 border-b">
              <h3 className="text-lg font-semibold">정렬</h3>
              <button
                onClick={() => setShowSortSheet(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="닫기"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            {/* 옵션 목록 */}
            <div className="py-2 max-h-[60vh] overflow-y-auto" role="listbox">
              {sortOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSortBy(option.id);
                    setShowSortSheet(false);
                  }}
                  role="option"
                  aria-selected={sortBy === option.id}
                  className={cn(
                    'w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors',
                    sortBy === option.id && 'text-primary'
                  )}
                >
                  <span className={cn(sortBy === option.id && 'font-medium')}>{option.label}</span>
                  {sortBy === option.id && (
                    <Check className="w-5 h-5 text-primary" aria-hidden="true" />
                  )}
                </button>
              ))}
            </div>
            {/* 하단 여백 (safe area) */}
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* 제품 그리드 */}
      <main className="px-4 py-4 space-y-6">
        {/* 피부타입별 오늘의 랭킹 (화해 스타일) */}
        {hasAnalysis && (
          <FadeInUp delay={6}>
            <section className="bg-card rounded-2xl border p-4" aria-label="오늘의 랭킹">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" aria-hidden="true" />
                  {getSkinTypeLabel(userSkinType)} TOP 5
                </h2>
                <span className="text-xs text-muted-foreground">실시간 업데이트</span>
              </div>
              <div className="space-y-2">
                {rankingBySkinType[userSkinType].map((product) => (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/beauty/${product.id}`)}
                    className="w-full flex items-center gap-3 bg-card rounded-xl border p-3 hover:shadow-md hover:bg-muted/30 transition-all duration-200 group"
                  >
                    {/* 순위 */}
                    <div
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0',
                        product.rank === 1
                          ? 'bg-yellow-500 text-white'
                          : product.rank === 2
                            ? 'bg-gray-400 text-white'
                            : product.rank === 3
                              ? 'bg-amber-700 text-white'
                              : 'bg-muted text-muted-foreground'
                      )}
                    >
                      {product.rank === 1 ? (
                        <Crown className="w-4 h-4" aria-hidden="true" />
                      ) : (
                        product.rank
                      )}
                    </div>

                    {/* 제품 이미지 */}
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-muted to-muted/50 overflow-hidden shrink-0">
                      {/* 실제 이미지 로드 시 next/image 사용 */}
                    </div>

                    {/* 제품 정보 */}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs text-muted-foreground">{product.brand}</p>
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Star
                          className="w-3 h-3 fill-yellow-400 text-yellow-400"
                          aria-hidden="true"
                        />
                        <span className="text-xs font-medium">{product.rating}</span>
                        <span className="text-xs text-muted-foreground">
                          ({product.reviews.toLocaleString()})
                        </span>
                      </div>
                    </div>

                    {/* 순위 변동 */}
                    <div className="shrink-0">
                      {product.change === 'up' && (
                        <div className="flex items-center gap-0.5 text-green-500">
                          <TrendingUp className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs font-medium">{product.changeAmount}</span>
                        </div>
                      )}
                      {product.change === 'down' && (
                        <div className="flex items-center gap-0.5 text-red-500">
                          <TrendingDown className="w-4 h-4" aria-hidden="true" />
                          <span className="text-xs font-medium">{product.changeAmount}</span>
                        </div>
                      )}
                      {product.change === 'same' && (
                        <div className="flex items-center text-muted-foreground">
                          <Minus className="w-4 h-4" aria-hidden="true" />
                        </div>
                      )}
                      {product.change === 'new' && (
                        <span className="text-xs font-bold text-primary px-1.5 py-0.5 bg-primary/10 rounded">
                          NEW
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {/* 다른 피부타입 랭킹 보기 */}
              <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                {skinTypes
                  .filter((t) => t.id !== userSkinType)
                  .map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        // 해당 피부타입 필터로 이동
                        setSelectedSkinTypes([type.id]);
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      {type.label} 랭킹
                    </button>
                  ))}
              </div>
            </section>
          </FadeInUp>
        )}

        {/* 제품 목록 */}
        <FadeInUp delay={7}>
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />
                {hasAnalysis ? '내 피부 맞춤' : '인기 제품'}
              </h2>
              <span className="text-sm text-muted-foreground">
                {productsLoading ? '로딩...' : `${products.length}개 제품`}
              </span>
            </div>
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-card rounded-2xl border p-3 animate-pulse">
                    <div className="w-full aspect-square bg-muted rounded-xl mb-3" />
                    <div className="h-3 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>조건에 맞는 제품이 없습니다.</p>
                <p className="text-sm mt-1">필터를 조정해 보세요.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/beauty/${product.id}`)}
                    className="bg-card rounded-2xl border p-3 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                  >
                    {/* 제품 이미지 */}
                    <div className="w-full aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl mb-3 relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {hasAnalysis && (
                        <div
                          className={cn(
                            'absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-bold z-10',
                            product.matchRate >= 95
                              ? 'bg-green-500 text-white'
                              : product.matchRate >= 90
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                          )}
                        >
                          {product.matchRate}%
                        </div>
                      )}
                    </div>

                    {/* 브랜드 */}
                    <p className="text-xs text-muted-foreground">{product.brand}</p>

                    {/* 제품명 */}
                    <p className="text-sm font-medium line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                      {product.name}
                    </p>

                    {/* 평점 및 리뷰 */}
                    <div className="flex items-center gap-1.5 mt-2">
                      <Star
                        className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400"
                        aria-hidden="true"
                      />
                      <span className="text-xs font-medium">{product.rating}</span>
                      <span className="text-xs text-muted-foreground">
                        ({product.reviews.toLocaleString()})
                      </span>
                    </div>

                    {/* 가격 */}
                    <p className="text-sm font-bold mt-2">{formatPrice(product.price)}원</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </FadeInUp>

        {/* 스킨케어 루틴 (하이브리드 UX) */}
        {hasAnalysis && (
          <FadeInUp delay={8}>
            <SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />
          </FadeInUp>
        )}

        {/* 피부나이 계산기 (하이브리드 UX) */}
        {hasAnalysis && (
          <FadeInUp delay={9}>
            <SkinAgeCalculator
              actualAge={28}
              skinMetrics={{
                hydration: 72,
                oil: 45,
                elasticity: 68,
                wrinkles: 25,
                pores: 35,
                pigmentation: 30,
              }}
            />
          </FadeInUp>
        )}

        {/* 영양제 추천 */}
        <FadeInUp delay={10}>
          <section className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/30 p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Pill className="w-4 h-4 text-green-600" aria-hidden="true" />
              </div>
              이너뷰티 추천
              <span className="text-xs text-muted-foreground">(피부 개선용)</span>
            </h2>
            <p className="text-sm text-muted-foreground">
              비타민C, 콜라겐, 오메가3로 피부 속부터 관리하세요
            </p>
            <button
              onClick={() => router.push('/beauty?category=supplements')}
              className="mt-3 text-sm text-green-700 dark:text-green-400 font-medium hover:underline"
            >
              영양제 보러가기 →
            </button>
          </section>
        </FadeInUp>

        {/* 주의 성분 알림 */}
        {hasAnalysis && (
          <FadeInUp delay={9}>
            <section className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800/30 p-4">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
                </div>
                주의 성분 알림
              </h2>
              <p className="text-sm text-muted-foreground">
                내 피부에 맞지 않는 성분이 포함된 제품을 알려드려요
              </p>
              <button
                onClick={() => router.push('/profile/analysis?tab=warnings')}
                className="mt-3 text-sm text-orange-700 dark:text-orange-400 font-medium hover:underline"
              >
                주의 성분 확인하기 →
              </button>
            </section>
          </FadeInUp>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
