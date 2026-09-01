/**
 * 브리핑 페이로드 조립 — 웹 홈(DailyBriefing)과 모바일(/api/briefing)이 공유하는 정본.
 *
 * composeBriefing(문장) + "나의 퍼스널컬러" 스와치 + "오늘의 배색"을 한 번에 조립한다.
 * 순수 함수(React·클라이언트 의존성 없음)이므로 서버 라우트에서도 그대로 실행된다.
 * "문장·배색 조립 로직"은 이 파일 1곳에만 존재한다 — 모바일은 이 결과를 렌더만 한다(ADR-118).
 *
 * @see docs/adr/ADR-118-mobile-parity-thin-client.md
 * @see docs/adr/ADR-114-beauty-team-ia.md §결정 4
 */

import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { composeDailyOutfit, type DailyOutfitPalette } from '@/lib/color/daily-outfit';
import {
  suggestOutfitFromCloset,
  type BodyType3,
  type ClosetRecommendation,
} from '@/lib/inventory/client';
import { isInventoryStoragePath } from '@/lib/inventory/image-url';
import type { PersonalColorSeason } from '@/lib/color-recommendations';
import type { InventoryItem } from '@/types/inventory';
import {
  composeBriefing,
  getTimeSlot,
  type Briefing,
  type BriefingCapsulePriority,
  type BriefingRecentProduct,
  type TimeSlot,
} from './compose';

const DAY_MS = 24 * 60 * 60 * 1000;

/** 경과일 — 기준 시각(now) 대비. 음수는 0으로 절삭 */
function daysSince(date: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / DAY_MS));
}

/** 조립 컨텍스트 — 분석 요약 외 부가 입력(전부 optional) */
export interface BriefingAssembleContext {
  userName?: string | null;
  /** 기준 시각(테스트/서버에서 고정 주입). 미지정 시 현재 시각 */
  now?: Date;
  /**
   * 사용자 타임존 기준 시(0~23). 서버(UTC) 라우트가 주입해 인사/시간대가 어긋나지 않게 한다.
   * 미지정 시 now.getHours()(브라우저 로컬) 사용 — 웹 홈은 로컬 시각 그대로.
   */
  hour?: number;
  /** 날씨 피부 팁(첫 문장) — EnvironmentAdvice.skin[0] */
  weatherSkinTip?: string | null;
  /** 날씨 패션 팁(첫 문장) — EnvironmentAdvice.fashion[0] */
  weatherFashionTip?: string | null;
  /** 최근 제품함에 담은 아이템(있을 때만 — "기억한다" 화법, 없으면 미주입) */
  recentProduct?: BriefingRecentProduct | null;
  /** 오늘 캡슐의 우선 항목 1개(있을 때만 — 조언에 반영, 없으면 미주입) */
  capsulePriority?: BriefingCapsulePriority | null;
  /** 현재 기온 — 보유 의류 코디의 계절·아우터 선택에만 사용 */
  weatherTemp?: number | null;
  /** 서명 URL까지 해석된 보유 의류. undefined는 조회 전/실패, []는 실제 빈 옷장 */
  closetItems?: InventoryItem[];
}

/** 나의 퍼스널컬러 스와치 — PC 분석에 베스트 컬러가 있을 때만 */
export interface BriefingMyColors {
  /** PC 분석 id(결과 페이지 링크용) */
  analysisId: string;
  colors: Array<{ name: string; hex: string }>;
}

/** 오늘의 스타일 — 배색 조합 + 날씨 패션 팁 */
export interface BriefingTodayStyle {
  fashionTip: string | null;
  /** 베스트 컬러 기반 오늘의 배색(없으면 null — 정직성 가드) */
  outfit: DailyOutfitPalette | null;
  /** 보유 의류로 조립한 오늘의 코디. 사진 URL은 비공개 버킷 서명 경계를 지난 값만 담는다. */
  closetOutfit: BriefingClosetOutfit | null;
  /** null은 조회 전/실패, 0은 실제 빈 옷장 — 빈 상태를 지어내지 않기 위한 구분 */
  closetItemCount: number | null;
  /** true면 기존 추천 엔진이 3장짜리 코디를 완성할 만큼의 슬롯이 부족하다. */
  closetNeedsMoreItems: boolean | null;
}

/** 브리핑에 필요한 보유 의류 최소 필드 — 점수는 외모 채점처럼 읽히므로 싣지 않는다. */
export interface BriefingClosetOutfitItem {
  id: string;
  name: string;
  imageUrl: string;
  role: string;
}

/** 기존 suggestOutfitFromCloset 결과의 브리핑용 투영 */
export interface BriefingClosetOutfit {
  items: BriefingClosetOutfitItem[];
  /** 계절·상황 조건 완화 사실은 기존 엔진의 정직성 고지를 그대로 보존한다. */
  warnings: string[];
}

function normalizePersonalColorSeason(value: string | undefined): PersonalColorSeason | null {
  switch (value?.trim().toLowerCase()) {
    case 'spring':
      return 'Spring';
    case 'summer':
      return 'Summer';
    case 'autumn':
    case 'fall':
      return 'Autumn';
    case 'winter':
      return 'Winter';
    default:
      return null;
  }
}

function normalizeBodyType(value: string | undefined): BodyType3 | null {
  switch (value?.trim().toLowerCase()) {
    case 's':
    case 'straight':
      return 'S';
    case 'w':
    case 'wave':
      return 'W';
    case 'n':
    case 'natural':
      return 'N';
    default:
      return null;
  }
}

/** 기존 추천 슬롯에서 브리핑에 보여줄 실제 사진을 최대 4장만 고른다. */
function toBriefingClosetOutfit(
  items: InventoryItem[],
  analyses: AnalysisSummary[],
  weatherTemp: number | null | undefined
): { outfit: BriefingClosetOutfit | null; needsMoreItems: boolean } {
  const personalColor = normalizePersonalColorSeason(
    analyses.find((analysis) => analysis.type === 'personal-color')?.seasonType
  );
  const bodyType = normalizeBodyType(
    analyses.find((analysis) => analysis.type === 'body')?.bodyType
  );
  const suggestion = suggestOutfitFromCloset(items, {
    personalColor,
    bodyType,
    temp: weatherTemp,
    occasion: null,
  });
  if (!suggestion) return { outfit: null, needsMoreItems: items.length > 0 };

  const slots: Array<[string, ClosetRecommendation | undefined]> = [
    ['상의', suggestion.top],
    ['하의', suggestion.bottom],
    ['원피스', suggestion.dress],
    ['아우터', suggestion.outer],
    ['신발', suggestion.shoes],
    ['가방', suggestion.bag],
    ['액세서리', suggestion.accessory],
  ];
  const selectedSlots = slots.filter(
    (slot): slot is [string, ClosetRecommendation] => slot[1] !== undefined
  );
  // 왜: 실제 아이템이 3개보다 적을 때 복제 사진이나 날조 슬롯으로 3장을 채우지 않는다.
  if (selectedSlots.length < 3) return { outfit: null, needsMoreItems: true };

  const outfitItems = selectedSlots
    .flatMap(([role, recommendation]) =>
      recommendation.item.imageUrl && !isInventoryStoragePath(recommendation.item.imageUrl)
        ? [
            {
              id: recommendation.item.id,
              name: recommendation.item.name,
              imageUrl: recommendation.item.imageUrl,
              role,
            },
          ]
        : []
    )
    .slice(0, 4);

  // 서명 실패는 옷 부족이 아니다. 경로를 노출하지 않고 팔레트로만 폴백한다.
  return outfitItems.length >= 3
    ? { outfit: { items: outfitItems, warnings: suggestion.warnings }, needsMoreItems: false }
    : { outfit: null, needsMoreItems: false };
}

/** 브리핑 페이로드 — 문장 + 스와치 + 스타일 + 시간대 */
export interface BriefingPayload {
  timeSlot: TimeSlot;
  briefing: Briefing;
  myColors: BriefingMyColors | null;
  todayStyle: BriefingTodayStyle;
  /** 분석 1건 이상 존재 여부(신규 유저 분기용) */
  hasAnalyses: boolean;
}

/**
 * 브리핑 페이로드 조립 — 순수 함수.
 *
 * @param analyses 5축 분석 요약(useAnalysisStatus 결과 또는 서버 수집분)
 * @param ctx 부가 입력(이름·기준시각·날씨 팁)
 */
export function assembleBriefing(
  analyses: AnalysisSummary[],
  ctx: BriefingAssembleContext = {}
): BriefingPayload {
  const now = ctx.now ?? new Date();

  // 나의 컬러 + 오늘의 배색 — PC 분석의 베스트 컬러에서 파생
  const pcEntry = analyses.find((a) => a.type === 'personal-color');
  const bestColors = pcEntry?.bestColors ?? [];
  // 시즌(seasonType)까지 넘겨 뉴트럴(신발)이 언더톤을 따르게 한다 — 쿨에게 웜 아이보리를 신기지 않는다
  const outfit = composeDailyOutfit(bestColors, now, pcEntry?.contrastLevel, pcEntry?.seasonType);
  const closetItems = ctx.closetItems?.filter((item) => item.category === 'closet');
  const closetProjection = closetItems
    ? toBriefingClosetOutfit(closetItems, analyses, ctx.weatherTemp)
    : null;

  // 브리핑 문장 — 피부 추이 + 마지막 분석 경과 + 날씨 팁을 규칙 조립(composeBriefing)
  const skinEntry = analyses.find((a) => a.type === 'skin');
  const lastAnalysisDaysAgo =
    analyses.length > 0 ? Math.min(...analyses.map((a) => daysSince(a.createdAt, now))) : null;

  const briefing = composeBriefing({
    userName: ctx.userName ?? undefined,
    now,
    hour: ctx.hour,
    skinTrend:
      skinEntry?.skinTrend != null
        ? {
            direction: skinEntry.skinTrend,
            delta: skinEntry.skinDelta ?? 0,
            daysSinceLast: daysSince(skinEntry.createdAt, now),
          }
        : null,
    lastAnalysisDaysAgo,
    // 날씨 피부 팁만 브리핑 조언에 흡수(패션 팁은 "오늘의 스타일"에서 별도 사용 — 중복 방지)
    weatherTip: ctx.weatherSkinTip ?? null,
    // "기억한다" 화법 — 제품함 후속(관찰) + 오늘 캡슐 우선(조언). 없으면 미주입(정직성 가드).
    recentProduct: ctx.recentProduct ?? null,
    capsulePriority: ctx.capsulePriority ?? null,
    hasIntegratedSession: analyses.length > 0,
  });

  return {
    timeSlot: getTimeSlot(ctx.hour ?? now.getHours()),
    briefing,
    myColors:
      pcEntry && bestColors.length > 0 ? { analysisId: pcEntry.id, colors: bestColors } : null,
    todayStyle: {
      fashionTip: ctx.weatherFashionTip ?? null,
      outfit,
      closetOutfit: closetProjection?.outfit ?? null,
      closetItemCount: closetItems?.length ?? null,
      closetNeedsMoreItems:
        closetItems == null ? null : closetItems.length > 0 && !!closetProjection?.needsMoreItems,
    },
    hasAnalyses: analyses.length > 0,
  };
}
