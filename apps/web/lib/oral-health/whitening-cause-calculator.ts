/**
 * 변색 원인별 미백 목표 세분화
 *
 * @module lib/oral-health/whitening-cause-calculator
 * @description 4종 변색 원인(표면/내재/노화/항생제)별 추천 경로 분리
 * @see docs/specs/SDD-OH-1-ORAL-HEALTH.md
 */

import type {
  VitaShade,
  PersonalColorSeason,
  DiscolorationCause,
  WhiteningGoalResult,
} from '@/types/oral-health';
import { calculateWhiteningGoal } from './whitening-goal-calculator';

/**
 * 변색 원인별 미백 특성
 */
const CAUSE_CHARACTERISTICS: Record<
  DiscolorationCause,
  {
    name: string;
    description: string;
    /** 자가 미백 효과 기대치 (0-1) */
    selfBleachingEffectiveness: number;
    /** 전문 시술 필요 여부 */
    needsProfessional: boolean;
    /** 추가 주의사항 */
    precautions: string[];
    /** 추천 방법 우선순위 */
    preferredMethods: WhiteningGoalResult['recommendedMethods'][0]['method'][];
  }
> = {
  surface: {
    name: '표면 착색',
    description: '커피, 와인, 흡연 등 외부 요인에 의한 표면 착색',
    selfBleachingEffectiveness: 0.9,
    needsProfessional: false,
    precautions: [
      '착색 원인 음식/음료 섭취를 줄이세요.',
      '식후 30분 내 양치 또는 물로 헹구세요.',
      '미백 치약으로 꾸준히 관리하면 효과가 좋아요.',
    ],
    preferredMethods: ['whitening_toothpaste', 'strips', 'professional_bleaching'],
  },
  intrinsic: {
    name: '내재적 변색',
    description: '치아 내부 구조의 변색 (외상, 과불소증 등)',
    selfBleachingEffectiveness: 0.4,
    needsProfessional: true,
    precautions: [
      '내재적 변색은 자가 미백으로 완전한 개선이 어려울 수 있어요.',
      '전문가 상담 후 적합한 시술을 결정하세요.',
      '라미네이트나 비니어를 고려해볼 수 있어요.',
    ],
    preferredMethods: ['in_office', 'professional_bleaching'],
  },
  aging: {
    name: '노화 변색',
    description: '나이에 따른 법랑질 마모와 상아질 노출',
    selfBleachingEffectiveness: 0.6,
    needsProfessional: false,
    precautions: [
      '법랑질이 얇아져 있으므로 고농도 미백제 사용 시 주의하세요.',
      '민감도 증가에 대비해 저자극 제품을 선택하세요.',
      '점진적으로 진행하는 것이 치아 건강에 좋아요.',
    ],
    preferredMethods: ['whitening_toothpaste', 'professional_bleaching', 'strips'],
  },
  antibiotic: {
    name: '항생제 변색',
    description: '테트라사이클린 등 항생제에 의한 깊은 변색',
    selfBleachingEffectiveness: 0.2,
    needsProfessional: true,
    precautions: [
      '항생제 변색은 자가 미백으로 개선이 매우 어려워요.',
      '전문 치과에서 복합 시술을 권장해요.',
      '비니어, 크라운 등 보철 치료가 가장 효과적일 수 있어요.',
      '장기간의 인-오피스 블리칭으로 부분 개선이 가능해요.',
    ],
    preferredMethods: ['in_office'],
  },
};

/**
 * 변색 원인별 미백 목표 세분화 결과
 */
export interface WhiteningGoalByCauseResult extends WhiteningGoalResult {
  cause: DiscolorationCause;
  causeName: string;
  causeDescription: string;
  selfBleachingEffectiveness: number;
  needsProfessional: boolean;
  causePrecautions: string[];
  /** 원인 고려한 현실적 목표 셰이드 (기본 목표보다 보수적일 수 있음) */
  realisticTargetShade: VitaShade;
  realisticShadeSteps: number;
}

/**
 * 변색 원인별 미백 목표 계산
 *
 * 기본 미백 목표를 계산한 뒤, 변색 원인에 따라 현실적 목표를 조정한다.
 * - surface: 기본 목표 그대로 (효과 높음)
 * - aging: 기본 목표의 80% (법랑질 상태 고려)
 * - intrinsic: 기본 목표의 50% (내부 구조 한계)
 * - antibiotic: 기본 목표의 30% (자가 미백 한계)
 */
export function calculateWhiteningGoalByCause(
  currentShade: VitaShade,
  personalColorSeason: PersonalColorSeason,
  desiredLevel: 'subtle' | 'moderate' | 'dramatic',
  cause: DiscolorationCause
): WhiteningGoalByCauseResult {
  // 기본 미백 목표 계산
  const baseGoal = calculateWhiteningGoal({
    currentShade,
    personalColorSeason,
    desiredLevel,
  });

  const causeInfo = CAUSE_CHARACTERISTICS[cause];

  // 원인별 현실적 단계 조정
  const realisticSteps = Math.max(
    1,
    Math.round(baseGoal.shadeStepsNeeded * causeInfo.selfBleachingEffectiveness)
  );

  // 현실적 목표 셰이드: 전문 시술 여부와 무관하게 기본 목표 셰이드 사용
  // (전문 시술 필요 시 기간이 길어지는 것으로 반영)
  const realisticTargetShade = baseGoal.targetShade;

  // 기간 조정: 효과가 낮을수록 더 오래 걸림
  const durationMultiplier =
    causeInfo.selfBleachingEffectiveness > 0 ? 1 / causeInfo.selfBleachingEffectiveness : 3;
  const adjustedDuration = {
    minWeeks: Math.round(baseGoal.expectedDuration.minWeeks * Math.min(durationMultiplier, 3)),
    maxWeeks: Math.round(baseGoal.expectedDuration.maxWeeks * Math.min(durationMultiplier, 3)),
  };

  // 추천 방법을 원인에 맞게 필터링 + 재정렬
  const adjustedMethods = baseGoal.recommendedMethods.sort((a, b) => {
    const aIdx = causeInfo.preferredMethods.indexOf(a.method);
    const bIdx = causeInfo.preferredMethods.indexOf(b.method);
    const aPriority = aIdx === -1 ? 99 : aIdx;
    const bPriority = bIdx === -1 ? 99 : bIdx;
    return aPriority - bPriority;
  });

  // 전문 시술 필요 시 과도한 미백 경고 추가
  const overWhiteningWarning =
    causeInfo.needsProfessional && !baseGoal.isOverWhitening
      ? `${causeInfo.name}의 경우 전문가 상담을 먼저 받으세요.`
      : baseGoal.overWhiteningReason;

  return {
    ...baseGoal,
    expectedDuration: adjustedDuration,
    recommendedMethods: adjustedMethods,
    overWhiteningReason: overWhiteningWarning,
    cause,
    causeName: causeInfo.name,
    causeDescription: causeInfo.description,
    selfBleachingEffectiveness: causeInfo.selfBleachingEffectiveness,
    needsProfessional: causeInfo.needsProfessional,
    causePrecautions: causeInfo.precautions,
    realisticTargetShade: realisticTargetShade,
    realisticShadeSteps: realisticSteps,
  };
}
