/**
 * 구버전 세션에 저장된 페르소나 문구의 표시 시점 교정
 *
 * @module lib/analysis/integrated/internal/persona-repair
 * @description
 *   세션 persona는 생성 시점 문자열로 DB에 저장된다. d0978aa1 이전 Mock 템플릿은
 *   원시 영문 피부타입("combination 피부")·원시 체형값("straight 실루엣")·
 *   "바이탈리티" 전문용어·"을(를)" 병기 조사를 그대로 저장했고, 그 세션을 오늘 열어도
 *   그대로 렌더된다. 재생성 없이 표시만 정본 라벨로 교정한다
 *   (신규 세션은 이미 정본 라벨로 저장 — 교정은 no-op).
 *
 * @internal — 통합 결과 페이지 전용 (result-fetcher와 동일한 내부 소비 관행)
 */

import { objectParticle } from '@/lib/utils/korean';
import { skinTypeKo } from '../labels';
import type { PersonaProfile } from '../types';

/** 구 Mock 템플릿의 원시 체형값 → 한국어 (당시 템플릿 어휘 한정) */
const LEGACY_BODY_KO: Record<string, string> = {
  straight: '스트레이트',
  wave: '웨이브',
  natural: '내추럴',
};

/** 저장된 페르소나 문장 1개를 정본 라벨·올바른 조사로 교정 */
export function repairLegacyPersonaText(text: string): string {
  const relabeled = text
    .replace(/\b(combination|oily|dry|normal|sensitive)(?= 피부)/g, (raw) => skinTypeKo(raw))
    .replace(/\b(straight|wave|natural)(?= 실루엣)/g, (raw) => LEGACY_BODY_KO[raw] ?? raw)
    .replace(/바이탈리티/g, '피부 컨디션 점수');
  // "을(를)" 병기 → 앞 문구의 마지막 한글 받침으로 조사 확정
  return relabeled.replace(/을\(를\)/g, (_match, offset: number, whole: string) =>
    objectParticle(whole.slice(0, offset))
  );
}

/** 저장된 persona 전체(oneLine·narrative·keyInsights)를 교정한 사본 반환 */
export function repairLegacyPersona(persona: PersonaProfile | null): PersonaProfile | null {
  if (!persona) return null;
  return {
    ...persona,
    oneLine: repairLegacyPersonaText(persona.oneLine),
    narrative: repairLegacyPersonaText(persona.narrative),
    keyInsights: persona.keyInsights.map(repairLegacyPersonaText),
  };
}
