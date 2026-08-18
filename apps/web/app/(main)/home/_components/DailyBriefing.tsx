'use client';

/**
 * 오늘 탭 — 전속 뷰티팀의 "아침 메시지" (ADR-114 결정 4)
 *
 * 위젯 대시보드가 아니라 1인칭 브리핑 레터 + 오늘의 실행 3개.
 * 문장은 composeBriefing(규칙 조립, AI 호출 없음)로 만든다.
 * 데이터 수집은 기존 훅/함수만 재사용(새 API 없음).
 *
 * 구성:
 *  1) 브리핑 레터 — 인사 · 관찰 · 조언 · 맺음말
 *  2) 오늘의 실행 3개 — ① 오늘의 루틴 ② 오늘의 코디 ③ 내 상태
 *  3) 물어보기 프리뷰 인풋 → /coach?q=...
 *  4) 최신 통합 결과 링크
 */

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import { MessageCircle, Shirt, ChevronRight, ArrowRight } from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import type { DailyItem } from '@/types/capsule';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import type { OutfitColor, OutfitRole } from '@/lib/color/daily-outfit';
import { selectCurrentCapsuleAction } from '@/lib/capsule/time-of-day';
import {
  assembleBriefing,
  ratingToFeedback,
  SHELF_FEEDBACK_RATING,
  type BriefingCapsulePriority,
  type BriefingRecentProduct,
  type ShelfFeedback,
} from '@/lib/briefing';
import { generateInsights, analysisToDataBundle } from '@/lib/insights';
import {
  getCurrentWeather,
  getWeatherWithGeolocation,
  generateEnvironmentAdvice,
  type EnvironmentAdvice,
  type WeatherData,
  type WeatherLocationSource,
} from '@/lib/weather';
import HomeDailyCapsuleWidget from './HomeDailyCapsuleWidget';
import { IntegratedSessionPromptCard } from './IntegratedSessionPromptCard';

/**
 * 위치 사용 동의 플래그 — 코디 추천(/closet/recommend)이 저장하는 키를 그대로 재사용한다.
 * 홈은 새 동의 UI를 만들지 않는다(브리핑 톤 보호): 이미 동의한 사용자만 실제 위치로 조회하고,
 * 미동의면 서울 기본 좌표 + "서울 기준" 고지로 정직하게 표시한다.
 */
const LOCATION_CONSENT_KEY = 'location_consent';

function hasLocationConsent(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(LOCATION_CONSENT_KEY) === 'granted';
  } catch {
    return false; // 스토리지 비활성(사생활 모드) — 동의 없음으로 간주
  }
}

/** 홈 브리핑이 쓰는 날씨 상태 — 조언 + 좌표 출처(위치 고지용) */
interface BriefingWeather {
  advice: EnvironmentAdvice | null;
  /** 조회 전이면 null. 'default'면 서울 기본 좌표 → 문구에 "서울 기준" 고지 */
  locationSource: WeatherLocationSource | null;
}

/**
 * 환경 조언 로드 — EnvironmentAdviceCard와 동일한 30분 sessionStorage 캐시 재사용.
 * (홈에서 날씨는 단일 소스 — 브리핑이 EnvironmentAdviceCard를 흡수)
 *
 * 캐시 키는 좌표 출처별로 분리한다 — 동의 전에 담아둔 서울 값이 동의 후에도 재사용되면
 * "현재 위치 날씨"라고 잘못 말하게 된다.
 */
function useEnvironmentAdvice(): BriefingWeather {
  const [weather, setWeather] = useState<BriefingWeather>({ advice: null, locationSource: null });

  useEffect(() => {
    let cancelled = false;
    function apply(data: WeatherData): void {
      if (cancelled) return;
      setWeather({
        advice: generateEnvironmentAdvice(data),
        // 구버전 캐시(필드 없음)는 서울 기본값으로 간주 — 위치를 과장하지 않는다
        locationSource: data.locationSource ?? 'default',
      });
    }

    async function load(): Promise<void> {
      const consented = hasLocationConsent();
      const cacheKey = consented ? 'env-weather-geo' : 'env-weather';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            apply(data);
            return;
          }
        } catch {
          /* 캐시 파싱 실패 — 새로 조회 */
        }
      }
      // 동의한 사용자만 위치 조회(브라우저 권한 프롬프트) — 그 외에는 서울 기본 좌표
      const data = consented ? await getWeatherWithGeolocation() : await getCurrentWeather();
      if (data && !cancelled) {
        apply(data);
        try {
          sessionStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
        } catch {
          /* 스토리지 용량 초과 */
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return weather;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 배색 바 역할별 권장 비율(%) — 착장 역할의 일반적인 면적 차이를 색 질량으로 표현.
 * 동일 크기 점 5개는 "역할"이 읽히지 않던 원인 — 상의가 주인공, 포인트는 좁은 세로 띠.
 * 포인트 6%→13% 상향(2026-08): 6%는 모바일에서 지각 한계 미만이라 악센트가 죽었다.
 * 합 100% 유지 — 상의·하의·가방에서 7%p를 회수해 재배분.
 */
const OUTFIT_BAND: ReadonlyArray<{ role: OutfitRole; widthPct: number }> = [
  { role: '상의', widthPct: 32 },
  { role: '하의', widthPct: 27 },
  { role: '가방', widthPct: 15 },
  { role: '포인트', widthPct: 13 },
  { role: '신발', widthPct: 13 }, // 뉴트럴 끝단 — 배색을 받쳐주며 바를 닫는다
];

/**
 * 범례에 색 이름까지 노출할 최소 폭(%). 이 미만 세그먼트는 역할만 보이고
 * 색 이름은 접근성 텍스트(sr-only)로만 남긴다 — 13% 폭에 이름을 우겨넣으면 둘 다 안 읽힌다.
 */
const LEGEND_NAME_MIN_PCT = 15;

type OutfitBandSegment = { color: OutfitColor; widthPct: number };

/** 배색 5색을 표시 순서(상의→하의→가방→포인트→신발)로 재배열 + 폭 비율 결합 */
function orderOutfitBand(colors: ReadonlyArray<OutfitColor>): OutfitBandSegment[] {
  return OUTFIT_BAND.flatMap(({ role, widthPct }) => {
    const color = colors.find((c) => c.role === role);
    return color ? [{ color, widthPct }] : [];
  });
}

/** 밴드 전체를 한 장의 그림으로 읽어주는 aria-label(세그먼트별 aria-label 나열 대신 1개) */
function outfitBandLabel(band: ReadonlyArray<OutfitBandSegment>): string {
  const parts = band.map((s) => `${s.color.role} ${s.color.name}`).join(', ');
  return `오늘의 배색: ${parts}`;
}

/** 실제 배색 역할/이름만 사용해 밴드보다 먼저 읽히는 결론을 만든다. */
function outfitVerdict(band: ReadonlyArray<OutfitBandSegment>): string | null {
  const top = band.find((segment) => segment.color.role === '상의')?.color.name;
  const bottom = band.find((segment) => segment.color.role === '하의')?.color.name;
  if (!top || !bottom) return null;
  return `${top} 상의 + ${bottom} 하의`;
}

interface BriefingAttribute {
  label: string;
  value: string;
  verdictText: string;
  rationale: string | null;
}

/** 문장에 드러난 의미만 라벨링하고, 불명확하면 데이터 출처 이름으로 폴백한다. */
function toBriefingAttribute(line: string, index: number): BriefingAttribute {
  const [action = line, ...reasonParts] = line.split(' — ');
  const rationale = reasonParts.join(' — ').trim() || null;
  const searchable = `${action} ${rationale ?? ''}`;
  const label = /클렌|세안/.test(searchable)
    ? '세안'
    : /보습|수분|크림/.test(searchable)
      ? '보습'
      : index === 0
        ? '루틴'
        : '환경';

  return {
    label,
    value: action.replace(/^오늘은\s*/, '').trim(),
    verdictText: action.trim(),
    rationale,
  };
}

/** 첫 조언의 실제 문장을 그대로 올린다. 데이터가 없을 때만 정직한 빈 결론으로 폴백한다. */
function buildBriefingVerdict(attributes: ReadonlyArray<BriefingAttribute>): string {
  return (
    attributes.find((attribute) => attribute.verdictText.length > 0)?.verdictText ??
    '오늘은 내 상태에 맞는 한 가지만 가볍게 챙겨보세요'
  );
}

/** "기억한다" 화법 입력(제품함 후속 + 오늘 캡슐 우선) */
interface BriefingMemory {
  recentProduct: BriefingRecentProduct | null;
  capsulePriority: BriefingCapsulePriority | null;
}

/** ISO 문자열 → 경과일(무효면 null) */
function daysAgoOrNull(iso: unknown): number | null {
  if (typeof iso !== 'string') return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / DAY_MS));
}

/**
 * 최근 담은 소유 제품 1건 — 기존 제품함 API 재사용. 실패/없음이면 null(미주입).
 * 이전 응답(rating)이 있으면 함께 실어 폐루프 회고가 되게 한다(고객 노트 v1).
 */
async function loadRecentProduct(): Promise<BriefingRecentProduct | null> {
  try {
    const res = await fetch('/api/scan/shelf?status=owned&limit=1');
    if (!res.ok) return null;
    const json = await res.json();
    const item = Array.isArray(json?.items) ? json.items[0] : null;
    if (!item?.productName) return null;
    // rating(1~5) → 응답 해석.
    // feedbackDaysAgo는 산정하지 않는다(null): updatedAt은 피드백 전용 타임스탬프가 아니라
    // 상태·메모·개봉일 등 어떤 수정에도 갱신되므로 "N일 전"이 부정확해진다 → 근거 수치를 뺀다(정직성).
    const feedback = ratingToFeedback(item.rating);
    return {
      shelfItemId: typeof item.id === 'string' ? item.id : null,
      name: item.productName,
      addedDaysAgo: daysAgoOrNull(item.scannedAt),
      feedback,
      feedbackDaysAgo: null,
    };
  } catch {
    return null;
  }
}

/** 오늘 캡슐 우선 항목 1건 — GET(캐시 조회, 생성 부작용 없음). 없거나 실패면 null(미주입) */
async function loadCapsulePriority(): Promise<BriefingCapsulePriority | null> {
  try {
    const res = await fetch('/api/capsule/daily');
    if (!res.ok) return null;
    const json: { data?: { items?: DailyItem[] } } = await res.json();
    const items = json.data?.items ?? [];
    const first = selectCurrentCapsuleAction(items, new Date().getHours());
    if (!first?.name) return null;
    return { name: first.name, reason: first.reason ?? null };
  } catch {
    return null;
  }
}

/**
 * "기억한다" 화법 입력 로드 — 모바일 /api/briefing과 정합(두 소비처가 같은 화법을 낸다).
 * 데이터 없으면 미주입(assembleBriefing의 정직성 가드 그대로).
 */
function useBriefingMemory(hasUser: boolean): BriefingMemory {
  const [memory, setMemory] = useState<BriefingMemory>({
    recentProduct: null,
    capsulePriority: null,
  });

  useEffect(() => {
    if (!hasUser) return;
    let cancelled = false;
    async function load(): Promise<void> {
      const [recentProduct, capsulePriority] = await Promise.all([
        loadRecentProduct(),
        loadCapsulePriority(),
      ]);
      if (!cancelled) setMemory({ recentProduct, capsulePriority });
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [hasUser]);

  return memory;
}

interface DailyBriefingProps {
  analyses: AnalysisSummary[];
}

export default function DailyBriefing({ analyses }: DailyBriefingProps) {
  const { user } = useUser();
  const router = useRouter();
  const { advice: env, locationSource: weatherLocationSource } = useEnvironmentAdvice();
  const memory = useBriefingMemory(!!user);
  const [question, setQuestion] = useState('');
  // 제품함 후속 응답을 이 세션에서 이미 보냈는지 — 낙관적 "기억해둘게요" 표시용
  const [shelfFeedbackSaved, setShelfFeedbackSaved] = useState(false);

  // 실이름만 — '회원' 같은 placeholder는 넘기지 않음(이름 없으면 생략형)
  const userName = user?.firstName || user?.username || undefined;

  // 브리핑 문장 + 나의 컬러 스와치 + 오늘의 배색 — 공유 정본(assembleBriefing)에서 조립.
  // 같은 로직을 /api/briefing(모바일)이 재사용 → 문장·배색 조립은 이 함수 1곳(ADR-118).
  const payload = useMemo(
    () =>
      assembleBriefing(analyses, {
        userName,
        weatherSkinTip: env?.skin?.[0] ?? null,
        weatherFashionTip: env?.fashion?.[0] ?? null,
        // "기억한다" 화법(제품함 후속·오늘 캡슐 우선) — 모바일 /api/briefing과 정합
        recentProduct: memory.recentProduct,
        capsulePriority: memory.capsulePriority,
      }),
    [analyses, userName, env, memory]
  );

  const { briefing, myColors } = payload;

  // 진단 정본(bestColors)의 우선순위를 그대로 보존한다. 홈은 대표 3색만 맡고 전체 팔레트는 리포트가 맡는다.
  const representativeColors = myColors?.colors.slice(0, 3) ?? null;
  const briefingAttributes = useMemo(
    () => briefing.advice.slice(0, 2).map(toBriefingAttribute),
    [briefing.advice]
  );
  const verdict = buildBriefingVerdict(briefingAttributes);
  // 응답 대기 중인 제품함 후속은 근거가 아니라 다음 브리핑을 만드는 폐루프 대화다.
  const shelfFollowup = briefing.shelfFollowup;
  const hasBriefingEvidence =
    Boolean(briefing.observation && !shelfFollowup) ||
    briefingAttributes.some((attribute) => attribute.rationale !== null);

  const dailyOutfit = payload.todayStyle.outfit;
  const fashionTip = payload.todayStyle.fashionTip;
  // 배색 밴드 세그먼트(폭 비율 결합) — 밴드·범례·캡션·aria-label이 같은 배열을 공유
  const outfitBand = useMemo(
    () => (dailyOutfit ? orderOutfitBand(dailyOutfit.colors) : []),
    [dailyOutfit]
  );
  const outfitConclusion = outfitVerdict(outfitBand);
  // 내 상태 섹션용(브리핑 조립과 별개) — 피부 추이 칩에 사용
  const skinEntry = analyses.find((a) => a.type === 'skin');

  // 시즌명(예: "봄 웜톤") — 팔레트 색면 밴드의 세리프 앵커용(PC 분석 요약 그대로)
  const seasonLabel = analyses.find((a) => a.type === 'personal-color')?.summary ?? null;

  // 내 상태 — 상위 인사이트 1개 흡수
  const topInsight = useMemo(() => {
    const bundle = analysisToDataBundle(analyses);
    const { insights } = generateInsights(bundle, {
      maxInsights: 1,
      minPriorityScore: 30,
      language: 'ko',
    });
    return insights[0] ?? null;
  }, [analyses]);

  function handleAsk(e: React.FormEvent): void {
    e.preventDefault();
    const q = question.trim();
    router.push(q ? `/coach?q=${encodeURIComponent(q)}` : '/coach');
  }

  // 제품함 후속 응답 저장 — 기존 rating 경로(PUT /api/scan/shelf/[id]) 재사용, 새 테이블 없음.
  // 낙관적으로 "기억해둘게요"를 즉시 표시하고, 저장 실패해도 흐름을 막지 않는다(다음 로드에서 재질문).
  async function handleShelfFeedback(shelfItemId: string, feedback: ShelfFeedback): Promise<void> {
    setShelfFeedbackSaved(true);
    try {
      await fetch(`/api/scan/shelf/${shelfItemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: SHELF_FEEDBACK_RATING[feedback] }),
      });
    } catch {
      /* 저장 실패 — 사용자 흐름은 유지, 다음 브리핑 로드 시 다시 질문한다 */
    }
  }

  return (
    // 그룹 간 간격 차등: 그룹 사이는 크게(space-y-8), 그룹 내부는 작게(space-y-3)
    <div className="space-y-8" data-testid="home-daily-briefing">
      {/* ── 그룹 1: 브리핑 레터(주인공) + 나의 퍼스널컬러 밴드 ── */}
      <div className="space-y-3">
        {/* 1) 브리핑 레터 — 표면당 유일한 히어로. raised 섀도 + 종이 그레인 1겹("아침 편지" 물성).
            보더는 히어로 전용 웜 시트 토큰(라이트 한정 — 다크는 기존 보더 유지) */}
        <section
          className="relative overflow-hidden rounded-2xl border border-[var(--border-warm-sheet)] dark:border-border bg-card p-6 shadow-[var(--shadow-raised)] dark:shadow-none"
          data-testid="briefing-letter"
          aria-label="오늘의 브리핑"
        >
          {/* 종이 그레인 — 히어로 한정 1겹, 느껴지되 보이지 않는 농도(≤0.05) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: PAPER_GRAIN_URI }}
          />
          <div className="relative">
            <p className="mb-3 font-serif text-[13px] italic text-foreground/60">전속 뷰티팀</p>

            {/* 관계 서사는 작은 윗줄로 보존하고, 오늘의 결론만 세리프 히어로가 맡는다. */}
            <p className="text-sm text-muted-foreground" data-testid="briefing-greeting">
              {briefing.greeting}
            </p>
            <h2
              className="mt-2 break-keep font-serif text-2xl font-semibold leading-snug text-foreground md:text-3xl"
              data-testid="briefing-verdict"
            >
              {verdict}
            </h2>

            {briefingAttributes.length > 0 && (
              <dl className="mt-5 divide-y divide-border border-y border-border">
                {briefingAttributes.map((attribute, index) => (
                  <div
                    key={`${attribute.label}-${index}`}
                    className="grid grid-cols-[4.5rem_1fr] gap-3 py-2.5 text-sm"
                    data-testid="briefing-attribute"
                  >
                    <dt className="font-medium text-muted-foreground">{attribute.label}</dt>
                    <dd className="break-keep text-foreground/90">{attribute.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {/* 관찰·이유는 결론 뒤의 접힌 근거로만 제공한다. */}
            {hasBriefingEvidence && (
              <details className="mt-3 text-sm" data-testid="briefing-evidence">
                <summary className="cursor-pointer text-xs font-medium text-foreground/70 hover:text-foreground">
                  오늘 제안의 근거
                </summary>
                <div className="mt-3 space-y-2 border-l border-border pl-3 text-xs leading-relaxed text-muted-foreground">
                  {briefing.observation && !shelfFollowup && <p>{briefing.observation}</p>}
                  {briefingAttributes.map(
                    (attribute, index) =>
                      attribute.rationale && (
                        <p key={`${attribute.label}-reason-${index}`}>
                          <span className="font-medium text-foreground/80">{attribute.label}</span>
                          {' | '}
                          {attribute.rationale}
                        </p>
                      )
                  )}
                </div>
              </details>
            )}

            <p className="mt-3 text-xs text-muted-foreground" data-testid="briefing-closing">
              {briefing.closing}
            </p>

            {/* 제품함 후속은 마무리 뒤의 한 줄 대화로 두어 근거 disclosure와 분리한다. */}
            {shelfFollowup && (
              <div
                className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3 text-xs"
                data-testid="shelf-feedback-followup"
              >
                {shelfFeedbackSaved ? (
                  <p className="font-medium text-foreground" data-testid="shelf-feedback-ack">
                    기억해둘게요.
                  </p>
                ) : (
                  <>
                    <p className="mr-auto text-muted-foreground">{briefing.observation}</p>
                    <div className="flex gap-2" data-testid="shelf-feedback-actions">
                      <button
                        type="button"
                        data-testid="shelf-feedback-positive"
                        onClick={() => handleShelfFeedback(shelfFollowup.shelfItemId, 'positive')}
                        className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        잘 맞아요
                      </button>
                      <button
                        type="button"
                        data-testid="shelf-feedback-negative"
                        onClick={() => handleShelfFeedback(shelfFollowup.shelfItemId, 'negative')}
                        className="rounded-full border border-border bg-card px-3 py-1.5 font-medium text-foreground transition-colors hover:bg-secondary"
                      >
                        글쎄요
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </section>

        {/* 1-b) 나의 퍼스널컬러 — 원형 점 대신 풀폭 색면 밴드(하드엣지)로 색 질량 복구.
            색은 전부 사용자 진단 hex — 장식색·채도 증폭 없음 */}
        {myColors && representativeColors && representativeColors.length > 0 && (
          <section aria-label="나의 퍼스널컬러" data-testid="briefing-my-colors">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground">나의 퍼스널컬러</h3>
                </div>
                {seasonLabel && (
                  <span
                    className="break-keep font-serif text-base font-semibold text-foreground"
                    data-testid="briefing-season-name"
                  >
                    {seasonLabel}
                  </span>
                )}
              </div>
              {/* 색면 밴드 — 이어붙은 색면(간격 0), 높이 48px. 명도 내림차순 표시(위 정렬 주석).
                  경계 링: 흰 카드에서 밝은 색면이 배경에 녹는 것을 막는다.
                  접근성: 밴드 1장을 그림으로 읽어준다(세그먼트마다 aria-label을 걸면 소음) */}
              <div
                className="mt-3 flex h-12 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10"
                role="img"
                aria-label={`나의 퍼스널컬러 대표 색: ${representativeColors
                  .map((c) => c.name || c.hex)
                  .join(', ')}`}
              >
                {representativeColors.map((c, i) => (
                  <span
                    key={`${c.hex}-${i}`}
                    className="h-full min-w-0 flex-1"
                    style={{ backgroundColor: c.hex }}
                    title={c.name || c.hex}
                    data-testid="briefing-color-swatch"
                  />
                ))}
              </div>
              {/* 색 이름 — 밴드 세그먼트와 같은 폭 배분, 2줄까지 허용(잘림 대신 가독) */}
              <div className="mt-1.5 flex">
                {representativeColors.map((c, i) => (
                  <span
                    key={`${c.hex}-name-${i}`}
                    className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted-foreground break-keep line-clamp-2"
                    data-testid="briefing-color-name"
                  >
                    {c.name || c.hex}
                  </span>
                ))}
              </div>
              <Link
                href={`/analysis/personal-color/result/${myColors.analysisId}`}
                className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                전체 리포트 보기
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ── 그룹 2: 오늘의 실행 3개(보조 위계 — 경량 카드) ── */}
      <div className="space-y-3">
        {/* ① 오늘의 루틴 */}
        <section aria-label="오늘의 루틴" data-testid="briefing-routine">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">오늘의 루틴</h3>
          <HomeDailyCapsuleWidget />
        </section>

        {/* ② 오늘의 코디 — 역할별 폭 비율 배색 바(색 질량) + 날씨 팁.
            제목은 목적지(/closet/recommend의 h1 "오늘의 코디")와 같은 말을 쓴다 — 같은 개념의 이름 드리프트 해소 */}
        <section aria-label="오늘의 코디" data-testid="briefing-style">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">오늘의 코디</h3>
          <Link
            href="/closet/recommend"
            className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-foreground/30"
          >
            {/* 오늘의 배색 (베스트 컬러가 있을 때만 — 결정론). 착장 면적 비율 배색 바 */}
            {dailyOutfit && (
              <div className="mb-3" data-testid="briefing-outfit-palette">
                {outfitConclusion && (
                  <p
                    className="mb-2 break-keep font-serif text-lg font-semibold text-foreground"
                    data-testid="briefing-outfit-verdict"
                  >
                    {outfitConclusion}
                  </p>
                )}
                {/* 경계 링: 흰 카드에서 밝은 색면이 녹지 않게. 접근성: 밴드 1장 = 그림 1개 */}
                <div
                  className="flex h-10 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10"
                  role="img"
                  aria-label={outfitBandLabel(outfitBand)}
                >
                  {outfitBand.map(({ color, widthPct }) => (
                    <span
                      key={color.role}
                      className="h-full"
                      style={{ backgroundColor: color.hex, width: `${widthPct}%` }}
                      title={`${color.role} · ${color.name}`}
                      data-testid="briefing-outfit-block"
                    />
                  ))}
                </div>
                {/* 범례 — 세그먼트와 같은 폭 배분으로 색 아래에 붙는다(wrap 나열이면 어느 색인지 안 읽힘).
                    좁은 세그먼트(13%)는 역할만 — 색 이름은 위 밴드의 aria-label·title이 전한다.
                    시각 보조 표기라 aria-hidden(밴드 aria-label과 중복 낭독 방지) */}
                <div className="mt-1.5 flex" aria-hidden="true">
                  {outfitBand.map(({ color, widthPct }) => (
                    <span
                      key={color.role}
                      className="min-w-0 px-0.5 text-center"
                      style={{ width: `${widthPct}%` }}
                    >
                      <span className="block text-[11px] leading-tight text-muted-foreground">
                        {color.role}
                      </span>
                      {widthPct >= LEGEND_NAME_MIN_PCT && (
                        <span
                          className="block break-keep text-[11px] font-medium leading-tight text-foreground/80 line-clamp-2"
                          data-testid="briefing-outfit-name"
                        >
                          {color.name}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Shirt className="h-5 w-5 text-foreground/70" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                {/* 날씨 팁 — 배색 캡션과 별개 줄. 위치는 동의한 사용자만 실제 좌표,
                    그 외에는 서울 기본값이므로 "서울 기준"을 함께 밝힌다 */}
                <p
                  className="text-sm leading-snug text-foreground/90"
                  data-testid="briefing-weather-tip"
                >
                  {fashionTip ?? '오늘의 배색과 코디 조합을 더 자세히 확인해보세요'}
                  {fashionTip && weatherLocationSource === 'default' && (
                    <span
                      className="ml-1.5 text-xs text-muted-foreground"
                      data-testid="briefing-weather-location"
                    >
                      서울 기준
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs font-medium text-foreground/70">코디 추천 받기</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>
          </Link>
        </section>
      </div>

      {/* ── 그룹 3: 공식 후속 채널 + 접힌 상태/리포트 ── */}
      <div className="space-y-4 border-t border-border pt-6">
        {/* 물어보기 프리뷰 인풋 */}
        <div data-testid="briefing-ask-channel">
          <p className="mb-2 px-1 text-xs text-muted-foreground">
            오늘 브리핑에서 더 궁금한 점이 있나요?
          </p>
          <form onSubmit={handleAsk} data-testid="briefing-ask" className="flex items-center gap-2">
            <div className="relative flex-1">
              <MessageCircle
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="피부·옷·헤어를 물어보세요"
                aria-label="무엇이든 물어보세요"
                data-testid="briefing-ask-input"
                className="w-full rounded-full border border-border bg-card py-2.5 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-foreground/40"
              />
            </div>
            <button
              type="submit"
              aria-label="물어보기"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-colors hover:bg-foreground/85"
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </form>
        </div>

        {/* 내 상태와 정체성 리포트는 한 후속 영역으로 통합하고 기본 접힘 상태를 유지한다. */}
        <details
          className="rounded-2xl border border-border bg-card"
          data-testid="briefing-followup"
        >
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-foreground marker:content-none">
            <span className="flex items-center justify-between gap-3">
              내 상태와 정체성 리포트
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </span>
          </summary>
          <div className="space-y-4 border-t border-border p-4">
            <section aria-label="내 상태" data-testid="briefing-status">
              {skinEntry?.skinTrend && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">피부 컨디션</span>
                  <BriefingSkinChip trend={skinEntry.skinTrend} />
                </div>
              )}
              {topInsight ? (
                <div>
                  <p className="text-sm font-medium text-foreground">{topInsight.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {topInsight.description}
                  </p>
                </div>
              ) : (
                !skinEntry?.skinTrend && (
                  <p className="text-sm text-muted-foreground">
                    분석을 더 담아주면 내 상태를 더 자세히 읽어드릴게요
                  </p>
                )
              )}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
                >
                  내 프로필 전체 보기
                  <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
                {/* 피부 분석이 있는 사용자만 다이어리 추적 경로를 제공한다. */}
                {skinEntry && (
                  <Link
                    href="/analysis/skin/diary"
                    className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground"
                    data-testid="briefing-skin-diary-link"
                  >
                    피부 일기로 오늘 컨디션 기록하기
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </section>

            <IntegratedSessionPromptCard embedded />
          </div>
        </details>
      </div>
    </div>
  );
}

/** 숫자 점수 대신 직전 분석 대비 방향만 정직하게 전달한다. */
function BriefingSkinChip({ trend }: { trend: 'up' | 'down' | 'flat' }) {
  const config = {
    up: {
      cls: 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-200',
      label: '지난 분석보다 안정적이에요',
    },
    down: {
      cls: 'bg-amber-500/15 text-amber-800 dark:text-amber-200',
      label: '지난 분석보다 세심한 관리가 필요해요',
    },
    flat: {
      cls: 'bg-secondary text-foreground/70',
      label: '지난 분석과 비슷해요',
    },
  }[trend];
  const { cls, label } = config;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}
      data-testid="skin-trend-chip"
    >
      {label}
    </span>
  );
}
