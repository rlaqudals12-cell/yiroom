import { describe, it, expect, vi } from 'vitest';

// Mock 컴포넌트 의존성 (순수 함수만 테스트)
vi.mock('@/app/(main)/home/_components/HomeStateNew', () => ({ default: () => null }));
vi.mock('@/app/(main)/home/_components/HomeStateGrowing', () => ({ default: () => null }));
vi.mock('@/app/(main)/home/_components/HomeStateActive', () => ({ default: () => null }));
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => ({ isLoading: false, analysisCount: 0, analyses: [] }),
}));

import { getHomeState } from '@/app/(main)/home/_components/HomeStateRouter';

describe('getHomeState', () => {
  it('분석 0개 → new', () => {
    expect(getHomeState(0)).toBe('new');
  });

  it('분석 1개 → growing', () => {
    expect(getHomeState(1)).toBe('growing');
  });

  it('분석 2개 → growing', () => {
    expect(getHomeState(2)).toBe('growing');
  });

  it('분석 3개 → growing', () => {
    expect(getHomeState(3)).toBe('growing');
  });

  it('분석 4개 → active', () => {
    expect(getHomeState(4)).toBe('active');
  });

  it('분석 6개 → active', () => {
    expect(getHomeState(6)).toBe('active');
  });
});
