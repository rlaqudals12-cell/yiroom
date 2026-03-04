/**
 * 4단계 안전성 파이프라인
 *
 * @see docs/adr/ADR-070-safety-profile-architecture.md
 * @see docs/specs/SDD-SAFETY-PROFILE.md
 *
 * Step 1: 알레르겐 교차반응 (Level 1, BLOCK, FNR ≤ 0.1%)
 * Step 2: 금기사항 + 연령 제한 (Level 2, WARN, FNR ≤ 5%)
 * Step 3: 성분 상호작용 (Level 2-3, WARN/INFORM)
 * Step 4: EWG 일반 안전성 (Level 3, INFORM, FNR ≤ 15%)
 *
 * 출력: SafetyReport { grade, score, alerts[], blockedIngredients[], disclaimer }
 */

import type { SafetyCheckInput, SafetyReport, SafetyGrade, PipelineContext } from './types';
import {
  CROSS_REACTIVITY_GROUPS,
  CONTRAINDICATION_RULES,
  AGE_RESTRICTIONS,
  INTERACTION_RULES,
  ACTION_PENALTIES,
} from './rules';
import { getDisclaimer } from './disclaimer';

// =============================================================================
// 메인 파이프라인
// =============================================================================

/**
 * 제품 성분 안전성 검사 (4단계 파이프라인)
 *
 * 동의 미완료 사용자: 빈 리포트 반환 (Level 3 일반 안전성만)
 */
export function checkProductSafety(input: SafetyCheckInput): SafetyReport {
  // 동의 미완료 시 개인화 없이 기본 리포트만 반환
  if (!input.profile.consentGiven) {
    return buildReport({
      input,
      alerts: [],
      blockedIngredients: [],
      score: 100,
    });
  }

  // 성분을 소문자로 정규화
  const normalizedInput: SafetyCheckInput = {
    ...input,
    ingredients: input.ingredients.map((i) => i.toLowerCase().trim()),
  };

  let ctx: PipelineContext = {
    input: normalizedInput,
    alerts: [],
    blockedIngredients: [],
    score: 100,
  };

  // 4단계 순차 실행
  ctx = step1AllergenCheck(ctx);
  ctx = step2ContraindicationCheck(ctx);
  ctx = step3InteractionCheck(ctx);
  ctx = step4EWGCheck(ctx);

  return buildReport(ctx);
}

// =============================================================================
// Step 1: 알레르겐 교차반응 (Level 1, BLOCK)
// =============================================================================

/** 사용자 알레르기 성분 → 교차반응 그룹 매칭 → BLOCK */
function step1AllergenCheck(ctx: PipelineContext): PipelineContext {
  const { allergies } = ctx.input.profile;
  if (allergies.length === 0) return ctx;

  const normalizedAllergies = allergies.map((a) => a.toLowerCase().trim());

  for (const ingredient of ctx.input.ingredients) {
    for (const group of CROSS_REACTIVITY_GROUPS) {
      // 사용자 알레르기가 이 그룹에 속하는지 확인
      const userHasGroupAllergy = normalizedAllergies.some((allergy) =>
        group.members.includes(allergy)
      );
      if (!userHasGroupAllergy) continue;

      // 제품 성분이 같은 그룹에 속하는지 확인
      if (group.members.includes(ingredient)) {
        // 이미 차단된 성분이면 중복 추가 방지
        if (ctx.blockedIngredients.includes(ingredient)) continue;

        ctx.alerts.push({
          level: 1,
          type: 'ALLERGEN',
          ingredient,
          reason: `${group.nameKo} 교차반응 위험: ${ingredient}`,
          action: 'BLOCK',
          source: `교차반응 그룹: ${group.name}`,
        });
        ctx.blockedIngredients.push(ingredient);
        ctx.score += ACTION_PENALTIES.ALLERGEN;
      }
    }
  }

  return ctx;
}

// =============================================================================
// Step 2: 금기사항 + 연령 제한 (Level 2, WARN)
// =============================================================================

/** 건강 상태 + 연령 기반 금기사항 검사 */
function step2ContraindicationCheck(ctx: PipelineContext): PipelineContext {
  ctx = checkConditionContraindications(ctx);
  ctx = checkAgeRestrictions(ctx);
  return ctx;
}

/** 건강 상태 기반 금기사항 매칭 */
function checkConditionContraindications(ctx: PipelineContext): PipelineContext {
  const { conditions, skinConditions } = ctx.input.profile;
  const allConditions = [
    ...conditions.map((c) => c.toLowerCase().trim()),
    ...skinConditions.map((c) => c.toLowerCase().trim()),
  ];

  for (const rule of CONTRAINDICATION_RULES) {
    if (!allConditions.includes(rule.condition)) continue;

    for (const ingredient of ctx.input.ingredients) {
      if (rule.ingredients.includes(ingredient)) {
        ctx.alerts.push({
          level: 2,
          type: 'CONTRAINDICATION',
          ingredient,
          reason: rule.reason,
          action: 'WARN',
          source: `금기사항: ${rule.condition}`,
        });
        ctx.score += ACTION_PENALTIES.CONTRAINDICATION;
      }
    }
  }

  return ctx;
}

/** 연령 제한 검사 */
function checkAgeRestrictions(ctx: PipelineContext): PipelineContext {
  const { age } = ctx.input.profile;
  if (age === null) return ctx;

  for (const rule of AGE_RESTRICTIONS) {
    if (age >= rule.minAge) continue;

    for (const ingredient of ctx.input.ingredients) {
      if (ingredient === rule.ingredient) {
        ctx.alerts.push({
          level: 2,
          type: 'CONTRAINDICATION',
          ingredient,
          reason: rule.reason,
          action: 'WARN',
          source: `연령 제한: ${rule.minAge}세 이상`,
        });
        ctx.score += ACTION_PENALTIES.CONTRAINDICATION;
      }
    }
  }

  return ctx;
}

// =============================================================================
// Step 3: 성분 상호작용 (Level 2-3, WARN/INFORM)
// =============================================================================

/** 제품 내 성분 간 상호작용 검사 */
function step3InteractionCheck(ctx: PipelineContext): PipelineContext {
  const { ingredients } = ctx.input;

  for (const rule of INTERACTION_RULES) {
    const hasA = ingredients.includes(rule.ingredientA);
    const hasB = ingredients.includes(rule.ingredientB);

    if (hasA && hasB) {
      const action = rule.level === 2 ? 'WARN' : 'INFORM';
      const penalty = ACTION_PENALTIES[rule.type] ?? -10;

      ctx.alerts.push({
        level: rule.level,
        type: 'INTERACTION',
        ingredient: `${rule.ingredientA} + ${rule.ingredientB}`,
        reason: rule.reason,
        action,
        source: `상호작용: ${rule.type}`,
      });
      ctx.score += penalty;
    }
  }

  return ctx;
}

// =============================================================================
// Step 4: EWG 일반 안전성 (Level 3, INFORM)
// =============================================================================

/**
 * EWG 기반 점수 반영
 * 현재는 기본 점수만 사용 (향후 성분별 EWG 조회 연동 시 확장)
 */
function step4EWGCheck(ctx: PipelineContext): PipelineContext {
  // EWG 등급이 입력에 포함되면 기본 점수 조정
  // 현재는 파이프라인 구조만 유지 (EWG DB 연동은 향후)
  return ctx;
}

// =============================================================================
// 리포트 생성
// =============================================================================

/** 파이프라인 결과 → SafetyReport 변환 */
function buildReport(ctx: PipelineContext): SafetyReport {
  // 점수 0~100 클램핑
  const score = Math.max(0, Math.min(100, ctx.score));

  // 등급 결정
  const grade = determineGrade(score, ctx.blockedIngredients.length);

  // 최고 레벨 경고에 따른 면책 문구
  const maxLevel = ctx.alerts.reduce((max, alert) => Math.max(max, alert.level), 0);
  const disclaimer = getDisclaimer(maxLevel as 0 | 1 | 2 | 3);

  return {
    productId: ctx.input.productId,
    grade,
    score,
    alerts: ctx.alerts,
    blockedIngredients: ctx.blockedIngredients,
    disclaimer,
  };
}

/** 점수 + 차단 성분 수 → 등급 결정 */
function determineGrade(score: number, blockedCount: number): SafetyGrade {
  // BLOCK 성분이 있으면 무조건 DANGER
  if (blockedCount > 0) return 'DANGER';
  if (score >= 80) return 'SAFE';
  if (score >= 50) return 'CAUTION';
  return 'DANGER';
}
