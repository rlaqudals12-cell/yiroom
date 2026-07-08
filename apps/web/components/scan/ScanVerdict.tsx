'use client';

/**
 * 스캔 판정 정본 컴포넌트 — "나와의 적합도" 컨설팅 (ADR-112 / ADR-111 표현 원칙)
 *
 * @description
 *   verdict-first 레이아웃: 적합도 히어로 → 그래서(행동) → 규제 사실 → 효과 타임라인
 *   → 궁합 경고(접기) → 전성분(접기) → 면책.
 *   절대 안전등급을 매기지 않는다 — 내 프로필 기준 "적합도"만 표현.
 *   모든 문구는 이미 받은 응답에서 규칙 기반으로 조립한다(새 fetch/새 AI 금지, 정직성).
 *
 *   ⚠️ 규제 정보·효과 타임라인 문구는 법적 검토를 거친 lib 상수를 그대로 인용한다.
 *      금지 표현(치료·재생·보장·사라져)·절대등급·낙인 금지.
 */

import Link from 'next/link';
import { Sparkles, ShieldAlert, Clock3, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TopActionsCard, type TopAction } from '@/components/analysis/TopActionsCard';
import { ProgressiveDisclosure } from '@/components/common/ProgressiveDisclosure';
import { IngredientEWGBadge } from '@/components/products/ingredients';
import type { CompatibilityResult } from '@/lib/scan';
import {
  type IngredientTimeline,
  formatTimelineNotice,
  TIMELINE_DISCLAIMER,
} from '@/lib/scan/ingredient-timeline';
import type { ProductIngredient } from '@/types/scan';

/** L1 규제 사실 플래그 (SDD §2 — /api/scan/analyze 응답 확장, 하위호환 optional) */
export interface RegulatoryFlag {
  ingredient: string;
  kind: 'allergen25' | 'restricted' | 'caution20';
  label: string;
}

/**
 * 스캔 판정 응답 — 기존 CompatibilityResult에 L1/L4 레이어를 optional로 얹은 형태.
 * 서버가 아직 필드를 안 주면 undefined → 미표시(방어).
 */
export type ScanVerdictData = CompatibilityResult &
  Partial<{
    regulatory: RegulatoryFlag[];
    timelines: IngredientTimeline[];
  }>;

export interface ScanVerdictProps {
  /** 판정 데이터 (기존 /api/scan/analyze 응답) */
  verdict: ScanVerdictData;
  /** 분석에 사용된 성분 목록 (전성분 표시용) */
  ingredients: ProductIngredient[];
  /** 제품명 (있을 때) */
  productName?: string;
  /** 브랜드명 (있을 때) */
  brandName?: string;
  /** OCR 인식 정확도 — 정직성: 판정의 입력 품질을 사용자에게 알린다 */
  ocrConfidence?: 'high' | 'medium' | 'low';
  /** 다시 스캔 콜백 */
  onRescan?: () => void;
  className?: string;
}

/** OCR 정확도 배지 라벨/톤 */
const OCR_CONFIDENCE_VIEW: Record<
  NonNullable<ScanVerdictProps['ocrConfidence']>,
  { label: string; tone: string }
> = {
  high: {
    label: '높은 정확도',
    tone: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  },
  medium: {
    label: '보통 정확도',
    tone: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  },
  low: {
    label: '낮은 정확도 · 재촬영 권장',
    tone: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  },
};

// 적합도 점수 → 색상/판정 문구 (절대등급 아님)
function getScoreView(score: number): { colorClass: string; verdict: string } {
  if (score >= 80) {
    return {
      colorClass: 'text-green-600 dark:text-green-400',
      verdict: '내 프로필에 잘 맞는 제품이에요',
    };
  }
  if (score >= 60) {
    return {
      colorClass: 'text-amber-600 dark:text-amber-400',
      verdict: '대체로 잘 맞아요 · 아래 주의점만 확인해보세요',
    };
  }
  return {
    colorClass: 'text-rose-600 dark:text-rose-400',
    verdict: '내 프로필엔 잘 안 맞을 수 있어요 · 아래를 확인해보세요',
  };
}

/**
 * "그래서, 이렇게 하세요" 행동을 응답 데이터에서 규칙 조립.
 * - ①적합/부적합 핵심 행동 (프로필 있을 때만)
 * - ②규제 정보 있으면 성분 확인 유도
 * - ③타임라인 있으면 변화 추적(재분석) 유도
 */
function buildActions(verdict: ScanVerdictData, hasSkinProfile: boolean): TopAction[] {
  const actions: TopAction[] = [];
  const avoid = verdict.ingredientAnalysis.avoid;
  const regulatory = verdict.regulatory ?? [];
  const timelines = verdict.timelines ?? [];

  // ① 핵심 적합/부적합 행동 — 내 피부 프로필이 있을 때만 (없으면 판정 자체가 성립 안 함)
  if (hasSkinProfile) {
    if (avoid.length > 0) {
      actions.push({
        title: '내 피부엔 자극될 수 있는 성분이 있어요 — 대체 제품을 살펴보세요',
        detail: `${avoid
          .slice(0, 2)
          .map((a) => a.nameKo || a.ingredient)
          .join(', ')} 성분이 신경 쓰일 수 있어요`,
        href: '/beauty',
        hrefLabel: '대체 제품 보기',
      });
    } else if (verdict.overallScore >= 80) {
      actions.push({
        title: '잘 맞는 제품이에요 — 지금 루틴에 더해보세요',
        detail: '내 피부 기준으로 큰 주의점이 없어요',
      });
    } else {
      actions.push({
        title: '패치 테스트 후 사용해보세요',
        detail: '내 피부 기준으로 무난하지만, 처음엔 소량으로 확인하는 게 좋아요',
      });
    }
  }

  // ② 규제 정보
  if (regulatory.length > 0) {
    const hasAllergen = regulatory.some((r) => r.kind === 'allergen25');
    const hasRestricted = regulatory.some((r) => r.kind === 'restricted');
    let title: string;
    if (hasAllergen) {
      title = '식약처 지정 알레르기 유발 착향제가 있어요 — 성분을 확인해보세요';
    } else if (hasRestricted) {
      title = '식약처 배합 제한 성분이 있어요 — 성분을 확인해보세요';
    } else {
      title = '알아두면 좋은 성분 정보가 있어요 — 아래에서 확인해보세요';
    }
    actions.push({ title, detail: '아래 규제 정보에서 성분명을 확인할 수 있어요' });
  }

  // ③ 효과 타임라인 → 변화 추적 연결
  if (timelines.length > 0) {
    actions.push({
      title: `꾸준히 쓰면 ${timelines[0].timelineShort} 후 변화를 확인해보세요`,
      detail: `핵심 성분: ${timelines
        .slice(0, 3)
        .map((t) => t.name)
        .join(', ')}`,
      href: '/analysis/skin',
      hrefLabel: '피부 분석으로 변화 확인',
    });
  }

  return actions;
}

// 규제 종류 → 배지 스타일 (공포 표현 없이 중립 톤)
const REGULATORY_TONE: Record<RegulatoryFlag['kind'], string> = {
  allergen25: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  restricted: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  caution20: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export function ScanVerdict({
  verdict,
  ingredients,
  productName,
  brandName,
  ocrConfidence,
  onRescan,
  className,
}: ScanVerdictProps) {
  // 피부 프로필 유무 — 점수 히어로/핵심 행동의 표시 여부를 가른다
  const hasSkinProfile = verdict.hasUserAnalysis.skinAnalysis;
  const regulatory = verdict.regulatory ?? [];
  const timelines = verdict.timelines ?? [];
  const { colorClass, verdict: verdictLine } = getScoreView(verdict.overallScore);

  const goodPoints = verdict.skinCompatibility.goodPoints;
  const warnings = verdict.skinCompatibility.warnings;
  const avoid = verdict.ingredientAnalysis.avoid;
  const caution = verdict.ingredientAnalysis.caution;
  const interactions = verdict.ingredientAnalysis.interactions;

  const actions = buildActions(verdict, hasSkinProfile);

  const cautionCount = warnings.length + avoid.length + caution.length + interactions.length;
  let warningSummary = '특별히 주의할 점은 없어요';
  if (avoid.length > 0) {
    warningSummary = `주의 성분 ${avoid.length}개 · 함께 볼 점 확인`;
  } else if (cautionCount > 0) {
    warningSummary = '함께 사용 시 참고할 점이 있어요';
  }

  return (
    <div data-testid="scan-verdict" className={cn('space-y-4', className)}>
      {/* 제품명 + OCR 정확도 (있을 때) */}
      {(productName || brandName || ocrConfidence) && (
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {brandName && <p className="text-sm text-muted-foreground">{brandName}</p>}
            {productName && <h2 className="text-lg font-bold leading-tight">{productName}</h2>}
          </div>
          {ocrConfidence && (
            <span
              data-testid="scan-verdict-ocr-confidence"
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                OCR_CONFIDENCE_VIEW[ocrConfidence].tone
              )}
            >
              {OCR_CONFIDENCE_VIEW[ocrConfidence].label}
            </span>
          )}
        </div>
      )}

      {/* 히어로: 나와의 적합도 (프로필 있을 때) / 분석 CTA (없을 때) */}
      {hasSkinProfile ? (
        <section
          data-testid="scan-verdict-hero"
          className="rounded-2xl border bg-card p-5 text-center"
        >
          <p className="text-sm font-medium text-muted-foreground">나와의 적합도</p>
          <p className={cn('mt-1 text-5xl font-extrabold tabular-nums', colorClass)}>
            {verdict.overallScore}
            <span className="ml-0.5 text-2xl font-bold">점</span>
          </p>
          <p className="mt-2 text-sm font-medium text-foreground">{verdictLine}</p>
        </section>
      ) : (
        <section
          data-testid="scan-verdict-cta"
          className="rounded-2xl border border-primary/20 bg-primary/5 p-5 text-center"
        >
          <Sparkles className="mx-auto h-7 w-7 text-primary" aria-hidden />
          <p className="mt-2 text-base font-bold text-foreground">
            피부 분석을 하면 내 피부 기준으로 판정해드려요
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            아래 성분 정보와 효과 안내는 지금도 볼 수 있어요
          </p>
          <Button asChild className="mt-4">
            <Link href="/analysis/skin">피부 분석 시작하기</Link>
          </Button>
        </section>
      )}

      {/* 그래서, 이렇게 하세요 */}
      {actions.length > 0 && <TopActionsCard actions={actions} />}

      {/* 좋은 점 (프로필 있고 항목 있을 때 간단 노출) */}
      {hasSkinProfile && goodPoints.length > 0 && (
        <section className="rounded-xl border bg-card p-4">
          <h3 className="mb-2 text-sm font-semibold text-foreground">잘 맞는 점</h3>
          <ul className="space-y-1.5">
            {goodPoints.map((point, i) => (
              <li key={`good-${i}`} className="flex items-start gap-2 text-sm">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-green-500" aria-hidden />
                <span>{point.description}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* L1 규제 정보 — 사실 인용 톤 (있을 때만) */}
      {regulatory.length > 0 && (
        <section data-testid="scan-verdict-regulatory" className="rounded-xl border bg-card p-4">
          <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-foreground">
            <ShieldAlert className="h-4 w-4 text-amber-500" aria-hidden />
            성분 규제 정보
          </h3>
          <p className="mb-3 text-xs text-muted-foreground">
            식약처 고시·공공데이터 기준으로 참고할 성분이에요.
          </p>
          <ul className="space-y-2">
            {regulatory.map((flag, i) => (
              <li key={`reg-${flag.ingredient}-${i}`} className="flex items-center gap-2 text-sm">
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2 py-0.5 text-xs font-medium',
                    REGULATORY_TONE[flag.kind]
                  )}
                >
                  {flag.label}
                </span>
                <span className="min-w-0 truncate text-foreground">{flag.ingredient}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* L4 효과 타임라인 — 문헌 인용형 (있을 때만) */}
      {timelines.length > 0 && (
        <section data-testid="scan-verdict-timeline" className="rounded-xl border bg-card p-4">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock3 className="h-4 w-4 text-primary" aria-hidden />
            효과가 보이는 시기
          </h3>
          <ul className="space-y-3">
            {timelines.map((t, i) => (
              <li
                key={`tl-${t.name}-${i}`}
                className="border-b border-border/50 pb-3 last:border-0 last:pb-0"
              >
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-sm font-semibold text-foreground">{t.name}</span>
                  <span className="text-xs text-muted-foreground">{t.effect}</span>
                </div>
                <p className="mt-1 text-sm text-foreground">{formatTimelineNotice(t)}</p>
                <a
                  href={t.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  출처: {t.sourceLabel}
                  <ExternalLink className="h-3 w-3" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {TIMELINE_DISCLAIMER}
          </p>
        </section>
      )}

      {/* 궁합·주의 — 접기 (프로필 있고 항목 있을 때) */}
      {hasSkinProfile && cautionCount > 0 && (
        <ProgressiveDisclosure
          title="궁합·주의할 점"
          summary={warningSummary}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          <div className="space-y-3">
            {warnings.map((w, i) => (
              <div key={`warn-${i}`} className="flex items-start gap-2 text-sm">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                <div>
                  <p className="font-medium text-foreground">{w.title}</p>
                  <p className="text-muted-foreground">{w.description}</p>
                </div>
              </div>
            ))}
            {avoid.length > 0 && (
              <div className="rounded-lg bg-rose-50 p-3 dark:bg-rose-950/20">
                <p className="mb-1 text-sm font-medium text-rose-700 dark:text-rose-300">
                  주의가 필요한 성분
                </p>
                <ul className="space-y-1">
                  {avoid.map((item, i) => (
                    <li key={`avoid-${i}`} className="text-sm text-rose-600 dark:text-rose-400">
                      {item.nameKo || item.ingredient}
                      {item.reason ? ` · ${item.reason}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {interactions.map((it, i) => (
              <div key={`int-${i}`} className="flex items-start gap-2 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span>
                  {it.ingredients.join(' + ')} · {it.reason}
                </span>
              </div>
            ))}
          </div>
        </ProgressiveDisclosure>
      )}

      {/* 전성분 — 접기 */}
      {ingredients.length > 0 && (
        <ProgressiveDisclosure
          title={`전성분 ${ingredients.length}개`}
          summary="성분별 EWG 참고 지표를 함께 볼 수 있어요"
        >
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div
                key={`ing-${ing.order}-${i}`}
                className="flex items-center justify-between gap-2 border-b border-border/40 py-1 text-sm last:border-0"
              >
                <span className="min-w-0">
                  <span className="mr-2 text-muted-foreground">{ing.order}.</span>
                  {ing.nameKo || ing.inciName}
                  {ing.nameKo && ing.inciName && (
                    <span className="ml-1 text-xs text-muted-foreground">({ing.inciName})</span>
                  )}
                </span>
                {ing.ewgGrade !== undefined && ing.ewgGrade !== null && (
                  <IngredientEWGBadge
                    score={ing.ewgGrade}
                    size="sm"
                    showLabel={false}
                    className="shrink-0"
                  />
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            EWG 등급은 성분 안전성 참고 지표예요(출처: EWG Skin Deep). 농도·개인차는 반영되지
            않아요.
          </p>
        </ProgressiveDisclosure>
      )}

      {/* 면책 강화 */}
      <p
        data-testid="scan-verdict-disclaimer"
        className="px-2 text-center text-xs text-muted-foreground"
      >
        이 판정은 정보 제공 도구이며 의학적 조언이 아니에요. 성분·규제 정보는 공개 데이터를 인용한
        참고 자료로, 알레르기나 피부 질환이 있다면 전문가와 상담해주세요.
      </p>

      {/* 다시 스캔 */}
      {onRescan && (
        <Button
          variant="outline"
          onClick={onRescan}
          className="w-full"
          data-testid="scan-verdict-rescan"
        >
          다른 제품 스캔하기
        </Button>
      )}
    </div>
  );
}
