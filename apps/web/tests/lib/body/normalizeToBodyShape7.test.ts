import { describe, it, expect } from 'vitest';
import { normalizeToBodyShape7 } from '@/lib/body';

describe('normalizeToBodyShape7', () => {
  it('소문자 입력 정상 변환', () => {
    expect(normalizeToBodyShape7('hourglass')).toBe('hourglass');
    expect(normalizeToBodyShape7('pear')).toBe('pear');
    expect(normalizeToBodyShape7('rectangle')).toBe('rectangle');
    expect(normalizeToBodyShape7('apple')).toBe('apple');
    expect(normalizeToBodyShape7('oval')).toBe('oval');
    expect(normalizeToBodyShape7('trapezoid')).toBe('trapezoid');
  });

  it('대소문자 혼합 입력', () => {
    expect(normalizeToBodyShape7('Hourglass')).toBe('hourglass');
    expect(normalizeToBodyShape7('PEAR')).toBe('pear');
  });

  it('invertedTriangle 변형 처리', () => {
    expect(normalizeToBodyShape7('invertedTriangle')).toBe('invertedTriangle');
    expect(normalizeToBodyShape7('inverted_triangle')).toBe('invertedTriangle');
    expect(normalizeToBodyShape7('inverted-triangle')).toBe('invertedTriangle');
    expect(normalizeToBodyShape7('Inverted Triangle')).toBe('invertedTriangle');
  });

  it('유효하지 않은 입력은 null 반환', () => {
    expect(normalizeToBodyShape7('unknown')).toBeNull();
    expect(normalizeToBodyShape7('')).toBeNull();
    expect(normalizeToBodyShape7('abc')).toBeNull();
  });
});
