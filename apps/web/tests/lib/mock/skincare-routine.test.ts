import { describe, it, expect } from 'vitest';
import {
  PRODUCT_CATEGORIES,
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
  SKIN_CONCERN_TIPS,
  getCategoryInfo,
  calculateEstimatedTime,
  formatDuration,
} from '@/lib/mock/skincare-routine';
import type { ProductCategory } from '@/types/skincare-routine';

describe('PRODUCT_CATEGORIES', () => {
  it('contains all expected categories', () => {
    const expectedCategories: ProductCategory[] = [
      'cleanser',
      'toner',
      'essence',
      'serum',
      'ampoule',
      'cream',
      'sunscreen',
      'mask',
      'eye_cream',
      'oil',
      'spot_treatment',
    ];

    expectedCategories.forEach((category) => {
      expect(PRODUCT_CATEGORIES[category]).toBeDefined();
    });
  });

  it('each category has required fields', () => {
    Object.values(PRODUCT_CATEGORIES).forEach((info) => {
      expect(info.id).toBeDefined();
      expect(info.name).toBeDefined();
      expect(info.emoji).toBeDefined();
      expect(info.description).toBeDefined();
    });
  });

  it('cleanser has correct info', () => {
    expect(PRODUCT_CATEGORIES.cleanser.name).toBe('클렌저');
    expect(PRODUCT_CATEGORIES.cleanser.emoji).toBe('🧴');
  });

  it('sunscreen has correct info', () => {
    expect(PRODUCT_CATEGORIES.sunscreen.name).toBe('선크림');
    expect(PRODUCT_CATEGORIES.sunscreen.emoji).toBe('☀️');
  });
});

describe('MORNING_ROUTINE_STEPS', () => {
  it('has at least 5 steps', () => {
    expect(MORNING_ROUTINE_STEPS.length).toBeGreaterThanOrEqual(5);
  });

  it('starts with cleanser', () => {
    expect(MORNING_ROUTINE_STEPS[0].category).toBe('cleanser');
  });

  it('ends with sunscreen', () => {
    const lastStep = MORNING_ROUTINE_STEPS[MORNING_ROUTINE_STEPS.length - 1];
    expect(lastStep.category).toBe('sunscreen');
  });

  it('sunscreen is required (not optional)', () => {
    const sunscreenStep = MORNING_ROUTINE_STEPS.find((s) => s.category === 'sunscreen');
    expect(sunscreenStep!.isOptional).toBe(false);
  });

  it('all steps have tips', () => {
    MORNING_ROUTINE_STEPS.forEach((step) => {
      expect(step.tips.length).toBeGreaterThan(0);
    });
  });
});

describe('EVENING_ROUTINE_STEPS', () => {
  it('has at least 7 steps', () => {
    expect(EVENING_ROUTINE_STEPS.length).toBeGreaterThanOrEqual(7);
  });

  it('includes double cleansing', () => {
    const cleanserSteps = EVENING_ROUTINE_STEPS.filter((s) => s.category === 'cleanser');
    expect(cleanserSteps.length).toBeGreaterThanOrEqual(2);
  });

  it('first cleanser is for makeup removal', () => {
    const firstCleanser = EVENING_ROUTINE_STEPS.find((s) => s.category === 'cleanser');
    expect(firstCleanser!.name).toContain('오일');
  });

  it('does not include sunscreen', () => {
    const hasSunscreen = EVENING_ROUTINE_STEPS.some((s) => s.category === 'sunscreen');
    expect(hasSunscreen).toBe(false);
  });

  it('includes spot treatment as optional', () => {
    const spotStep = EVENING_ROUTINE_STEPS.find((s) => s.category === 'spot_treatment');
    expect(spotStep).toBeDefined();
    expect(spotStep!.isOptional).toBe(true);
  });
});

describe('SKIN_TYPE_MODIFIERS', () => {
  it('has modifiers for dry skin', () => {
    const dry = SKIN_TYPE_MODIFIERS.dry;
    expect(dry.addCategories).toContain('oil');
    expect(dry.warnings.length).toBeGreaterThan(0);
  });

  it('has modifiers for oily skin', () => {
    const oily = SKIN_TYPE_MODIFIERS.oily;
    expect(oily.removeCategories).toContain('oil');
  });

  it('has modifiers for combination skin', () => {
    const combination = SKIN_TYPE_MODIFIERS.combination;
    expect(combination.adjustTips.cream.length).toBeGreaterThan(0);
  });

  it('has modifiers for normal skin', () => {
    const normal = SKIN_TYPE_MODIFIERS.normal;
    expect(normal.adjustTips.cleanser.length).toBeGreaterThan(0);
  });

  it('has modifiers for sensitive skin', () => {
    const sensitive = SKIN_TYPE_MODIFIERS.sensitive;
    expect(sensitive.removeCategories).toContain('ampoule');
    expect(sensitive.warnings.length).toBeGreaterThan(0);
  });

  it('all modifiers have adjust tips for main categories', () => {
    const mainCategories: ProductCategory[] = ['cleanser', 'toner', 'cream', 'sunscreen'];

    Object.values(SKIN_TYPE_MODIFIERS).forEach((modifier) => {
      mainCategories.forEach((category) => {
        expect(modifier.adjustTips[category]).toBeDefined();
      });
    });
  });
});

describe('SKIN_CONCERN_TIPS', () => {
  it('has tips for acne', () => {
    expect(SKIN_CONCERN_TIPS.acne).toBeDefined();
    expect(SKIN_CONCERN_TIPS.acne.ingredients).toContain('BHA(살리실산)');
  });

  it('has tips for wrinkles', () => {
    expect(SKIN_CONCERN_TIPS.wrinkles).toBeDefined();
    expect(SKIN_CONCERN_TIPS.wrinkles.ingredients).toContain('레티놀');
  });

  it('has tips for pigmentation', () => {
    expect(SKIN_CONCERN_TIPS.pigmentation).toBeDefined();
    expect(SKIN_CONCERN_TIPS.pigmentation.ingredients).toContain('비타민C');
  });

  it('has tips for dryness', () => {
    expect(SKIN_CONCERN_TIPS.dryness).toBeDefined();
    expect(SKIN_CONCERN_TIPS.dryness.ingredients).toContain('히알루론산');
  });

  it('has tips for redness', () => {
    expect(SKIN_CONCERN_TIPS.redness).toBeDefined();
    expect(SKIN_CONCERN_TIPS.redness.ingredients).toContain('센텔라');
  });

  it('all concerns have ingredients, tips, and avoidIngredients', () => {
    Object.values(SKIN_CONCERN_TIPS).forEach((concern) => {
      expect(concern.ingredients).toBeDefined();
      expect(concern.tips).toBeDefined();
      expect(concern.avoidIngredients).toBeDefined();
    });
  });
});

describe('getCategoryInfo', () => {
  it('returns correct info for cleanser', () => {
    const info = getCategoryInfo('cleanser');
    expect(info.id).toBe('cleanser');
    expect(info.name).toBe('클렌저');
    expect(info.emoji).toBe('🧴');
  });

  it('returns correct info for toner', () => {
    const info = getCategoryInfo('toner');
    expect(info.id).toBe('toner');
    expect(info.name).toBe('토너');
    expect(info.emoji).toBe('💧');
  });

  it('returns correct info for all categories', () => {
    const categories: ProductCategory[] = [
      'cleanser',
      'toner',
      'essence',
      'serum',
      'ampoule',
      'cream',
      'sunscreen',
      'mask',
      'eye_cream',
      'oil',
      'spot_treatment',
    ];

    categories.forEach((category) => {
      const info = getCategoryInfo(category);
      expect(info.id).toBe(category);
      expect(info.name).toBeTruthy();
      expect(info.emoji).toBeTruthy();
    });
  });
});

describe('calculateEstimatedTime', () => {
  it('calculates time for steps with minutes', () => {
    const steps = [{ duration: '1분' }, { duration: '2분' }, { duration: '3분' }] as any[];

    expect(calculateEstimatedTime(steps)).toBe(6);
  });

  it('calculates time for steps with seconds', () => {
    const steps = [{ duration: '30초' }, { duration: '30초' }] as any[];

    expect(calculateEstimatedTime(steps)).toBe(1);
  });

  it('handles mixed duration formats', () => {
    const steps = [{ duration: '1분' }, { duration: '30초' }] as any[];

    expect(calculateEstimatedTime(steps)).toBe(1.5);
  });

  it('handles undefined duration', () => {
    const steps = [{ duration: '1분' }, { duration: undefined }, { duration: '1분' }] as any[];

    expect(calculateEstimatedTime(steps)).toBe(2);
  });

  it('returns 0 for empty array', () => {
    expect(calculateEstimatedTime([])).toBe(0);
  });
});

describe('formatDuration', () => {
  it('formats whole minutes correctly', () => {
    expect(formatDuration(1)).toBe('1분');
    expect(formatDuration(5)).toBe('5분');
    expect(formatDuration(10)).toBe('10분');
  });

  it('formats fractional minutes with seconds', () => {
    expect(formatDuration(1.5)).toBe('1분 30초');
    expect(formatDuration(2.5)).toBe('2분 30초');
  });

  it('formats zero correctly', () => {
    expect(formatDuration(0)).toBe('0분');
  });

  it('rounds seconds appropriately', () => {
    expect(formatDuration(1.25)).toBe('1분 15초');
    expect(formatDuration(1.75)).toBe('1분 45초');
  });
});
