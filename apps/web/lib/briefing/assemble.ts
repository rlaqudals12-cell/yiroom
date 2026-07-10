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
  const outfit = composeDailyOutfit(bestColors, now, pcEntry?.contrastLevel);

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
    },
    hasAnalyses: analyses.length > 0,
  };
}
