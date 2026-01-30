/**
 * 영양소 섭취량 평가 함수
 *
 * P2 원칙: docs/principles/nutrition-science.md 섹션 2.1, 2.3 기반
 */

import type { NutrientId, RDAGender, NutrientRDA } from './rda-database';
import { KOREAN_RDA } from './rda-database';

export type NutrientStatusLevel = 'deficiency' | 'optimal' | 'excess' | 'danger';

export interface NutrientStatus {
  nutrientId: NutrientId;
  intake: number;
  rda: number;
  ul: number | null;
  unit: string;
  ratio: number;
  status: NutrientStatusLevel;
  score: number;
}

export type NutrientIntake = Partial<Record<NutrientId, number>>;

export interface NutrientEvaluationResult {
  overallScore: number;
  nutrientScores: Record<string, number>;
  nutrientStatuses: NutrientStatus[];
  deficiencies: NutrientId[];
  excesses: NutrientId[];
  dangers: NutrientId[];
  recommendations: string[];
}

export function evaluateNutrientStatus(
  nutrientId: NutrientId,
  intake: number,
  rdaInfo: NutrientRDA
): NutrientStatus {
  const { rda, ul, unit } = rdaInfo;
  const ratio = (intake / rda) * 100;

  let status: NutrientStatusLevel;
  let score: number;

  if (ratio < 70) {
    status = 'deficiency';
    score = (ratio / 70) * 50;
  } else if (ratio >= 70 && ratio <= 130) {
    status = 'optimal';
    score = 100 - Math.abs(100 - ratio) * 0.3;
  } else if (ratio > 130 && (ul === null || intake <= ul)) {
    status = 'excess';
    score = Math.max(50, 100 - (ratio - 130) * 0.2);
  } else if (ul !== null && intake > ul) {
    status = 'danger';
    const excessRatio = intake / ul;
    score = Math.max(0, 50 - (excessRatio - 1) * 50);
  } else {
    status = 'optimal';
    score = 70;
  }

  return {
    nutrientId,
    intake,
    rda,
    ul,
    unit,
    ratio: Math.round(ratio * 10) / 10,
    status,
    score: Math.round(Math.max(0, Math.min(100, score))),
  };
}

const NUTRIENT_FOOD_SOURCES: Partial<Record<NutrientId, string[]>> = {
  vitaminA: ['당근', '고구마', '시금치', '케일', '달걀노른자'],
  vitaminC: ['파프리카', '브로콜리', '키위', '딸기', '오렌지'],
  vitaminE: ['아몬드', '해바라기씨', '아보카도', '시금치'],
  vitaminD: ['연어', '고등어', '달걀노른자', '버섯', '강화우유'],
  vitaminK: ['케일', '시금치', '브로콜리', '배추', '청경채'],
  vitaminB1: ['돼지고기', '현미', '해바라기씨', '검은콩'],
  vitaminB2: ['달걀', '우유', '아몬드', '버섯', '시금치'],
  vitaminB3: ['닭가슴살', '참치', '연어', '땅콩', '버섯'],
  vitaminB6: ['닭가슴살', '연어', '참치', '감자', '바나나'],
  vitaminB12: ['조개류', '연어', '소고기', '우유', '달걀'],
  folate: ['시금치', '아스파라거스', '렌틸콩', '브로콜리'],
  biotin: ['달걀노른자', '아몬드', '고구마', '시금치'],
  calcium: ['우유', '치즈', '요거트', '두부', '케일', '멸치'],
  magnesium: ['아몬드', '시금치', '캐슈넛', '땅콩', '검은콩'],
  zinc: ['굴', '소고기', '호박씨', '병아리콩', '캐슈넛'],
  selenium: ['브라질너트', '참치', '정어리', '달걀', '해바라기씨'],
  iron: ['소고기', '간', '시금치', '렌틸콩', '두부'],
  omega3: ['연어', '고등어', '청어', '치아씨', '호두', '아마씨'],
};

function generateRecommendations(
  deficiencies: NutrientId[],
  excesses: NutrientId[],
  dangers: NutrientId[],
  gender: RDAGender
): string[] {
  const recs: string[] = [];

  for (const nutrientId of dangers) {
    const rdaInfo = KOREAN_RDA[gender][nutrientId];
    const msg = rdaInfo.nameKo + ' 과다 섭취 주의: 상한 섭취량(' + rdaInfo.ul + rdaInfo.unit + ')을 초과했습니다.';
    recs.push(msg);
  }

  for (const nutrientId of deficiencies) {
    const rdaInfo = KOREAN_RDA[gender][nutrientId];
    const sources = NUTRIENT_FOOD_SOURCES[nutrientId];
    if (sources && sources.length >= 3) {
      const top3 = sources[0] + ', ' + sources[1] + ', ' + sources[2];
      recs.push(rdaInfo.nameKo + ' 부족: ' + top3 + ' 등의 섭취를 늘려보세요.');
    } else {
      recs.push(rdaInfo.nameKo + ' 부족: 권장 섭취량 대비 부족합니다.');
    }
  }

  for (const nutrientId of excesses) {
    const rdaInfo = KOREAN_RDA[gender][nutrientId];
    recs.push(rdaInfo.nameKo + ' 과잉: 상한 이내이지만, 균형 잡힌 섭취를 권장합니다.');
  }

  if (recs.length === 0) {
    recs.push('영양소 섭취가 전반적으로 양호합니다. 현재 식단을 유지하세요.');
  }

  return recs;
}

export function evaluateNutrientIntake(
  intake: NutrientIntake,
  gender: RDAGender
): NutrientEvaluationResult {
  const rda = KOREAN_RDA[gender];
  const nutrientStatuses: NutrientStatus[] = [];
  const nutrientScores: Record<string, number> = {};
  const deficiencies: NutrientId[] = [];
  const excesses: NutrientId[] = [];
  const dangers: NutrientId[] = [];

  let totalScore = 0;
  let validCount = 0;

  for (const [nutrientId, intakeValue] of Object.entries(intake)) {
    const rdaInfo = rda[nutrientId as NutrientId];
    if (!rdaInfo || intakeValue === undefined) continue;

    const status = evaluateNutrientStatus(nutrientId as NutrientId, intakeValue, rdaInfo);

    nutrientStatuses.push(status);
    nutrientScores[nutrientId] = status.score;
    totalScore += status.score;
    validCount++;

    switch (status.status) {
      case 'deficiency':
        deficiencies.push(nutrientId as NutrientId);
        break;
      case 'excess':
        excesses.push(nutrientId as NutrientId);
        break;
      case 'danger':
        dangers.push(nutrientId as NutrientId);
        break;
    }
  }

  const overallScore = validCount > 0 ? Math.round(totalScore / validCount) : 0;
  const recommendations = generateRecommendations(deficiencies, excesses, dangers, gender);

  return {
    overallScore,
    nutrientScores,
    nutrientStatuses,
    deficiencies,
    excesses,
    dangers,
    recommendations,
  };
}

export function calculateBalanceIndex(intake: NutrientIntake, gender: RDAGender): number {
  const rda = KOREAN_RDA[gender];
  let totalDeviation = 0;
  let count = 0;
  let penalty = 0;

  for (const [nutrientId, intakeValue] of Object.entries(intake)) {
    const rdaInfo = rda[nutrientId as NutrientId];
    if (!rdaInfo || intakeValue === undefined) continue;

    const optimal = rdaInfo.rda;
    const ul = rdaInfo.ul;

    const deviation = Math.abs(intakeValue - optimal) / optimal;
    totalDeviation += deviation;
    count++;

    if (ul !== null && intakeValue > ul) {
      penalty += ((intakeValue - ul) / ul) * 2;
    }
  }

  if (count === 0) return 0;

  const averageDeviation = totalDeviation / count;
  const balanceIndex = Math.max(0, 1 - averageDeviation - penalty);

  return Math.round(balanceIndex * 100) / 100;
}
