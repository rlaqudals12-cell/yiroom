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
 *  2) 오늘의 실행 3개 — ① 오늘의 루틴 ② 오늘의 스타일 ③ 내 상태
 *  3) 물어보기 프리뷰 인풋 → /coach?q=...
 *  4) 최신 통합 결과 링크
 */

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  MessageCircle,
  Shirt,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { PAPER_GRAIN_URI } from '@/components/share/paper-grain';
import { hexToLab, calculateHue } from '@/lib/color';
import type { OutfitColor, OutfitRole } from '@/lib/color/daily-outfit';
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
  generateEnvironmentAdvice,
  type EnvironmentAdvice,
} from '@/lib/weather';
import HomeDailyCapsuleWidget from './HomeDailyCapsuleWidget';
import { IntegratedSessionPromptCard } from './IntegratedSessionPromptCard';

/**
 * 환경 조언 로드 — EnvironmentAdviceCard와 동일한 30분 sessionStorage 캐시 재사용.
 * (홈에서 날씨는 단일 소스 — 브리핑이 EnvironmentAdviceCard를 흡수)
 */
function useEnvironmentAdvice(): EnvironmentAdvice | null {
  const [advice, setAdvice] = useState<EnvironmentAdvice | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load(): Promise<void> {
      const cacheKey = 'env-weather';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 30 * 60 * 1000) {
            if (!cancelled) setAdvice(generateEnvironmentAdvice(data));
            return;
          }
        } catch {
          /* 캐시 파싱 실패 — 새로 조회 */
        }
      }
      const data = await getCurrentWeather();
      if (data && !cancelled) {
        setAdvice(generateEnvironmentAdvice(data));
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

  return advice;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 배색 바 역할별 폭 비율(%) — 실제 착장에서 차지하는 면적 비율로 색 질량을 표현.
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

/** 배색 5색을 표시 순서(상의→하의→가방→포인트→신발)로 재배열 + 폭 비율 결합 */
function orderOutfitBand(
  colors: ReadonlyArray<OutfitColor>
): Array<{ color: OutfitColor; widthPct: number }> {
  return OUTFIT_BAND.flatMap(({ role, widthPct }) => {
    const color = colors.find((c) => c.role === role);
    return color ? [{ color, widthPct }] : [];
  });
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
    const json = await res.json();
    const first = json?.data?.items?.[0];
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
  const env = useEnvironmentAdvice();
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

  // 12톤 밴드 표시용 정렬 — 명도(L*) 내림차순, 동률이면 색상각(h°) 오름차순.
  // 왜: 진단 팔레트 원래 순서는 뮤트 톤에서 "회청 일색"으로 보인다 —
  // 밝음→어두움 그라데이션으로 늘어놓으면 같은 색들이 명도 축으로 구분된다.
  // hex·데이터는 불변(표시 순서만 바꿈 — 진단 결과 훼손 없음).
  const sortedMyColors = useMemo(() => {
    if (!myColors) return null;
    return [...myColors.colors].sort((a, b) => {
      const labA = hexToLab(a.hex);
      const labB = hexToLab(b.hex);
      if (labB.L !== labA.L) return labB.L - labA.L;
      return calculateHue(labA) - calculateHue(labB);
    });
  }, [myColors]);

  const dailyOutfit = payload.todayStyle.outfit;
  const fashionTip = payload.todayStyle.fashionTip;
  // 응답 대기 중인 제품함 후속(미응답 질문일 때만 존재) — 로컬 const라 클로저에서 좁힘이 유지된다
  const shelfFollowup = briefing.shelfFollowup;

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
            <p className="mb-3 font-serif text-[13px] italic text-primary">전속 뷰티팀</p>

            {/* 인사 — 세리프 디스플레이(레터의 앵커 1곳) */}
            <p className="break-keep font-serif text-2xl font-semibold leading-snug text-foreground md:text-3xl">
              {briefing.greeting}
            </p>

            {briefing.observation && (
              <p className="mt-3 text-sm text-foreground/90 leading-relaxed">
                {briefing.observation}
              </p>
            )}

            {/* 제품함 후속 응답 — 폐루프 v1(고객 노트). 답하면 rating 저장 → 다음 브리핑이 기억한다 */}
            {shelfFollowup &&
              (shelfFeedbackSaved ? (
                <p
                  className="mt-2 text-xs font-medium text-pink-600 dark:text-pink-300"
                  data-testid="shelf-feedback-ack"
                >
                  기억해둘게요.
                </p>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2" data-testid="shelf-feedback-actions">
                  <button
                    type="button"
                    data-testid="shelf-feedback-positive"
                    onClick={() => handleShelfFeedback(shelfFollowup.shelfItemId, 'positive')}
                    className="rounded-full border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
                  >
                    잘 맞아요
                  </button>
                  <button
                    type="button"
                    data-testid="shelf-feedback-negative"
                    onClick={() => handleShelfFeedback(shelfFollowup.shelfItemId, 'negative')}
                    className="rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition-colors hover:bg-secondary"
                  >
                    글쎄요
                  </button>
                </div>
              ))}

            {briefing.advice.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {briefing.advice.map((line, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                    <ArrowRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-500"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-3 text-xs text-muted-foreground">{briefing.closing}</p>
          </div>
        </section>

        {/* 1-b) 나의 퍼스널컬러 — 원형 점 대신 풀폭 색면 밴드(하드엣지)로 색 질량 복구.
            색은 전부 사용자 진단 hex — 장식색·채도 증폭 없음 */}
        {myColors && sortedMyColors && (
          <section aria-label="나의 퍼스널컬러" data-testid="briefing-my-colors">
            <Link
              href={`/analysis/personal-color/result/${myColors.analysisId}`}
              className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted-foreground">나의 퍼스널컬러</h3>
                {seasonLabel && (
                  <span
                    className="break-keep font-serif text-base font-semibold text-foreground"
                    data-testid="briefing-season-name"
                  >
                    {seasonLabel}
                  </span>
                )}
              </div>
              {/* 색면 밴드 — 이어붙은 색면(간격 0), 높이 48px. 명도 내림차순 표시(위 정렬 주석) */}
              <div className="mt-3 flex h-12 overflow-hidden rounded-lg">
                {sortedMyColors.map((c, i) => (
                  <span
                    key={`${c.hex}-${i}`}
                    className="h-full min-w-0 flex-1"
                    style={{ backgroundColor: c.hex }}
                    title={c.name || c.hex}
                    aria-label={c.name || c.hex}
                    data-testid="briefing-color-swatch"
                  />
                ))}
              </div>
              {/* 색 이름 — 밴드 세그먼트와 같은 폭 배분, 2줄까지 허용(잘림 대신 가독) */}
              <div className="mt-1.5 flex">
                {sortedMyColors.map((c, i) => (
                  <span
                    key={`${c.hex}-name-${i}`}
                    className="min-w-0 flex-1 text-center text-[10px] leading-tight text-muted-foreground break-keep line-clamp-2"
                    data-testid="briefing-color-name"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </Link>
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

        {/* ② 오늘의 스타일 — 역할별 폭 비율 배색 바(색 질량) + 날씨 팁 */}
        <section aria-label="오늘의 스타일" data-testid="briefing-style">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">오늘의 스타일</h3>
          <Link
            href="/closet/recommend"
            className="block rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            {/* 오늘의 배색 (베스트 컬러가 있을 때만 — 결정론). 착장 면적 비율 배색 바 */}
            {dailyOutfit && (
              <div
                className="mb-3"
                data-testid="briefing-outfit-palette"
                aria-label={`오늘의 배색: ${dailyOutfit.baseName} 기반`}
              >
                <div className="flex h-10 overflow-hidden rounded-lg">
                  {orderOutfitBand(dailyOutfit.colors).map(({ color, widthPct }) => (
                    <span
                      key={color.role}
                      className="h-full"
                      style={{ backgroundColor: color.hex, width: `${widthPct}%` }}
                      title={`${color.role} · ${color.name}`}
                      aria-label={`${color.role} ${color.name}`}
                      data-testid="briefing-outfit-block"
                    />
                  ))}
                </div>
                {/* 범례 — 역할 · 색 이름(파생색은 계열명, 지어내지 않음) */}
                <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  {orderOutfitBand(dailyOutfit.colors).map(({ color }) => (
                    <span key={color.role} className="text-[10px] text-muted-foreground">
                      {color.role}{' '}
                      <span
                        className="font-medium text-foreground/80"
                        data-testid="briefing-outfit-name"
                      >
                        {color.name}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Shirt className="h-5 w-5 text-primary" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/90 leading-snug">
                  {fashionTip ??
                    (dailyOutfit
                      ? '내 베스트 컬러로 짠 오늘의 배색이에요'
                      : '오늘 날씨와 내 체형에 맞는 코디를 골라줄게요')}
                </p>
                <p className="mt-0.5 text-xs font-medium text-primary">코디 추천 받기</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </div>
          </Link>
        </section>

        {/* ③ 내 상태 */}
        <section aria-label="내 상태" data-testid="briefing-status">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">내 상태</h3>
          <div className="rounded-2xl border border-border bg-card p-4">
            {skinEntry?.skinTrend && (
              <div className="mb-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">피부 컨디션</span>
                <BriefingSkinChip trend={skinEntry.skinTrend} delta={skinEntry.skinDelta ?? 0} />
              </div>
            )}
            {topInsight ? (
              <div>
                <p className="text-sm font-medium text-foreground">{topInsight.title}</p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
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
            <Link
              href="/profile"
              className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
            >
              내 프로필 전체 보기
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
            {/* 피부 일기 재측정 유도 — 피부 분석을 한 사용자에게만 노출(다이어리 추적 IA 진입).
                리텐션 엔진(before/after·상관·악화 알림)이 홈에서 도달 가능하게 배선 */}
            {skinEntry && (
              <Link
                href="/analysis/skin/diary"
                className="mt-2 flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80"
                data-testid="briefing-skin-diary-link"
              >
                피부 일기로 오늘 컨디션 기록하기
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            )}
          </div>
        </section>
      </div>

      {/* ── 그룹 3: 물어보기 + 최신 통합 결과 ── */}
      <div className="space-y-3">
        {/* 물어보기 프리뷰 인풋 */}
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
              placeholder="무엇이든 물어보세요 — 피부·옷·헤어"
              aria-label="무엇이든 물어보세요"
              data-testid="briefing-ask-input"
              className="w-full rounded-full border border-border bg-card py-3 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/60"
            />
          </div>
          <button
            type="submit"
            aria-label="물어보기"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-colors hover:bg-primary/90"
          >
            <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </form>

        {/* 최신 통합 결과 링크 */}
        <IntegratedSessionPromptCard />
      </div>
    </div>
  );
}

/** 피부 점수 추이 칩 — 직전 분석 대비 (↑ 개선 / ↓ 하락 / 유지) */
function BriefingSkinChip({ trend, delta }: { trend: 'up' | 'down' | 'flat'; delta: number }) {
  const magnitude = Math.abs(delta);
  const config = {
    up: {
      Icon: TrendingUp,
      cls: 'bg-emerald-500/25 text-emerald-700 dark:text-emerald-300',
      label: `+${magnitude}점`,
      desc: `지난 분석보다 ${magnitude}점 올랐어요`,
    },
    down: {
      Icon: TrendingDown,
      cls: 'bg-amber-500/25 text-amber-700 dark:text-amber-300',
      label: `-${magnitude}점`,
      desc: `지난 분석보다 ${magnitude}점 내려갔어요`,
    },
    flat: {
      Icon: Minus,
      cls: 'bg-slate-500/20 text-slate-600 dark:text-slate-300',
      label: '유지',
      desc: '지난 분석과 같은 점수예요',
    },
  }[trend];
  const { Icon, cls, label, desc } = config;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${cls}`}
      title={desc}
      aria-label={desc}
      data-testid="skin-trend-chip"
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label}
    </span>
  );
}
