import { describe, it, expect } from 'vitest';
import {
  mapBodyShape7ToBodyType,
  mapBodyShape7ToBodyType3,
  mapBodyTypeTo3Type,
  BODY_SHAPE7_LABELS,
  BODY_TYPE_LABELS,
  BODY_TYPE3_LABELS,
  BODY_TYPE_EXERCISE_PRIORITIES,
} from '@/lib/body';
import type { BodyShape7 } from '@/lib/body';

describe('mapBodyShape7ToBodyType', () => {
  it('hourglass → X', () => {
    expect(mapBodyShape7ToBodyType('hourglass')).toBe('X');
  });

  it('pear → A', () => {
    expect(mapBodyShape7ToBodyType('pear')).toBe('A');
  });

  it('invertedTriangle → V', () => {
    expect(mapBodyShape7ToBodyType('invertedTriangle')).toBe('V');
  });

  it('apple → O', () => {
    expect(mapBodyShape7ToBodyType('apple')).toBe('O');
  });

  it('rectangle → H', () => {
    expect(mapBodyShape7ToBodyType('rectangle')).toBe('H');
  });

  it('trapezoid → Y (남성)', () => {
    expect(mapBodyShape7ToBodyType('trapezoid')).toBe('Y');
  });

  it('oval → O (남성)', () => {
    expect(mapBodyShape7ToBodyType('oval')).toBe('O');
  });

  it('모든 7-Type에 대해 유효한 8-Type 반환', () => {
    const allShapes: BodyShape7[] = [
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ];
    const validTypes = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'];

    for (const shape of allShapes) {
      const result = mapBodyShape7ToBodyType(shape);
      expect(validTypes).toContain(result);
    }
  });
});

describe('mapBodyShape7ToBodyType3', () => {
  it('hourglass → S (상체 볼륨, 직선적)', () => {
    expect(mapBodyShape7ToBodyType3('hourglass')).toBe('S');
  });

  it('pear → W (하체 볼륨, 곡선적)', () => {
    expect(mapBodyShape7ToBodyType3('pear')).toBe('W');
  });

  it('invertedTriangle → S', () => {
    expect(mapBodyShape7ToBodyType3('invertedTriangle')).toBe('S');
  });

  it('apple → W', () => {
    expect(mapBodyShape7ToBodyType3('apple')).toBe('W');
  });

  it('rectangle → N (골격감, 직선형)', () => {
    expect(mapBodyShape7ToBodyType3('rectangle')).toBe('N');
  });

  it('trapezoid → S (남성, 상체 발달)', () => {
    expect(mapBodyShape7ToBodyType3('trapezoid')).toBe('S');
  });

  it('oval → W (남성, 곡선적 볼륨)', () => {
    expect(mapBodyShape7ToBodyType3('oval')).toBe('W');
  });

  it('7→3 직접 변환이 7→8→3 체인과 동일한 결과', () => {
    const allShapes: BodyShape7[] = [
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ];

    for (const shape of allShapes) {
      const direct = mapBodyShape7ToBodyType3(shape);
      const chained = mapBodyTypeTo3Type(mapBodyShape7ToBodyType(shape));
      expect(direct).toBe(chained);
    }
  });
});

describe('mapBodyTypeTo3Type', () => {
  it('X → S', () => expect(mapBodyTypeTo3Type('X')).toBe('S'));
  it('V → S', () => expect(mapBodyTypeTo3Type('V')).toBe('S'));
  it('Y → S', () => expect(mapBodyTypeTo3Type('Y')).toBe('S'));
  it('A → W', () => expect(mapBodyTypeTo3Type('A')).toBe('W'));
  it('8 → W', () => expect(mapBodyTypeTo3Type('8')).toBe('W'));
  it('O → W', () => expect(mapBodyTypeTo3Type('O')).toBe('W'));
  it('H → N', () => expect(mapBodyTypeTo3Type('H')).toBe('N'));
  it('I → N', () => expect(mapBodyTypeTo3Type('I')).toBe('N'));
});

describe('BODY_SHAPE7_LABELS', () => {
  it('모든 7-Type에 한국어 라벨 존재', () => {
    const allShapes: BodyShape7[] = [
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ];

    for (const shape of allShapes) {
      expect(BODY_SHAPE7_LABELS[shape]).toBeDefined();
      expect(typeof BODY_SHAPE7_LABELS[shape]).toBe('string');
      expect(BODY_SHAPE7_LABELS[shape].length).toBeGreaterThan(0);
    }
  });
});

describe('BODY_TYPE_LABELS', () => {
  it('모든 8-Type에 한국어 라벨 존재', () => {
    const allTypes = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'] as const;

    for (const type of allTypes) {
      expect(BODY_TYPE_LABELS[type]).toBeDefined();
      expect(BODY_TYPE_LABELS[type].length).toBeGreaterThan(0);
    }
  });
});

describe('BODY_TYPE3_LABELS', () => {
  it('모든 3-Type에 한국어 라벨 존재', () => {
    expect(BODY_TYPE3_LABELS.S).toBe('스트레이트');
    expect(BODY_TYPE3_LABELS.W).toBe('웨이브');
    expect(BODY_TYPE3_LABELS.N).toBe('내추럴');
  });
});

describe('BODY_TYPE_EXERCISE_PRIORITIES', () => {
  it('모든 8-Type에 운동 우선순위 정의', () => {
    const allTypes = ['X', 'A', 'V', 'H', 'O', 'I', 'Y', '8'] as const;

    for (const type of allTypes) {
      const priority = BODY_TYPE_EXERCISE_PRIORITIES[type];
      expect(priority).toBeDefined();
      expect(priority.focusAreas.length).toBeGreaterThan(0);
      expect(['low', 'medium', 'high']).toContain(priority.cardioEmphasis);
    }
  });

  it('하체 우세(A) → 상체 강화 우선', () => {
    const priorities = BODY_TYPE_EXERCISE_PRIORITIES.A;
    expect(priorities.focusAreas).toContain('upper');
  });

  it('상체 우세(V) → 하체/코어 강화 우선', () => {
    const priorities = BODY_TYPE_EXERCISE_PRIORITIES.V;
    expect(priorities.focusAreas).toContain('lower');
    expect(priorities.focusAreas).toContain('core');
  });

  it('복부 중심(O) → 유산소 강조', () => {
    const priorities = BODY_TYPE_EXERCISE_PRIORITIES.O;
    expect(priorities.cardioEmphasis).toBe('high');
    expect(priorities.focusAreas).toContain('cardio');
  });
});
