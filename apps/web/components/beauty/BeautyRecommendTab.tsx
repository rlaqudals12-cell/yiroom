'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  Star,
  ChevronDown,
  Sparkles,
  Droplets,
  Sun,
  Shield,
  Zap,
  Check,
  Flame,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { classifyByRange } from '@/lib/utils/conditional-helpers';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { IngredientFavoriteFilter } from '@/components/beauty/IngredientFavoriteFilter';
import { AgeGroupFilter } from '@/components/beauty/AgeGroupFilter';
import type { FavoriteItem, AgeGroup } from '@/types/hybrid';
import type { MatchReason, AnyProduct, ProductWithMatch } from '@/types/product';

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

// 대분류 카테고리
// DB(cosmetic_products)의 category 컬럼은 이미 세분류 값(serum/toner/moisturizer/...)이라
// 대분류는 "DB category 값의 집합"으로 매핑한다 (실DB 값 검증 2026-07-08).
type MainCategory = 'all' | 'cleansing' | 'skincare' | 'suncare' | 'makeup' | 'mask';
const mainCategories: { id: MainCategory; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'cleansing', label: '클렌징' },
  { id: 'skincare', label: '스킨케어' },
  { id: 'suncare', label: '선케어' },
  { id: 'makeup', label: '메이크업' },
  { id: 'mask', label: '마스크/팩' },
];

// 대분류 → DB category 값 집합
const CATEGORY_MAP: Record<MainCategory, string[]> = {
  all: [],
  cleansing: ['cleanser'],
  skincare: ['toner', 'essence', 'serum', 'moisturizer', 'eye_cream', 'lip_care'],
  suncare: ['sunscreen'],
  makeup: ['makeup'],
  mask: ['mask'],
};

// 세부 카테고리 — DB 실값 기준 필터 정의.
// 스킨케어 세분류는 DB category 자체가 세분류 값이고, 나머지는 subcategory 컬럼(kebab-case)을 쓴다.
interface SubCategoryDef {
  id: string;
  label: string;
  /** 필터 대상 컬럼 */
  column: 'category' | 'subcategory';
  /** DB 실값 목록 (2026-07-08 prod 실쿼리 검증) */
  values: string[];
}

const subCategories: Record<MainCategory, SubCategoryDef[]> = {
  all: [],
  cleansing: [
    { id: 'cleansing_foam', label: '클렌징폼', column: 'subcategory', values: ['foam'] },
    {
      id: 'cleansing_oil',
      label: '클렌징오일',
      column: 'subcategory',
      values: ['oil', 'cleansing-oil'],
    },
    {
      id: 'cleansing_water',
      label: '클렌징워터',
      column: 'subcategory',
      values: ['cleansing-water', 'micellar'],
    },
    { id: 'cleansing_gel', label: '클렌징젤', column: 'subcategory', values: ['gel'] },
    {
      id: 'cleansing_balm',
      label: '클렌징밤',
      column: 'subcategory',
      values: ['cleansing-balm', 'balm'],
    },
    {
      id: 'scrub_peeling',
      label: '스크럽/필링',
      column: 'subcategory',
      values: ['scrub', 'powder-wash'],
    },
  ],
  skincare: [
    { id: 'toner', label: '스킨/토너', column: 'category', values: ['toner'] },
    { id: 'essence', label: '에센스', column: 'category', values: ['essence'] },
    { id: 'serum', label: '세럼/앰플', column: 'category', values: ['serum'] },
    { id: 'moisturizer', label: '로션/크림', column: 'category', values: ['moisturizer'] },
    { id: 'eye_cream', label: '아이크림', column: 'category', values: ['eye_cream'] },
    { id: 'lip_care', label: '립케어', column: 'category', values: ['lip_care'] },
  ],
  suncare: [
    {
      id: 'sun_cream',
      label: '선크림',
      column: 'subcategory',
      values: ['cream', 'physical', 'mineral', 'fluid', 'milk', 'tone-up'],
    },
    { id: 'sun_stick', label: '선스틱', column: 'subcategory', values: ['stick'] },
    { id: 'sun_cushion', label: '선쿠션', column: 'subcategory', values: ['cushion'] },
  ],
  makeup: [
    { id: 'lip', label: '립', column: 'subcategory', values: ['lip', 'lip-gloss', 'lip-liner'] },
    {
      id: 'base',
      label: '베이스',
      column: 'subcategory',
      values: ['foundation', 'cushion', 'concealer', 'primer', 'powder'],
    },
    {
      id: 'eye',
      label: '아이',
      column: 'subcategory',
      values: ['eyeshadow', 'eyeliner', 'mascara', 'brow'],
    },
    {
      id: 'cheek',
      label: '치크/하이라이터',
      column: 'subcategory',
      values: ['blush', 'highlighter', 'contour'],
    },
  ],
  mask: [
    {
      id: 'sheet_mask',
      label: '시트마스크',
      column: 'subcategory',
      values: ['sheet-mask', 'sheet'],
    },
    {
      id: 'wash_off',
      label: '워시오프팩',
      column: 'subcategory',
      values: ['wash-off-mask', 'wash-off'],
    },
    { id: 'sleeping_pack', label: '슬리핑팩', column: 'subcategory', values: ['sleeping-mask'] },
    { id: 'peel_off', label: '필오프팩', column: 'subcategory', values: ['peel-off-mask'] },
  ],
};

// 매칭 필터 임계값 — 현 매칭 점수 분포(스킨케어 상한 ~77+α, 메이크업 ~100)에서
// 90은 사실상 도달 불가라 80으로 설정. 0개면 자동 완화 + 안내 (아래 fetch 로직 참조)
const MATCH_FILTER_THRESHOLD = 80;

// 정렬 옵션
// 평점/리뷰수는 DB에 대부분 null이라 정렬 축으로 쓰면 순서가 사실상 무의미 —
// 실데이터가 있는 축(매칭률/등록일/이름/가격)만 제공 (정직 원칙)
type SortOption = 'match' | 'latest' | 'name' | 'price_low' | 'price_high';
const sortOptions: { id: SortOption; label: string }[] = [
  { id: 'match', label: '매칭률순' },
  { id: 'latest', label: '최신순' },
  { id: 'name', label: '이름순' },
  { id: 'price_low', label: '가격 낮은순' },
  { id: 'price_high', label: '가격 높은순' },
];

// 제품 타입 정의 (matchReasons 포함 — E1)
interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  /** 실제 평점 (없으면 null — UI에서 미표시) */
  rating: number | null;
  reviews: number;
  matchRate: number;
  price: number;
  imageUrl: string;
  category?: string;
  keyIngredients?: string[];
  matchReasons?: MatchReason[];
}

// 이미지 placeholder 생성
// 이미지 없는 제품은 단색 블록 대신 브랜드명을 새긴 라벨 타일로 표시 (빈 색블록 = 깨진 것처럼 보임 방지).
function getProductImageUrl(imageUrl: string | null | undefined, brand: string): string {
  if (imageUrl) return imageUrl;
  const colors = ['fce7f3', 'dbeafe', 'd1fae5', 'fef3c7', 'ede9fe', 'ffedd5'];
  const colorIndex = brand.charCodeAt(0) % colors.length;
  const label = encodeURIComponent(brand.slice(0, 4));
  return `https://placehold.co/400x400/${colors[colorIndex]}/64748b?text=${label}`;
}

// 성분 매칭 확인
function hasMatchingIngredient(ingredients: string[] | undefined | null, names: string[]): boolean {
  return (
    ingredients?.some((ing) => names.some((name) => ing.toLowerCase().includes(name))) ?? false
  );
}

// E5: 교차 모듈 매칭 서술 생성
function getMatchNarrative(reasons: MatchReason[]): string | null {
  const matched = reasons.filter((r) => r.matched);
  if (matched.length === 0) return null;

  // 2개+ 모듈이 매칭되면 교차 인사이트
  if (matched.length >= 2) {
    return `${matched[0].label}이고 ${matched[1].label}이라 잘 맞는 제품이에요`;
  }

  // 단일 매칭 서술
  return `${matched[0].label}에 맞는 제품이에요`;
}

interface BeautyRecommendTabProps {
  hasAnalysis: boolean;
  userSkinType: SkinType;
  userSkinConcerns: SkinConcern[];
  personalColor: string | null;
  getMatchedProducts: <T extends AnyProduct>(products: T[]) => ProductWithMatch<T>[];
  /** 큐레이션/딥링크에서 전달된 초기 카테고리 (기본 'all') */
  initialMainCategory?: MainCategory;
  /** 딥링크 세부 카테고리 프리셋 (예: 'lip' — "코랄 립 보러가기"가 립에 착지) */
  initialSubCategory?: string | null;
  /** 딥링크 톤→시즌 필터 (예: ['Spring','Autumn']) — 개인색 필터 반영 */
  initialSeasons?: Array<'Spring' | 'Summer' | 'Autumn' | 'Winter'> | null;
}

export function BeautyRecommendTab({
  hasAnalysis,
  userSkinType,
  userSkinConcerns,
  personalColor: _personalColor,
  getMatchedProducts,
  initialMainCategory = 'all',
  initialSubCategory = null,
  initialSeasons = null,
}: BeautyRecommendTabProps): React.ReactElement {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();

  // 필터 상태 (탭 내부)
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<SkinType[]>(['combination']);
  const [selectedConcerns, setSelectedConcerns] = useState<SkinConcern[]>(['hydration']);
  const [mainCategory, setMainCategory] = useState<MainCategory>(initialMainCategory);
  // 딥링크 세부 카테고리 프리셋 반영 (예: category=lip → 립)
  const [subCategory, setSubCategory] = useState<string | null>(initialSubCategory);
  const [sortBy, setSortBy] = useState<SortOption>('match');
  const [showSortSheet, setShowSortSheet] = useState(false);
  // 매칭 필터는 기본 OFF — 기본 상태에서는 제품이 보여야 한다 (0개 화면 방지)
  const [matchFilterOn, setMatchFilterOn] = useState(false);
  // 매칭 필터 ON인데 임계 이상 제품이 0개라 자동 완화된 상태 (안내 표시용)
  const [matchFilterRelaxed, setMatchFilterRelaxed] = useState(false);

  // 하이브리드 UX 상태
  const [favoriteIngredients, setFavoriteIngredients] = useState<FavoriteItem[]>([]);
  const [avoidIngredients, setAvoidIngredients] = useState<FavoriteItem[]>([]);
  const [selectedAgeGroups, setSelectedAgeGroups] = useState<AgeGroup[]>([]);

  // 제품 데이터 상태
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // 훅에서 분석 결과 로드 시 필터 상태 동기화
  useEffect(() => {
    if (hasAnalysis) {
      if (userSkinType) {
        setSelectedSkinTypes([userSkinType]);
      }
      if (userSkinConcerns.length > 0) {
        setSelectedConcerns(userSkinConcerns);
      }
    }
  }, [hasAnalysis, userSkinType, userSkinConcerns]);

  // 제품 데이터 조회
  useEffect(() => {
    // eslint-disable-next-line sonarjs/cognitive-complexity -- complex business logic
    const fetchProducts = async (): Promise<void> => {
      setProductsLoading(true);
      setProductsError(false);
      try {
        let query = supabase
          .from('cosmetic_products')
          .select(
            'id, name, brand, category, price_krw, rating, review_count, image_url, skin_types, concerns, personal_color_seasons, key_ingredients, target_age_groups'
          )
          .eq('is_active', true)
          .limit(40);

        if (mainCategory !== 'all') {
          const subDef = subCategory
            ? subCategories[mainCategory].find((s) => s.id === subCategory)
            : null;

          if (subDef?.column === 'category') {
            // 스킨케어 세분류: DB category 자체가 세분류 값 (예: '세럼/앰플' → category='serum')
            query = query.in('category', subDef.values);
          } else {
            const dbCategories = CATEGORY_MAP[mainCategory];
            if (dbCategories.length > 0) {
              query = query.in('category', dbCategories);
            }
            // subcategory 값(gel 등)은 카테고리 간 중복되므로 category 제한과 함께 적용
            if (subDef) {
              query = query.in('subcategory', subDef.values);
            }
          }
        }

        // 태그 배열 필터: 태그가 없는(null) 제품을 배제하지 않는다.
        // DB의 87%(2,459/2,821)가 skin_types 미태깅이라 overlap 필터만 쓰면 사실상 전멸 —
        // "모름"은 "불일치"가 아니므로 null은 통과시키고, 태깅된 불일치만 거른다 (정직 원칙)
        if (selectedSkinTypes.length > 0) {
          query = query.or(`skin_types.ov.{${selectedSkinTypes.join(',')}},skin_types.is.null`);
        }

        if (selectedConcerns.length > 0) {
          query = query.or(`concerns.ov.{${selectedConcerns.join(',')}},concerns.is.null`);
        }

        // 딥링크 톤→시즌 필터: 태깅된 시즌이 겹치거나(개인색 매칭) 미태깅(null)이면 통과.
        // 87% 미태깅 현실상 null을 배제하면 전멸하므로 "모름"은 통과시킨다 (정직 원칙).
        if (initialSeasons && initialSeasons.length > 0) {
          query = query.or(
            `personal_color_seasons.ov.{${initialSeasons.join(',')}},personal_color_seasons.is.null`
          );
        }

        if (selectedAgeGroups.length > 0) {
          const dbAgeGroups = selectedAgeGroups.map((age) => (age === '50plus' ? '50s' : age));
          query = query.or(
            `target_age_groups.ov.{${dbAgeGroups.join(',')}},target_age_groups.is.null`
          );
        }

        switch (sortBy) {
          case 'name':
            query = query.order('name', { ascending: true });
            break;
          case 'price_low':
            query = query.order('price_krw', { ascending: true });
            break;
          case 'price_high':
            query = query.order('price_krw', { ascending: false });
            break;
          // latest 및 match(클라이언트 정렬)의 DB 기본 순서는 최신 등록순
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query;

        if (error) {
          console.error('[Beauty] 제품 조회 실패:', error);
          return;
        }

        // getMatchedProducts로 매칭 점수 + 이유 계산 (E1: 인과 연결)
        const rawProducts = (data || []).map((row) => ({
          id: row.id,
          name: row.name,
          brand: row.brand,
          category: row.category as string,
          // 평점 없는 제품에 가짜 기본값(4.0)을 채우지 않는다 — null이면 미표시 (정직 원칙)
          rating: row.rating ?? null,
          reviewCount: row.review_count ?? 0,
          priceKrw: row.price_krw ?? 0,
          imageUrl: getProductImageUrl(row.image_url, row.brand),
          keyIngredients: row.key_ingredients ?? [],
          skinTypes: row.skin_types,
          concerns: row.concerns,
          personalColorSeasons: row.personal_color_seasons,
        }));

        const matched = hasAnalysis
          ? getMatchedProducts(rawProducts as unknown as AnyProduct[])
          : rawProducts.map((p) => ({
              product: p,
              matchScore: 75,
              matchReasons: [] as MatchReason[],
            }));

        const mappedProducts: BeautyProduct[] = matched.map((m) => {
          const p = m.product as (typeof rawProducts)[number];
          return {
            id: p.id,
            name: p.name,
            brand: p.brand,
            category: p.category,
            rating: p.rating,
            reviews: p.reviewCount,
            matchRate: m.matchScore,
            price: p.priceKrw,
            imageUrl: p.imageUrl,
            keyIngredients: p.keyIngredients,
            matchReasons: m.matchReasons,
          };
        });

        // 매칭률 정렬은 클라이언트 계산 값이므로 여기서 정렬
        if (sortBy === 'match') {
          mappedProducts.sort((a, b) => b.matchRate - a.matchRate);
        }

        // 매칭 필터 적용 — 임계 이상이 0개면 자동 완화(매칭률순 전체 표시) + 안내
        let filteredProducts = mappedProducts;
        let relaxed = false;
        if (matchFilterOn && hasAnalysis) {
          const aboveThreshold = mappedProducts.filter(
            (p) => p.matchRate >= MATCH_FILTER_THRESHOLD
          );
          if (aboveThreshold.length > 0) {
            filteredProducts = aboveThreshold;
          } else if (mappedProducts.length > 0) {
            relaxed = true;
            filteredProducts = [...mappedProducts].sort((a, b) => b.matchRate - a.matchRate);
          }
        }
        setMatchFilterRelaxed(relaxed);

        // 선호 성분 필터
        if (favoriteIngredients.length > 0) {
          const favoriteNames = favoriteIngredients.map((f) => f.itemName.toLowerCase());
          filteredProducts = filteredProducts.filter((p) =>
            hasMatchingIngredient(p.keyIngredients, favoriteNames)
          );
        }

        // 기피 성분 필터
        if (avoidIngredients.length > 0) {
          const avoidNames = avoidIngredients.map((a) => a.itemName.toLowerCase());
          filteredProducts = filteredProducts.filter(
            (p) => !hasMatchingIngredient(p.keyIngredients, avoidNames)
          );
        }

        setProducts(filteredProducts);
      } catch (err) {
        console.error('[Beauty] 제품 조회 오류:', err);
        setProductsError(true);
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
    selectedAgeGroups,
    favoriteIngredients,
    avoidIngredients,
    sortBy,
    matchFilterOn,
    hasAnalysis,
    getMatchedProducts,
    retryCount,
    initialSeasons,
  ]);

  const handleMainCategoryChange = (cat: MainCategory): void => {
    setMainCategory(cat);
    setSubCategory(null);
  };

  const toggleSkinType = (type: SkinType): void => {
    setSelectedSkinTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const toggleConcern = (concern: SkinConcern): void => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('ko-KR').format(price);
  };

  return (
    <div data-testid="beauty-recommend-tab">
      {/* D5: 분석 완료 사용자 대상 발견 텍스트 */}
      {hasAnalysis && products.length > 0 && !productsLoading && (
        <p className="text-sm text-muted-foreground px-4 pt-3" data-testid="beauty-discovery-text">
          오늘의 추천은 내 피부 분석 결과에 맞춰 골랐어요
        </p>
      )}

      {/* 피부타입 필터 칩 — B2: min-h-[44px] */}
      <section
        className="px-4 py-3 border-b"
        aria-label="피부타입 필터"
        data-testid="beauty-filter-skin-type"
      >
        <p className="text-xs text-muted-foreground mb-2 font-medium">피부타입</p>
        <div className="flex gap-2 flex-wrap">
          {skinTypes.map((type) => {
            const isSelected = selectedSkinTypes.includes(type.id);
            return (
              <button
                key={type.id}
                onClick={() => toggleSkinType(type.id)}
                className={cn(
                  'px-3 py-2.5 min-h-[44px] rounded-full text-sm font-medium transition-all duration-200',
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                aria-pressed={isSelected}
                data-testid={`beauty-chip-skin-${type.id}`}
              >
                {isSelected && <Check className="w-3 h-3 inline mr-1" aria-hidden="true" />}
                {type.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 피부고민 필터 — B2: min-h-[44px] */}
      <section
        className="px-4 py-3 border-b overflow-x-auto"
        aria-label="피부고민 필터"
        data-testid="beauty-filter-concern"
      >
        <p className="text-xs text-muted-foreground mb-2 font-medium">피부고민</p>
        <div className="flex gap-2 pb-1">
          {skinConcerns.map((concern) => {
            const isSelected = selectedConcerns.includes(concern.id);
            return (
              <button
                key={concern.id}
                onClick={() => toggleConcern(concern.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2.5 min-h-[44px] rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200',
                  isSelected
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
                aria-pressed={isSelected}
                data-testid={`beauty-chip-concern-${concern.id}`}
              >
                {concern.icon}
                {concern.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 성분/연령대 필터 */}
      <section
        className="px-4 py-3 border-b flex flex-wrap items-center gap-3"
        aria-label="추가 필터"
        data-testid="beauty-filter-extra"
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

      {/* 대분류 카테고리 탭 */}
      <nav
        className="px-4 py-3 border-b overflow-x-auto"
        aria-label="대분류 카테고리"
        data-testid="beauty-category-nav"
      >
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

      {/* 세부 카테고리 — B2: min-h-[44px] */}
      {mainCategory !== 'all' && subCategories[mainCategory].length > 0 && (
        <nav className="px-4 py-2 border-b overflow-x-auto bg-muted/30" aria-label="세부 카테고리">
          <div className="flex gap-2 pb-1">
            <button
              onClick={() => setSubCategory(null)}
              className={cn(
                'px-3 py-2 min-h-[44px] rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
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
                  'px-3 py-2 min-h-[44px] rounded-full text-xs font-medium whitespace-nowrap transition-all duration-200',
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
      )}

      {/* 정렬 및 매칭 필터 */}
      <div
        className="px-4 py-3 border-b flex items-center justify-between"
        data-testid="beauty-sort-bar"
      >
        <button
          onClick={() => setShowSortSheet(true)}
          className="flex items-center gap-1 text-sm text-foreground"
          aria-haspopup="dialog"
          data-testid="beauty-sort-button"
        >
          {sortOptions.find((s) => s.id === sortBy)?.label}
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </button>

        {hasAnalysis ? (
          <button
            onClick={() => setMatchFilterOn(!matchFilterOn)}
            className="flex items-center gap-2"
            role="switch"
            aria-checked={matchFilterOn}
            aria-label={`${MATCH_FILTER_THRESHOLD}% 이상 매칭 제품만 표시`}
            data-testid="beauty-match-toggle"
          >
            <span className="text-sm text-muted-foreground">{MATCH_FILTER_THRESHOLD}%+ 매칭</span>
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
        ) : (
          <button
            onClick={() => router.push('/analysis/skin')}
            className="text-xs text-primary font-medium hover:underline"
          >
            분석하면 매칭률 확인
          </button>
        )}
      </div>

      {/* 정렬 Bottom Sheet */}
      {showSortSheet && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="정렬 기준 선택"
          data-testid="beauty-sort-sheet"
        >
          <div
            className="absolute inset-0 bg-black/50 transition-opacity"
            onClick={() => setShowSortSheet(false)}
            aria-hidden="true"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
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
            <div className="h-6" />
          </div>
        </div>
      )}

      {/* 콘텐츠 영역 */}
      <div className="px-4 py-4 space-y-6">
        {/* 매칭 필터 자동 완화 안내 — 임계 이상 제품이 없을 때 숨기는 대신 정직하게 알리고 전체 표시 */}
        {matchFilterOn && matchFilterRelaxed && !productsLoading && (
          <p
            className="text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2"
            role="status"
            data-testid="beauty-match-relaxed-notice"
          >
            {MATCH_FILTER_THRESHOLD}% 이상 매칭 제품이 없어 매칭률이 높은 순서로 모두 보여드려요
          </p>
        )}

        {/* 제품 목록 */}
        <section data-testid="beauty-product-grid">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" aria-hidden="true" />
              {hasAnalysis ? '내 피부 맞춤' : '추천 제품'}
            </h2>
            <span className="text-sm text-muted-foreground">
              {productsLoading ? '로딩...' : `${products.length}개 제품`}
            </span>
          </div>

          {/* 로딩 스켈레톤 */}
          {productsLoading && (
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
          )}

          {/* 에러 상태 — D9: 제안형 */}
          {!productsLoading && productsError && (
            <div className="text-center py-12 text-muted-foreground">
              <p>제품을 불러오지 못했어요</p>
              <p className="text-sm mt-1">네트워크 연결을 확인해 보세요</p>
              <button
                onClick={() => setRetryCount((c) => c + 1)}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 빈 상태 — D7: 호기심 유도 */}
          {!productsLoading && !productsError && products.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <p>아직 딱 맞는 제품을 찾지 못했어요</p>
              <p className="text-sm mt-1">필터를 조정하면 숨겨진 제품을 발견할 수 있어요</p>
              <button
                onClick={() => {
                  // 초기화 = 필터 전부 해제 (기본값 재주입이 아니라, 제품이 보이는 상태로 복귀)
                  setSelectedSkinTypes([]);
                  setSelectedConcerns([]);
                  setSelectedAgeGroups([]);
                  setMainCategory('all');
                  setSubCategory(null);
                  setMatchFilterOn(false);
                }}
                className="mt-3 text-sm text-primary font-medium hover:underline"
              >
                필터 초기화
              </button>
            </div>
          )}

          {/* 제품 그리드 — E1/E5/E7: 매칭 이유 표시 */}
          {!productsLoading && products.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <button
                  key={product.id}
                  onClick={() => router.push(`/beauty/${product.id}`)}
                  className="bg-card rounded-2xl border p-3 text-left hover:shadow-lg hover:scale-[1.02] transition-all duration-200 group"
                  data-testid={`beauty-product-${product.id}`}
                >
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
                          classifyByRange(product.matchRate, [
                            { max: 90, result: 'bg-muted text-muted-foreground' },
                            { min: 90, max: 95, result: 'bg-primary text-primary-foreground' },
                            { min: 95, result: 'bg-green-500 text-white' },
                          ])
                        )}
                      >
                        {product.matchRate}%
                      </div>
                    )}
                    {/* D5: 90%+ 찰떡 매칭 뱃지 */}
                    {hasAnalysis && product.matchRate >= 95 && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-yellow-400 text-yellow-900 z-10">
                        찰떡
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{product.brand}</p>
                  <p className="text-sm font-medium line-clamp-2 mt-0.5 group-hover:text-primary transition-colors">
                    {product.name}
                  </p>

                  {/* E1/E5/E7: 매칭 이유 서술 */}
                  {hasAnalysis && product.matchReasons && product.matchReasons.length > 0 && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">
                      {getMatchNarrative(product.matchReasons) || ''}
                    </p>
                  )}

                  {/* 평점은 실데이터가 있을 때만 표시 (null → 미표시) */}
                  {product.rating != null && product.reviews > 0 && (
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
                  )}
                  <p className="text-sm font-bold mt-2">{formatPrice(product.price)}원</p>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
