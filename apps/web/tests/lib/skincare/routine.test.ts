import { describe, it, expect } from 'vitest';
import {
  generateRoutine,
  getSkinTypeLabel,
  getTimeOfDayLabel,
  getTimeOfDayEmoji,
  calculateEstimatedTime,
  formatDuration,
} from '@/lib/skincare/routine';
import {
  MORNING_ROUTINE_STEPS,
  EVENING_ROUTINE_STEPS,
  SKIN_TYPE_MODIFIERS,
} from '@/lib/mock/skincare-routine';
import type { SkinTypeId } from '@/lib/mock/skin-analysis';

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
    const result = generateRoutine({
      skinType: 'dry',
      concerns: [],
      timeOfDay: 'evening',
    });

    const hasOil = result.routine.some((step) => step.category === 'oil');
    expect(hasOil).toBe(true);
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
