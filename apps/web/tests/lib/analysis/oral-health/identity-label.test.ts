/**
 * OH-1 구강건강 Identity Label 생성 테스트
 *
 * brightness + gumHealthStatus 조합 라벨 검증
 */
import { describe, it, expect } from 'vitest';

import { generateOralHealthIdentityLabel } from '@/lib/analysis/oral-health/identity-label';

describe('generateOralHealthIdentityLabel', () => {
  describe('건강한 잇몸 + 밝기별 라벨', () => {
    it('very_bright + healthy → "건강 환한 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('very_bright', 'healthy')).toBe('건강 환한 미소 타입');
    });

    it('bright + healthy → "건강 밝은 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('bright', 'healthy')).toBe('건강 밝은 미소 타입');
    });

    it('medium + healthy → "내추럴 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('medium', 'healthy')).toBe('내추럴 미소 타입');
    });

    it('dark + healthy → "미백 관심 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('dark', 'healthy')).toBe('미백 관심 미소 타입');
    });

    it('very_dark + healthy → "미백 집중 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('very_dark', 'healthy')).toBe('미백 집중 미소 타입');
    });
  });

  describe('잇몸 상태별 라벨 (비건강)', () => {
    it('mild_gingivitis → "잇몸 케어 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('bright', 'mild_gingivitis')).toBe(
        '잇몸 케어 미소 타입'
      );
    });

    it('moderate_gingivitis → "잇몸 집중 케어 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('medium', 'moderate_gingivitis')).toBe(
        '잇몸 집중 케어 미소 타입'
      );
    });

    it('severe_inflammation → "전문 케어 필요 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('dark', 'severe_inflammation')).toBe(
        '전문 케어 필요 미소 타입'
      );
    });

    it('잇몸 상태가 비건강이면 밝기에 관계없이 잇몸 기반 라벨', () => {
      // very_bright여도 잇몸 상태가 우선
      expect(generateOralHealthIdentityLabel('very_bright', 'moderate_gingivitis')).toBe(
        '잇몸 집중 케어 미소 타입'
      );
    });
  });

  describe('밝기 없이 잇몸 상태만 제공', () => {
    it('undefined 밝기 + mild_gingivitis → 잇몸 기반 라벨', () => {
      expect(generateOralHealthIdentityLabel(undefined, 'mild_gingivitis')).toBe(
        '잇몸 케어 미소 타입'
      );
    });

    it('undefined 밝기 + healthy → 기본값 "미소 타입"', () => {
      expect(generateOralHealthIdentityLabel(undefined, 'healthy')).toBe('미소 타입');
    });
  });

  describe('잇몸 상태 없이 밝기만 제공', () => {
    it('bright + undefined gumHealth → "밝은 미소 타입" (건강 접두어 없음)', () => {
      expect(generateOralHealthIdentityLabel('bright', undefined)).toBe('밝은 미소 타입');
    });

    it('very_bright + undefined gumHealth → "환한 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('very_bright', undefined)).toBe('환한 미소 타입');
    });

    it('medium + undefined gumHealth → "내추럴 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('medium', undefined)).toBe('내추럴 미소 타입');
    });

    it('dark + undefined gumHealth → "미백 관심 미소 타입"', () => {
      expect(generateOralHealthIdentityLabel('dark', undefined)).toBe('미백 관심 미소 타입');
    });
  });

  describe('데이터 부족 (기본값)', () => {
    it('모두 undefined → "미소 타입"', () => {
      expect(generateOralHealthIdentityLabel(undefined, undefined)).toBe('미소 타입');
    });

    it('인자 없이 호출 → "미소 타입"', () => {
      expect(generateOralHealthIdentityLabel()).toBe('미소 타입');
    });

    it('알 수 없는 밝기 문자열은 무시하고 기본값', () => {
      expect(generateOralHealthIdentityLabel('unknown_brightness', undefined)).toBe('미소 타입');
    });

    it('알 수 없는 밝기 + healthy → 기본값', () => {
      expect(generateOralHealthIdentityLabel('invalid', 'healthy')).toBe('미소 타입');
    });
  });
});
