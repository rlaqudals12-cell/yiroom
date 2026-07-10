'use client';

/**
 * 오늘의 코디 추천 페이지
 * 퍼스널컬러, 체형, 날씨 기반으로 옷장에서 코디 추천
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, RefreshCw, Thermometer, Sparkles, ChevronRight } from 'lucide-react';
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
import { LIPSTICK_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';

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
        // 퍼스널컬러 조회
        const { data: colorData } = await supabase
          .from('personal_color_assessments')
          .select('season')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (colorData?.season) {
          setPersonalColor(colorData.season as PersonalColorSeason);
        }

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

  // 빈 옷장 — 통합 분석 큐레이션 맥락 유지
  if (items.length === 0) {
    const addHref = isFromIntegrated
      ? `/closet/add?source=integrated${curationSessionId ? `&session=${curationSessionId}` : ''}`
      : '/closet/add';
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
          data-testid="closet-empty-state"
        >
          <span className="text-6xl mb-4">👗</span>
          <h2 className="text-lg font-semibold mb-2">
            {isFromIntegrated ? '옷장을 먼저 등록해주세요' : '옷장이 비어있어요'}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isFromIntegrated ? (
              <>
                분석한 체형과 컬러에 맞춰
                <br />
                가지고 있는 옷으로 코디를 제안할게요
              </>
            ) : (
              <>
                옷장에 아이템을 추가하면
                <br />
                맞춤 코디를 추천해드려요
              </>
            )}
          </p>
          <Button onClick={() => router.push(addHref)} data-testid="closet-empty-cta">
            {isFromIntegrated ? '먼저 옷장 등록하기' : '옷 추가하기'}
          </Button>
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
