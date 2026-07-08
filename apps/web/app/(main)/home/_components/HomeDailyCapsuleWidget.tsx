'use client';

/**
 * 홈 Daily Capsule 위젯 + ConnectionAwareness 내재화 추적
 *
 * - 캡슐 표시 시 각 도메인별 연결 노출 기록
 * - 아이템 체크 시 연결 확인 (상태 전이 촉진)
 * - 내재화 수준에 따라 reason 표시 깊이 조절
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight,
  Palette,
  Droplets,
  Dumbbell,
  Apple,
  Scissors,
  Wand2,
  Smile,
  Shirt,
  Activity,
} from 'lucide-react';
import type { DailyCapsule, DailyItem, ModuleCode } from '@/types/capsule';
import type { ExplanationDepth } from '@/lib/connection-awareness';
import {
  exposeConnection,
  confirmConnection,
  getExplanationDepth,
  capsuleItemToExposeRequest,
} from '@/lib/connection-awareness';

// 모듈별 아이콘 매핑
const MODULE_ICONS: Record<ModuleCode, typeof Sparkles> = {
  PC: Palette,
  S: Droplets,
  C: Activity,
  W: Dumbbell,
  N: Apple,
  H: Scissors,
  M: Wand2,
  OH: Smile,
  Fashion: Shirt,
};

export default function HomeDailyCapsuleWidget() {
  const { user } = useUser();
  const userId = user?.id;
  const supabase = useClerkSupabaseClient();
  const t = useTranslations('home');
  const [capsule, setCapsule] = useState<DailyCapsule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // 각 모듈의 내재화 상태 (도메인 단위 추적)
  const [moduleDepths, setModuleDepths] = useState<Record<string, ExplanationDepth>>({});

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const fetchCapsule = async (): Promise<void> => {
      try {
        const res = await fetch('/api/capsule/daily', { method: 'POST' });
        const data = await res.json();
        if (res.ok && data.success && data.data) {
          setCapsule(data.data);
        } else {
          // 서버 에러(500 등)를 빈 상태("분석을 더 완료하면")로 위장하지 않도록 에러 UI로 분기
          setHasError(true);
        }
      } catch {
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCapsule();
  }, [userId]);

  // 캡슐 아이템 로드 후 ConnectionAwareness 노출 기록
  useEffect(() => {
    if (!userId || !capsule || capsule.items.length === 0) return;

    async function trackCapsuleExposure(): Promise<void> {
      const depths: Record<string, ExplanationDepth> = {};
      const trackedModules = new Set<string>();

      for (const item of capsule!.items) {
        // 이미 추적한 모듈은 건너뜀 (도메인 단위)
        if (trackedModules.has(item.moduleCode)) continue;
        trackedModules.add(item.moduleCode);

        const request = capsuleItemToExposeRequest(item.moduleCode);
        try {
          const response = await exposeConnection(supabase, userId!, request);
          depths[item.moduleCode] = getExplanationDepth(response.status);
        } catch {
          depths[item.moduleCode] = 'full';
        }
      }

      setModuleDepths(depths);
    }

    trackCapsuleExposure();
  }, [userId, capsule, supabase]);

  // 아이템 체크 토글 + ConnectionAwareness 확인
  const handleCheck = useCallback(
    async (item: DailyItem) => {
      if (!capsule || !userId) return;

      // 체크 시 연결 확인 (체크 해제 시엔 추적 안 함)
      if (!item.isChecked) {
        const request = capsuleItemToExposeRequest(item.moduleCode);
        try {
          const response = await confirmConnection(supabase, userId!, request.connectionId);
          setModuleDepths((prev) => ({
            ...prev,
            [item.moduleCode]: getExplanationDepth(response.status),
          }));
        } catch {
          // 확인 실패 시 무시
        }
      }

      try {
        await fetch(`/api/capsule/check/${capsule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, isChecked: !item.isChecked }),
        });

        setCapsule((prev) => {
          if (!prev) return prev;
          const updatedItems = prev.items.map((i) =>
            i.id === item.id ? { ...i, isChecked: !i.isChecked } : i
          );
          const allChecked = updatedItems.every((i) => i.isChecked);
          return {
            ...prev,
            items: updatedItems,
            status: allChecked ? 'completed' : 'in_progress',
          };
        });
      } catch {
        // 체크 실패 시 무시
      }
    },
    [capsule, userId, supabase]
  );

  // 로딩/데이터 없음
  if (isLoading) {
    return (
      <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm animate-pulse">
        <div className="h-5 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-3" />
        <div className="space-y-2">
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
          <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded" />
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div
        className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 p-5 shadow-sm"
        data-testid="home-daily-capsule-error"
      >
        <p className="text-sm text-muted-foreground mb-2">{t('capsuleLoadError')}</p>
        <button
          onClick={() => {
            setHasError(false);
            setIsLoading(true);
            fetch('/api/capsule/daily', { method: 'POST' })
              .then(async (res) => {
                const data = await res.json();
                // 초기 로드와 동일: 실패 응답은 빈 상태가 아닌 에러 UI로
                if (res.ok && data.success && data.data) setCapsule(data.data);
                else setHasError(true);
              })
              .catch(() => setHasError(true))
              .finally(() => setIsLoading(false));
          }}
          className="text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium min-h-[44px]"
        >
          {t('capsuleRetry')}
        </button>
      </div>
    );
  }

  if (!capsule || capsule.items.length === 0) {
    return (
      <div
        className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 p-5 text-center"
        data-testid="home-daily-capsule-empty"
      >
        <Sparkles className="w-5 h-5 text-violet-400 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">{t('capsuleEmptyState')}</p>
        <Link
          href="/analysis/integrated"
          className="mt-3 inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 font-medium min-h-[44px]"
        >
          {t('capsuleEmptyCta')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  const checkedCount = capsule.items.filter((i) => i.isChecked).length;
  const totalCount = capsule.items.length;
  const progress = Math.round((checkedCount / totalCount) * 100);

  return (
    <div
      className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 rounded-2xl border border-violet-200/50 dark:border-violet-800/30 p-5"
      data-testid="home-daily-capsule"
      role="region"
      aria-label={t('capsuleLabel')}
    >
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500" />
          <h3 className="font-semibold text-foreground">{t('todayRoutine')}</h3>
          <span className="text-xs text-muted-foreground" aria-live="polite">
            {checkedCount}/{totalCount}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          <span>{t('capsuleMinutes', { minutes: capsule.estimatedMinutes })}</span>
        </div>
      </div>

      {/* 프로그레스 바 */}
      <div className="h-1.5 bg-violet-100 dark:bg-violet-900/30 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-400 to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* 아이템 리스트 (최대 5개 표시) */}
      <div className="space-y-1.5">
        {capsule.items.slice(0, 5).map((item) => {
          const Icon = MODULE_ICONS[item.moduleCode] || Sparkles;
          const depth = moduleDepths[item.moduleCode] ?? 'full';

          return (
            <button
              key={item.id}
              onClick={() => handleCheck(item)}
              className="flex items-center gap-3 w-full p-3 min-h-[44px] rounded-lg hover:bg-white/50 dark:hover:bg-white/5 transition-colors text-left"
            >
              {item.isChecked ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-violet-500 shrink-0" />
              ) : (
                <Circle className="w-4.5 h-4.5 text-muted-foreground/40 shrink-0" />
              )}
              <Icon className="w-4 h-4 text-violet-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm block truncate ${
                    item.isChecked ? 'line-through text-muted-foreground' : 'text-foreground'
                  }`}
                >
                  {item.name}
                </span>
                {/* reason 표시 — 내재화 수준에 따라 분기 */}
                {depth === 'full' && item.reason && (
                  <span className="text-[11px] text-muted-foreground truncate block">
                    {item.reason}
                  </span>
                )}
                {depth === 'brief' && item.reason && (
                  <span className="text-[10px] text-muted-foreground/70 truncate block">
                    {item.reason}
                  </span>
                )}
                {/* 실행 가이드("어떤 것으로/어떻게") — 엔진이 이미 생성하지만 위젯에서 숨겨져 있었음 */}
                {depth === 'full' && item.solution && (
                  <span className="text-[11px] text-violet-500/90 dark:text-violet-400/90 truncate block">
                    {item.solution}
                  </span>
                )}
                {/* minimal/none: reason 생략 — 사용자가 이미 이해함 */}
              </div>
            </button>
          );
        })}
      </div>

      {/* 더 보기 */}
      {capsule.items.length > 5 && (
        <p className="text-xs text-muted-foreground mt-2 pl-2">
          {t('capsuleMoreItems', { count: capsule.items.length - 5 })}
        </p>
      )}

      {/* 완료 상태 또는 상세 보기 */}
      {capsule.status === 'completed' ? (
        <div className="mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-800/30 text-center">
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
            {t('capsuleAllComplete')}
          </p>
        </div>
      ) : (
        <Link
          href="/capsule/daily"
          className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-violet-200/50 dark:border-violet-800/30 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
        >
          {t('capsuleDetail')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
