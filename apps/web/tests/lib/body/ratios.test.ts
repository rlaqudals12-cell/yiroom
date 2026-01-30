/**
 * 체형 비율 계산 함수 테스트
 *
 * @description P2 검증: docs/principles/body-mechanics.md 공식과 일치 확인
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWHR,
  calculateSHR,
  calculateWHtR,
  classifyWHR,
  classifyWHtR,
  classifySHR,
} from '@/lib/body';

describe('calculateWHR', () => {
  it('should calculate WHR correctly', () => {
    // 원리 문서 예시: 한국 남성 20대 평균
    // WHR = 78.4 / 94.3 = 0.83
    const whr = calculateWHR(78.4, 94.3);
    expect(whr).toBe(0.83);
  });

  it('should calculate WHR for female average', () => {
    // 한국 여성 20대 평균
    // WHR = 68.0 / 91.0 = 0.75
    const whr = calculateWHR(68.0, 91.0);
    expect(whr).toBe(0.75);
  });

  it('should throw error for invalid input', () => {
    expect(() => calculateWHR(0, 94)).toThrow();
    expect(() => calculateWHR(78, 0)).toThrow();
    expect(() => calculateWHR(-1, 94)).toThrow();
  });
});

describe('calculateSHR', () => {
  it('should calculate SHR correctly', () => {
    // 어깨 40cm, 엉덩이 37cm
    // SHR = 40 / 37 = 1.08
    const shr = calculateSHR(40, 37);
    expect(shr).toBe(1.08);
  });

  it('should return balanced ratio', () => {
    // 어깨와 엉덩이가 비슷한 경우
    const shr = calculateSHR(38, 38);
    expect(shr).toBe(1.0);
  });

  it('should throw error for invalid input', () => {
    expect(() => calculateSHR(0, 37)).toThrow();
    expect(() => calculateSHR(40, 0)).toThrow();
  });
});

describe('calculateWHtR', () => {
  it('should calculate WHtR correctly', () => {
    // 원리 문서 예시
    // WHtR = 78.4 / 174.4 = 0.45
    const whtr = calculateWHtR(78.4, 174.4);
    expect(whtr).toBe(0.45);
  });

  it('should calculate normal range WHtR', () => {
    // 정상 범위: 0.4 ~ 0.49
    const whtr = calculateWHtR(68.0, 161.1);
    expect(whtr).toBe(0.42);
    expect(whtr).toBeGreaterThanOrEqual(0.4);
    expect(whtr).toBeLessThan(0.5);
  });

  it('should throw error for invalid input', () => {
    expect(() => calculateWHtR(0, 170)).toThrow();
    expect(() => calculateWHtR(78, 0)).toThrow();
  });
});

describe('classifyWHR', () => {
  it('should classify male WHR as normal', () => {
    // 남성 기준: < 0.90 정상
    const result = classifyWHR(0.83, 'male');
    expect(result.status).toBe('normal');
    expect(result.threshold).toBe(0.90);
  });

  it('should classify male WHR as risk', () => {
    const result = classifyWHR(0.92, 'male');
    expect(result.status).toBe('risk');
  });

  it('should classify female WHR as normal', () => {
    // 여성 기준: < 0.85 정상
    const result = classifyWHR(0.75, 'female');
    expect(result.status).toBe('normal');
    expect(result.threshold).toBe(0.85);
  });

  it('should classify female WHR as risk', () => {
    const result = classifyWHR(0.88, 'female');
    expect(result.status).toBe('risk');
  });
});

describe('classifyWHtR', () => {
  it('should classify as underweight', () => {
    const result = classifyWHtR(0.35);
    expect(result.status).toBe('underweight');
  });

  it('should classify as normal', () => {
    const result = classifyWHtR(0.45);
    expect(result.status).toBe('normal');
  });

  it('should classify as caution', () => {
    const result = classifyWHtR(0.55);
    expect(result.status).toBe('caution');
  });

  it('should classify as risk', () => {
    const result = classifyWHtR(0.65);
    expect(result.status).toBe('risk');
  });

  it('should handle boundary values', () => {
    expect(classifyWHtR(0.4).status).toBe('normal');
    expect(classifyWHtR(0.5).status).toBe('caution');
    expect(classifyWHtR(0.6).status).toBe('risk');
  });
});

describe('classifySHR', () => {
  it('should classify as inverted triangle', () => {
    // SHR > 1.1
    const result = classifySHR(1.2);
    expect(result.shape).toBe('invertedTriangle');
  });

  it('should classify as balanced', () => {
    // SHR 0.9 ~ 1.1
    const result = classifySHR(1.0);
    expect(result.shape).toBe('balanced');
  });

  it('should classify as pear', () => {
    // SHR < 0.9
    const result = classifySHR(0.85);
    expect(result.shape).toBe('pear');
  });

  it('should handle boundary values', () => {
    expect(classifySHR(1.1).shape).toBe('balanced');
    expect(classifySHR(0.9).shape).toBe('balanced');
    expect(classifySHR(1.11).shape).toBe('invertedTriangle');
    expect(classifySHR(0.89).shape).toBe('pear');
  });
});
