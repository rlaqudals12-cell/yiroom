/**
 * 스킨케어 루틴 안전 게이트.
 *
 * 민감정보 동의가 없거나 임신·수유/이소트레티노인 상태가 확인되면 레티노이드
 * 사이클을 보수적으로 잠근다. 제품 성분이 있는 보유 제품은 기존 4단계 안전성
 * 파이프라인으로 검사해 금기 제품을 루틴 배치에서 제외한다.
 */

import type { ShelfItem } from '@/lib/scan/product-shelf';
import { detectOwnedActives } from '@/lib/skincare/active-categories';
import { checkProductSafety } from './pipeline';
import type { SafetyProfile } from './types';

export type RoutineSafetyProfile = Pick<
  SafetyProfile,
  'consentGiven' | 'conditions' | 'medications'
> &
  Partial<Pick<SafetyProfile, 'allergies' | 'skinConditions' | 'age'>>;

export type RetinoidRestrictionReason =
  | 'unassessed'
  | 'pregnancy_or_breastfeeding'
  | 'isotretinoin'
  | null;

export interface RoutineSafetyState {
  retinoidAllowed: boolean;
  reason: RetinoidRestrictionReason;
}

const PREGNANCY_CONDITIONS = new Set([
  'pregnancy',
  'pregnant',
  'breastfeeding',
  'lactation',
  'pregnancy_or_breastfeeding',
]);
const ISOTRETINOIN_MEDICATIONS = new Set(['isotretinoin', 'accutane', 'roaccutane']);

function normalize(values: string[]): string[] {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

/** 안전 문진 상태에서 레티노이드 사이클 허용 여부를 결정한다. */
export function resolveRoutineSafety(
  profile: RoutineSafetyProfile | null | undefined
): RoutineSafetyState {
  // 왜: 민감정보를 제공하지 않은 사용자를 임의로 "해당 없음"으로 간주하면 안전 게이트가
  // fail-open 된다. 문진 전에는 레티노이드 일정만 보수적으로 제외하고 일반 루틴은 유지한다.
  if (!profile?.consentGiven) {
    return { retinoidAllowed: false, reason: 'unassessed' };
  }

  const conditions = normalize(profile.conditions);
  if (conditions.some((condition) => PREGNANCY_CONDITIONS.has(condition))) {
    return { retinoidAllowed: false, reason: 'pregnancy_or_breastfeeding' };
  }

  const medications = normalize(profile.medications);
  if (medications.some((medication) => ISOTRETINOIN_MEDICATIONS.has(medication))) {
    return { retinoidAllowed: false, reason: 'isotretinoin' };
  }

  return { retinoidAllowed: true, reason: null };
}

function getIngredientNames(item: ShelfItem): string[] {
  return item.productIngredients.flatMap((ingredient) =>
    [ingredient.inciName, ingredient.nameKo].filter((name): name is string => Boolean(name))
  );
}

/**
 * 루틴에 배치할 보유 제품을 안전성 프로필로 필터링한다.
 *
 * - 임신·수유 규칙 등 기존 `checkProductSafety`의 금기 경고가 난 제품은 추천에서 제외
 * - 문진 전/이소트레티노인 복용 중에는 레티노이드 제품을 보수적으로 제외
 * - 성분 정보가 없는 제품은 안전 판정을 지어내지 않고 그대로 두되 사이클은 잠근다
 */
export function filterRoutineShelfItems(
  items: ShelfItem[],
  profile: RoutineSafetyProfile | null | undefined
): { items: ShelfItem[]; removedCount: number; safety: RoutineSafetyState } {
  const safety = resolveRoutineSafety(profile);
  let removedCount = 0;

  const filtered = items.filter((item) => {
    const ingredients = getIngredientNames(item);
    const hasRetinoid = detectOwnedActives([item]).has('retinoid');

    if (!safety.retinoidAllowed && hasRetinoid) {
      removedCount += 1;
      return false;
    }

    if (!profile?.consentGiven || ingredients.length === 0) return true;

    const report = checkProductSafety({
      productId: item.productId ?? item.id,
      ingredients,
      profile: {
        userId: '',
        allergies: profile.allergies ?? [],
        conditions: profile.conditions,
        skinConditions: profile.skinConditions ?? [],
        medications: profile.medications,
        age: profile.age ?? null,
        consentGiven: profile.consentGiven,
        consentVersion: '1.0',
        updatedAt: '',
      },
    });
    const mustExclude = report.alerts.some(
      (alert) =>
        alert.action === 'BLOCK' || (alert.type === 'CONTRAINDICATION' && alert.action === 'WARN')
    );
    if (mustExclude) removedCount += 1;
    return !mustExclude;
  });

  return { items: filtered, removedCount, safety };
}

/** 사용자에게 노출할 루틴 안전 안내. 제한이 실제 관련 있을 때만 호출한다. */
export function getRoutineSafetyNotice(reason: RetinoidRestrictionReason): string {
  switch (reason) {
    case 'pregnancy_or_breastfeeding':
      return '임신·수유 중 주의가 필요한 성분 제품과 레티노이드 일정을 제외했어요. 새 제품은 전문 의료인과 상의해주세요.';
    case 'isotretinoin':
      return '이소트레티노인 복용 중에는 레티노이드 제품과 일정을 제외했어요. 병용 전 처방 의료인과 상의해주세요.';
    case 'unassessed':
      return '안전 문진이 완료되지 않아 레티노이드 제품과 일정은 제안하지 않아요.';
    default:
      return '';
  }
}
