/**
 * ITA (Individual Typology Angle) 테스트
 *
 * @see docs/principles/color-science.md
 */

import { describe, it, expect } from 'vitest';
import {
  calculateITA,
  classifySkinToneByITA,
  analyzeITA,
  ITA_THRESHOLDS,
} from '@/lib/analysis/skin';

describe('calculateITA', () => {
  it('should calculate ITA correctly for bright skin (L=70, b=15)', () => {
    // ITA = arctan[(70 - 50) / 15] * (180/PI) = arctan(1.333...) * 57.2958
    // = 53.13 degrees approximately
    const ita = calculateITA(70, 15);
    expect(ita).toBeCloseTo(53.13, 1);
  });

  it('should calculate ITA correctly for dark skin (L=35, b=20)', () => {
    // ITA = arctan[(35 - 50) / 20] * (180/PI) = arctan(-0.75) * 57.2958
    // = -36.87 degrees approximately
    const ita = calculateITA(35, 20);
    expect(ita).toBeCloseTo(-36.87, 1);
  });

  it('should return 0 when L=50 and b is any positive value', () => {
    // ITA = arctan[(50 - 50) / 10] = arctan(0) = 0
    const ita = calculateITA(50, 10);
    expect(ita).toBe(0);
  });

  it('should handle b=0 edge case with L > 50', () => {
    const ita = calculateITA(60, 0);
    expect(ita).toBe(90);
  });

  it('should handle b=0 edge case with L < 50', () => {
    const ita = calculateITA(40, 0);
    expect(ita).toBe(-90);
  });

  it('should handle b=0 and L=50 edge case', () => {
    const ita = calculateITA(50, 0);
    expect(ita).toBe(0);
  });

  it('should handle negative b values', () => {
    // b가 음수이면 arctan 결과도 뒤집힘
    const ita = calculateITA(70, -15);
    expect(ita).toBeCloseTo(-53.13, 1);
  });
});

describe('classifySkinToneByITA', () => {
  it('should classify > 55 as very-light', () => {
    expect(classifySkinToneByITA(60)).toBe('very-light');
    expect(classifySkinToneByITA(55.1)).toBe('very-light');
  });

  it('should classify 41-55 as light', () => {
    expect(classifySkinToneByITA(55)).toBe('light');
    expect(classifySkinToneByITA(45)).toBe('light');
    expect(classifySkinToneByITA(41.1)).toBe('light');
  });

  it('should classify 28-41 as intermediate', () => {
    expect(classifySkinToneByITA(41)).toBe('intermediate');
    expect(classifySkinToneByITA(35)).toBe('intermediate');
    expect(classifySkinToneByITA(28.1)).toBe('intermediate');
  });

  it('should classify 10-28 as tan', () => {
    expect(classifySkinToneByITA(28)).toBe('tan');
    expect(classifySkinToneByITA(20)).toBe('tan');
    expect(classifySkinToneByITA(10.1)).toBe('tan');
  });

  it('should classify -30-10 as brown', () => {
    expect(classifySkinToneByITA(10)).toBe('brown');
    expect(classifySkinToneByITA(0)).toBe('brown');
    expect(classifySkinToneByITA(-20)).toBe('brown');
    expect(classifySkinToneByITA(-29.9)).toBe('brown');
  });

  it('should classify <= -30 as dark', () => {
    expect(classifySkinToneByITA(-30)).toBe('dark');
    expect(classifySkinToneByITA(-40)).toBe('dark');
    expect(classifySkinToneByITA(-90)).toBe('dark');
  });
});

describe('analyzeITA', () => {
  it('should return complete analysis result', () => {
    const result = analyzeITA(70, 15);

    expect(result.ita).toBeCloseTo(53.13, 1);
    expect(result.skinToneLevel).toBe('light');
    expect(result.labL).toBe(70);
    expect(result.labB).toBe(15);
  });

  it('should correctly classify very light skin', () => {
    const result = analyzeITA(80, 10);
    expect(result.skinToneLevel).toBe('very-light');
  });

  it('should correctly classify dark skin', () => {
    const result = analyzeITA(30, 20);
    expect(result.skinToneLevel).toBe('dark');
  });
});

describe('ITA_THRESHOLDS', () => {
  it('should have correct threshold values', () => {
    expect(ITA_THRESHOLDS.VERY_LIGHT).toBe(55);
    expect(ITA_THRESHOLDS.LIGHT).toBe(41);
    expect(ITA_THRESHOLDS.INTERMEDIATE).toBe(28);
    expect(ITA_THRESHOLDS.TAN).toBe(10);
    expect(ITA_THRESHOLDS.BROWN).toBe(-30);
  });
});
