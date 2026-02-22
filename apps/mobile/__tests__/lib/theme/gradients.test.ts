/**
 * gradients.ts 테스트
 */
import { gradients, getModuleGradient, type GradientKey } from '../../../lib/theme/gradients';

describe('gradients', () => {
  it('should have all expected gradient keys', () => {
    const expectedKeys: GradientKey[] = [
      'brand',
      'brandExtended',
      'workout',
      'nutrition',
      'skin',
      'body',
      'personalColor',
      'face',
      'hair',
      'makeup',
      'posture',
      'oralHealth',
      'professional',
      'heroOverlay',
    ];

    expectedKeys.forEach((key) => {
      expect(gradients[key]).toBeDefined();
    });
  });

  it('should have valid color arrays (at least 2 colors)', () => {
    Object.values(gradients).forEach((gradient) => {
      expect(gradient.colors.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should have valid start/end coordinates', () => {
    Object.values(gradients).forEach((gradient) => {
      expect(gradient.start).toHaveProperty('x');
      expect(gradient.start).toHaveProperty('y');
      expect(gradient.end).toHaveProperty('x');
      expect(gradient.end).toHaveProperty('y');
      expect(gradient.start.x).toBeGreaterThanOrEqual(0);
      expect(gradient.start.x).toBeLessThanOrEqual(1);
      expect(gradient.end.y).toBeGreaterThanOrEqual(0);
      expect(gradient.end.y).toBeLessThanOrEqual(1);
    });
  });

  it('brand gradient should use brand colors', () => {
    const brand = gradients.brand;
    expect(brand.colors).toHaveLength(2);
    expect(typeof brand.colors[0]).toBe('string');
    expect(typeof brand.colors[1]).toBe('string');
  });

  it('heroOverlay should use vertical direction', () => {
    const hero = gradients.heroOverlay;
    // 수직: start.x === end.x, start.y < end.y
    expect(hero.start.x).toBe(hero.end.x);
    expect(hero.start.y).toBeLessThan(hero.end.y);
  });
});

describe('getModuleGradient', () => {
  it('should return gradient config for a module', () => {
    const result = getModuleGradient('skin');
    expect(result).toHaveProperty('colors');
    expect(result).toHaveProperty('start');
    expect(result).toHaveProperty('end');
    expect(result.colors).toHaveLength(2);
  });

  it('should return diagonal direction', () => {
    const result = getModuleGradient('workout');
    expect(result.start).toEqual({ x: 0, y: 0 });
    expect(result.end).toEqual({ x: 1, y: 1 });
  });

  it('should work for all module keys', () => {
    const moduleKeys = [
      'workout', 'nutrition', 'skin', 'body',
      'personalColor', 'face', 'hair', 'makeup',
      'posture', 'oralHealth',
    ] as const;

    moduleKeys.forEach((key) => {
      const result = getModuleGradient(key);
      expect(result.colors.length).toBe(2);
    });
  });
});
