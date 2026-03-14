/**
 * 위기 감지 공유 모듈 테스트
 *
 * @module tests/lib/safety/crisis
 * @description detectCrisis, CRISIS_RESPONSE_MESSAGE 테스트
 */

import { describe, it, expect } from 'vitest';
import { detectCrisis, CRISIS_RESPONSE_MESSAGE } from '@/lib/safety';

describe('detectCrisis', () => {
  it('should detect suicide-related keywords', () => {
    expect(detectCrisis('자살하고 싶어')).toBe(true);
    expect(detectCrisis('죽고싶다')).toBe(true);
    expect(detectCrisis('자해했어')).toBe(true);
  });

  it('should detect keywords with spaces removed', () => {
    expect(detectCrisis('죽 고 싶 다')).toBe(true);
    expect(detectCrisis('살고 싶지 않아')).toBe(true);
    expect(detectCrisis('더 이상 못 살겠어')).toBe(true);
  });

  it('should detect partial keyword matches', () => {
    expect(detectCrisis('목숨 걸고 운동해요')).toBe(true);
    expect(detectCrisis('극단적인 다이어트')).toBe(true);
  });

  it('should NOT detect normal messages', () => {
    expect(detectCrisis('오늘 운동 뭐 하면 좋을까요?')).toBe(false);
    expect(detectCrisis('피부가 건조해요')).toBe(false);
    expect(detectCrisis('식단 추천해주세요')).toBe(false);
    expect(detectCrisis('스트레스를 받아요')).toBe(false);
  });

  it('should handle empty string', () => {
    expect(detectCrisis('')).toBe(false);
  });
});

describe('CRISIS_RESPONSE_MESSAGE', () => {
  it('should contain emergency hotline numbers', () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain('1393');
    expect(CRISIS_RESPONSE_MESSAGE).toContain('1577-0199');
    expect(CRISIS_RESPONSE_MESSAGE).toContain('1588-9191');
  });

  it('should contain empathetic opening', () => {
    expect(CRISIS_RESPONSE_MESSAGE).toContain('힘드시군요');
  });
});
