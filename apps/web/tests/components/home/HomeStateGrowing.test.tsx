/**
 * HomeStateGrowing 테스트 (ADR-114)
 * 발견 칩 나열 → 브리핑 홈. Growing 상태도 DailyBriefing을 렌더한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'user_123' } }),
}));
vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({}),
}));
// expose는 부작용일 뿐 — 렌더 검증에 무관하게 no-op
vi.mock('@/lib/connection-awareness', () => ({
  exposeConnection: vi.fn().mockResolvedValue({ status: 'exposed' }),
}));
vi.mock('@/app/(main)/home/_components/DailyBriefing', () => ({
  default: ({ analyses }: { analyses: unknown[] }) => (
    <div data-testid="daily-briefing" data-count={analyses.length} />
  ),
}));

import HomeStateGrowing from '@/app/(main)/home/_components/HomeStateGrowing';
import type { AnalysisSummary } from '@/hooks/useAnalysisStatus';

const analyses = [
  { id: '1', type: 'skin', createdAt: new Date(), summary: '80점' },
] as AnalysisSummary[];

describe('HomeStateGrowing', () => {
  it('data-testid="home-state-growing"가 존재한다', () => {
    render(<HomeStateGrowing analysisCount={1} analyses={analyses} />);
    expect(screen.getByTestId('home-state-growing')).toBeInTheDocument();
  });

  it('DailyBriefing을 렌더한다', () => {
    render(<HomeStateGrowing analysisCount={1} analyses={analyses} />);
    expect(screen.getByTestId('daily-briefing')).toBeInTheDocument();
  });
});
