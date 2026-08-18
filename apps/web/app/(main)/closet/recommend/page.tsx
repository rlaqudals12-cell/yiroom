'use client';

/**
 * 오늘의 코디 추천 페이지
 * 퍼스널컬러, 체형, 날씨 기반으로 옷장에서 코디 추천
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  RefreshCw,
  Thermometer,
  ChevronRight,
  Images,
  MapPin,
  Bookmark,
  Check,
  Shirt,
  Palette,
  Lightbulb,
  Umbrella,
  Sun,
  CloudRain,
  CalendarDays,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { classifyByRange } from '@/lib/utils/conditional-helpers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  suggestOutfitFromCloset,
  getRecommendationSummary,
  resolveClothingCategory,
  type OutfitSuggestion,
  type BodyType3,
  type ClosetRecommendation,
} from '@/lib/inventory/client';
import { OCCASION_LABELS, type Occasion } from '@/types/inventory';
import type { InventoryItem, InventoryItemDB, Season } from '@/types/inventory';
import { getPersonalColorSeasonLabel, type PersonalColorSeason } from '@/lib/color-recommendations';
import { getBodyShapeLabel } from '@/lib/body';
import { getWeatherWithGeolocation, RAIN_THRESHOLD_MM, type WeatherData } from '@/lib/weather';
import { assessOutfitHarmony } from '@/lib/inventory/color-bridge';
// 비공개 버킷 이미지 해석 — 'use client' 번들에 서버 repository가 딸려오지 않도록 image-url만 직접 import
import { resolveInventoryImageUrl, signInventoryImagePaths } from '@/lib/inventory/image-url';
import { BEST_COLORS, LIPSTICK_RECOMMENDATIONS, type SeasonType } from '@/lib/mock/personal-color';
import { BODY_TYPES_3 } from '@/lib/mock/body-analysis';
import { composeDailyOutfit } from '@/lib/color/daily-outfit';
import { normalizeColors, type NormalizedColor } from '@/lib/color/normalize-colors';

/** PC image_analysis JSONB에서 실측 대비 레벨만 안전 추출(없으면 undefined — 추측 없음). */
function readContrastLevel(raw: unknown): 'low' | 'medium' | 'high' | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const v = (raw as { contrastLevel?: unknown }).contrastLevel;
  return v === 'low' || v === 'medium' || v === 'high' ? v : undefined;
}

/**
 * 날씨 아이콘 — 실측(위치 동의)일 때만 하늘을 말한다.
 * 계절 추정에는 관측하지 않은 하늘(맑음 아이콘) 대신 "달력"을 쓴다(정직성):
 * 월 기준 추정이라는 근거 자체를 아이콘으로 드러내고, 옆의 온도계와도 겹치지 않는다.
 * (이모지 대신 라인아트 아이콘 — 디자인 계약)
 */
function weatherIcon(weather: WeatherData | null): LucideIcon {
  if (!weather) return CalendarDays;
  return weather.precipitationMm >= RAIN_THRESHOLD_MM ? CloudRain : Sun;
}

/** 저장·착용 기록 피드백 색 — 성공/안내/실패를 시각적으로도 구분 */
const ACTION_MESSAGE_TONE_CLASS: Record<'success' | 'info' | 'error', string> = {
  success: 'text-emerald-600',
  info: 'text-muted-foreground',
  error: 'text-destructive',
};

/** 저장할 코디의 계절 — 월 기준(0=1월). 날씨 실측이 없어도 기록이 비지 않게 한다. */
function getSeasonFromMonth(month: number): Season {
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
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
  const [pcBestColors, setPcBestColors] = useState<NormalizedColor[]>([]);
  const [pcContrast, setPcContrast] = useState<'low' | 'medium' | 'high' | undefined>(undefined);

  // 날씨 — Open-Meteo 실연동(키 불필요). ADR-098의 WEATHER 게이팅은 "독립 날씨
  // 위젯 = 퍼널 비기여"가 근거였고, 코디 실행에 쓰는 TPO는 그 근거 밖 (로드맵 승인).
  // 실패 시 계절 추정으로 폴백하고 "추정"임을 표시한다 (정직성).
  const [temp, setTemp] = useState<number>(15);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  // 위치 사용 상태 — 위치정보보호법: 브라우저 권한 프롬프트만으로는 부족하다.
  // 앱 내 명시적 동의(버튼) 후에만 좌표를 날씨 조회에 '일시' 사용하고, 좌표는 저장하지 않는다.
  const [locationStatus, setLocationStatus] = useState<
    'idle' | 'loading' | 'active' | 'unavailable'
  >('idle');

  // 상황(TPO) 선택 — null = 상황 무관
  const [occasion, setOccasion] = useState<Occasion | null>(null);

  // 저장된 코디의 아이템 구성 키(정렬 후 join) — 같은 조합 중복 저장 차단용
  const [savedOutfitKeys, setSavedOutfitKeys] = useState<string[]>([]);
  const [savingOutfit, setSavingOutfit] = useState(false);
  const [recordingWear, setRecordingWear] = useState(false);
  // 저장·착용 기록 피드백 — 성공/차단/실패를 화면에서 정직하게 알린다
  const [actionMessage, setActionMessage] = useState<{
    tone: 'success' | 'info' | 'error';
    text: string;
  } | null>(null);

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
        setPcBestColors(normalizeColors(rawBest));
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

  // 위치 기반 날씨 로드 — 앱 내 명시적 동의 이후에만 호출한다.
  // getWeatherWithGeolocation()이 내부에서 브라우저 권한 프롬프트를 띄운다(좌표는 조회에만 쓰고 저장 안 함).
  const loadWeatherFromLocation = useCallback(async () => {
    setLocationStatus('loading');
    try {
      const data = await getWeatherWithGeolocation();
      if (data) {
        setWeather(data);
        setTemp(data.temp);
        setLocationStatus('active');
      } else {
        // 권한 거부/실패 → 계절 추정 온도 유지
        setLocationStatus('unavailable');
      }
    } catch {
      setLocationStatus('unavailable');
    }
  }, []);

  // 실시간 날씨 조회 — 계절 추정으로 시작. 위치는 사용자가 '앱 내'에서 동의해야만 사용한다.
  // 위치정보보호법: 페이지 로드만으로 위치를 요청하지 않는다(과거엔 마운트에서 자동 요청했음).
  // 단, 이전에 앱 내 동의한 사용자는 다시 묻지 않고 자동 반영한다(좌표 미저장, 동의 플래그만 저장).
  useEffect(() => {
    // 폴백 기본값: 월 기반 계절 추정
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) setTemp(15);
    else if (month >= 5 && month <= 7) setTemp(27);
    else if (month >= 8 && month <= 10) setTemp(18);
    else setTemp(3);

    if (typeof window !== 'undefined' && localStorage.getItem('location_consent') === 'granted') {
      void loadWeatherFromLocation();
    }
  }, [loadWeatherFromLocation]);

  // 위치 사용 동의 — 명시적 사용자 액션. 동의 플래그만 저장하고 좌표는 저장하지 않는다.
  const handleUseLocation = useCallback(() => {
    try {
      localStorage.setItem('location_consent', 'granted');
    } catch {
      /* 스토리지 비활성(사생활 모드 등) — 이번 세션에만 위치 사용 */
    }
    void loadWeatherFromLocation();
  }, [loadWeatherFromLocation]);

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

      const rows = data as InventoryItemDB[];
      // 비공개 버킷 — 코디 카드 썸네일에 쓸 이미지 경로를 한 번에 서명한다(아이템별 서명 = N+1 요청)
      const signedImages = await signInventoryImagePaths(supabase, [
        ...rows.flatMap((r) => [r.image_url, r.original_image_url]),
      ]);

      const clientItems = rows.map((row) => ({
        id: row.id,
        clerkUserId: row.clerk_user_id,
        category: row.category,
        subCategory: row.sub_category,
        name: row.name,
        imageUrl: resolveInventoryImageUrl(row.image_url, signedImages),
        originalImageUrl: resolveInventoryImageUrl(row.original_image_url, signedImages),
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

  // 저장된 코디 조회 — 같은 조합을 두 번 저장하지 않기 위한 사전 조회.
  // 실패해도 화면은 정상 동작한다(저장 시점에 서버 응답으로 다시 판단).
  const fetchSavedOutfits = useCallback(async () => {
    try {
      const res = await fetch('/api/inventory/outfits?limit=100');
      if (!res.ok) return;
      const json = (await res.json()) as { outfits?: Array<{ itemIds?: string[] }> };
      const keys = (json.outfits ?? [])
        .map((o) => [...(o.itemIds ?? [])].sort().join(','))
        .filter(Boolean);
      setSavedOutfitKeys(keys);
    } catch (error) {
      console.warn('[Recommend] Saved outfits fetch error:', error);
    }
  }, []);

  useEffect(() => {
    fetchSavedOutfits();
  }, [fetchSavedOutfits]);

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

  // 이 코디를 구성하는 아이템 ID — 저장·착용 기록의 대상(슬롯 순서 고정 → 결정론)
  const outfitItemIds = useMemo((): string[] => {
    if (!outfit) return [];
    return [
      outfit.outer,
      outfit.dress,
      outfit.top,
      outfit.bottom,
      outfit.shoes,
      outfit.bag,
      outfit.accessory,
    ]
      .filter((rec): rec is ClosetRecommendation => !!rec)
      .map((rec) => rec.item.id);
  }, [outfit]);

  // 이미 저장된 조합인지 판정 — 아이템 구성이 같으면 같은 코디로 본다(모바일 규칙 미러)
  const isOutfitAlreadySaved = useMemo((): boolean => {
    if (outfitItemIds.length === 0) return false;
    const key = [...outfitItemIds].sort().join(',');
    return savedOutfitKeys.includes(key);
  }, [outfitItemIds, savedOutfitKeys]);

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

  // 옷장 분석 요약 — 코디가 불발일 때는 부재 카테고리 안내를 접는다.
  // 불발 문구가 이미 "하의(또는 원피스)를 1벌 등록해주세요"를 말하고 있어, 요약까지 같은 요청을
  // 반복하면 한 화면에서 두 번 조르는 꼴이 된다(불발 문구가 1주인공).
  const summary = useMemo(() => {
    return getRecommendationSummary(items, {
      personalColor,
      bodyType,
      hideAbsentCategoryTip: !outfit,
    });
  }, [items, personalColor, bodyType, outfit]);

  // 보유 슬롯 집계 — 조립기가 실제로 인식하는 기준(resolveClothingCategory)과 동일하게 센다.
  // 미매핑 아이템(목록 밖 한글 세부종류 등)은 조립 슬롯에서 빠지므로 집계에도 넣지 않는다
  // (등록했는데 집계에 없다고 카피가 거짓말하지 않게, 코드와 같은 기준 사용).
  const slotCounts = useMemo(() => {
    const counts = { top: 0, bottom: 0, dress: 0 };
    for (const item of items) {
      const category = resolveClothingCategory(item);
      if (category === 'top' || category === 'bottom' || category === 'dress')
        counts[category] += 1;
    }
    return counts;
  }, [items]);

  // 코디 불발 시 안내 문구 — 보유 슬롯 집계 기반(무엇이 있고 무엇이 부족한지 정직하게).
  // 미매핑 아이템은 집계에 없으므로 "등록하면 된다"는 약속이 코드 기준과 어긋나지 않는다.
  const missingSlotMessage = ((): string => {
    if (slotCounts.top > 0 && slotCounts.bottom === 0) {
      return `상의 ${slotCounts.top}벌 있어요 — 하의나 원피스를 1벌 등록하면 내 옷으로 코디를 조립해드려요`;
    }
    if (slotCounts.bottom > 0 && slotCounts.top === 0) {
      return `하의 ${slotCounts.bottom}벌 있어요 — 상의나 원피스를 1벌 등록하면 내 옷으로 코디를 조립해드려요`;
    }
    return '코디를 조립하려면 상의와 하의가 각각 1벌 이상, 또는 원피스 1벌이 필요해요';
  })();

  // 날씨 아이콘 컴포넌트 — 실측 유무에 따라 하늘/달력이 갈린다(weatherIcon 주석 참조)
  const WeatherIcon = weatherIcon(weather);

  // 빈 옷장 콜드스타트 — 진단 기반 코디 "방향"(실제 옷을 지어내지 않고 색·역할·스타일 가이드만).
  // 오늘의 배색: DB 베스트 컬러 우선, 없으면 진단 시즌의 추천 팔레트(Hybrid). 둘 다 없으면 null(정직성).
  // 진단 시즌을 함께 넘겨야 뉴트럴(신발)이 언더톤에 맞게 확정된다
  // (미전달 시 팔레트 b* 평균 폴백 — 저채도 팔레트에서 웜/쿨이 뒤집힐 수 있다)
  const coldStartOutfit = useMemo(() => {
    const fromDiagnosed = composeDailyOutfit(pcBestColors, new Date(), pcContrast, personalColor);
    if (fromDiagnosed) return fromDiagnosed;
    if (personalColor) {
      const seasonPalette = BEST_COLORS[personalColor.toLowerCase() as SeasonType] ?? [];
      return composeDailyOutfit(seasonPalette, new Date(), pcContrast, personalColor);
    }
    return null;
  }, [pcBestColors, pcContrast, personalColor]);

  // 체형 스타일 가이드(진단된 체형이 있을 때만) — 기존 체형 결과와 동일 데이터.
  // body_analyses.body_type에는 레거시 taxonomy(8형 X/A/… 등 비 S/W/N)가 섞여 있어
  // BODY_TYPES_3[bodyType] 조회가 undefined가 될 수 있다 → null로 정규화(빈 진단 카드 방지).
  const coldStartBody = (bodyType && BODY_TYPES_3[bodyType]) ?? null;

  // 저장 버튼 라벨 — 저장됨/진행 중/기본 세 상태
  const saveButtonLabel = ((): string => {
    if (isOutfitAlreadySaved) return '저장됨';
    if (savingOutfit) return '저장 중...';
    return '이 코디 저장';
  })();

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
  };

  // 이 코디 저장 — 같은 아이템 구성은 중복 저장하지 않는다(모바일 규칙 미러)
  const handleSaveOutfit = async () => {
    if (!outfit || savingOutfit || outfitItemIds.length === 0) return;

    if (isOutfitAlreadySaved) {
      setActionMessage({ tone: 'info', text: '이미 저장된 코디예요' });
      return;
    }

    setSavingOutfit(true);
    setActionMessage(null);

    try {
      const today = new Date();
      const currentSeason = getSeasonFromMonth(today.getMonth());
      // 설명은 추천 근거를 그대로 — 없는 진단은 적지 않는다.
      // DB에 영속되는 문자열이라 원시 코드값('Autumn') 대신 라벨('가을 웜톤')로 저장한다
      const description = [
        personalColor ? getPersonalColorSeasonLabel(personalColor) : null,
        bodyType ? getBodyShapeLabel(bodyType) : null,
        `${temp}°C`,
      ]
        .filter(Boolean)
        .join(' · ');

      const res = await fetch('/api/inventory/outfits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: `${today.getMonth() + 1}월 ${today.getDate()}일 추천 코디`,
          description,
          itemIds: outfitItemIds,
          occasion: occasion ?? undefined,
          season: [currentSeason],
        }),
      });

      if (!res.ok) throw new Error(`save failed: ${res.status}`);

      setSavedOutfitKeys((prev) => [...prev, [...outfitItemIds].sort().join(',')]);
      setActionMessage({ tone: 'success', text: '내 코디에 저장했어요' });
    } catch (error) {
      console.error('[Recommend] Save outfit error:', error);
      setActionMessage({
        tone: 'error',
        text: '코디를 저장하지 못했어요. 잠시 후 다시 시도해주세요',
      });
    } finally {
      setSavingOutfit(false);
    }
  };

  // 오늘 입었어요 — 구성 아이템의 착용 횟수·최근 착용일을 갱신한다(고객 노트 축적)
  const handleRecordWear = async () => {
    if (!outfit || recordingWear || outfitItemIds.length === 0) return;

    setRecordingWear(true);
    setActionMessage(null);

    try {
      // 아이템별 PATCH N회는 중간 실패 시 "일부만 기록됨"으로 남았다 —
      // 서버가 소유권 확인 후 한 번에 갱신하는 배치 경로로 통일
      const res = await fetch('/api/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'recordUsage', itemIds: outfitItemIds }),
      });

      if (!res.ok) throw new Error(`record wear failed: ${res.status}`);

      setActionMessage({ tone: 'success', text: '오늘 입은 옷으로 기록했어요' });
      await fetchItems();
    } catch (error) {
      console.error('[Recommend] Record wear error:', error);
      setActionMessage({
        tone: 'error',
        text: '착용 기록을 저장하지 못했어요. 잠시 후 다시 시도해주세요',
      });
    } finally {
      setRecordingWear(false);
    }
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
              <Shirt className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className="p-2.5">
          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
          <p className="text-sm font-medium truncate">{item.name}</p>
          {/* 점수 막대 — 제품 결정 D2(점수 표기 존치 여부) 대기 중이라 이번 수리에서 손대지 않는다 */}
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
        {/* 불투명 지면 — 반투명+blur 유리판은 아래 콘텐츠가 비쳐 글자 대비가 무너진다(디자인 계약) */}
        <div className="sticky top-0 z-10 bg-background border-b">
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
        {/* 불투명 지면 — 반투명+blur 유리판은 아래 콘텐츠가 비쳐 글자 대비가 무너진다(디자인 계약) */}
        <div className="sticky top-0 z-10 bg-background border-b">
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
          <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
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
    // 불리언 강제(!!): coldStartBody가 undefined여도(비 S/W/N) 빈 진단 카드를 띄우지 않는다.
    const hasDiagnosis = !!coldStartOutfit || !!coldStartBody;

    return (
      <div data-testid="closet-recommend-page" className="pb-24">
        {/* 불투명 지면 — 반투명+blur 유리판은 아래 콘텐츠가 비쳐 글자 대비가 무너진다(디자인 계약) */}
        <div className="sticky top-0 z-10 bg-background border-b">
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
                <h2 className="mb-1 text-sm font-semibold">옷장은 비었지만, 이렇게 입어보세요</h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  아직 등록한 옷이 없어서, 분석한 컬러와 체형으로 오늘의 코디 방향을 제안해드릴게요.
                  실제 옷이 아니라 색·스타일 가이드예요.
                </p>
              </div>

              {/* 오늘의 배색 — PC 베스트 컬러 기반(색·역할만, 특정 옷 미발명) */}
              {coldStartOutfit && (
                <Card data-testid="coldstart-outfit-palette">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1.5 text-sm">
                      <Palette className="h-4 w-4 text-primary" aria-hidden="true" />
                      이런 색 조합으로 입어보세요
                    </CardTitle>
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
                    {/* 체형 이모지(BODY_TYPES_3.emoji) 미표기 — 진단 라벨만 둔다(디자인 계약) */}
                    <CardTitle className="text-sm">
                      {coldStartBody.label} 체형 스타일 가이드
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
              <Shirt className="mb-4 h-12 w-12 text-muted-foreground" aria-hidden="true" />
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
      {/* 헤더 — 불투명 지면(반투명 유리판 폐지, 디자인 계약) */}
      <div className="sticky top-0 z-10 bg-background border-b">
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
            {/* 실측(위치 동의)과 추정(월 기준)을 시각적으로 구분한다.
                추정일 때 맑음/비 아이콘을 띄우면 관측하지 않은 하늘을 단정하게 되므로
                달력 아이콘(월 기준)으로 두고 온도 옆에 '추정' 배지를 단다 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <WeatherIcon className="h-4 w-4" aria-hidden="true" />
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
                {!weather && (
                  <span
                    data-testid="temp-estimated-badge"
                    className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                  >
                    추정
                  </span>
                )}
              </div>
            </div>

            {/* 위치 사용 동의 — 위치정보보호법: 브라우저 권한만으로는 부족, 앱 내 목적 고지·명시적 동의 필요.
                위치가 반영되기 전(동의 전/실패)에만 노출한다. 좌표는 저장하지 않는다. */}
            {locationStatus !== 'active' && (
              <div
                className="mb-3 rounded-lg border border-dashed border-border bg-muted/30 p-2.5"
                data-testid="location-consent"
              >
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  날씨 기반 코디 추천을 위해 현재 위치를 일시적으로 사용해요. 저장하지 않아요.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-8 text-xs"
                  onClick={handleUseLocation}
                  disabled={locationStatus === 'loading'}
                  data-testid="location-consent-button"
                >
                  <MapPin className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                  {locationStatus === 'loading' ? '위치 확인 중...' : '현재 위치로 날씨 반영하기'}
                </Button>
                {locationStatus === 'unavailable' && (
                  <p className="mt-1.5 text-[11px] text-muted-foreground">
                    위치를 사용할 수 없어 계절 기준으로 추정했어요.
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {personalColor && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {getPersonalColorSeasonLabel(personalColor)}
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
                  <span>분석하고 맞춤 추천 받기</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 상황(TPO) 선택 — 조립할 코디가 있을 때만.
            불발 상태에서는 어떤 칩을 눌러도 결과가 바뀌지 않아(고를 옷 자체가 없음)
            "눌러도 아무 일 없는 버튼"이 된다 */}
        {outfit && (
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
            {(Object.entries(OCCASION_LABELS) as Array<[Occasion, string]>).map(
              ([value, label]) => (
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
              )
            )}
          </div>
        )}

        {/* 코디 추천 */}
        {outfit ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">추천 코디</h2>
              {/* 종합점수 원 — 제품 결정 D2(점수 표기 존치 여부) 대기 중이라 이번 수리에서 손대지 않는다 */}
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                {outfit.totalScore}
              </div>
            </div>

            {/* 아이템 그리드 */}
            <div className="grid grid-cols-2 gap-3">
              {renderOutfitItem('아우터', outfit.outer)}
              {renderOutfitItem('원피스', outfit.dress)}
              {renderOutfitItem('상의', outfit.top)}
              {renderOutfitItem('하의', outfit.bottom)}
              {renderOutfitItem('신발', outfit.shoes)}
              {renderOutfitItem('가방', outfit.bag)}
              {renderOutfitItem('액세서리', outfit.accessory)}
            </div>

            {/* 저장·착용 기록 — 추천이 기록으로 남아야 다음 추천이 좋아진다(고객 노트 폐루프) */}
            <div className="space-y-2" data-testid="outfit-actions">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={handleSaveOutfit}
                  disabled={savingOutfit}
                  data-testid="outfit-save-button"
                >
                  <Bookmark className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {saveButtonLabel}
                </Button>
                <Button
                  onClick={handleRecordWear}
                  disabled={recordingWear}
                  data-testid="outfit-wear-button"
                >
                  <Check className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  {recordingWear ? '기록 중...' : '오늘 입었어요'}
                </Button>
              </div>
              {actionMessage && (
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={`text-xs ${ACTION_MESSAGE_TONE_CLASS[actionMessage.tone]}`}
                    data-testid="outfit-action-message"
                  >
                    {actionMessage.text}
                  </p>
                  <Link
                    href="/closet/outfits"
                    className="shrink-0 text-xs font-medium text-primary hover:text-primary/80"
                  >
                    내 코디 보기
                  </Link>
                </div>
              )}
            </div>

            {/* 조립 완화 고지 — 계절·상황 조건을 완화해 골랐다면 숨기지 않고 먼저 알린다 */}
            {outfit.warnings.length > 0 && (
              <div
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2.5"
                data-testid="outfit-warnings"
              >
                <ul className="space-y-1">
                  {outfit.warnings.map((warning, idx) => (
                    <li
                      key={idx}
                      className="text-xs leading-relaxed text-amber-700 dark:text-amber-300"
                    >
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 코디 팁 — 색 조화(LCh 판정)·날씨 팁을 앞에 */}
            {(outfit.tips.length > 0 ||
              harmony ||
              (weather && weather.precipitationMm >= RAIN_THRESHOLD_MM)) && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-1.5 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary" aria-hidden="true" />
                    코디 팁
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-1">
                    {harmony && (
                      <li className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <Palette className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{harmony.tip}</span>
                      </li>
                    )}
                    {weather && weather.precipitationMm >= RAIN_THRESHOLD_MM && (
                      <li className="flex items-start gap-1.5 text-sm text-muted-foreground">
                        <Umbrella className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>지금 비가 내리고 있어요 — 우산과 함께 방수 소재 신발을 권해요</span>
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
                  <CardTitle className="text-sm">이 코디에 이 립</CardTitle>
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
                    내 퍼스널컬러({getPersonalColorSeasonLabel(personalColor)}) 기준 추천이에요
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-4" data-testid="outfit-missing-slots">
            <Card className="p-6 text-center">
              <p className="text-muted-foreground mb-2">추천할 코디를 찾지 못했어요</p>
              <p className="text-sm text-muted-foreground">{missingSlotMessage}</p>
              {/* 상황(TPO) 칩 대신 — 지금은 고를 옷이 없어 상황별 추천도 못 한다는 사실을 알린다 */}
              <p className="mt-2 text-xs text-muted-foreground" data-testid="occasion-unavailable">
                옷을 더 등록하면 상황별로 골라드려요
              </p>
            </Card>

            {/* 빈 옷장 상태와 동일한 일괄 등록 CTA 카드 재사용 (두 분기는 동시에 렌더되지 않음) */}
            <Card data-testid="closet-register-cta">
              <CardContent className="p-4">
                <h3 className="mb-1 text-sm font-semibold">내 옷으로 코디를 받으려면</h3>
                <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                  한 벌씩 넣지 않아도 돼요. 옷 사진을 여러 장 한 번에 올리면 AI가 자동으로 분류해요.
                </p>
                <Button
                  className="w-full"
                  onClick={() =>
                    router.push(
                      withIntegratedContext(
                        '/closet/add/batch',
                        isFromIntegrated,
                        curationSessionId
                      )
                    )
                  }
                  data-testid="closet-empty-cta"
                >
                  <Images className="mr-1.5 h-4 w-4" aria-hidden="true" />
                  사진 여러 장 한 번에 등록
                </Button>
                <button
                  onClick={() =>
                    router.push(
                      withIntegratedContext('/closet/add', isFromIntegrated, curationSessionId)
                    )
                  }
                  data-testid="closet-empty-single-cta"
                  className="mt-2 w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  한 벌씩 등록할래요
                </button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 옷장 분석 요약 */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">내 옷장 분석</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {/* 0/0 침묵 밴드 해소 — 양끝(잘 어울림/개선 필요)만 보이면 중간 밴드 옷들이 '0벌 옷장'과
                구분되지 않는다. 전체 N벌 + '무난' 열로 전량을 정직하게 드러낸다.
                '무난'에는 판단보류(정보 부족)도 섞이므로 과잉 확신 카피는 쓰지 않는다 */}
            <div className="py-3 border-b mb-3">
              <p className="mb-2 text-center text-xs text-muted-foreground">
                전체 {summary.total}벌
              </p>
              <div className="flex justify-around">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{summary.wellMatched}</p>
                  <p className="text-xs text-muted-foreground">잘 어울림</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">
                    {summary.total - summary.wellMatched - summary.needsImprovement}
                  </p>
                  <p className="text-xs text-muted-foreground">무난</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-500">{summary.needsImprovement}</p>
                  <p className="text-xs text-muted-foreground">개선 필요</p>
                </div>
              </div>
              {/* 판정 근거 고지 — 이 집계는 날씨·계절이 아니라 진단 두 축으로만 매긴다 */}
              <p
                className="mt-2 text-center text-[11px] text-muted-foreground"
                data-testid="summary-basis"
              >
                퍼스널컬러·체형 기준이에요
              </p>
            </div>
            {summary.suggestions.length > 0 && (
              <ul className="space-y-1">
                {summary.suggestions.map((suggestion, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    {/* 위 '코디 팁' 목록과 같은 불릿 문법 — 장식 이모지 대신 텍스트 불릿 */}
                    <span aria-hidden="true">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* '옷장 전체 보기' 버튼 없음 — 되돌아가는 길은 헤더 뒤로가기 하나로 통일한다
            (같은 목적지로 가는 출구가 두 개면 어느 쪽이 정본인지 알 수 없다) */}
      </div>
    </div>
  );
}
