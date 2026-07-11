'use client';

/**
 * 오늘의 코디 추천 페이지
 * 퍼스널컬러, 체형, 날씨 기반으로 옷장에서 코디 추천
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, RefreshCw, Thermometer, Sparkles, ChevronRight, Images } from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { classifyByRange } from '@/lib/utils/conditional-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  suggestOutfitFromCloset,
  getRecommendationSummary,
  type OutfitSuggestion,
  type BodyType3,
  type ClosetRecommendation,
} from '@/lib/inventory/client';
import { OCCASION_LABELS, type Occasion } from '@/types/inventory';
import type { InventoryItem, InventoryItemDB } from '@/types/inventory';
import type { PersonalColorSeason } from '@/lib/color-recommendations';
import { getBodyShapeLabel } from '@/lib/body';
import { getWeatherWithGeolocation, type WeatherData } from '@/lib/weather';
import { assessOutfitHarmony } from '@/lib/inventory/color-bridge';
import { BEST_COLORS, LIPSTICK_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';
import { BODY_TYPES_3 } from '@/lib/mock/body-analysis';
import { composeDailyOutfit } from '@/lib/color/daily-outfit';

/** PC image_analysis JSONB에서 실측 대비 레벨만 안전 추출(없으면 undefined — 추측 없음). */
function readContrastLevel(raw: unknown): 'low' | 'medium' | 'high' | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const v = (raw as { contrastLevel?: unknown }).contrastLevel;
  return v === 'low' || v === 'medium' || v === 'high' ? v : undefined;
}

/** 통합 큐레이션 맥락(source·session)을 옷장 등록 경로에 이어붙인다(맥락 유지). */
function withIntegratedContext(
  base: string,
  isFromIntegrated: boolean,
  sessionId: string | null
): string {
  if (!isFromIntegrated) return base;
  const session = sessionId ? `&session=${sessionId}` : '';
  return `${base}?source=integrated${session}`;
}

export default function ClosetRecommendPage() {
  const router = useRouter();
  const supabase = useClerkSupabaseClient();
  const searchParams = useSearchParams();

  // 통합 분석 큐레이션에서 진입한 경우 맥락 유지용
  const curationSource = searchParams.get('source');
  const curationSessionId = searchParams.get('session');
  const isFromIntegrated = curationSource === 'integrated';

  // 상태
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  // 조회 실패 여부 — 빈 옷장(정상 0개)과 오류를 구분한다 (오류를 "옷장이 비어있어요"로 위장 금지)
  const [fetchError, setFetchError] = useState(false);

  // 사용자 프로필 (실제 앱에서는 DB에서 가져옴)
  const [personalColor, setPersonalColor] = useState<PersonalColorSeason | null>(null);
  const [bodyType, setBodyType] = useState<BodyType3 | null>(null);
  // 콜드스타트(빈 옷장) 진단 제안용 — PC 베스트 컬러(개인 팔레트)·퍼스널 대비.
  // 브리핑 '오늘의 배색'과 동일 소스라 옷장이 비어도 같은 배색을 이어서 보여준다.
  const [pcBestColors, setPcBestColors] = useState<Array<{ name?: string; hex?: string }>>([]);
  const [pcContrast, setPcContrast] = useState<'low' | 'medium' | 'high' | undefined>(undefined);

  // 날씨 — Open-Meteo 실연동(키 불필요). ADR-098의 WEATHER 게이팅은 "독립 날씨
  // 위젯 = 퍼널 비기여"가 근거였고, 코디 실행에 쓰는 TPO는 그 근거 밖 (로드맵 승인).
  // 실패 시 계절 추정으로 폴백하고 "추정"임을 표시한다 (정직성).
  const [temp, setTemp] = useState<number>(15);
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // 상황(TPO) 선택 — null = 상황 무관
  const [occasion, setOccasion] = useState<Occasion | null>(null);

  // 사용자 프로필 조회
  useEffect(() => {
    async function fetchProfile() {
      if (!supabase) return;

      try {
        // 퍼스널컬러 조회 — 시즌 + 진단된 베스트 컬러(개인 팔레트) + 대비 레벨
        const { data: colorData } = await supabase
          .from('personal_color_assessments')
          .select('season, best_colors, image_analysis')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (colorData?.season) {
          setPersonalColor(colorData.season as PersonalColorSeason);
        }
        // 빈 옷장 콜드스타트 배색에 사용 — 실제 옷이 아니라 색 가이드용(브리핑과 동일 소스)
        const rawBest = (colorData as { best_colors?: unknown } | null)?.best_colors;
        setPcBestColors(
          Array.isArray(rawBest) ? (rawBest as Array<{ name?: string; hex?: string }>) : []
        );
        setPcContrast(
          readContrastLevel((colorData as { image_analysis?: unknown } | null)?.image_analysis)
        );

        // 체형 조회
        const { data: bodyData } = await supabase
          .from('body_analyses')
          .select('body_type')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (bodyData?.body_type) {
          setBodyType(bodyData.body_type as BodyType3);
        }
      } catch (error) {
        console.warn('[Recommend] Profile fetch error:', error);
      }
    }

    fetchProfile();
  }, [supabase]);

  // 실시간 날씨 조회 — 실패하면 계절 추정 온도 유지
  useEffect(() => {
    // 폴백 기본값: 월 기반 계절 추정
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) setTemp(15);
    else if (month >= 5 && month <= 7) setTemp(27);
    else if (month >= 8 && month <= 10) setTemp(18);
    else setTemp(3);

    let cancelled = false;
    getWeatherWithGeolocation()
      .then((data) => {
        if (!cancelled && data) {
          setWeather(data);
          setTemp(data.temp);
        }
      })
      .catch(() => {
        /* 폴백 유지 */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 옷장 아이템 조회
  const fetchItems = useCallback(async () => {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .from('user_inventory')
        .select('*')
        .eq('category', 'closet')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const clientItems = (data as InventoryItemDB[]).map((row) => ({
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
      }));

      setItems(clientItems);
      setFetchError(false);
    } catch (error) {
      console.error('[Recommend] Fetch error:', error);
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // 코디 추천
  const outfit = useMemo((): OutfitSuggestion | null => {
    if (items.length === 0) return null;

    return suggestOutfitFromCloset(items, {
      personalColor,
      bodyType,
      temp,
      occasion,
    });
  }, [items, personalColor, bodyType, temp, occasion]);

  // 코디 색 조화 판정 (ADR-105 LCh) — 상·하의 색상명이 hex로 풀릴 때만
  const harmony = useMemo(() => {
    if (!outfit?.top || !outfit?.bottom) return null;
    return assessOutfitHarmony(
      outfit.top.item.metadata?.color as string[] | undefined,
      outfit.bottom.item.metadata?.color as string[] | undefined
    );
  }, [outfit]);

  // 시즌 립 추천 — "오늘 이 옷 + 이 립" (TPO 완성 레이어)
  const lipRecommendations = useMemo(() => {
    if (!personalColor) return [];
    const season = personalColor.toLowerCase() as SeasonType;
    return LIPSTICK_RECOMMENDATIONS[season] ?? [];
  }, [personalColor]);

  // 옷장 분석 요약
  const summary = useMemo(() => {
    return getRecommendationSummary(items, { personalColor, bodyType });
  }, [items, personalColor, bodyType]);

  // 빈 옷장 콜드스타트 — 진단 기반 코디 "방향"(실제 옷을 지어내지 않고 색·역할·스타일 가이드만).
  // 오늘의 배색: DB 베스트 컬러 우선, 없으면 진단 시즌의 추천 팔레트(Hybrid). 둘 다 없으면 null(정직성).
  const coldStartOutfit = useMemo(() => {
    const fromDiagnosed = composeDailyOutfit(pcBestColors, new Date(), pcContrast);
    if (fromDiagnosed) return fromDiagnosed;
    if (personalColor) {
      const seasonPalette = BEST_COLORS[personalColor.toLowerCase() as SeasonType] ?? [];
      return composeDailyOutfit(seasonPalette, new Date(), pcContrast);
    }
    return null;
  }, [pcBestColors, pcContrast, personalColor]);

  // 체형 스타일 가이드(진단된 체형이 있을 때만) — 기존 체형 결과와 동일 데이터
  const coldStartBody = bodyType ? BODY_TYPES_3[bodyType] : null;

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
  };

  // 아이템 렌더링 헬퍼
  const renderOutfitItem = (label: string, rec: ClosetRecommendation | undefined) => {
    if (!rec) return null;

    const { item, score } = rec;

    return (
      <Link
        href={`/closet/${item.id}`}
        className="block bg-card rounded-xl overflow-hidden border hover:shadow-md transition-shadow"
      >
        <div className="relative aspect-square bg-muted">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <span className="text-2xl">👕</span>
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-medium truncate">{item.name}</p>
          <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${classifyByRange(
                score.total,
                [
                  { max: 50, result: 'bg-red-500' },
                  { max: 70, result: 'bg-yellow-500' },
                  { min: 70, result: 'bg-green-500' },
                ],
                'bg-red-500'
              )}`}
              style={{ width: `${score.total}%` }}
            />
          </div>
        </div>
      </Link>
    );
  };

  // 로딩 상태
  if (loading) {
    return (
      <div data-testid="closet-recommend-page" className="pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">오늘의 코디</h1>
          </div>
        </div>
        <div className="px-4 py-4 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 조회 오류 — 빈 옷장(정상 0개)과 구분해 정직하게 표시 + 재시도 경로 제공
  if (fetchError) {
    return (
      <div data-testid="closet-recommend-page" className="pb-20">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">오늘의 코디</h1>
          </div>
        </div>
        <div
          className="flex flex-col items-center justify-center px-4 py-16 text-center"
          data-testid="closet-error-state"
        >
          <span className="text-6xl mb-4">⚠️</span>
          <h2 className="text-lg font-semibold mb-2">옷장을 불러오지 못했어요</h2>
          <p className="text-muted-foreground mb-6">
            일시적인 문제일 수 있어요.
            <br />
            잠시 후 다시 시도해주세요
          </p>
          <Button onClick={handleRefresh} disabled={refreshing} data-testid="closet-error-retry">
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  // 빈 옷장 — 옷을 일일이 넣지 않아도 진단(컬러·체형)으로 코디 "방향"을 제안한다.
  // 실제 옷을 지어내지 않고 색·역할·스타일 가이드만 보여주고, 그 아래에 일괄 등록을 우선 안내.
  if (items.length === 0) {
    const addHref = withIntegratedContext('/closet/add', isFromIntegrated, curationSessionId);
    const batchHref = withIntegratedContext(
      '/closet/add/batch',
      isFromIntegrated,
      curationSessionId
    );
    const hasDiagnosis = coldStartOutfit !== null || coldStartBody !== null;

    return (
      <div data-testid="closet-recommend-page" className="pb-24">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">오늘의 코디</h1>
          </div>
        </div>

        <div className="px-4 py-5 space-y-5" data-testid="closet-empty-state">
          {hasDiagnosis ? (
            <div className="space-y-5" data-testid="coldstart-suggestions">
              {/* 안내 — 진단 기반 "방향" 제안이며 실제 옷이 아님을 명확히 */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                  <h2 className="text-sm font-semibold">옷장은 비었지만, 이렇게 입어보세요</h2>
                </div>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  아직 등록한 옷이 없어서, 분석한 컬러와 체형으로 오늘의 코디 방향을 제안해드릴게요.
                  실제 옷이 아니라 색·스타일 가이드예요.
                </p>
              </div>

              {/* 오늘의 배색 — PC 베스트 컬러 기반(색·역할만, 특정 옷 미발명) */}
              {coldStartOutfit && (
                <Card data-testid="coldstart-outfit-palette">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">🎨 이런 색 조합으로 입어보세요</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-start gap-2">
                      {coldStartOutfit.colors.map((c) => (
                        <div
                          key={c.role}
                          data-testid="coldstart-outfit-block"
                          className="flex min-w-0 flex-1 flex-col items-center gap-1"
                        >
                          <span
                            className="h-11 w-11 rounded-xl border border-white/70 shadow-sm dark:border-slate-700"
                            style={{ backgroundColor: c.hex }}
                            title={`${c.role} · ${c.name}`}
                            aria-label={`${c.role} ${c.name}`}
                          />
                          <span className="text-[11px] font-medium text-foreground/80">
                            {c.role}
                          </span>
                          <span className="line-clamp-2 w-full break-keep text-center text-[10px] leading-tight text-muted-foreground">
                            {c.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <p
                      className="mt-3 text-[11px] text-muted-foreground"
                      data-testid="coldstart-outfit-caption"
                    >
                      내 베스트 컬러({coldStartOutfit.baseName})로 짠 배색이에요. 파생색은 색 계열로
                      표기했어요.
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 체형 스타일 가이드 — 체형에 맞는 스타일 방향(품목 예시는 가이드, 소유 옷 아님) */}
              {coldStartBody && (
                <Card data-testid="coldstart-body-tips">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      {coldStartBody.emoji} {coldStartBody.label} 체형 스타일 가이드
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {coldStartBody.characteristics}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {coldStartBody.keywords.map((k) => (
                        <span
                          key={k}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground/80"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                    <ul className="space-y-1.5">
                      {coldStartBody.recommendations.slice(0, 4).map((rec, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary">•</span>
                          <span>
                            <span className="font-medium">{rec.item}</span>{' '}
                            <span className="text-muted-foreground">— {rec.reason}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <span className="mb-4 text-6xl">👗</span>
              <h2 className="mb-2 text-lg font-semibold">
                {isFromIntegrated ? '옷장을 먼저 등록해주세요' : '옷장이 비어있어요'}
              </h2>
              <p className="text-muted-foreground">
                분석을 먼저 하면 컬러·체형에 맞춰 코디 방향을 제안해드려요.
              </p>
              <Link
                href="/analysis/integrated"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                분석하고 맞춤 추천 받기
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* 내 옷으로 받으려면 — 한 벌씩이 아니라 사진 여러 장 일괄 등록을 우선 안내 */}
          <Card data-testid="closet-register-cta">
            <CardContent className="p-4">
              <h3 className="mb-1 text-sm font-semibold">내 옷으로 코디를 받으려면</h3>
              <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                한 벌씩 넣지 않아도 돼요. 옷 사진을 여러 장 한 번에 올리면 AI가 자동으로 분류해요.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push(batchHref)}
                data-testid="closet-empty-cta"
              >
                <Images className="mr-1.5 h-4 w-4" aria-hidden="true" />
                사진 여러 장 한 번에 등록
              </Button>
              <button
                onClick={() => router.push(addHref)}
                data-testid="closet-empty-single-cta"
                className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                한 벌씩 등록할래요
              </button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="closet-recommend-page" className="pb-20">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-semibold">오늘의 코디</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 날씨 및 프로필 정보 */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{weather && weather.precipitation > 0 ? '🌧' : '☀️'}</span>
                <span>{weather ? weather.condition : '계절 기준 추정'}</span>
                {weather && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600">
                    현재 날씨
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Thermometer className="w-4 h-4" />
                <span>{temp}°C</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {personalColor && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {personalColor}
                </Badge>
              )}
              {bodyType && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
                  {getBodyShapeLabel(bodyType)}
                </Badge>
              )}
              {!personalColor && !bodyType && (
                <Link
                  href="/analysis/integrated"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>분석하고 맞춤 추천 받기</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 상황(TPO) 선택 */}
        <div className="flex gap-2 overflow-x-auto pb-1" data-testid="occasion-chips">
          <button
            onClick={() => setOccasion(null)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              occasion === null
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-background text-muted-foreground border-border'
            }`}
          >
            전체
          </button>
          {(Object.entries(OCCASION_LABELS) as Array<[Occasion, string]>).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setOccasion(occasion === value ? null : value)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                occasion === value
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background text-muted-foreground border-border'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* 코디 추천 */}
        {outfit ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">추천 코디</h2>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {outfit.totalScore}
              </div>
            </div>

            {/* 아이템 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {renderOutfitItem('아우터', outfit.outer)}
              {renderOutfitItem('상의', outfit.top)}
              {renderOutfitItem('하의', outfit.bottom)}
              {renderOutfitItem('신발', outfit.shoes)}
              {renderOutfitItem('가방', outfit.bag)}
              {renderOutfitItem('액세서리', outfit.accessory)}
            </div>

            {/* 코디 팁 — 색 조화(LCh 판정)·날씨 팁을 앞에 */}
            {(outfit.tips.length > 0 || harmony || (weather && weather.precipitation > 0)) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">💡 코디 팁</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {harmony && <li className="text-sm text-muted-foreground">🎨 {harmony.tip}</li>}
                    {weather && weather.precipitation > 0 && (
                      <li className="text-sm text-muted-foreground">
                        ☔ 강수가 있어요 — 우산과 함께 방수 소재 신발을 권해요
                      </li>
                    )}
                    {outfit.tips.map((tip, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground">
                        • {tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* 오늘의 립 — 옷 + 립까지가 하나의 완성 (퍼스널컬러 시즌 기준) */}
            {lipRecommendations.length > 0 && (
              <Card data-testid="tpo-lip-section">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">💄 이 코디에 이 립</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {lipRecommendations.slice(0, 3).map((lip) => (
                      <div key={lip.colorName} className="flex items-center gap-3">
                        <span
                          className="w-6 h-6 rounded-full border shrink-0"
                          style={{ backgroundColor: lip.hex }}
                          aria-label={lip.colorName}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{lip.colorName}</p>
                          {(lip.oliveyoungAlt || lip.brandExample) && (
                            <p className="text-[11px] text-muted-foreground truncate">
                              예: {lip.oliveyoungAlt || lip.brandExample}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    내 퍼스널컬러({personalColor}) 기준 추천이에요
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-2">추천할 코디를 찾지 못했어요</p>
            <p className="text-sm text-muted-foreground">상의와 하의가 필요해요</p>
          </Card>
        )}

        {/* 옷장 분석 요약 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">내 옷장 분석</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex justify-around py-3 border-b mb-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{summary.wellMatched}</p>
                <p className="text-xs text-muted-foreground">잘 어울림</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-500">{summary.needsImprovement}</p>
                <p className="text-xs text-muted-foreground">개선 필요</p>
              </div>
            </div>
            {summary.suggestions.length > 0 && (
              <ul className="space-y-1">
                {summary.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span>📌</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* 옷장으로 이동 */}
        <Button variant="outline" className="w-full" onClick={() => router.push('/closet')}>
          옷장 전체 보기
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
