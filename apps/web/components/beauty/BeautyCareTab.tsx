'use client';

import { useMemo, useState } from 'react';
import { Sparkles, Pill, AlertTriangle } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { InnerBeautySupplements } from '@/components/beauty/InnerBeautySupplements';
import { SkinAgeCalculator, type SkinAgeMetrics } from '@/components/beauty/SkinAgeCalculator';
import { SkincareRoutineCard } from '@/components/beauty/SkincareRoutineCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { RoutineItem } from '@/types/hybrid';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface BeautyCareTabProps {
  hasAnalysis: boolean;
  router: AppRouterInstance;
  morningRoutine: RoutineItem[];
  eveningRoutine: RoutineItem[];
  /** 최신 피부 분석 실지표 (없으면 overall_score 기반 추정 또는 분석 안내) */
  skinMetrics: SkinAgeMetrics | null;
  /** 최신 피부 분석 종합 점수 — 세부 지표가 없어도 이 값으로 피부나이 추정 가능 */
  skinOverallScore?: number | null;
  /** 최신 피부 분석 id — 주의 성분 알림에서 해당 결과로 딥링크 */
  skinAnalysisId?: string | null;
}

// 케어 탭 — 스킨케어 루틴, 피부나이, 영양제, 주의 성분
export default function BeautyCareTab({
  hasAnalysis,
  router,
  morningRoutine,
  eveningRoutine,
  skinMetrics,
  skinOverallScore = null,
  skinAnalysisId = null,
}: BeautyCareTabProps) {
  // 실제 나이는 DB에 저장하지 않는 정보 — 사용자가 직접 입력한 값으로만 계산 (정직 원칙)
  const [ageInput, setAgeInput] = useState('');
  const actualAge = useMemo(() => {
    const parsed = parseInt(ageInput, 10);
    return Number.isInteger(parsed) && parsed >= 10 && parsed <= 99 ? parsed : null;
  }, [ageInput]);

  return (
    <div className="space-y-4 p-4" data-testid="beauty-care-tab">
      {/* 분석 미완료 시 탭 상단 1개 통합 안내 (F2: CTA 중복 제거) */}
      {!hasAnalysis && (
        <FadeInUp>
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-900/20 rounded-2xl border p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              피부 분석을 하면 나에게 맞는 루틴과 성분 정보를 받을 수 있어요
            </p>
            <button
              // 미분석 첫 진입은 통합분석("첫 미팅")으로 통일 — 개별 축 단독 진입 대신 5축 정본 온보딩. (배치 IA-3)
              onClick={() => router.push('/analysis/integrated')}
              className="bg-primary text-primary-foreground px-4 py-2.5 min-h-[44px] rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              피부 분석하기
            </button>
          </div>
        </FadeInUp>
      )}

      {/* 스킨케어 루틴 */}
      <FadeInUp delay={1}>
        {hasAnalysis ? (
          <div data-testid="beauty-routine">
            <SkincareRoutineCard morningRoutine={morningRoutine} eveningRoutine={eveningRoutine} />
          </div>
        ) : (
          <section className="bg-card rounded-2xl border p-4" data-testid="beauty-routine">
            <h2 className="font-semibold mb-2">나만의 스킨케어 루틴</h2>
            <p className="text-sm text-muted-foreground">
              피부 분석을 하면 아침·저녁 맞춤 루틴을 추천해 드려요
            </p>
          </section>
        )}
      </FadeInUp>

      {/* 피부나이 계산기 — 실제 분석 데이터(세부 지표 또는 종합 점수)가 있을 때만 (하드코딩 지표 금지) */}
      <FadeInUp delay={2}>
        {hasAnalysis && (skinMetrics || skinOverallScore != null) ? (
          <div data-testid="beauty-skin-age" className="space-y-3">
            <section className="bg-card rounded-2xl border p-4">
              <h2 className="font-semibold mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
                피부나이 측정
              </h2>
              <p className="text-sm text-muted-foreground mb-3">
                실제 나이를 입력하면 최근 피부 분석 결과로 피부나이를 계산해 드려요. 입력한 나이는
                저장되지 않아요.
              </p>
              <div className="flex items-center gap-3">
                <Label htmlFor="skin-age-input" className="text-sm shrink-0">
                  실제 나이
                </Label>
                <Input
                  id="skin-age-input"
                  data-testid="skin-age-input"
                  type="number"
                  inputMode="numeric"
                  min={10}
                  max={99}
                  placeholder="예: 28"
                  value={ageInput}
                  onChange={(e) => setAgeInput(e.target.value)}
                  className="w-28"
                />
                <span className="text-sm text-muted-foreground">세</span>
              </div>
            </section>
            {actualAge !== null && (
              <SkinAgeCalculator
                actualAge={actualAge}
                skinMetrics={skinMetrics}
                overallScore={skinOverallScore}
              />
            )}
          </div>
        ) : (
          <section className="bg-card rounded-2xl border p-4" data-testid="beauty-skin-age">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              피부나이 측정
            </h2>
            <p className="text-sm text-muted-foreground">
              {hasAnalysis
                ? '피부 분석을 새로 하면 수분·유분 등 세부 지표로 피부나이를 알려드려요'
                : '피부 분석 후 수분·유분·주름 지표로 피부나이를 알려드려요'}
            </p>
          </section>
        )}
      </FadeInUp>

      {/* 영양제 추천 (D9: 지시형 → 제안형) */}
      <FadeInUp delay={3}>
        <section
          className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-900/20 rounded-2xl border border-green-200 dark:border-green-800/30 p-4"
          data-testid="beauty-supplements"
        >
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Pill className="w-4 h-4 text-green-600" aria-hidden="true" />
            </div>
            이너뷰티 추천
            <span className="text-xs text-muted-foreground">(피부 개선용)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            콜라겐, 비타민, 오메가3로 피부 속부터 관리해 보는 건 어때요?
          </p>
          {/* supplement_products 실데이터(200개) 적재 완료(2026-07-08) → 실제품 연결.
              데이터가 없으면 컴포넌트가 아무것도 렌더링하지 않는다. */}
          <InnerBeautySupplements />
        </section>
      </FadeInUp>

      {/* 주의 성분 알림 */}
      <FadeInUp delay={4}>
        {hasAnalysis ? (
          <section
            className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-900/20 rounded-2xl border border-orange-200 dark:border-orange-800/30 p-4"
            data-testid="beauty-warnings"
          >
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
              </div>
              주의 성분 알림
            </h2>
            <p className="text-sm text-muted-foreground">
              내 피부에 맞지 않는 성분이 포함된 제품을 알려드려요
            </p>
            {/* 최신 피부 분석 결과의 성분 경고 섹션으로 딥링크 (id 없으면 피부 분석 시작으로) */}
            <button
              onClick={() =>
                router.push(
                  skinAnalysisId ? `/analysis/skin/result/${skinAnalysisId}` : '/analysis/skin'
                )
              }
              className="mt-3 text-sm text-orange-700 dark:text-orange-400 font-medium hover:underline min-h-[44px] inline-flex items-center"
            >
              내 분석 결과에서 확인하기 →
            </button>
          </section>
        ) : (
          <section className="bg-card rounded-2xl border p-4" data-testid="beauty-warnings">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
              </div>
              성분 안전 체크
            </h2>
            <p className="text-sm text-muted-foreground">
              분석 후 내 피부에 맞지 않는 성분을 자동으로 걸러줘요
            </p>
          </section>
        )}
      </FadeInUp>
    </div>
  );
}
