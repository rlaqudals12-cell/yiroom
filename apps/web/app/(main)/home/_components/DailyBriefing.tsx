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
  Sparkles,
  MessageCircle,
  Shirt,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
} from 'lucide-react';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';
import { assembleBriefing } from '@/lib/briefing';
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

interface DailyBriefingProps {
  analyses: AnalysisSummary[];
}

export default function DailyBriefing({ analyses }: DailyBriefingProps) {
  const { user } = useUser();
  const router = useRouter();
  const env = useEnvironmentAdvice();
  const [question, setQuestion] = useState('');

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
      }),
    [analyses, userName, env]
  );

  const { briefing, myColors } = payload;
  const dailyOutfit = payload.todayStyle.outfit;
  const fashionTip = payload.todayStyle.fashionTip;

  // 내 상태 섹션용(브리핑 조립과 별개) — 피부 추이 칩에 사용
  const skinEntry = analyses.find((a) => a.type === 'skin');

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

  return (
    <div className="space-y-5" data-testid="home-daily-briefing">
      {/* 1) 브리핑 레터 */}
      <section
        className="rounded-2xl border border-pink-200/60 dark:border-pink-900/40 bg-gradient-to-br from-pink-50/80 via-white to-purple-50/60 dark:from-pink-950/20 dark:via-slate-900/40 dark:to-purple-950/20 p-5"
        data-testid="briefing-letter"
        aria-label="오늘의 브리핑"
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-purple-500 shadow-sm">
            <Sparkles className="h-4 w-4 text-white" aria-hidden="true" />
          </span>
          <span className="text-xs font-medium text-muted-foreground">전속 뷰티팀</span>
        </div>

        <p className="text-lg font-bold text-foreground">{briefing.greeting}</p>

        {briefing.observation && (
          <p className="mt-2 text-sm text-foreground/90 leading-relaxed">{briefing.observation}</p>
        )}

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
      </section>

      {/* 1-b) 나의 컬러 — 진단된 베스트 팔레트 스와치 (PC 분석 있을 때만) */}
      {myColors && (
        <section aria-label="나의 퍼스널컬러" data-testid="briefing-my-colors">
          <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">나의 퍼스널컬러</h3>
          <Link
            href={`/analysis/personal-color/result/${myColors.analysisId}`}
            className="flex items-center gap-3 rounded-2xl border border-pink-200/50 dark:border-pink-900/40 bg-white/60 dark:bg-slate-800/40 p-4 transition-colors hover:border-pink-300 dark:hover:border-pink-800"
          >
            {/* 4개까지만 표시해 폭을 확보 — 이름이 잘리지 않고 읽히는 것이 우선 */}
            <div className="flex flex-1 items-start gap-2">
              {myColors.colors.slice(0, 4).map((c, i) => (
                <div
                  key={`${c.hex}-${i}`}
                  className="flex flex-1 min-w-0 flex-col items-center gap-1"
                >
                  <span
                    className="h-9 w-9 rounded-full border border-white/70 dark:border-slate-700 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                    title={c.name || c.hex}
                    aria-label={c.name || c.hex}
                    data-testid="briefing-color-swatch"
                  />
                  {/* 색 이름 — 잘림(truncate) 대신 2줄까지 허용(break-keep)해 어떤 색인지 읽히게 */}
                  {c.name && (
                    <span
                      className="w-full text-center text-[10px] leading-tight text-muted-foreground break-keep line-clamp-2"
                      data-testid="briefing-color-name"
                    >
                      {c.name}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </Link>
        </section>
      )}

      {/* 2) 오늘의 실행 3개 */}
      {/* ① 오늘의 루틴 */}
      <section aria-label="오늘의 루틴" data-testid="briefing-routine">
        <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">오늘의 루틴</h3>
        <HomeDailyCapsuleWidget />
      </section>

      {/* ② 오늘의 스타일 — 내 베스트 컬러 기반 오늘의 배색(상의·하의·신발·가방·포인트) + 날씨 팁 */}
      <section aria-label="오늘의 스타일" data-testid="briefing-style">
        <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">오늘의 스타일</h3>
        <Link
          href="/closet/recommend"
          className="block rounded-2xl border border-blue-200/50 dark:border-blue-900/40 bg-white/60 dark:bg-slate-800/40 p-4 transition-colors hover:border-blue-300 dark:hover:border-blue-800"
        >
          {/* 오늘의 배색 조합 (베스트 컬러가 있을 때만 — 결정론). 색 이름 함께 표기 */}
          {dailyOutfit && (
            <div
              className="mb-3 flex items-start gap-2"
              data-testid="briefing-outfit-palette"
              aria-label={`오늘의 배색: ${dailyOutfit.baseName} 기반`}
            >
              {dailyOutfit.colors.map((c) => (
                <div key={c.role} className="flex flex-1 min-w-0 flex-col items-center gap-1">
                  <span
                    className="h-10 w-10 rounded-xl border border-white/70 dark:border-slate-700 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                    title={`${c.role} · ${c.name}`}
                    aria-label={`${c.role} ${c.name}`}
                    data-testid="briefing-outfit-block"
                  />
                  <span className="text-[10px] font-medium text-foreground/80">{c.role}</span>
                  {/* 색 이름 — 파생색은 계열명, 지어내지 않음(2줄까지 허용) */}
                  <span
                    className="w-full text-center text-[9px] leading-tight text-muted-foreground break-keep line-clamp-2"
                    data-testid="briefing-outfit-name"
                  >
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15">
              <Shirt className="h-5 w-5 text-blue-500" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-foreground/90 leading-snug">
                {fashionTip ??
                  (dailyOutfit
                    ? '내 베스트 컬러로 짠 오늘의 배색이에요'
                    : '오늘 날씨와 내 체형에 맞는 코디를 골라줄게요')}
              </p>
              <p className="mt-0.5 text-xs font-medium text-blue-500">코디 추천 받기</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          </div>
        </Link>
      </section>

      {/* ③ 내 상태 */}
      <section aria-label="내 상태" data-testid="briefing-status">
        <h3 className="mb-2 px-1 text-xs font-semibold text-muted-foreground">내 상태</h3>
        <div className="rounded-2xl border border-white/50 dark:border-slate-700/50 bg-white/60 dark:bg-slate-800/40 p-4">
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
        </div>
      </section>

      {/* 3) 물어보기 프리뷰 인풋 */}
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
            className="w-full rounded-full border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-800/60 py-3 pl-9 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-pink-400"
          />
        </div>
        <button
          type="submit"
          aria-label="물어보기"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-sm transition-opacity hover:opacity-90"
        >
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </form>

      {/* 4) 최신 통합 결과 링크 */}
      <IntegratedSessionPromptCard />
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
