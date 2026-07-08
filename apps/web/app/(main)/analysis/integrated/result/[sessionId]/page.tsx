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
import { fetchCurationProducts } from '@/lib/analysis/integrated/internal/product-matcher';
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
  type RecommendationGender,
  type RecommendationSituation,
} from '@/lib/analysis/integrated';
import { AxesSummaryCard } from './_components/AxesSummaryCard';
import { AxisDetailAccordion } from './_components/AxisDetailAccordion';
import { PartialSuccessBanner } from './_components/PartialSuccessBanner';
import { NextStepsLinks } from './_components/NextStepsLinks';
import { PersonaNarrativeCard } from './_components/PersonaNarrativeCard';
import { ActionPlanCard } from './_components/ActionPlanCard';
import { CrossInsightsCard } from './_components/CrossInsightsCard';
import { CurationCard } from './_components/CurationCard';
import { ShareReportButton } from './_components/ShareReportButton';

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
  title: '통합 분석 리포트',
  description: '셀카 한 장으로 분석한 퍼스널컬러·피부·체형·헤어·메이크업 통합 리포트',
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

  // 성별/상황 — 추천 분기 전용 (분석 판정엔 영향 없음). questionnaire JSONB에 저장됨.
  const questionnaire = (session.questionnaire ?? {}) as Record<string, unknown>;
  const gender = questionnaire.gender as RecommendationGender | undefined;
  const situation = questionnaire.situation as RecommendationSituation | undefined;

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

  // ADR-104 체크리스트 #2: 결정론적 규칙 기반 액션 플랜 (성별/상황 분기)
  const actionPlan = composeActionPlan({ ...axisResults, gender, situation });

  // ADR-104 체크리스트 #4: 축 조합 인사이트 (0-5개)
  const crossInsights = composeCrossInsights(axisResults);

  // ADR-104 체크리스트 #5: 통합 큐레이션 (세션 기반 제품 세트)
  // 왜: 옷장이 비면 outfit 카드 CTA를 "먼저 옷장 등록하기"로 우회
  // 실제 제품 3개(지갑 여는 세트)는 병렬로 매칭 — 없으면 링크 카드 폴백
  const pcData = axisResults.personalColor.success ? axisResults.personalColor.data : null;
  const skinData = axisResults.skin.success ? axisResults.skin.data : null;
  const [hasClosetItems, curationProducts] = await Promise.all([
    hasAnyClosetItems(),
    fetchCurationProducts({
      skinType: skinData?.skinType,
      personalColorSeason: pcData?.season,
      undertone: pcData?.undertone,
      gender: gender ?? 'neutral',
    }),
  ]);
  const curation = composeCuration({
    ...axisResults,
    sessionId: session.id,
    hasClosetItems,
    gender,
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
          {/* 왜 "리포트": 이 페이지는 세션 1회의 기록 — "내 정체성 5축 결과"는 프로필 전체를
              주장하는 제목이라 부분 세션에서 "완성 5/5인데 왜 3축이 없어?" 모순을 유발했음 */}
          <h1 className="text-2xl font-bold text-white md:text-3xl">통합 분석 리포트</h1>
          <p className="text-xs text-zinc-400">
            {new Date(session.created_at).toLocaleString('ko-KR')}
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

        {/* ADR-104 체크리스트 #5: 통합 큐레이션 (제품 세트 + 실제 제품 3개) */}
        <CurationCard curation={curation} products={curationProducts} />

        {/* 5축 요약 카드 */}
        <AxesSummaryCard axes={axes} />

        {/* 축별 상세 아코디언 */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            상세 분석
          </h2>
          <AxisDetailAccordion axes={axes} />
        </section>

        {/* 스타일 리포트 공유 — 사진 없는 공개 링크 (바이럴 루프) */}
        <ShareReportButton sessionId={session.id} />

        {/* 다음 단계 링크 */}
        <NextStepsLinks axesCompleted={axesCompleted} />

        {/* 하단 안내 */}
        <div className="space-y-1 pt-4 text-center text-[11px] text-zinc-600">
          {/* 재현성 실측 — 과장 없이 "같은 입력 → 같은 판정"만 (퍼스널컬러·피부에서 검증) */}
          <p className="text-zinc-500">
            같은 사진은 같은 결과 — 동일 사진을 반복 분석해 판정이 일치하는지 검증했어요.
          </p>
          <p>분석 결과는 AI가 생성한 참고 정보이며, 의학적 진단을 대체하지 않아요.</p>
        </div>
      </div>
    </div>
  );
}
