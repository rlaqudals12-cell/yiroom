/**
 * 상태 기반 스텝 후보. ADR-117 / 상담 시뮬레이션 D-2.
 * 성분 후보는 제품 전성분 확인이나 개인 안전성 보증이 아니다.
 */
import type { ProductCategory } from '@/types/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { ClaimEvidence } from './step-howto';
import {
  allowsActiveRecommendations,
  isRecommendationAllowed,
  type RecommendationSafetyContext,
} from './recommendation-safety';

export type CarePhaseId = 'barrier' | 'goal';
export interface StepSpec {
  specName: string;
  specReason: string;
  claimId: string;
  evidence: ClaimEvidence;
  sourceId: string;
}

const SPEC_EVIDENCE: Record<string, { evidence: ClaimEvidence; sourceId: string }> = {
  'spec-general-moisture': { evidence: 'conventional', sourceId: 'LABEL' },
  'spec-cleanser': { evidence: 'established', sourceId: 'A1' },
  'spec-toner': { evidence: 'conventional', sourceId: 'LABEL' },
  'spec-barrier': { evidence: 'conventional', sourceId: 'LABEL' },
  'spec-retinol-evening': { evidence: 'established', sourceId: 'A5' },
  'spec-tone': { evidence: 'conventional', sourceId: 'LABEL' },
  'spec-hydration': { evidence: 'conventional', sourceId: 'LABEL' },
  'spec-moisturizer': { evidence: 'established', sourceId: 'A8' },
  'spec-sunscreen': { evidence: 'established', sourceId: 'A2' },
};

/** 저장된 임의 문자열/등급 변경이 승인 렌더 경로를 우회하지 못하게 한다. */
export function isApprovedStepSpec(
  id?: string,
  evidence?: ClaimEvidence,
  sourceId?: string
): boolean {
  if (!id || !Object.hasOwn(SPEC_EVIDENCE, id)) return false;
  const approved = SPEC_EVIDENCE[id];
  return approved.evidence === evidence && approved.sourceId === sourceId;
}
/** 문진과 시간대를 확인한 후 후보만 제시한다. 제품별 농도는 생성하지 않는다. */
export function getStepSpec(
  category: ProductCategory,
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  phase?: CarePhaseId,
  context: RecommendationSafetyContext = {}
): StepSpec | null {
  const conventional = (id: string, name: string, reason: string): StepSpec => ({
    specName: name,
    specReason: reason,
    claimId: id,
    evidence: 'conventional',
    sourceId: 'LABEL',
  });
  const generalSerum = (): StepSpec =>
    conventional(
      'spec-general-moisture',
      '보습 관리',
      '안전 상태와 제품 성분을 확인한 뒤 선택해주세요. 지금은 일반 보습 관리만 안내해요.'
    );
  switch (category) {
    case 'cleanser':
      return {
        specName: skinType === 'dry' ? '촉촉한 클렌저(크림·로션 제형)' : '순한 클렌저',
        specReason:
          '세안할 때 순한 제품과 미온수로 부드럽게 씻는 것을 권장해요. pH만으로 저자극을 보장하지 않아요.',
        claimId: 'spec-cleanser',
        evidence: 'established',
        sourceId: 'A1',
      };
    case 'toner':
      return conventional(
        'spec-toner',
        '보습 토너(선택)',
        '토너는 사용 습관과 제품 라벨에 따라 선택하는 단계예요.'
      );
    case 'serum':
    case 'ampoule': {
      if (!allowsActiveRecommendations(context)) return generalSerum();
      if (phase === 'barrier')
        return conventional(
          'spec-barrier',
          '보습 세럼(선택)',
          '피부가 예민한 동안에는 사용감을 살피며 보습 위주로 선택해주세요.'
        );
      for (const concern of concerns) {
        if (concern === 'wrinkles' || concern === 'fine_lines') {
          if (!isRecommendationAllowed('레티놀', context)) continue;
          return {
            specName: '레티놀 세럼(저녁)',
            specReason:
              '사용을 고려한다면 저녁에 제품 라벨을 따르고 자극을 살피며 천천히 시작하는 것을 권장해요. 임신 중에는 피해주세요.',
            claimId: 'spec-retinol-evening',
            evidence: 'established',
            sourceId: 'A5',
          };
        }
        if (concern === 'pigmentation' || concern === 'dullness')
          return conventional(
            'spec-tone',
            '톤 관리 세럼(선택)',
            '톤 관리 제품은 전성분과 사용 조건을 확인한 뒤 선택해주세요.'
          );
        if (concern === 'dryness' || concern === 'dehydration')
          return conventional(
            'spec-hydration',
            '보습 세럼(선택)',
            '보습 제형은 제품 라벨과 사용감을 보고 선택해주세요.'
          );
        if (['sensitivity', 'redness', 'acne', 'excess_oil', 'pores'].includes(concern))
          return generalSerum();
      }
      return null;
    }
    case 'cream':
      return {
        specName: skinType === 'oily' ? '수분 젤 크림(선택)' : '보습 크림',
        specReason:
          '건조한 피부는 씻은 뒤 촉촉할 때 보습을 권장해요. 제형은 사용감에 따라 선택해주세요.',
        claimId: 'spec-moisturizer',
        evidence: 'established',
        sourceId: 'A8',
      };
    case 'sunscreen':
      return {
        specName: '자외선 차단제',
        specReason:
          '외출 약 15분 전 충분량을 바르고, 야외에서는 약 2시간마다 또는 땀·수영 후 재도포를 권장해요.',
        claimId: 'spec-sunscreen',
        evidence: 'established',
        sourceId: 'A2',
      };
    default:
      return null;
  }
}
