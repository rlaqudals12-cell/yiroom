'use client';

import { Sparkles, Pill, AlertTriangle } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { InnerBeautySupplements } from '@/components/beauty/InnerBeautySupplements';
import { SkinAgeCalculator, type SkinAgeMetrics } from '@/components/beauty/SkinAgeCalculator';
import { SkincareRoutineCard } from '@/components/beauty/SkincareRoutineCard';
import type { RoutineItem } from '@/types/hybrid';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface BeautyCareTabProps {
  hasAnalysis: boolean;
  router: AppRouterInstance;
  morningRoutine: RoutineItem[];
  eveningRoutine: RoutineItem[];
  /** 최신 피부 분석 실지표 (없으면 overall_score 기반 추정 또는 분석 안내) */
  skinMetrics: SkinAgeMetrics | null;
  /** 최신 피부 분석 종합 점수 — 세부 지표가 없어도 이 값으로 컨디션 표기 가능 */
  skinOverallScore?: number | null;
  /** 최신 피부 분석 id — 주의 성분 알림에서 해당 결과로 딥링크 */
  skinAnalysisId?: string | null;
}

// 케어 탭 — 스킨케어 루틴, 피부 컨디션, 영양제, 주의 성분
export default function BeautyCareTab({
  hasAnalysis,
  router,
  morningRoutine,
  eveningRoutine,
  skinMetrics,
  skinOverallScore = null,
  skinAnalysisId = null,
}: BeautyCareTabProps) {
  return (
    <div className="space-y-4 p-4" data-testid="beauty-care-tab">
      {/* 분석 미완료 시 탭 상단 1개 통합 안내 (F2: CTA 중복 제거) */}
      {!hasAnalysis && (
        <FadeInUp>
          {/* ADR-120: 그라데이션 벽면 대신 솔리드 카드 — 색은 아이콘/포인트에만 */}
          <div className="bg-card rounded-2xl border p-4 text-center">
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

      {/* 스킨케어 루틴 — 실제 루틴 스텝이 있을 때만.
          피부 미분석(퍼컬만 분석 등)이면 상위에서 빈 배열이 내려온다 = 지어낸 루틴 없음 */}
      <FadeInUp delay={1}>
        {morningRoutine.length > 0 || eveningRoutine.length > 0 ? (
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

      {/* 피부 컨디션 — 실제 분석 데이터(세부 지표 또는 종합 점수)가 있을 때만 (하드코딩 지표 금지).
          합성 "피부나이"·실제나이 입력은 폐지(2026-08): 분석이 측정한 적 없는 값을 만들어
          외모를 채점하던 표면이었다. 이제 실측 컨디션 점수와 근거 지표만 렌더한다. */}
      <FadeInUp delay={2}>
        {hasAnalysis && (skinMetrics || skinOverallScore != null) ? (
          <div data-testid="beauty-skin-age">
            <SkinAgeCalculator skinMetrics={skinMetrics} overallScore={skinOverallScore} />
          </div>
        ) : (
          <section className="bg-card rounded-2xl border p-4" data-testid="beauty-skin-age">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              피부 컨디션
            </h2>
            <p className="text-sm text-muted-foreground">
              {/* "새로 하면"은 이미 피부 분석을 한 사람에게만 맞는 말 — 분석 유무는 hasAnalysis(5축)가
                  아니라 피부 분석 id 유무로 판단한다 (퍼컬만 분석한 사용자 오인 방지) */}
              {skinAnalysisId
                ? '피부 분석을 새로 하면 수분·유분 등 세부 지표로 컨디션을 알려드려요'
                : '피부 분석 후 수분·유분·주름 지표로 컨디션을 알려드려요'}
            </p>
          </section>
        )}
      </FadeInUp>

      {/* 영양제 추천 (D9: 지시형 → 제안형) */}
      <FadeInUp delay={3}>
        {/* ADR-120: 그라데이션 벽면 폐지 — 색 정체성은 아이콘만 */}
        <section className="bg-card rounded-2xl border p-4" data-testid="beauty-supplements">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Pill className="w-4 h-4 text-green-600" aria-hidden="true" />
            </div>
            이너뷰티 추천
            <span className="text-xs text-muted-foreground">(식품 정보)</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            콜라겐, 비타민, 오메가3 같은 영양 성분에 관심이 있다면 참고해 보세요.
          </p>
          {/* supplement_products 실데이터(200개) 적재 완료(2026-07-08) → 실제품 연결.
              데이터가 없으면 컴포넌트가 아무것도 렌더링하지 않는다. */}
          <InnerBeautySupplements />
          {/* 건강기능식품법·식품표시광고법 §8 대응 — 효능 단정 오인 방지 고지 */}
          <p className="mt-3 text-[11px] leading-snug text-muted-foreground">
            ※ 건강기능식품은 질병의 예방·치료를 위한 의약품이 아닙니다. 위 정보는 일반적인 식품
            정보이며, 섭취 전 개인 건강 상태에 따라 전문가와 상담하는 것을 권장해요.
          </p>
        </section>
      </FadeInUp>

      {/* 주의 성분 — 실제 제공은 "분석 결과로 가는 링크"뿐이므로 알림·자동 필터링을 약속하지 않는다.
          (ADR-120: 그라데이션 벽면 폐지 — 색은 아이콘만) */}
      <FadeInUp delay={4}>
        <section className="bg-card rounded-2xl border p-4" data-testid="beauty-warnings">
          <h2 className="font-semibold mb-2 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-600" aria-hidden="true" />
            </div>
            주의 성분 확인
          </h2>
          {skinAnalysisId ? (
            <>
              <p className="text-sm text-muted-foreground">
                내 분석 결과에서 주의 성분을 확인하세요
              </p>
              {/* 최신 피부 분석 결과의 성분 경고 섹션으로 딥링크 */}
              <button
                onClick={() => router.push(`/analysis/skin/result/${skinAnalysisId}`)}
                className="mt-3 text-sm text-primary font-medium hover:underline min-h-[44px] inline-flex items-center"
                data-testid="beauty-warnings-result-link"
              >
                내 분석 결과 보기 →
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                피부 분석을 하면 내 결과에서 주의 성분을 확인할 수 있어요
              </p>
              {/* 미분석 전체 상태에서는 탭 상단 CTA가 이미 있으므로 버튼 중복을 만들지 않는다 (F2) */}
              {hasAnalysis && (
                <button
                  onClick={() => router.push('/analysis/skin')}
                  className="mt-3 text-sm text-primary font-medium hover:underline min-h-[44px] inline-flex items-center"
                  data-testid="beauty-warnings-analyze-cta"
                >
                  피부 분석하기
                </button>
              )}
            </>
          )}
        </section>
      </FadeInUp>
    </div>
  );
}
