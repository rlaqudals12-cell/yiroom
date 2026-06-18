'use client';

import { Sparkles, Pill, AlertTriangle } from 'lucide-react';
import { FadeInUp } from '@/components/animations';
import { SkinAgeCalculator } from '@/components/beauty/SkinAgeCalculator';
import { SkincareRoutineCard } from '@/components/beauty/SkincareRoutineCard';
import type { RoutineItem } from '@/types/hybrid';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

interface BeautyCareTabProps {
  hasAnalysis: boolean;
  router: AppRouterInstance;
  morningRoutine: RoutineItem[];
  eveningRoutine: RoutineItem[];
}

// 케어 탭 — 스킨케어 루틴, 피부나이, 영양제, 주의 성분
export default function BeautyCareTab({
  hasAnalysis,
  router,
  morningRoutine,
  eveningRoutine,
}: BeautyCareTabProps) {
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
              onClick={() => router.push('/onboarding/skin')}
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

      {/* 피부나이 계산기 */}
      <FadeInUp delay={2}>
        {hasAnalysis ? (
          <div data-testid="beauty-skin-age">
            <SkinAgeCalculator
              actualAge={28}
              skinMetrics={{
                hydration: 72,
                oil: 45,
                elasticity: 68,
                wrinkles: 25,
                pores: 35,
                pigmentation: 30,
              }}
            />
          </div>
        ) : (
          <section className="bg-card rounded-2xl border p-4" data-testid="beauty-skin-age">
            <h2 className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
              피부나이 측정
            </h2>
            <p className="text-sm text-muted-foreground">
              피부 분석 후 수분·유분·탄력 지표로 피부나이를 알려드려요
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
            비타민C, 콜라겐, 오메가3로 피부 속부터 관리해 보는 건 어때요?
          </p>
          {/* '영양제 보러가기' 링크 제거: N-1(영양) 숨김 + supplement DB 미적재로 빈 결과 누수.
              S-1 이너뷰티 하위 기능으로 부활 시 재연결 (ADR-098 / demo-polish-plan). */}
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
            <button
              onClick={() => router.push('/profile/analysis?tab=warnings')}
              className="mt-3 text-sm text-orange-700 dark:text-orange-400 font-medium hover:underline min-h-[44px] inline-flex items-center"
            >
              주의 성분 확인하기 →
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
