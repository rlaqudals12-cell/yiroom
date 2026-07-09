/**
 * 스텝 스펙 — 일반 명칭을 "상태 기반 성분 스펙"으로 구체화 (U2)
 *
 * @module lib/skincare/step-spec
 * @description
 *   창업자 피드백: "약산성 클렌징 폼, 무슨 성분의 크림, 어떤 세럼 — 이 디테일이
 *   AI 솔루션의 차별성이다." generateRoutine이 만드는 일반 스텝명("클렌저","크림")을
 *   피부 타입·고민·케어 단계로 구체화한다.
 *
 *   순수·결정론적: 같은 입력이면 같은 스펙. AI/랜덤 없음.
 *   기존 name을 대체하지 않고 specName/specReason을 추가(하위호환) — 표면이 specName 우선.
 *
 *   용어 안전(ADR-117 §7.3): "치료·처방·완치" 금지. 효능은 "~에 도움을 주는/잘 맞는"
 *   담백한 톤으로만. 근거 없는 고민(concern 미보유)은 기본 명칭 유지 — 지어내지 않는다.
 */

import type { ProductCategory } from '@/types/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';

/** 케어 단계 — care-phase.ts CarePhase.phase와 동일 축 */
export type CarePhaseId = 'barrier' | 'goal';

/** 스텝 스펙 — 구체화된 이름 + 왜 한 줄 */
export interface StepSpec {
  /** 구체화된 스텝명 (예: "약산성 클렌저", "세라마이드 크림") */
  specName: string;
  /** 이 스펙이 왜 잘 맞는지 한 줄 (담백한 톤) */
  specReason: string;
}

/**
 * 고민 → 세럼 스펙 매핑. concerns 배열 순서대로 첫 매칭이 채택된다
 * (사용자 목표가 앞에 병합되므로 목표 우선 반영됨 — mergeGoalsIntoConcerns 참조).
 */
const SERUM_BY_CONCERN: Partial<Record<SkinConcernId, StepSpec>> = {
  pigmentation: {
    specName: '비타민C 세럼(아침)/나이아신아마이드',
    specReason:
      '기미·잡티 톤 관리에 자주 쓰이는 성분이에요. 비타민C는 보통 10~20% 농도를 쓰는데, 제품 표기를 확인하세요',
  },
  dullness: {
    specName: '비타민C 세럼(아침)',
    specReason:
      '칙칙한 피부 톤 관리에 도움을 주는 성분이에요. 비타민C는 보통 10~20% 농도예요 — 제품 표기를 확인하세요',
  },
  wrinkles: {
    specName: '레티놀 세럼(저녁)',
    specReason:
      '탄력 관리에 도움을 주는 성분이라 저녁에 써요. 레티놀은 0.1~0.3% 저농도부터 시작하는 게 좋아요 — 제품 표기를 확인하세요',
  },
  fine_lines: {
    specName: '레티놀 세럼(저녁)',
    specReason:
      '잔주름 관리에 자주 쓰이는 성분이라 저녁에 써요. 레티놀은 0.1~0.3%부터 시작해요 — 제품 표기를 확인하세요',
  },
  dryness: {
    specName: '히알루론산 세럼',
    specReason: '수분을 끌어당겨 채워주는 성분이에요',
  },
  dehydration: {
    specName: '히알루론산 세럼',
    specReason: '수분을 끌어당겨 채워주는 성분이에요',
  },
  sensitivity: {
    specName: '진정 세럼(시카·판테놀)',
    specReason: '예민해진 피부를 진정시키는 데 도움을 주는 성분이에요',
  },
  redness: {
    specName: '진정 세럼(시카·판테놀)',
    specReason: '붉은기 진정에 자주 쓰이는 성분이에요',
  },
  acne: {
    specName: '나이아신아마이드 세럼',
    specReason: '트러블이 잦은 피부에 잘 맞는 성분이에요',
  },
  excess_oil: {
    specName: '나이아신아마이드 세럼',
    specReason: '피지·모공 관리에 도움을 주는 성분이에요',
  },
  pores: {
    specName: '나이아신아마이드 세럼',
    specReason: '모공 관리에 자주 쓰이는 성분이에요',
  },
};

/** barrier 단계 세럼 — 목표 활성 대신 진정·보습으로 강제 */
function barrierSerum(skinType: SkinTypeId, concerns: SkinConcernId[]): StepSpec {
  if (
    skinType === 'sensitive' ||
    concerns.includes('sensitivity') ||
    concerns.includes('redness')
  ) {
    return {
      specName: '진정 세럼(시카·판테놀)',
      specReason: '지금은 장벽 회복이 먼저라 진정 성분이 잘 맞아요',
    };
  }
  return {
    specName: '히알루론산 세럼',
    specReason: '지금은 장벽 회복이 먼저라 수분 채우기에 집중해요',
  };
}

/**
 * 카테고리 + 상태 → 스텝 스펙. 구체화할 게 없으면 null(기본 명칭 유지).
 *
 * @param category 스텝 카테고리
 * @param skinType 피부 타입
 * @param concerns 파생/목표 고민 (순서 = 우선순위)
 * @param phase 케어 단계 — 'barrier'면 세럼·크림을 진정·보습으로 강제
 */
export function getStepSpec(
  category: ProductCategory,
  skinType: SkinTypeId,
  concerns: SkinConcernId[],
  phase?: CarePhaseId
): StepSpec | null {
  const isBarrier = phase === 'barrier';

  switch (category) {
    case 'cleanser':
      // 약산성 = 장벽 자극이 적은 세안. 건성은 세정 후에도 당기지 않는 촉촉한 제형.
      if (skinType === 'dry') {
        return {
          specName: '촉촉한 약산성 클렌저',
          specReason: '건조한 피부에는 세정 후에도 당기지 않는 약산성 제형이 잘 맞아요',
        };
      }
      return {
        specName: '약산성 클렌저',
        specReason: '약산성 세안은 피부 장벽을 덜 자극해요',
      };

    case 'toner':
      if (skinType === 'dry') {
        return { specName: '보습 토너', specReason: '수분을 먼저 채워 다음 단계 흡수를 도와요' };
      }
      if (skinType === 'oily') {
        return { specName: '수분 토너(무유분)', specReason: '유분 없이 수분만 가볍게 채워요' };
      }
      if (skinType === 'sensitive') {
        return {
          specName: '무향 진정 토너',
          specReason: '향·자극 성분을 뺀 진정 포뮬러가 잘 맞아요',
        };
      }
      return null; // 중성·복합성 = 기본 토너 유지

    case 'serum':
    case 'ampoule': {
      if (isBarrier) return barrierSerum(skinType, concerns);
      // 목표: concerns 순서대로 첫 매칭 (목표가 앞에 병합됨)
      for (const c of concerns) {
        const spec = SERUM_BY_CONCERN[c];
        if (spec) return spec;
      }
      return null; // 대응 고민 없으면 기본 세럼 유지 (지어내지 않음)
    }

    case 'cream':
      if (skinType === 'oily') {
        return { specName: '수분 젤 크림', specReason: '유분 없이 산뜻하게 수분만 잡아줘요' };
      }
      // 장벽 회복 단계·건성·민감성은 장벽을 채우는 세라마이드 크림이 잘 맞아요
      if (isBarrier || skinType === 'dry' || skinType === 'sensitive') {
        return { specName: '세라마이드 크림', specReason: '피부 장벽을 채워 수분을 가둬줘요' };
      }
      return null; // 중성·복합성 = 기본 크림 유지

    case 'sunscreen':
      if (skinType === 'sensitive') {
        return {
          specName: '무기자차(민감 피부용)',
          specReason: '자극이 적은 무기자차가 예민한 피부에 잘 맞아요',
        };
      }
      return {
        specName: 'SPF50+ PA+++',
        specReason:
          'SPF50+는 자외선 차단력, PA+++는 노화를 부르는 자외선(UVA) 차단 정도를 뜻해요. 자외선 차단은 광노화 예방의 기본이에요',
      };

    // essence·mask·eye_cream·oil·spot_treatment = 상태 기반 성분 구체화 대상 아님 (기본 명칭)
    default:
      return null;
  }
}
