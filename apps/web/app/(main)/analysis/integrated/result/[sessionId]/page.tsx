/**
 * 통합 분석 결과 페이지 (Server Component)
 *
 * @route GET /analysis/integrated/result/[sessionId]
 * @see docs/adr/ADR-100-integrated-analysis-ui.md
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §3
 */

import { auth } from '@clerk/nextjs/server';
import { redirect, notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { fetchIntegratedResult } from '@/lib/analysis/integrated/internal/result-fetcher';
import type { AxisDbRecord } from '@/lib/analysis/integrated/internal/result-fetcher';
import { hasAnyClosetItems } from '@/lib/analysis/integrated/internal/closet-check';
import {
  composeActionPlan,
  composeCrossInsights,
  composeCuration,
  type AxisCode,
  type AxisResult,
  type PersonalColorAxisData,
  type SkinAxisData,
  type BodyAxisData,
  type HairAxisData,
  type MakeupAxisData,
} from '@/lib/analysis/integrated';
import { AxesSummaryCard } from './_components/AxesSummaryCard';
import { AxisDetailAccordion } from './_components/AxisDetailAccordion';
import { PartialSuccessBanner } from './_components/PartialSuccessBanner';
import { NextStepsLinks } from './_components/NextStepsLinks';
import { PersonaNarrativeCard } from './_components/PersonaNarrativeCard';
import { ActionPlanCard } from './_components/ActionPlanCard';
import { CrossInsightsCard } from './_components/CrossInsightsCard';
import { CurationCard } from './_components/CurationCard';

/**
 * DB 레코드 → AxisResult 변환 (action-plan 입력용).
 * 레코드 null이면 실패 경로.
 */
function toAxisResult<T>(
  record: AxisDbRecord | null,
  mapper: (r: AxisDbRecord) => T
): AxisResult<T> {
  if (!record) {
    return {
      success: false,
      error: {
        code: 'MISSING_INPUT',
        message: 'No DB record',
        userMessage: '분석 결과가 없어요.',
        retryable: true,
      },
    };
  }
  return { success: true, usedFallback: false, data: mapper(record) };
}

function extractNested(record: AxisDbRecord, key: string, field: string): string {
  const nested = record[key];
  if (typeof nested === 'object' && nested !== null) {
    const value = (nested as Record<string, unknown>)[field];
    if (typeof value === 'string') return value;
  }
  return '';
}

export const metadata: Metadata = {
  title: '통합 분석 결과',
  description: '5축 통합 분석 결과',
};

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function IntegratedResultPage({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const { sessionId } = await params;

  // UUID 형식 간단 검증 (경로 주입 방지)
  const isValidUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    sessionId
  );
  if (!isValidUuid) {
    notFound();
  }

  const data = await fetchIntegratedResult(sessionId);
  if (!data) {
    // RLS가 권한 없으면 null 반환 → 404로 처리
    notFound();
  }

  const { session, axes } = data;
  const axesCompleted = (session.axes_completed ?? []) as AxisCode[];
  const axesFailed = (session.axes_failed ?? []) as AxisCode[];

  // 왜: action-plan + cross-insights가 같은 AxisResult 입력을 받음 → 변환 1회로 공유
  const axisResults = {
    personalColor: toAxisResult<PersonalColorAxisData>(axes.personalColor, (r) => ({
      season: String(r.season ?? ''),
      tone: extractNested(r, 'image_analysis', 'tone') || String(r.season ?? ''),
      undertone: String(r.undertone ?? ''),
      confidence: Number(r.confidence ?? 0),
    })),
    skin: toAxisResult<SkinAxisData>(axes.skin, (r) => ({
      skinType: String(r.skin_type ?? ''),
      overallScore: Number(r.overall_score ?? 0),
    })),
    body: toAxisResult<BodyAxisData>(axes.body, (r) => ({
      bodyType: String(r.body_type ?? ''),
    })),
    hair: toAxisResult<HairAxisData>(axes.hair, (r) => ({
      faceShape: String(r.face_shape ?? ''),
    })),
    makeup: toAxisResult<MakeupAxisData>(axes.makeup, (r) => ({
      baseRecommendation: extractNested(r, 'recommendations', 'baseRecommendation'),
    })),
  };

  // ADR-104 체크리스트 #2: 결정론적 규칙 기반 액션 플랜
  const actionPlan = composeActionPlan(axisResults);

  // ADR-104 체크리스트 #4: 축 조합 인사이트 (0-5개)
  const crossInsights = composeCrossInsights(axisResults);

  // ADR-104 체크리스트 #5: 통합 큐레이션 (세션 기반 제품 세트)
  // 왜: 옷장이 비면 outfit 카드 CTA를 "먼저 옷장 등록하기"로 우회
  const hasClosetItems = await hasAnyClosetItems();
  const curation = composeCuration({
    ...axisResults,
    sessionId: session.id,
    hasClosetItems,
  });

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-neutral-950 px-4 py-8"
      data-testid="integrated-result-page"
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {/* 헤더 */}
        <header className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-widest text-zinc-500">Yiroom Intelligence</p>
          <h1 className="text-2xl font-bold text-white md:text-3xl">내 정체성 5축 결과</h1>
          <p className="text-xs text-zinc-400">
            세션 {session.id.slice(0, 8)} · {new Date(session.created_at).toLocaleString('ko-KR')}
          </p>
        </header>

        {/* Partial Success 안내 */}
        <PartialSuccessBanner axesCompleted={axesCompleted} axesFailed={axesFailed} />

        {/* ADR-104 체크리스트 #1: 나 프로필 내러티브 (상단 히어로) */}
        <PersonaNarrativeCard persona={session.persona} />

        {/* ADR-104 체크리스트 #2: 다음 행동 3단계 */}
        <ActionPlanCard plan={actionPlan} />

        {/* ADR-104 체크리스트 #4: 축 간 연결 인사이트 */}
        <CrossInsightsCard insights={crossInsights} />

        {/* ADR-104 체크리스트 #5: 통합 큐레이션 (제품 세트) */}
        <CurationCard curation={curation} />

        {/* 5축 요약 카드 */}
        <AxesSummaryCard axes={axes} />

        {/* 축별 상세 아코디언 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            상세 분석
          </h2>
          <AxisDetailAccordion axes={axes} />
        </section>

        {/* 다음 단계 링크 */}
        <NextStepsLinks axesCompleted={axesCompleted} />

        {/* 하단 안내 */}
        <p className="pt-4 text-center text-[11px] text-zinc-600">
          분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.
        </p>
      </div>
    </div>
  );
}
