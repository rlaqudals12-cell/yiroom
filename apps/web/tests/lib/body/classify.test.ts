/**
 * 체형 분류 함수 테스트
 *
 * @description P2 검증: docs/principles/body-mechanics.md 섹션 5.2, 5.3 기준
 */

import { describe, it, expect } from 'vitest';
import {
  classifyBodyType,
  classifyBodyTypeFromRatios,
  calculateAllRatios,
} from '@/lib/body';
import type { ClassifyInput, BodyRatios } from '@/lib/body';

describe('classifyBodyType - Female', () => {
  it('should classify as hourglass', () => {
    // 모래시계형: bust ≈ hip, waist 잘록함
    const input: ClassifyInput = {
      bust: 90,
      waist: 65, // bust-waist = 25cm (9" = 22.86cm 초과)
      hip: 91,   // bust-hip = -1cm (1" = 2.54cm 이내)
      shoulder: 38,
      height: 165,
      gender: 'female',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('hourglass');
    expect(result.koreanName).toBe('모래시계형');
    expect(result.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('should classify as pear', () => {
    // 배형: (hips-bust) >= 3.6" AND (hips-waist) < 9"
    // 3.6" = 9.14cm, 9" = 22.86cm
    const input: ClassifyInput = {
      bust: 82,
      waist: 75, // hips-waist = 20cm < 22.86cm 만족
      hip: 95,   // hips-bust = 13cm > 9.14cm 만족
      shoulder: 35,
      height: 160,
      gender: 'female',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('pear');
    expect(result.koreanName).toBe('배형');
  });

  it('should classify as inverted triangle', () => {
    // 역삼각형: (bust-hips) >= 3.6" AND (bust-waist) < 9"
    // bust-hip >= 9.14cm, bust-waist < 22.86cm
    const input: ClassifyInput = {
      bust: 96,
      waist: 78, // bust-waist = 18cm < 22.86cm 만족
      hip: 85,   // bust-hip = 11cm > 9.14cm 만족
      shoulder: 42,
      height: 168,
      gender: 'female',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('invertedTriangle');
    expect(result.koreanName).toBe('역삼각형');
  });

  it('should classify as apple', () => {
    // 사과형: waist >= bust OR waist >= hip
    const input: ClassifyInput = {
      bust: 88,
      waist: 90,
      hip: 92,
      shoulder: 38,
      height: 162,
      gender: 'female',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('apple');
    expect(result.koreanName).toBe('사과형');
  });

  it('should classify as rectangle', () => {
    // 직사각형: 전체적으로 비슷함 (다른 조건 미충족)
    const input: ClassifyInput = {
      bust: 85,
      waist: 75,
      hip: 87,
      shoulder: 37,
      height: 163,
      gender: 'female',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('rectangle');
    expect(result.koreanName).toBe('직사각형');
  });

  it('should throw error without bust for female', () => {
    const input: ClassifyInput = {
      bust: 0,
      waist: 70,
      hip: 90,
      shoulder: 36,
      height: 160,
      gender: 'female',
    };

    expect(() => classifyBodyType(input)).toThrow('가슴 둘레');
  });
});

describe('classifyBodyType - Male', () => {
  it('should classify as inverted triangle', () => {
    // 역삼각형: SHR > 1.2 AND shoulder/waist > 1.15
    const input: ClassifyInput = {
      bust: 100,
      waist: 78,
      hip: 90,
      shoulder: 110, // SHR = 110/90 = 1.22, shoulder/waist = 1.41
      height: 175,
      gender: 'male',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('invertedTriangle');
    expect(result.koreanName).toBe('역삼각형');
  });

  it('should classify as trapezoid', () => {
    // 사다리꼴: SHR > 1.05 AND shoulder/waist > 1.2
    const input: ClassifyInput = {
      bust: 98,
      waist: 75,
      hip: 93,
      shoulder: 100, // SHR = 100/93 = 1.08, shoulder/waist = 1.33
      height: 178,
      gender: 'male',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('trapezoid');
    expect(result.koreanName).toBe('사다리꼴');
  });

  it('should classify as oval', () => {
    // 타원형: waist >= shoulder AND waist >= hip
    const input: ClassifyInput = {
      bust: 100,
      waist: 100,
      hip: 95,
      shoulder: 95,
      height: 172,
      gender: 'male',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('oval');
    expect(result.koreanName).toBe('타원형');
  });

  it('should classify as pear (triangle)', () => {
    // 삼각형/배형: hip > shoulder
    const input: ClassifyInput = {
      bust: 92,
      waist: 78,
      hip: 98,
      shoulder: 90,
      height: 170,
      gender: 'male',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('pear');
    expect(result.koreanName).toBe('배형');
  });

  it('should classify as rectangle', () => {
    // 직사각형: 전체적으로 비슷함
    const input: ClassifyInput = {
      bust: 95,
      waist: 85,
      hip: 94,
      shoulder: 95,
      height: 175,
      gender: 'male',
    };

    const result = classifyBodyType(input);
    expect(result.type).toBe('rectangle');
    expect(result.koreanName).toBe('직사각형');
  });
});

describe('calculateAllRatios', () => {
  it('should calculate all ratios correctly', () => {
    const ratios = calculateAllRatios(78.4, 94.3, 40.1, 174.4);

    expect(ratios.whr).toBe(0.83);
    expect(ratios.shr).toBe(0.43); // 40.1 / 94.3
    expect(ratios.whtr).toBe(0.45);
  });
});

describe('classifyBodyTypeFromRatios', () => {
  it('should classify based on SHR > 1.1', () => {
    const ratios: BodyRatios = { whr: 0.80, shr: 1.2, whtr: 0.45 };
    const result = classifyBodyTypeFromRatios(ratios, 'male');

    expect(result.type).toBe('invertedTriangle');
  });

  it('should classify based on SHR < 0.9', () => {
    const ratios: BodyRatios = { whr: 0.75, shr: 0.85, whtr: 0.42 };
    const result = classifyBodyTypeFromRatios(ratios, 'female');

    expect(result.type).toBe('pear');
  });

  it('should classify female hourglass with low WHR', () => {
    const ratios: BodyRatios = { whr: 0.72, shr: 0.98, whtr: 0.42 };
    const result = classifyBodyTypeFromRatios(ratios, 'female');

    expect(result.type).toBe('hourglass');
  });

  it('should classify female apple with high WHR', () => {
    const ratios: BodyRatios = { whr: 0.88, shr: 0.95, whtr: 0.52 };
    const result = classifyBodyTypeFromRatios(ratios, 'female');

    expect(result.type).toBe('apple');
  });

  it('should classify male oval with high WHR', () => {
    const ratios: BodyRatios = { whr: 0.95, shr: 1.0, whtr: 0.55 };
    const result = classifyBodyTypeFromRatios(ratios, 'male');

    expect(result.type).toBe('oval');
  });
});
