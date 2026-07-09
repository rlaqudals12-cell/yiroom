import { describe, it, expect, vi } from 'vitest';

// 어필리에이트 추천은 결정론 유지를 위해 mock (빈 추천 = 결손 슬롯)
vi.mock('@/lib/affiliate/products', () => ({
  getRecommendedProductsBySkin: vi.fn(async () => []),
}));

import {
  generateRoutine,
  enrichRoutineWithProducts,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  getTimeOfDayEmoji,
  calculateEstimatedTime,
  formatDuration,
} from '@/lib/skincare/routine';
import { deriveConcernsFromScores } from '@/lib/skincare/concerns';
import {
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
} from '@/lib/mock/skincare-routine';
import type { SkinTypeId, SkinConcernId } from '@/lib/mock/skin-analysis';
import type { RoutineStep } from '@/types/skincare-routine';
import type { ShelfItem } from '@/lib/scan/product-shelf';

// 루틴 스텝 헬퍼
function makeStep(category: RoutineStep['category'], name: string): RoutineStep {
  return { order: 1, category, name, purpose: '', tips: [], isOptional: false };
}

// 제품함 아이템 헬퍼
function makeShelfItem(overrides: Partial<ShelfItem> = {}): ShelfItem {
  return {
    id: 'shelf-1',
    clerkUserId: 'u',
    productName: '제품',
    productIngredients: [],
    scannedAt: new Date(),
    scanMethod: 'manual',
    status: 'owned',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe('generateRoutine', () => {
  it('generates morning routine with base steps', () => {
    const result = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'morning',
    });

    expect(result.routine).toBeDefined();
    expect(result.routine.length).toBeGreaterThan(0);
    expect(result.estimatedTime).toBeGreaterThan(0);
    expect(result.personalizationNote).toBeDefined();
  });

  it('generates evening routine with base steps', () => {
    const result = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'evening',
    });

    expect(result.routine).toBeDefined();
    expect(result.routine.length).toBeGreaterThan(0);
  });

  it('includes sunscreen in morning routine', () => {
    const result = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'morning',
    });

    const hasSunscreen = result.routine.some((step) => step.category === 'sunscreen');
    expect(hasSunscreen).toBe(true);
  });

  it('does not include sunscreen in evening routine', () => {
    const result = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'evening',
    });

    const hasSunscreen = result.routine.some((step) => step.category === 'sunscreen');
    expect(hasSunscreen).toBe(false);
  });

  it('adds oil category for dry skin', () => {
    // 오일은 선택 스텝 — 선택 포함 모드에서 추가 여부 확인
    const result = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'evening',
      includeOptional: true,
    });

    const hasOil = result.routine.some((step) => step.category === 'oil');
    expect(hasOil).toBe(true);
  });

  it('includes serum in essential evening routine (2026-07-08 저녁 세럼 누락 수리)', () => {
    // 저녁 상식 루틴 = 클렌징→토너→세럼→크림. 세럼은 필수 스텝이라
    // 체크리스트 모드(includeOptional: false)에서도 반드시 포함되어야 한다.
    const result = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'evening',
      includeOptional: false,
    });

    expect(result.routine.some((step) => step.category === 'serum')).toBe(true);
    // 순서: 토너 → 세럼 → 크림
    const categories = result.routine.map((s) => s.category);
    expect(categories.indexOf('toner')).toBeLessThan(categories.indexOf('serum'));
    expect(categories.indexOf('serum')).toBeLessThan(categories.indexOf('cream'));
  });

  it('defaults to essential-only routine (체크리스트 표면 정합 — /beauty = 캡슐 데일리)', () => {
    // includeOptional 미전달 = false — 파라미터 차이로 화면마다 루틴이 달라지던 문제 방지
    const byDefault = generateRoutine({
      skinType: 'combination',
      concerns: [],
      timeOfDay: 'evening',
    });
    const essential = generateRoutine({
      skinType: 'combination',
      concerns: [],
      timeOfDay: 'evening',
      includeOptional: false,
    });

    expect(byDefault.routine.map((s) => s.category)).toEqual(
      essential.routine.map((s) => s.category)
    );
    expect(byDefault.routine.every((step) => !step.isOptional)).toBe(true);
  });

  it('removes oil category for oily skin', () => {
    const result = generateRoutine({
      skinType: 'oily',
      concerns: [],
      timeOfDay: 'evening',
    });

    const hasOil = result.routine.some((step) => step.category === 'oil');
    expect(hasOil).toBe(false);
  });

  it('removes ampoule and spot_treatment for sensitive skin', () => {
    const result = generateRoutine({
      skinType: 'sensitive',
      concerns: [],
      timeOfDay: 'evening',
    });

    const hasAmpoule = result.routine.some((step) => step.category === 'ampoule');
    const hasSpotTreatment = result.routine.some((step) => step.category === 'spot_treatment');

    expect(hasAmpoule).toBe(false);
    expect(hasSpotTreatment).toBe(false);
  });

  it('filters optional steps when includeOptional is false', () => {
    const withOptional = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'morning',
      includeOptional: true,
    });

    const withoutOptional = generateRoutine({
      skinType: 'normal',
      concerns: [],
      timeOfDay: 'morning',
      includeOptional: false,
    });

    expect(withoutOptional.routine.length).toBeLessThan(withOptional.routine.length);
    expect(withoutOptional.routine.every((step) => !step.isOptional)).toBe(true);
  });

  it('reorders steps correctly after modifications', () => {
    const result = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'evening',
    });

    // 순서가 1부터 시작해야 함
    expect(result.routine[0].order).toBe(1);

    // 순서가 연속적이어야 함
    for (let i = 0; i < result.routine.length; i++) {
      expect(result.routine[i].order).toBe(i + 1);
    }
  });

  it('adjusts tips based on skin type', () => {
    const result = generateRoutine({
      skinType: 'oily',
      concerns: [],
      timeOfDay: 'morning',
    });

    const cleanserStep = result.routine.find((step) => step.category === 'cleanser');
    expect(cleanserStep).toBeDefined();

    // 지성 피부용 팁이 포함되어야 함
    const oilyModifier = SKIN_TYPE_MODIFIERS.oily;
    const expectedTip = oilyModifier.adjustTips.cleanser[0];
    expect(cleanserStep!.tips).toContain(expectedTip);
  });

  it('includes personalization note with skin type', () => {
    const result = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'morning',
    });

    expect(result.personalizationNote).toContain('건성');
  });

  it('includes ingredient recommendation for concerns', () => {
    const result = generateRoutine({
      skinType: 'normal',
      concerns: ['acne'],
      timeOfDay: 'morning',
    });

    // 여드름 고민에 대한 성분 추천이 포함되어야 함
    expect(result.personalizationNote).toContain('BHA');
  });

  it('includes warning in personalization note', () => {
    const result = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'morning',
    });

    // 건성 피부 주의사항 포함
    expect(result.personalizationNote).toContain('주의');
  });
});

describe('getSkinTypeLabel', () => {
  it('returns correct label for each skin type', () => {
    expect(getSkinTypeLabel('dry')).toBe('건성');
    expect(getSkinTypeLabel('oily')).toBe('지성');
    expect(getSkinTypeLabel('combination')).toBe('복합성');
    expect(getSkinTypeLabel('normal')).toBe('중성');
    expect(getSkinTypeLabel('sensitive')).toBe('민감성');
  });
});

describe('getTimeOfDayLabel', () => {
  it('returns 아침 for morning', () => {
    expect(getTimeOfDayLabel('morning')).toBe('아침');
  });

  it('returns 저녁 for evening', () => {
    expect(getTimeOfDayLabel('evening')).toBe('저녁');
  });
});

describe('getTimeOfDayEmoji', () => {
  it('returns sunrise emoji for morning', () => {
    expect(getTimeOfDayEmoji('morning')).toBe('🌅');
  });

  it('returns moon emoji for evening', () => {
    expect(getTimeOfDayEmoji('evening')).toBe('🌙');
  });
});

describe('calculateEstimatedTime', () => {
  it('calculates total time in minutes', () => {
    const steps = [{ duration: '1분' }, { duration: '30초' }, { duration: '2분' }] as any[];

    const result = calculateEstimatedTime(steps);
    expect(result).toBe(3.5); // 1 + 0.5 + 2
  });

  it('handles steps without duration', () => {
    const steps = [{ duration: '1분' }, { duration: undefined }, { duration: '2분' }] as any[];

    const result = calculateEstimatedTime(steps);
    expect(result).toBe(3);
  });

  it('returns 0 for empty array', () => {
    const result = calculateEstimatedTime([]);
    expect(result).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats whole minutes', () => {
    expect(formatDuration(3)).toBe('3분');
    expect(formatDuration(5)).toBe('5분');
  });

  it('formats minutes with seconds', () => {
    expect(formatDuration(3.5)).toBe('3분 30초');
    expect(formatDuration(2.75)).toBe('2분 45초');
  });

  it('handles zero', () => {
    expect(formatDuration(0)).toBe('0분');
  });
});

describe('MORNING_ROUTINE_STEPS', () => {
  it('has cleanser as first step', () => {
    expect(MORNING_ROUTINE_STEPS[0].category).toBe('cleanser');
    expect(MORNING_ROUTINE_STEPS[0].order).toBe(1);
  });

  it('has sunscreen as last step', () => {
    const lastStep = MORNING_ROUTINE_STEPS[MORNING_ROUTINE_STEPS.length - 1];
    expect(lastStep.category).toBe('sunscreen');
  });

  it('includes required fields for all steps', () => {
    MORNING_ROUTINE_STEPS.forEach((step) => {
      expect(step.order).toBeDefined();
      expect(step.category).toBeDefined();
      expect(step.name).toBeDefined();
      expect(step.purpose).toBeDefined();
      expect(typeof step.isOptional).toBe('boolean');
    });
  });
});

describe('EVENING_ROUTINE_STEPS', () => {
  it('has cleanser as first step', () => {
    expect(EVENING_ROUTINE_STEPS[0].category).toBe('cleanser');
  });

  it('includes double cleansing steps', () => {
    const cleanserSteps = EVENING_ROUTINE_STEPS.filter((s) => s.category === 'cleanser');
    expect(cleanserSteps.length).toBeGreaterThanOrEqual(2);
  });

  it('includes spot_treatment as optional', () => {
    const spotStep = EVENING_ROUTINE_STEPS.find((s) => s.category === 'spot_treatment');
    expect(spotStep).toBeDefined();
    expect(spotStep!.isOptional).toBe(true);
  });
});

describe('SKIN_TYPE_MODIFIERS', () => {
  it('has modifiers for all skin types', () => {
    const skinTypes: SkinTypeId[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];

    skinTypes.forEach((type) => {
      expect(SKIN_TYPE_MODIFIERS[type]).toBeDefined();
      expect(SKIN_TYPE_MODIFIERS[type].addCategories).toBeDefined();
      expect(SKIN_TYPE_MODIFIERS[type].removeCategories).toBeDefined();
      expect(SKIN_TYPE_MODIFIERS[type].adjustTips).toBeDefined();
      expect(SKIN_TYPE_MODIFIERS[type].warnings).toBeDefined();
    });
  });

  it('dry skin adds oil category', () => {
    expect(SKIN_TYPE_MODIFIERS.dry.addCategories).toContain('oil');
  });

  it('oily skin removes oil category', () => {
    expect(SKIN_TYPE_MODIFIERS.oily.removeCategories).toContain('oil');
  });

  it('sensitive skin removes irritating categories', () => {
    expect(SKIN_TYPE_MODIFIERS.sensitive.removeCategories).toContain('ampoule');
    expect(SKIN_TYPE_MODIFIERS.sensitive.removeCategories).toContain('spot_treatment');
  });
});

// ── ADR-117: enrichRoutineWithProducts shelf-우선 ──────────────────────────
describe('enrichRoutineWithProducts (shelf-우선)', () => {
  const steps: RoutineStep[] = [makeStep('toner', '토너'), makeStep('cream', '크림')];

  it('보유 제품이 스텝 카테고리와 맞으면 ownedProduct를 세팅한다', async () => {
    const shelfItems = [
      makeShelfItem({ id: 's-toner', productName: '수분 토너', productBrand: '내브랜드' }),
    ];

    const result = await enrichRoutineWithProducts(steps, 'normal', [], shelfItems);

    const tonerStep = result.find((s) => s.category === 'toner');
    expect(tonerStep?.ownedProduct).toEqual({
      shelfItemId: 's-toner',
      name: '수분 토너',
      brand: '내브랜드',
    });
    // 크림은 보유 없음 → 빈 슬롯(recommendedProducts가 구매 연결)
    const creamStep = result.find((s) => s.category === 'cream');
    expect(creamStep?.ownedProduct).toBeUndefined();
    expect(creamStep?.recommendedProducts).toEqual([]);
  });

  it('shelfItems 미전달 시 기존과 동일 — ownedProduct 없음', async () => {
    const result = await enrichRoutineWithProducts(steps, 'normal', []);
    expect(result.every((s) => s.ownedProduct === undefined)).toBe(true);
  });

  it('감지 불가(unknown) 보유 제품은 배치하지 않는다', async () => {
    const shelfItems = [
      makeShelfItem({ id: 's-x', productName: '정체불명 제품', productBrand: '' }),
    ];
    const result = await enrichRoutineWithProducts(steps, 'normal', [], shelfItems);
    expect(result.every((s) => s.ownedProduct === undefined)).toBe(true);
  });

  it('보유 제품이 owned 상태가 아니면 배치하지 않는다', async () => {
    const shelfItems = [makeShelfItem({ id: 's-w', productName: '수분 토너', status: 'wishlist' })];
    const result = await enrichRoutineWithProducts(steps, 'normal', [], shelfItems);
    expect(result.every((s) => s.ownedProduct === undefined)).toBe(true);
  });
});

// ── ADR-117: 피부 고민 파생 정본 ──────────────────────────────────────────
describe('deriveConcernsFromScores', () => {
  it('임계(≤40) 이하 지표에 대응하는 고민을 파생한다', () => {
    const concerns = deriveConcernsFromScores({
      hydration: 35,
      oil_level: 60,
      pores: 40,
      pigmentation: 80,
      wrinkles: 90,
      sensitivity: 30,
    });
    expect(concerns).toEqual(['dryness', 'pores', 'sensitivity']);
  });

  it('지표가 없으면 빈 배열', () => {
    expect(deriveConcernsFromScores({})).toEqual([]);
  });

  it('루틴 페이지 파생 로직과 동등하다 (동일 임계·매핑·순서)', () => {
    const data = {
      hydration: 20,
      oil_level: 30,
      pores: 55,
      pigmentation: 38,
      wrinkles: 42,
      sensitivity: 41,
    };
    // 페이지 deriveConcernsFromMetrics 재현
    const T = 40;
    const expected: SkinConcernId[] = [];
    if (data.hydration <= T) expected.push('dryness');
    if (data.oil_level <= T) expected.push('excess_oil');
    if (data.pores <= T) expected.push('pores');
    if (data.pigmentation <= T) expected.push('pigmentation');
    if (data.wrinkles <= T) expected.push('wrinkles');
    if (data.sensitivity <= T) expected.push('sensitivity');

    expect(deriveConcernsFromScores(data)).toEqual(expected);
  });
});

// ── ADR-117: 법적 표현 안전 (처방·치료 금지) ──────────────────────────────
describe('법적 표현 안전', () => {
  it('루틴 개인화 문구에 의약품 클레임 단어(처방·치료)가 없다', () => {
    const note = generateRoutine({
      skinType: 'sensitive',
      concerns: ['acne', 'redness'],
      timeOfDay: 'evening',
    }).personalizationNote;

    expect(note).not.toContain('처방');
    expect(note).not.toContain('치료');
  });
});
