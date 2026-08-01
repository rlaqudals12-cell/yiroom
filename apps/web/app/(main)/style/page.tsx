'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { User, Palette, Shirt, Star, Loader2 } from 'lucide-react';
import { BottomNav } from '@/components/BottomNav';
import { FadeInUp } from '@/components/animations';
import { getBodyShapeLabel } from '@/lib/body';
import { cn } from '@/lib/utils';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { MaterialFavoriteFilter } from '@/components/style/MaterialFavoriteFilter';
import { StylePreferenceChips } from '@/components/style/StylePreferenceChips';
import { OutfitRoutineCard, type OutfitItem } from '@/components/style/OutfitRoutineCard';
import { shouldShowMeasurementBanner, getMatchedItemsEmptyState } from '@/lib/style';
import type { FavoriteItem } from '@/types/hybrid';
import {
  suggestOutfitFromCloset,
  type BodyType3,
  type ClosetRecommendation,
} from '@/lib/inventory/client';
import { colorNameToHex } from '@/lib/inventory/color-bridge';
import { hexToLab, calculateHue } from '@/lib/color';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';

/**
 * 스타일 탭 - 룩핀 스타일 코디 피드
 *
 * 위계 원칙 (PC 결과 검증 패턴 이식, 2026-08-01):
 * - 주인공 CTA는 상태 기반 1개만 — 옷장 0벌=옷장 등록, 1벌+=오늘의 코디(날씨·상황별 추천).
 *   나머지 행동(내 정보 입력·체형 분석)은 아웃라인/텍스트 링크로 격하.
 * - /closet/recommend 진입은 오늘의 코디 섹션 1곳뿐 (구 "오늘 뭐 입지?" 중복 섹션 제거).
 * - 섹션 적층 축소: 내 프로필(프로필+팔레트 병합) / 필터(맞춤 토글+카테고리+소재 병합)
 *   / 오늘의 코디 / 맞춤 아이템 — 4~5단.
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
  // 체형 분석에 이미 저장된 키(숫자) — 신체정보 배너 중복 판단용 (One Canon)
  const [bodyHeightCm, setBodyHeightCm] = useState<number | null>(null);
  const [feature, setFeature] = useState<string | null>(null);

  // 코디 매칭용 원본 코드값 (라벨과 별도 — closetMatcher 계약)
  const [rawBodyType, setRawBodyType] = useState<BodyType3 | null>(null);
  const [rawSeason, setRawSeason] = useState<PersonalColorSeason | null>(null);
  const [closetItems, setClosetItems] = useState<InventoryItem[]>([]);

  // DB 연결 데이터
  const [colorPalette, setColorPalette] = useState<ColorItem[]>([]);

  // 팔레트 표시용 정렬 — 명도(L*) 내림차순, 동률이면 색상각(h°) 오름차순.
  // 왜: 홈 DailyBriefing 색면 밴드와 같은 기준 — 밝음→어두움 그라데이션이어야
  // 뮤트 톤에서도 색이 명도 축으로 구분된다. hex·데이터는 불변(표시 순서만).
  const sortedColorPalette = useMemo(() => {
    return [...colorPalette].sort((a, b) => {
      const labA = hexToLab(a.color);
      const labB = hexToLab(b.color);
      if (labB.L !== labA.L) return labB.L - labA.L;
      return calculateHue(labA) - calculateHue(labB);
    });
  }, [colorPalette]);
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
    setBodyHeightCm(bodyData.height ?? null);
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
      // 전체 표시(slice 제거) — 진단 팔레트를 자르지 않고 세그먼트 바에 모두 늘어놓는다
      setColorPalette(
        bestColors.map((c) => ({
          name: c.name ?? '',
          color: c.hex ?? c.color ?? '#CCCCCC',
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

      {/* 키/몸무게 미입력 안내 배너 — 어떤 소스에도 키가 없을 때만 표시 (중복 입력 방지) */}
      {shouldShowMeasurementBanner(hasMeasurements, bodyHeightCm) && (
        <FadeInUp>
          <div className="mx-4 mt-4 p-4 bg-muted/50 border border-border rounded-xl">
            <p className="font-medium text-foreground mb-1">
              키/몸무게를 입력하면 더 정확한 추천을 받을 수 있어요
            </p>
            <p className="text-sm text-muted-foreground mb-2">
              체형 분석을 하면 자동으로 채워져요. 직접 입력하거나 수정하려면 내 정보에서 관리하세요.
            </p>
            {/* 보조 행동 — 주인공 CTA(옷장/코디)와 경쟁하지 않도록 텍스트 링크로 격하 */}
            <button
              onClick={() => router.push('/profile/my-info')}
              className="text-sm font-medium text-primary hover:underline"
            >
              내 정보에서 입력하기 →
            </button>
          </div>
        </FadeInUp>
      )}

      {/* 내 프로필 — 체형 프로필 + 컬러 팔레트 병합 (섹션 적층 축소) */}
      {hasAnalysis ? (
        <FadeInUp>
          <section className="bg-secondary px-4 py-4 border-b" aria-label="내 체형 프로필">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" aria-hidden="true" />
                <span className="font-medium">{bodyType || '미분석'}</span>
                {personalColor && (
                  <>
                    <span className="text-muted-foreground" aria-hidden="true">
                      |
                    </span>
                    <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                    <span className="text-sm text-muted-foreground">{personalColor}</span>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/analysis/integrated')}
                className="text-xs text-primary hover:underline"
                aria-label="체형 프로필 수정"
              >
                수정
              </button>
            </div>
            {(height || feature) && (
              <div className="flex gap-2 mt-2">
                {height && (
                  <span className="text-xs bg-secondary text-foreground/80 px-2 py-0.5 rounded-full">
                    {height}
                  </span>
                )}
                {feature && (
                  <span className="text-xs bg-secondary text-foreground/80 px-2 py-0.5 rounded-full">
                    {feature}
                  </span>
                )}
              </div>
            )}
            {/* 컬러 팔레트 — 별도 섹션이던 것을 프로필 하위 블록으로 병합 */}
            {colorPalette.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                  <span className="text-sm font-medium">내 컬러 팔레트</span>
                </div>
                {/* 색면 밴드 — 원형 점 대신 이어붙은 풀폭 세그먼트(간격 0·하드엣지).
                    홈 DailyBriefing 밴드와 같은 문법 — 색은 전부 진단 hex, 장식색 없음 */}
                <div className="flex h-10 overflow-hidden rounded-lg">
                  {sortedColorPalette.map((color, i) => (
                    <span
                      key={`${color.color}-${i}`}
                      className="h-full min-w-0 flex-1"
                      style={{ backgroundColor: color.color }}
                      title={color.name || color.color}
                      aria-label={color.name || color.color}
                    />
                  ))}
                </div>
                {/* 색 이름 — 밴드 세그먼트와 같은 폭 배분, 2줄까지 허용(잘림 대신 가독) */}
                <div className="mt-1.5 flex">
                  {sortedColorPalette.map((color, i) => (
                    <span
                      key={`${color.color}-name-${i}`}
                      className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted-foreground break-keep line-clamp-2"
                    >
                      {color.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <section className="bg-secondary px-4 py-4 border-b">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">체형 분석하면 나에게 맞는 코디 추천!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI가 내 체형에 어울리는 스타일을 찾아드려요
                </p>
              </div>
              {/* 보조 행동 — 아웃라인 격하 (주인공 CTA는 아래 옷장/코디 1개) */}
              <button
                onClick={() => router.push('/analysis/body')}
                className="border border-primary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/5 transition-colors shrink-0"
              >
                지금 분석하기
              </button>
            </div>
          </section>
        </FadeInUp>
      )}

      {/* 필터 — 체형 맞춤 토글 + 카테고리 + 소재·스타일 병합 (섹션 적층 축소, 로직 불변) */}
      <FadeInUp delay={1}>
        <section className="px-4 py-3 border-b space-y-3" aria-label="코디 필터">
          {hasAnalysis && (
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
          )}

          {/* 카테고리 필터 */}
          <nav className="overflow-x-auto" aria-label="카테고리 필터">
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

          {/* 소재 즐겨찾기 필터 + 선호 스타일 (하이브리드 UX) */}
          <MaterialFavoriteFilter
            favorites={favoriteMaterials}
            avoids={avoidMaterials}
            onFavoritesChange={setFavoriteMaterials}
            onAvoidsChange={setAvoidMaterials}
          />
          <StylePreferenceChips />
        </section>
      </FadeInUp>

      {/* 본문 */}
      <div className="px-4 py-4 space-y-6">
        {/* 오늘의 코디 — 상태 기반 주인공 1개:
            옷장 1벌+ = 날씨·상황별 코디 추천(유일한 /closet/recommend 진입),
            옷장 0벌 = 옷장 등록. 그 외 CTA는 전부 격하. */}
        {dailyOutfit.length > 0 && realOutfit ? (
          <FadeInUp delay={2}>
            <section>
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">오늘의 코디</h2>
              <OutfitRoutineCard
                occasion="daily"
                items={dailyOutfit}
                matchRate={realOutfit.totalScore}
                styleTips={realOutfit.tips}
              />
              <button
                onClick={() => router.push('/closet/recommend')}
                className="mt-3 w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2.5 rounded-lg font-medium transition-colors"
              >
                날씨·상황별 코디 추천 받기
              </button>
            </section>
          </FadeInUp>
        ) : (
          <FadeInUp delay={2}>
            <section className="bg-card rounded-2xl border border-border p-4">
              <h2 className="font-semibold mb-1 flex items-center gap-2">오늘의 코디</h2>
              <p className="text-sm text-muted-foreground mb-3">
                옷장에 옷을 등록하면 내 옷으로 매일 코디를 추천해드려요
              </p>
              <button
                onClick={() => router.push('/closet/add/batch')}
                className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                사진으로 옷장 한 번에 등록하기
              </button>
            </section>
          </FadeInUp>
        )}

        {/* 맞춤 아이템 추천 */}
        <FadeInUp delay={3}>
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
              (() => {
                // 패션 상품 DB가 없어 쇼핑 매칭 아이템은 미제공 — 정직하게 안내.
                // 주인공 CTA(오늘의 코디 섹션)와 겹치는 경로는 CTA 없이 메시지만 (진입 1곳 원칙)
                const { message, ctaHref, ctaLabel } = getMatchedItemsEmptyState(
                  hasAnalysis,
                  closetItems.length > 0
                );
                return (
                  <div className="text-center py-8 bg-card rounded-xl border px-4">
                    <Shirt className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">{message}</p>
                    {ctaHref && ctaLabel && (
                      <button
                        onClick={() => router.push(ctaHref)}
                        className="mt-3 text-sm font-medium text-primary hover:underline"
                      >
                        {ctaLabel} →
                      </button>
                    )}
                  </div>
                );
              })()
            )}
          </section>
        </FadeInUp>
      </div>

      <BottomNav />
    </div>
  );
}
