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
  seasonKo,
  undertoneKo,
  skinTypeKo,
  faceShapeKo,
} from '@/lib/analysis/integrated';
import { getBodyShapeLabel } from '@/lib/body';
import { PartialSuccessBanner } from './_components/PartialSuccessBanner';
import { AxisFallbackNotice } from './_components/AxisFallbackNotice';
import { NextStepsLinks } from './_components/NextStepsLinks';
import { PersonaNarrativeCard } from './_components/PersonaNarrativeCard';
import { ActionPlanCard } from './_components/ActionPlanCard';
import { CrossInsightsCard } from './_components/CrossInsightsCard';
import { CurationCard } from './_components/CurationCard';
import { ShareReportButton } from './_components/ShareReportButton';

/**
 * DB 레코드 → AxisResult 변환 (action-plan 입력용).
 * 레코드 null이면 실패 경로.
 *
 * usedFallback: 세션 used_fallback에 담긴 실제 Mock 대체 여부를 전달한다
 * (과거 false 하드코딩은 통합 리포트가 축별 Mock을 숨기던 정직성 결함이었음).
 */
function toAxisResult<T>(
  record: AxisDbRecord | null,
  mapper: (r: AxisDbRecord) => T,
  usedFallback: boolean
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
  return { success: true, usedFallback, data: mapper(record) };
}

function extractNested(record: AxisDbRecord, key: string, field: string): string {
  const nested = record[key];
  if (typeof nested === 'object' && nested !== null) {
    const value = (nested as Record<string, unknown>)[field];
    if (typeof value === 'string') return value;
  }
  return '';
}

/** 비어 있지 않은 라벨만 " · "로 이어붙임 (없으면 undefined) */
function joinLabels(...parts: Array<string | false | 0 | null | undefined>): string | undefined {
  const nonEmpty = parts.filter((p): p is string => typeof p === 'string' && p.length > 0);
  return nonEmpty.length > 0 ? nonEmpty.join(' · ') : undefined;
}

function pcSummary(r: AxisDbRecord | null): string | undefined {
  if (!r) return undefined;
  return joinLabels(
    r.season ? seasonKo(String(r.season)) : undefined,
    r.undertone ? undertoneKo(String(r.undertone)) : undefined
  );
}

function skinSummary(r: AxisDbRecord | null): string | undefined {
  if (!r) return undefined;
  const score = Number(r.overall_score ?? 0);
  return joinLabels(
    r.skin_type ? skinTypeKo(String(r.skin_type)) : undefined,
    score > 0 ? `컨디션 ${score}점` : undefined
  );
}

/**
 * 축별 "핵심 결과 1줄" 요약 (NextStepsLinks 심화 링크용).
 * 반드시 공용 라벨 헬퍼로 한국어화 — 원시 영문값(Autumn/combination) 노출 금지.
 * 세션에 담긴 축(DB 레코드 존재)만 요약을 만든다.
 */
function buildAxisSummaries(axes: {
  personalColor: AxisDbRecord | null;
  skin: AxisDbRecord | null;
  body: AxisDbRecord | null;
  hair: AxisDbRecord | null;
  makeup: AxisDbRecord | null;
}): Partial<Record<AxisCode, string>> {
  return {
    personal_color: pcSummary(axes.personalColor),
    skin: skinSummary(axes.skin),
    body: axes.body?.body_type ? getBodyShapeLabel(axes.body.body_type) : undefined,
    hair: axes.hair?.face_shape ? faceShapeKo(String(axes.hair.face_shape)) : undefined,
    makeup: axes.makeup?.undertone ? undertoneKo(String(axes.makeup.undertone)) : undefined,
  };
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
  // Mock Fallback으로 대체된 축 — 정직성 고지(AxisFallbackNotice)와 축별 usedFallback에 사용
  const usedFallbackAxes = (session.used_fallback ?? []) as AxisCode[];
  const usedFallbackSet = new Set<AxisCode>(usedFallbackAxes);

  // 성별/상황 — 추천 분기 전용 (분석 판정엔 영향 없음). questionnaire JSONB에 저장됨.
  const questionnaire = (session.questionnaire ?? {}) as Record<string, unknown>;
  const gender = questionnaire.gender as RecommendationGender | undefined;
  const situation = questionnaire.situation as RecommendationSituation | undefined;

  // 왜: action-plan + cross-insights가 같은 AxisResult 입력을 받음 → 변환 1회로 공유
  const axisResults = {
    personalColor: toAxisResult<PersonalColorAxisData>(
      axes.personalColor,
      (r) => ({
        season: String(r.season ?? ''),
        tone: extractNested(r, 'image_analysis', 'tone') || String(r.season ?? ''),
        undertone: String(r.undertone ?? ''),
        confidence: Number(r.confidence ?? 0),
      }),
      usedFallbackSet.has('personal_color')
    ),
    skin: toAxisResult<SkinAxisData>(
      axes.skin,
      (r) => ({
        skinType: String(r.skin_type ?? ''),
        overallScore: Number(r.overall_score ?? 0),
      }),
      usedFallbackSet.has('skin')
    ),
    body: toAxisResult<BodyAxisData>(
      axes.body,
      (r) => ({
        bodyType: String(r.body_type ?? ''),
      }),
      usedFallbackSet.has('body')
    ),
    hair: toAxisResult<HairAxisData>(
      axes.hair,
      (r) => ({
        faceShape: String(r.face_shape ?? ''),
      }),
      usedFallbackSet.has('hair')
    ),
    makeup: toAxisResult<MakeupAxisData>(
      axes.makeup,
      (r) => ({
        baseRecommendation: extractNested(r, 'recommendations', 'baseRecommendation'),
      }),
      usedFallbackSet.has('makeup')
    ),
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

  // 축별 심화 링크 요약 (원시 영문값 노출 방지 — 공용 라벨 헬퍼 사용, 새 fetch 없음)
  const axisSummaries = buildAxisSummaries(axes);

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

        {/* 정직성: Mock Fallback으로 대체된 축을 샘플 결과로 명시 (감사 B7) */}
        <AxisFallbackNotice usedFallback={usedFallbackAxes} />

        {/* ADR-104 체크리스트 #1: 나 프로필 내러티브 (상단 히어로) */}
        <PersonaNarrativeCard persona={session.persona} />

        {/* ADR-104 체크리스트 #2: 다음 행동 3단계 */}
        <ActionPlanCard plan={actionPlan} />

        {/* ADR-104 체크리스트 #4: 축 간 연결 인사이트 */}
        <CrossInsightsCard insights={crossInsights} />

        {/* ADR-104 체크리스트 #5: 통합 큐레이션 (제품 세트 + 실제 제품 3개) */}
        <CurationCard curation={curation} products={curationProducts} />

        {/* 더 깊이 — 축별 심화 링크 (개별 결과 페이지가 축 상세의 정본, ADR-111 One Canon) */}
        <NextStepsLinks axesCompleted={axesCompleted} axisSummaries={axisSummaries} />

        {/* 스타일 리포트 공유 — 사진 없는 공개 링크 (바이럴 루프) */}
        <ShareReportButton sessionId={session.id} />

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
