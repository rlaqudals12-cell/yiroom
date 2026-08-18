'use client';

/**
 * 홈 Daily Capsule 위젯 + ConnectionAwareness 내재화 추적
 *
 * - 캡슐 표시 시 각 도메인별 연결 노출 기록
 * - 아이템 체크 시 연결 확인 (상태 전이 촉진)
 * - 내재화 수준에 따라 reason 표시 깊이 조절
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { useTranslations } from 'next-intl';
import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import Link from 'next/link';
import {
  CheckCircle2,
  Circle,
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
  type LucideIcon,
} from 'lucide-react';
import type { DailyCapsule, DailyItem, DailySolutionProduct, ModuleCode } from '@/types/capsule';
// 시간대 → 활성 그룹 판정 — 배럴(index) 대신 직접 import (서버 전용 모듈 끌림 방지)
import { getTimeGroupPriority } from '@/lib/capsule/time-of-day';
import type { ExplanationDepth } from '@/lib/connection-awareness';
import {
  exposeConnection,
  confirmConnection,
  getExplanationDepth,
  capsuleItemToExposeRequest,
} from '@/lib/connection-awareness';

// ADR-117 계약: solutionProduct에 source/shelfItemId 확장 필드가 붙는다(R1 구현 중).
// 타입 배포 전에도 안전하게 소비하기 위한 로컬 확장 — 실제 타입 승격 후에도 호환.
type SolutionProductWithSource = DailySolutionProduct & {
  source?: 'shelf' | 'catalog';
  shelfItemId?: string;
};

// ADR-117 계약: 캡슐에 오늘 저녁 포커스가 붙는다(S1 구현 중). 배포 전에도 안전 소비.
// G4: 어제 대비 변화 문구(skinEveningChange)도 함께 붙는다(달라졌을 때만).
type CapsuleWithEveningFocus = DailyCapsule & {
  skinEveningFocus?: { focus: string; label: string; reason: string };
  skinEveningChange?: string;
};

// G4 일변화 체감 — 오늘 요일 (저녁 포커스 배지에 표기)
const DOW_KO = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];

// 모듈별 아이콘 매핑
const MODULE_ICONS: Record<ModuleCode, LucideIcon> = {
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

/** 현재 시간대에서 먼저 실행할 미완료 1건. 중요도 데이터가 없으므로 생성 순서를 그대로 따른다. */
function selectFirstAction(items: DailyItem[], hour: number): DailyItem | null {
  const uncheckedItems = items.filter((item) => !item.isChecked);
  for (const key of getTimeGroupPriority(hour)) {
    const first = uncheckedItems.find((item) => (item.timeOfDay ?? 'anytime') === key);
    if (first) return first;
  }
  return items[0] ?? null;
}

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
  const firstAction = useMemo(
    () => (capsule ? selectFirstAction(capsule.items, new Date().getHours()) : null),
    [capsule]
  );

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

  // 홈에 실제 노출하는 대표 행동 1건만 ConnectionAwareness 노출로 기록한다.
  useEffect(() => {
    if (!userId || !firstAction) return;
    const action = firstAction;

    async function trackCapsuleExposure(): Promise<void> {
      const request = capsuleItemToExposeRequest(action.moduleCode);
      let depth: ExplanationDepth = 'full';
      try {
        const response = await exposeConnection(supabase, userId!, request);
        depth = getExplanationDepth(response.status);
      } catch {
        // 추적 실패는 설명 노출을 막지 않는다.
      }
      setModuleDepths((previous) => ({ ...previous, [action.moduleCode]: depth }));
    }

    trackCapsuleExposure();
  }, [userId, firstAction, supabase]);

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
        // 체크 API 정본 = /api/capsule/daily/[id] (모바일 APK도 이 경로 하드코딩 —
        // 구 check/[id] 이중화가 표면별 계약 드리프트의 원천이라 통일, 2026-08-01)
        const res = await fetch(`/api/capsule/daily/${capsule.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId: item.id, isChecked: !item.isChecked }),
        });

        // 서버 거부(400/404/500) 시 로컬 갱신 금지 — 새로고침 때 체크가 사라지는
        // 무음 유실을 막는다(성공 확정 후에만 반영, 2026-08-01 리뷰 수리)
        if (!res.ok) return;

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
      <div className="bg-card rounded-2xl border border-border p-5 animate-pulse">
        <div className="h-5 w-32 bg-muted rounded mb-3" />
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
        className="bg-card rounded-2xl border border-border p-5"
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
          className="min-h-[44px] text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          {t('capsuleRetry')}
        </button>
      </div>
    );
  }

  if (!capsule || capsule.items.length === 0) {
    return (
      <div
        className="bg-card rounded-2xl border border-border p-5 text-center"
        data-testid="home-daily-capsule-empty"
      >
        <p className="text-sm text-muted-foreground">{t('capsuleEmptyState')}</p>
        <Link
          href="/analysis/integrated"
          className="mt-3 inline-flex min-h-[44px] items-center gap-1 text-sm font-medium text-foreground/70 hover:text-foreground"
        >
          {t('capsuleEmptyCta')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  // items가 비어 있지 않으므로 firstAction은 존재한다. 타입 가드는 비정상 응답에도 안전한 빈 상태를 보장한다.
  if (!firstAction) return null;

  const Icon = MODULE_ICONS[firstAction.moduleCode];
  const depth = moduleDepths[firstAction.moduleCode] ?? 'full';
  const solutionProduct = firstAction.solutionProduct as SolutionProductWithSource | undefined;
  const hasProduct = solutionProduct?.source != null;
  const canBrowseProducts = ['S', 'M', 'H'].includes(firstAction.moduleCode);
  const productHref =
    solutionProduct?.source === 'catalog' && solutionProduct.id
      ? `/beauty/${solutionProduct.id}`
      : solutionProduct?.source === 'catalog' || (!hasProduct && canBrowseProducts)
        ? '/beauty'
        : null;
  // ADR-117: 오늘 저녁 포커스(배지 1줄) — 있을 때만, 과하지 않게
  const eveningFocus = (capsule as CapsuleWithEveningFocus).skinEveningFocus;
  // G4: 어제 대비 변화 문구 + 오늘 요일 (일변화 체감)
  const eveningChange = (capsule as CapsuleWithEveningFocus).skinEveningChange;
  const todayDow = DOW_KO[new Date().getDay()] ?? '';
  const showReason = (depth === 'full' || depth === 'brief') && Boolean(firstAction.reason);
  const showSolution = depth === 'full' && Boolean(firstAction.solution);
  const hasEvidence = showReason || showSolution || Boolean(eveningFocus?.label);

  return (
    <div
      className="bg-card rounded-2xl border border-border p-5"
      data-testid="home-daily-capsule"
      role="region"
      aria-label={t('capsuleLabel')}
    >
      <p className="text-xs font-medium text-muted-foreground">오늘 먼저 할 일</p>
      <button
        onClick={() => handleCheck(firstAction)}
        className="mt-2 flex min-h-[44px] w-full items-center gap-3 rounded-lg py-2 text-left transition-colors hover:bg-secondary/60"
      >
        {firstAction.isChecked ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-foreground" aria-hidden="true" />
        ) : (
          <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
        )}
        <Icon className="h-4 w-4 shrink-0 text-foreground/60" aria-hidden="true" />
        <span
          className={`block min-w-0 flex-1 text-sm font-medium ${
            firstAction.isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
          }`}
        >
          {firstAction.name}
        </span>
      </button>

      {/* 성분·방법·저녁 보충 설명은 결론 뒤에서 사용자가 요청할 때만 펼친다. */}
      {hasEvidence && (
        <details className="mt-2 border-t border-border pt-2" data-testid="capsule-evidence">
          <summary className="cursor-pointer text-xs font-medium text-foreground/70 hover:text-foreground">
            선택 근거와 사용 방법
          </summary>
          <div className="mt-2 space-y-2 text-xs leading-relaxed text-muted-foreground">
            {showReason && <p>{firstAction.reason}</p>}
            {showSolution && <p>{firstAction.solution}</p>}
            {eveningFocus?.label && (
              <div data-testid="capsule-evening-focus">
                <p className="font-medium text-foreground/80">
                  {todayDow ? `${todayDow} · ` : ''}오늘 저녁: {eveningFocus.label}
                </p>
                {eveningChange && (
                  <p className="mt-0.5" data-testid="capsule-evening-change">
                    {eveningChange}
                  </p>
                )}
              </div>
            )}
          </div>
        </details>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
        <Link
          href="/capsule/daily"
          className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
        >
          전체 루틴 보기
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>

        {/* 선택된 행동의 제품 연결만 카드 하단 한 곳에 둔다. */}
        {solutionProduct?.source === 'shelf' ? (
          <span
            className="text-xs text-muted-foreground"
            data-testid="capsule-owned-chip"
            title={`내 ${solutionProduct.name}`}
          >
            보유 제품 · {solutionProduct.name}
          </span>
        ) : (
          productHref && (
            <Link
              href={productHref}
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground/70 transition-colors hover:text-foreground"
              data-testid="capsule-catalog-chip"
            >
              맞는 제품 보기
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )
        )}
      </div>
    </div>
  );
}
