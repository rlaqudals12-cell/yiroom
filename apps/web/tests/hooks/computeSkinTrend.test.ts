/**
 * computeSkinTrend 테스트 (ADR-109 Phase 3 — 피부=오늘의 컨디션 추이)
 */

import { describe, it, expect } from 'vitest';
import { computeSkinTrend } from '@/hooks/useAnalysisStatus';

describe('computeSkinTrend', () => {
  it('점수 상승 → up + 양수 delta', () => {
    expect(computeSkinTrend(68, 65)).toEqual({ delta: 3, trend: 'up' });
  });
  it('점수 하락 → down + 음수 delta', () => {
    expect(computeSkinTrend(60, 65)).toEqual({ delta: -5, trend: 'down' });
  });
  it('동일 점수 → flat + 0', () => {
    expect(computeSkinTrend(65, 65)).toEqual({ delta: 0, trend: 'flat' });
  });
  it('소수 점수는 반올림', () => {
    expect(computeSkinTrend(65.4, 63)).toEqual({ delta: 2, trend: 'up' });
  });
});
