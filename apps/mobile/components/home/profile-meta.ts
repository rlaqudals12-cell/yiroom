/**
 * 분석 5축 메타 (모바일 프로필 카드 — ADR-109 프로필 중심)
 *
 * 웹 app/(main)/home/_components/analysis-meta.ts의 모바일 포팅.
 * - 색상: 웹 tailwind 그라디언트 문자열 대신 theme moduleColors 키 사용
 * - 라우트: expo-router 경로(`/(analysis)/{axis}`, 결과는 최신 1건 → `/result`)
 * - 변동 그룹(🔒/🔄/📅): @yiroom/shared AXIS_CADENCE
 */

import { Palette, Sparkles, User, Scissors, Heart } from 'lucide-react-native';
import { getAxisCadence, type CadenceGroup } from '@yiroom/shared';

import type { AnalysisSummary } from '../../hooks/useUserAnalyses';

export const TOTAL_ANALYSIS_TYPES = 5;

// 프로필 카드가 다루는 5축 (useUserAnalyses의 oral-health는 제외 — ADR-098)
export type ProfileAxis = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

export interface ProfileAxisMeta {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  /** theme moduleColors 키 (아이콘 배지 색) */
  moduleKey: 'personalColor' | 'skin' | 'body' | 'hair' | 'makeup';
  /** 미완료 시 이동(해당 축 분석 시작) */
  analysisRoute: string;
  /** 완료 시 이동(최신 결과) */
  resultRoute: string;
}

export const PROFILE_META: Record<ProfileAxis, ProfileAxisMeta> = {
  'personal-color': {
    icon: Palette,
    label: '퍼스널 컬러',
    moduleKey: 'personalColor',
    analysisRoute: '/(analysis)/personal-color',
    resultRoute: '/(analysis)/personal-color/result',
  },
  skin: {
    icon: Sparkles,
    label: '피부',
    moduleKey: 'skin',
    analysisRoute: '/(analysis)/skin',
    resultRoute: '/(analysis)/skin/result',
  },
  body: {
    icon: User,
    label: '체형',
    moduleKey: 'body',
    analysisRoute: '/(analysis)/body',
    resultRoute: '/(analysis)/body/result',
  },
  hair: {
    icon: Scissors,
    label: '헤어',
    moduleKey: 'hair',
    analysisRoute: '/(analysis)/hair',
    resultRoute: '/(analysis)/hair/result',
  },
  makeup: {
    icon: Heart,
    label: '메이크업',
    moduleKey: 'makeup',
    analysisRoute: '/(analysis)/makeup',
    resultRoute: '/(analysis)/makeup/result',
  },
};

/** 미완료 분석 추천 순서 (웹과 동일) */
export const PROFILE_ORDER: ProfileAxis[] = ['personal-color', 'skin', 'body', 'hair', 'makeup'];

/** 완료 축 → 최신 결과 경로. 모바일 결과 화면은 최신 1건을 보여주므로 id 파라미터 불필요. */
export function getProfileResultRoute(analysis: AnalysisSummary): string {
  const meta = PROFILE_META[analysis.type as ProfileAxis];
  return meta ? meta.resultRoute : '/(analysis)/hub';
}

/** AnalysisType(하이픈) → AXIS_CADENCE 변동 그룹. */
export function getProfileCadence(type: ProfileAxis): CadenceGroup {
  return getAxisCadence(type.replace('-', '_'));
}
