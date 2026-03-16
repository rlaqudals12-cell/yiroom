/**
 * Insight → ConnectionAwareness 브릿지
 *
 * @module lib/connection-awareness/insight-bridge
 * @description 인사이트 엔진 결과를 ConnectionAwareness 노출 요청으로 변환
 *
 * AnalysisModule (underscore) → ConnectionModule (kebab-case) 매핑 포함
 */

import type { Insight, AnalysisModule } from '@/lib/insights';

import type { ConnectionModule, ExposeRequest } from './types';

// AnalysisModule → ConnectionModule 매핑
const ANALYSIS_TO_CONNECTION: Record<AnalysisModule, ConnectionModule> = {
  personal_color: 'personal-color',
  face: 'skin', // face 분석은 skin 도메인에 포함
  skin: 'skin',
  body: 'body',
  hair: 'hair',
  oral_health: 'oral-health',
};

// 모듈 한글 라벨
const MODULE_LABELS: Record<ConnectionModule, string> = {
  'personal-color': '퍼스널컬러',
  skin: '피부 분석',
  body: '체형 분석',
  hair: '헤어 분석',
  makeup: '메이크업',
  'oral-health': '구강건강',
  workout: '운동',
  nutrition: '영양',
  fashion: '패션',
};

/**
 * 인사이트에서 "A라서 B" 연결 규칙 생성
 *
 * relatedModules의 한글 라벨을 소스로, 인사이트 제목을 결과로 조합
 */
function buildConnectionRule(insight: Insight): string {
  const sourceLabels = insight.relatedModules
    .map((m) => MODULE_LABELS[ANALYSIS_TO_CONNECTION[m]])
    .filter(Boolean);

  if (sourceLabels.length === 0) return insight.title;

  const source = sourceLabels.join(' + ');
  return `${source} 기반 — ${insight.title}`;
}

/**
 * 인사이트에서 결정적 connectionId 생성
 *
 * 동일 인사이트가 반복 노출될 때 같은 ID로 카운트 누적
 */
function buildConnectionId(insight: Insight): string {
  const modules = [...insight.relatedModules].sort().join('_');
  return `${insight.category}::${modules}`;
}

/**
 * 인사이트의 주요 소스 모듈 결정
 *
 * relatedModules 중 첫 번째를 sourceModule로 사용
 */
function getSourceModule(insight: Insight): ConnectionModule {
  if (insight.relatedModules.length === 0) return 'skin'; // fallback
  return ANALYSIS_TO_CONNECTION[insight.relatedModules[0]];
}

/**
 * 인사이트의 타겟 도메인 결정
 *
 * relatedModules가 2개 이상이면 두 번째, 아니면 카테고리 기반
 */
function getTargetDomain(insight: Insight): string {
  if (insight.relatedModules.length >= 2) {
    return ANALYSIS_TO_CONNECTION[insight.relatedModules[1]];
  }
  return insight.category;
}

/**
 * Insight → ExposeRequest 변환
 */
export function insightToExposeRequest(insight: Insight): ExposeRequest {
  return {
    connectionId: buildConnectionId(insight),
    sourceModule: getSourceModule(insight),
    targetDomain: getTargetDomain(insight),
    connectionRule: buildConnectionRule(insight),
  };
}

/**
 * ConnectionModule의 한글 라벨 조회
 */
export function getModuleLabel(module: ConnectionModule): string {
  return MODULE_LABELS[module] ?? module;
}

/**
 * AnalysisModule → ConnectionModule 변환
 */
export function analysisToConnectionModule(module: AnalysisModule): ConnectionModule {
  return ANALYSIS_TO_CONNECTION[module];
}
