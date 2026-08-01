/**
 * BeforeAfterSection 테스트 (배치 C1)
 * - 컨디션 축(피부·헤어)만 비교 — 체형(body)은 부위별 계측 점수 평균이라
 *   채점 표기 금지(ADR-120) 위반이므로 시도 자체를 하지 않는다
 * - 카드 제목이 "○○ 컨디션 변화"로 컨디션 예외임을 명시한다
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BeforeAfterSection } from '@/components/profile/BeforeAfterSection';
import { getFirstAndLatestAnalysis } from '@/lib/analysis/historyService';
import type { AnalysisHistoryItem } from '@/types/analysis-history';

vi.mock('@clerk/nextjs', () => ({
  useUser: vi.fn(() => ({ user: { id: 'user_1' }, isLoaded: true })),
}));

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: vi.fn(() => ({})),
}));

vi.mock('@/lib/analysis/historyService', () => ({
  getFirstAndLatestAnalysis: vi.fn(),
  calculatePeriod: vi.fn(() => '3개월'),
}));

function item(over: Partial<AnalysisHistoryItem> = {}): AnalysisHistoryItem {
  return {
    id: 'a1',
    date: '2026-01-01',
    overallScore: 70,
    type: 'skin',
    ...over,
  };
}

describe('BeforeAfterSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('피부 비교 데이터가 있으면 "피부 컨디션 변화" 제목으로 표시한다', async () => {
    vi.mocked(getFirstAndLatestAnalysis).mockResolvedValue({
      first: item({ overallScore: 60 }),
      latest: item({ id: 'a2', date: '2026-04-01', overallScore: 72 }),
    });

    render(<BeforeAfterSection />);

    expect(await screen.findByText('피부 컨디션 변화')).toBeInTheDocument();
    expect(screen.getByTestId('before-after-section')).toBeInTheDocument();
  });

  it('체형(body)은 컨디션 축이 아니므로 조회 자체를 시도하지 않는다 (ADR-120)', async () => {
    vi.mocked(getFirstAndLatestAnalysis).mockResolvedValue(null);

    render(<BeforeAfterSection />);

    await screen.findByTestId('before-after-section');
    const triedTypes = vi
      .mocked(getFirstAndLatestAnalysis)
      .mock.calls.map(([, options]) => options.type);
    expect(triedTypes.length).toBeGreaterThan(0);
    expect(triedTypes).not.toContain('body');
  });

  it('비교 데이터가 없으면 컨디션 변화 안내 문구를 표시한다', async () => {
    vi.mocked(getFirstAndLatestAnalysis).mockResolvedValue(null);

    render(<BeforeAfterSection />);

    expect(
      await screen.findByText('피부·헤어 분석을 2회 이상 하면 컨디션 변화를 비교할 수 있어요')
    ).toBeInTheDocument();
  });
});
