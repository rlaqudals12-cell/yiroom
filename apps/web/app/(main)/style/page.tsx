'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { User, Palette, Eye, Shirt, Star, Sparkles, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { getBodyShapeLabel } from '@/lib/body';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { MaterialFavoriteFilter } from '@/components/style/MaterialFavoriteFilter';
import { OutfitRoutineCard, type OutfitItem } from '@/components/style/OutfitRoutineCard';
import { LookbookFeed } from '@/components/style/LookbookFeed';
import type { FavoriteItem, LookbookPost } from '@/types/hybrid';
import {
  suggestOutfitFromCloset,
  type BodyType3,
  type ClosetRecommendation,
} from '@/lib/inventory/client';
import { colorNameToHex } from '@/lib/inventory/color-bridge';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

/**
 * 스타일 탭 - 룩핀 스타일 코디 피드
 * - 내 체형 프로필 표시
 * - 내 컬러 팔레트
 * - 체형 맞춤 필터 토글
 * - 카테고리 필터 (전체/상의/하의/아우터/코디)
 * - 오늘의 코디 추천
 * - 맞춤 아이템 추천
 * - 비슷한 체형 리뷰
 * - 오늘 뭐 입지? AI 추천
 */

type Category = 'all' | 'tops' | 'bottoms' | 'outer' | 'outfit';

const categories: { id: Category; label: string }[] = [
  { id: 'all', label: '전체' },
  { id: 'tops', label: '상의' },
  { id: 'bottoms', label: '하의' },
  { id: 'outer', label: '아우터' },
  { id: 'outfit', label: '코디' },
];

interface ColorItem {
  name: string;
  color: string;
}

interface ProductItem {
  id: string;
  name: string;
  brand: string;
  rating: number;
  matchRate: number;
  price: number;
}

export default function StylePage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const supabase = useClerkSupabaseClient();
  const [category, setCategory] = useState<Category>('all');
  const [matchFilterOn, setMatchFilterOn] = useState(true);

  // 분석 결과 상태
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [bodyType, setBodyType] = useState<string | null>(null);
  const [personalColor, setPersonalColor] = useState<string | null>(null);
  const [height, setHeight] = useState<string | null>(null);
  const [feature, setFeature] = useState<string | null>(null);

  // 코디 매칭용 원본 코드값 (라벨과 별도 — closetMatcher 계약)
  const [rawBodyType, setRawBodyType] = useState<BodyType3 | null>(null);
  const [rawSeason, setRawSeason] = useState<PersonalColorSeason | null>(null);
  const [closetItems, setClosetItems] = useState<InventoryItem[]>([]);

  // DB 연결 데이터
  const [colorPalette, setColorPalette] = useState<ColorItem[]>([]);
  const [products] = useState<ProductItem[]>([]); // 패션 제품 DB 미보유 — 빈 상태 유지 (유령 쿼리 제거, 2026-07-08)

  // L-1-2: 키/몸무게 체크 상태
  const [hasMeasurements, setHasMeasurements] = useState<boolean | null>(null);

  // L-1-2: 키/몸무게 필수 게이트 체크
  useEffect(() => {
    const checkMeasurements = async () => {
      if (!isLoaded || !user?.id) return;

      try {
        const res = await fetch('/api/user/measurements');
        const data = await res.json();

        if (!data.hasMeasurements) {
          // 키/몸무게 없어도 페이지 표시 (인라인 안내로 변경)
          setHasMeasurements(false);
          return;
        }

        setHasMeasurements(true);
      } catch (err) {
        console.error('[Style] Measurements check error:', err);
        // 에러 시에도 페이지 표시 (graceful degradation)
        setHasMeasurements(true);
      }
    };

    checkMeasurements();
  }, [isLoaded, user?.id, router]);

  // 체형 분석 결과 적용
  const applyBodyData = (
    bodyData: { body_type: string; height: number | null; concerns: unknown } | null
  ) => {
    if (!bodyData) return;
    setBodyType(getBodyShapeLabel(bodyData.body_type));
    if (['S', 'W', 'N'].includes(bodyData.body_type)) {
      setRawBodyType(bodyData.body_type as BodyType3);
    }
    setHeight(bodyData.height ? `${bodyData.height}cm` : null);
    const concerns = bodyData.concerns as string[] | null;
    setFeature(concerns?.[0] || null);
  };

  // 퍼스널컬러 분석 결과 적용 — 실제 컬럼은 season("Spring")/undertone
  // (기존 result_season/result_tone은 유령 컬럼 — 이 섹션 전체가 죽어있던 원인)
  const applyPcData = (
    pcData: { season: string; undertone: string | null; best_colors: unknown } | null
  ) => {
    if (!pcData) return;
    setPersonalColor(pcData.undertone ? `${pcData.season} ${pcData.undertone}` : pcData.season);
    if (['Spring', 'Summer', 'Autumn', 'Winter'].includes(pcData.season)) {
      setRawSeason(pcData.season as PersonalColorSeason);
    }
    const bestColors = pcData.best_colors as Array<{
      name?: string;
      hex?: string;
      color?: string;
    }> | null;
    if (bestColors && bestColors.length > 0) {
      setColorPalette(
        bestColors.slice(0, 6).map((c) => ({
          name: c.name ?? '',
          color: c.hex ?? c.color ?? '#ccc',
        }))
      );
    }
  };

  // 분석 결과 + 제품 데이터 가져오기 (키/몸무게 체크 후)
  useEffect(() => {
    const fetchAnalysis = async () => {
      // 키/몸무게 체크 완료 후 분석 데이터 로드 (측정값 없어도 분석 결과는 표시)
      if (!isLoaded || !user?.id || hasMeasurements === null) return;

      try {
        const [bodyResult, pcResult, closetResult] = await Promise.all([
          supabase
            .from('body_analyses')
            .select('body_type, height, concerns')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          supabase
            .from('personal_color_assessments')
            .select('season, undertone, best_colors')
            .eq('clerk_user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // 내 옷장 — 오늘의 코디는 상품이 아니라 내 옷으로 (기존 fashion 제품
          // 쿼리는 유령 컬럼(product_name/color_hex)+없는 카테고리라 항상 실패했음)
          supabase
            .from('user_inventory')
            .select('*')
            .eq('clerk_user_id', user.id)
            .eq('category', 'closet')
            .order('created_at', { ascending: false }),
        ]);

        const bodyData = bodyResult.data;
        const pcData = pcResult.data;

        if (bodyData || pcData) {
          setHasAnalysis(true);
          applyBodyData(bodyData);
          applyPcData(pcData);
        }

        // 옷장 아이템 매핑 (코디 매칭 계약 InventoryItem으로)
        if (closetResult.data && closetResult.data.length > 0) {
          setClosetItems(
            (closetResult.data as InventoryItemDB[]).map((row) => ({
              id: row.id,
              clerkUserId: row.clerk_user_id,
              category: row.category,
              subCategory: row.sub_category,
              name: row.name,
              imageUrl: row.image_url,
              originalImageUrl: row.original_image_url,
              brand: row.brand,
              tags: row.tags,
              isFavorite: row.is_favorite,
              useCount: row.use_count,
              lastUsedAt: row.last_used_at,
              expiryDate: row.expiry_date,
              metadata: row.metadata,
              createdAt: row.created_at,
              updatedAt: row.updated_at,
            }))
          );
        }
      } catch (err) {
        console.error('[Style] Analysis fetch error:', err);
      }
    };

    fetchAnalysis();
  }, [isLoaded, user?.id, supabase, hasMeasurements]);

  // 하이브리드 UX 상태
  const [favoriteMaterials, setFavoriteMaterials] = useState<FavoriteItem[]>([]);
  const [avoidMaterials, setAvoidMaterials] = useState<FavoriteItem[]>([]);

  // 오늘의 코디 — 내 옷장에서 실제 매칭 (기존엔 하드코딩 가짜 4벌이었음)
  const realOutfit = useMemo(() => {
    if (closetItems.length === 0) return null;
    const month = new Date().getMonth();
    const temp =
      month >= 5 && month <= 7 ? 27 : month >= 8 && month <= 10 ? 18 : month >= 2 ? 15 : 3;
    return suggestOutfitFromCloset(closetItems, {
      personalColor: rawSeason,
      bodyType: rawBodyType,
      temp,
      occasion: null,
    });
  }, [closetItems, rawSeason, rawBodyType]);

  const dailyOutfit = useMemo((): OutfitItem[] => {
    if (!realOutfit) return [];
    const slots: Array<{ category: string; rec: ClosetRecommendation | undefined }> = [
      { category: 'top', rec: realOutfit.top },
      { category: 'bottom', rec: realOutfit.bottom },
      { category: 'outer', rec: realOutfit.outer },
      { category: 'shoes', rec: realOutfit.shoes },
    ];
    return slots
      .filter((s) => s.rec)
      .map((s, i) => {
        const colors = (s.rec!.item.metadata?.color as string[] | undefined) ?? [];
        return {
          order: i + 1,
          category: s.category,
          productName: s.rec!.item.name,
          color: colors[0],
          colorHex: colors[0] ? (colorNameToHex(colors[0]) ?? undefined) : undefined,
          imageUrl: s.rec!.item.imageUrl ?? undefined,
        };
      });
  }, [realOutfit]);
  const [lookbookPosts] = useState<LookbookPost[]>([
    {
      id: '1',
      clerkUserId: 'user1',
      imageUrl: 'https://placehold.co/400x600/fff8e7/d4a574?text=Spring+Look',
      bodyType: 'W',
      personalColor: 'Spring',
      caption: '봄 웜톤에 어울리는 데일리 코디',
      outfitItems: [
        { category: 'top', description: '크롭 니트', color: '아이보리', colorHex: '#FFF8E7' },
        { category: 'bottom', description: '와이드 팬츠', color: '베이지', colorHex: '#D4A574' },
      ],
      likesCount: 234,
      commentsCount: 12,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      clerkUserId: 'user2',
      imageUrl: 'https://placehold.co/400x600/ffb4a2/d4a574?text=Office+Look',
      bodyType: 'W',
      personalColor: 'Spring',
      caption: '웨이브 체형 출근룩',
      outfitItems: [
        { category: 'top', description: '블라우스', color: '피치', colorHex: '#FFB4A2' },
        { category: 'bottom', description: '플레어 스커트', color: '베이지', colorHex: '#D4A574' },
      ],
      likesCount: 189,
      commentsCount: 8,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      clerkUserId: 'user3',
      imageUrl: 'https://placehold.co/400x600/e8eef8/808080?text=Minimal+Look',
      bodyType: 'S',
      personalColor: 'Summer',
      caption: '미니멀 오피스룩',
      outfitItems: [
        { category: 'top', description: '셔츠', color: '화이트', colorHex: '#FFFFFF' },
        { category: 'bottom', description: '슬랙스', color: '그레이', colorHex: '#808080' },
      ],
      likesCount: 156,
      commentsCount: 5,
      isPublic: true,
      createdAt: new Date().toISOString(),
    },
  ]);

  // L-1-2: 키/몸무게 체크 중이면 로딩 표시
  if (hasMeasurements === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="style-page">
      {/* 페이지 제목 (스크린리더용) */}
      <h1 className="sr-only">스타일 - 체형 맞춤 코디 추천</h1>

      {/* 키/몸무게 미입력 안내 배너 */}
      {hasMeasurements === false && (
        <FadeInUp>
          <div className="mx-4 mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <p className="font-medium text-amber-900 dark:text-amber-200 mb-1">
              키/몸무게를 입력하면 더 정확한 추천을 받을 수 있어요
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mb-3">
              체형 맞춤 코디와 핏 추천을 위해 기본 정보가 필요해요
            </p>
            <button
              onClick={() => router.push('/style/onboarding')}
              className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              정보 입력하기
            </button>
          </div>
        </FadeInUp>
      )}

      {/* 내 체형 프로필 */}
      {hasAnalysis ? (
        <FadeInUp>
          <section
            className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b"
            aria-label="내 체형 프로필"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-500" aria-hidden="true" />
                <span className="font-medium">{bodyType || '미분석'}</span>
                {personalColor && (
                  <>
                    <span className="text-muted-foreground" aria-hidden="true">
                      |
                    </span>
                    <Palette className="w-4 h-4 text-indigo-500" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">{personalColor}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/profile/analysis')}
                className="text-xs text-primary hover:underline"
                aria-label="체형 프로필 수정"
              >
                수정
              </button>
            </div>
            {(height || feature) && (
              <div className="flex gap-2 mt-2">
                {height && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {height}
                  </span>
                )}
                {feature && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {feature}
                  </span>
                )}
              </div>
            )}
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <section className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">체형 분석하면 나에게 맞는 코디 추천!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 내 체형에 어울리는 스타일을 찾아드려요
                </p>
              </div>
              <button
                onClick={() => router.push('/onboarding/body')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium"
              >
                지금 분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 내 컬러 팔레트 */}
      {hasAnalysis && colorPalette.length > 0 && (
        <FadeInUp delay={1}>
          <section className="px-4 py-3 border-b">
            <div className="flex items-center gap-2 mb-2">
              <Palette className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">내 컬러 팔레트</span>
            </div>
            <div className="flex gap-2">
              {colorPalette.map((color) => (
                <div key={color.name} className="flex flex-col items-center">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                    style={{ backgroundColor: color.color }}
                  />
                  <span className="text-xs text-muted-foreground mt-1">{color.name}</span>
                </div>
              ))}
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 체형 맞춤 필터 토글 */}
      {hasAnalysis && (
        <FadeInUp delay={2}>
          <div className="px-4 py-3 border-b">
            <button
              onClick={() => setMatchFilterOn(!matchFilterOn)}
              className="flex items-center gap-2"
              role="switch"
              aria-checked={matchFilterOn}
              aria-label="내 체형 맞춤 제품만 표시"
            >
              <Shirt className="w-4 h-4" aria-hidden="true" />
              <span className="text-sm" aria-hidden="true">
                내 체형 맞춤만 보기
              </span>
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
          </div>
        </FadeInUp>
      )}

      {/* 카테고리 필터 */}
      <FadeInUp delay={3}>
        <nav className="px-4 py-3 border-b overflow-x-auto" aria-label="카테고리 필터">
          <div className="flex gap-2" role="tablist" aria-label="스타일 카테고리">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                role="tab"
                aria-selected={category === cat.id}
                aria-controls={`category-panel-${cat.id}`}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors',
                  category === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </nav>
      </FadeInUp>

      {/* 소재 즐겨찾기 필터 (하이브리드 UX) */}
      <FadeInUp delay={4}>
        <section className="px-4 py-3 border-b" aria-label="소재 필터">
          <MaterialFavoriteFilter
            favorites={favoriteMaterials}
            avoids={avoidMaterials}
            onFavoritesChange={setFavoriteMaterials}
            onAvoidsChange={setAvoidMaterials}
          />
        </section>
      </FadeInUp>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-6">
        {/* 오늘의 코디 — 내 옷장 실제 매칭 (가짜 하드코딩 코디였던 것 교체, 2026-07-08) */}
        {dailyOutfit.length > 0 && realOutfit ? (
          <FadeInUp delay={5}>
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                오늘의 코디
              </h2>
              <OutfitRoutineCard
                occasion="daily"
                items={dailyOutfit}
                matchRate={realOutfit.totalScore}
                styleTips={realOutfit.tips}
              />
              <button
                onClick={() => router.push('/closet/recommend')}
                className="mt-3 w-full border rounded-lg py-2 text-sm text-primary hover:bg-primary/5 transition-colors"
              >
                날씨·상황별 코디 더 보기 →
              </button>
            </section>
          </FadeInUp>
        ) : (
          <FadeInUp delay={5}>
            <section className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-2xl border border-indigo-200 dark:border-indigo-900 p-4">
              <h2 className="font-semibold mb-1 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                오늘의 코디
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                옷장에 옷을 등록하면 내 옷으로 매일 코디를 추천해드려요
              </p>
              <button
                onClick={() => router.push('/closet/add/batch')}
                className="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                사진으로 옷장 한 번에 등록하기
              </button>
            </section>
          </FadeInUp>
        )}

        {/* 맞춤 아이템 추천 */}
        <FadeInUp delay={6}>
          <section>
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              {hasAnalysis ? '내 체형 맞춤 아이템' : '인기 아이템'}
            </h2>
            {products.length > 0 ? (
              <div className="grid grid-cols-3 gap-3">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => router.push(`/style/${product.id}`)}
                    className="bg-card rounded-xl border p-3 text-left hover:shadow-md transition-shadow"
                  >
                    {hasAnalysis && product.matchRate > 0 && (
                      <div className="text-xs font-bold text-primary mb-1">
                        {product.matchRate}%
                      </div>
                    )}
                    <div className="w-full aspect-square bg-muted rounded-lg mb-2" />
                    <p className="text-xs text-muted-foreground">{product.brand}</p>
                    <p className="text-sm font-medium line-clamp-2">{product.name}</p>
                    {product.rating > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs">{product.rating}</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-card rounded-xl border">
                <Shirt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  {hasAnalysis
                    ? '맞춤 아이템을 준비하고 있어요'
                    : '체형 분석 후 맞춤 추천을 받아보세요'}
                </p>
              </div>
            )}
          </section>
        </FadeInUp>

        {/* 비슷한 체형 리뷰 */}
        {hasAnalysis && (
          <FadeInUp delay={7}>
            <section className="bg-card rounded-2xl border p-4">
              <h2 className="font-semibold mb-3 flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-500" />
                비슷한 체형 리뷰
              </h2>
              <div className="space-y-3">
                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-sm text-foreground">
                    &quot;저도 {bodyType}인데 이 바지 핏 좋아요!&quot;
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">{bodyType}</span>
                    <span className="text-xs text-muted-foreground">|</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => router.push('/style?tab=reviews')}
                className="mt-3 text-sm text-primary hover:underline"
              >
                리뷰 더보기 →
              </button>
            </section>
          </FadeInUp>
        )}

        {/* 룩북 피드 (하이브리드 UX) */}
        <FadeInUp delay={8}>
          <section aria-label="룩북 피드">
            <h2 className="text-lg font-semibold mb-3">룩북 피드</h2>
            <LookbookFeed
              posts={lookbookPosts}
              onPostClick={(postId) => router.push(`/style/lookbook/${postId}`)}
            />
          </section>
        </FadeInUp>

        {/* 오늘 뭐 입지? */}
        <FadeInUp delay={9}>
          <section className="bg-gradient-to-r from-violet-50 to-purple-50 rounded-2xl border border-violet-200 p-4">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Shirt className="w-5 h-5 text-violet-600" />
              오늘 뭐 입지?
            </h2>
            <p className="text-sm text-muted-foreground">체형 + 퍼스널컬러 + 날씨 맞춤 추천</p>
            <button
              onClick={() => router.push('/closet/recommend')}
              className="mt-3 w-full bg-violet-600 text-white py-2 rounded-lg font-medium hover:bg-violet-700 transition-colors"
            >
              추천 받기
            </button>
          </section>
        </FadeInUp>
      </div>

      <BottomNav />
    </div>
  );
}
