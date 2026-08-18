import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

const analysisStatus = vi.hoisted(() => ({
  isLoading: false,
  hasError: false,
  analysisCount: 0,
  analyses: [],
  refetch: vi.fn(),
}));

// Mock 컴포넌트 의존성 (순수 함수만 테스트)
vi.mock('@/app/(main)/home/_components/HomeStateNew', () => ({ default: () => null }));
vi.mock('@/app/(main)/home/_components/HomeStateGrowing', () => ({ default: () => null }));
vi.mock('@/app/(main)/home/_components/HomeStateActive', () => ({ default: () => null }));
vi.mock('@/hooks/useAnalysisStatus', () => ({
  useAnalysisStatus: () => analysisStatus,
}));

import HomeStateRouter, { getHomeState } from '@/app/(main)/home/_components/HomeStateRouter';

beforeEach(() => {
  analysisStatus.isLoading = false;
  analysisStatus.hasError = false;
  analysisStatus.analysisCount = 0;
  analysisStatus.analyses = [];
});

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

describe('HomeStateRouter 로딩', () => {
  it('클라이언트 상태 조회 중에도 라우트와 같은 진단지형 스켈레톤을 렌더한다', () => {
    analysisStatus.isLoading = true;

    render(<HomeStateRouter />);

    expect(screen.getByTestId('home-briefing-skeleton')).toBeInTheDocument();
    expect(screen.getByTestId('home-briefing-skeleton-hero')).toBeInTheDocument();
    expect(screen.queryByTestId('home-state-skeleton')).not.toBeInTheDocument();
  });
});
