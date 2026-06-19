/**
 * 분석 5축 메타 (홈 프로필 카드 + 분석 요약 공용)
 *
 * ADR-109: 프로필 중심 — ProfileCardGrid·HomeAnalysisSummary가 단일 소스 공유.
 * 변동 그룹(🔒/🔄/📅)은 @yiroom/shared AXIS_CADENCE에서.
 */

import { Palette, Sparkles, User, Scissors, Heart } from 'lucide-react';
import { getAxisCadence, type CadenceGroup } from '@yiroom/shared';
import type { AnalysisSummary, AnalysisType } from '@/hooks/useAnalysisStatus';

export const TOTAL_ANALYSIS_TYPES = 5;

export interface AnalysisMeta {
  icon: typeof Palette;
  label: string;
  valueHint: string;
  narrative: string;
  gradient: string;
  shadow: string;
  href: string;
  analysisHref: string;
}

export const ANALYSIS_META: Record<AnalysisType, AnalysisMeta> = {
  'personal-color': {
    icon: Palette,
    label: '퍼스널 컬러',
    valueHint: '나에게 어울리는 색을 알면 선택이 쉬워져요',
    narrative: '나에게 어울리는 색상 톤이에요',
    gradient: 'from-violet-400 to-purple-500',
    shadow: 'shadow-violet-500/30',
    href: '/analysis/personal-color/result',
    analysisHref: '/analysis/personal-color',
  },
  skin: {
    icon: Sparkles,
    label: '피부',
    valueHint: '피부 상태를 알면 관리 방향이 보여요',
    narrative: '현재 피부 컨디션이에요',
    gradient: 'from-rose-400 to-pink-500',
    shadow: 'shadow-rose-500/30',
    href: '/analysis/skin/result',
    analysisHref: '/analysis/skin',
  },
  body: {
    icon: User,
    label: '체형',
    valueHint: '체형을 알면 스타일링이 달라져요',
    narrative: '나의 체형 특징이에요',
    gradient: 'from-blue-400 to-indigo-500',
    shadow: 'shadow-blue-500/30',
    href: '/analysis/body/result',
    analysisHref: '/analysis/body',
  },
  hair: {
    icon: Scissors,
    label: '헤어',
    valueHint: '얼굴형에 맞는 헤어를 찾아보세요',
    narrative: '모발 특성을 알게 됐어요',
    gradient: 'from-amber-400 to-orange-500',
    shadow: 'shadow-amber-500/30',
    href: '/analysis/hair/result',
    analysisHref: '/analysis/hair',
  },
  makeup: {
    icon: Heart,
    label: '메이크업',
    valueHint: '나만의 메이크업 포인트를 발견해요',
    narrative: '나만의 메이크업 포인트에요',
    gradient: 'from-pink-400 to-rose-500',
    shadow: 'shadow-pink-500/30',
    href: '/analysis/makeup/result',
    analysisHref: '/analysis/makeup',
  },
};

/** 미완료 분석 추천 순서 */
export const ANALYSIS_ORDER: AnalysisType[] = ['personal-color', 'skin', 'body', 'hair', 'makeup'];

/** 분석 결과 → 개별 깊은 결과 페이지 경로 (카드 클릭 = 축 심화, ADR-109 무손실 라우팅). */
export function getResultHref(analysis: AnalysisSummary): string {
  const meta = ANALYSIS_META[analysis.type];
  return analysis.type === 'personal-color'
    ? `/analysis/personal-color/result/${analysis.id}`
    : `${meta.href}/${analysis.id}`;
}

/** AnalysisType(하이픈) → AXIS_CADENCE 변동 그룹. */
export function getCadenceForType(type: AnalysisType): CadenceGroup {
  return getAxisCadence(type.replace('-', '_'));
}
