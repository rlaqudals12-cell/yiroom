/**
 * H-1 헤어 — 두피 주의 성분 + 두피 고민 안내 (웹 lib/mock/hair-analysis.ts 포팅)
 *
 * 왜: 추천 성분만으로는 초보자가 "무엇을 피할지" 모른다. 두피 타입별 주의 성분을
 * 함께 제시한다. 또한 탈모·비듬 등 의료적 상담이 필요할 수 있는 증상은
 * "의심되면 전문의 상담" 형태로만 안내한다(진단은 이룸의 역할이 아님 — 경계 준수).
 */
import type { HairAnalysisResult } from '../gemini/types';

type ScalpCondition = HairAnalysisResult['scalpCondition']; // 'dry' | 'oily' | 'normal' | 'sensitive'

// 두피 타입별 주의(피하면 좋은) 성분 — 웹 CAUTION_INGREDIENTS_BY_SCALP와 동일
const CAUTION_INGREDIENTS_BY_SCALP: Record<ScalpCondition, string[]> = {
  dry: ['강한 설페이트(SLS·SLES) 세정제', '고농도 변성 알코올', '과도한 멘톨'],
  normal: ['실리콘 과다(빌드업 유발)', '인공 향료 과다'],
  oily: ['무거운 오일(코코넛·시어버터 과다)', '실리콘 과다(빌드업 유발)'],
  sensitive: ['강한 설페이트(SLS)', '인공 향료·색소', '고농도 멘톨·에센셜 오일'],
};

/**
 * 두피 타입별 주의(피하면 좋은) 성분 — scalpCondition 미상이면 공통 주의 성분 반환.
 */
export function getHairCautionIngredients(scalpCondition?: ScalpCondition): string[] {
  if (scalpCondition && CAUTION_INGREDIENTS_BY_SCALP[scalpCondition]) {
    return CAUTION_INGREDIENTS_BY_SCALP[scalpCondition];
  }
  return ['강한 설페이트(SLS·SLES) 세정제', '인공 향료 과다', '실리콘 과다(빌드업 유발)'];
}

// 의료적 상담이 필요할 수 있는 두피 고민 키워드 (mainConcerns는 자연어 문자열)
const REFERRAL_KEYWORDS = ['탈모', '비듬', '각질', '지루성'];

/**
 * 두피 고민 안내 — 탈모·비듬 등 의료적 상담이 필요할 수 있는 증상이면 안내 문구 반환.
 *
 * 왜: 진단은 이룸의 역할이 아니다(경계 준수). "의심되면 전문의 상담" 형태로만 안내한다.
 * 모바일 mainConcerns는 자연어 문자열 배열이므로 키워드 매칭으로 판정한다.
 */
export function getScalpConcernNotice(concerns: string[]): string | null {
  const needsReferral = concerns.some((c) => REFERRAL_KEYWORDS.some((k) => c.includes(k)));
  if (!needsReferral) return null;
  return '탈모·심한 비듬·지속되는 두피 각질은 지루성 두피염이나 탈모 질환이 의심될 수 있어요. 증상이 오래 지속되거나 심해지면 피부과 전문의 상담을 권해요. (이룸의 분석은 진단이 아니에요)';
}
