/**
 * HomeActivityBar 테스트
 * 4-status 세그먼트 바 통합 검증 (KI-007)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock Supabase client
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockLte = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({
    from: () => ({
      select: mockSelect,
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
      single: mockSingle,
    }),
  }),
}));

// Mock ConnectionAwareness
vi.mock('@/lib/connection-awareness', () => ({
  getConnectionStats: vi.fn().mockResolvedValue({
    totalConnections: 10,
    internalizationRate: 0.6,
    byStatus: {
      exposed: 2,
      recognized: 2,
      internalized: 3,
      independent: 3,
    },
  }),
}));

import HomeActivityBar from '@/app/(main)/home/_components/HomeActivityBar';

describe('HomeActivityBar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('data-testid="home-activity-bar"가 존재한다', async () => {
    render(<HomeActivityBar userId="user_123" />);

    const bar = await screen.findByTestId('home-activity-bar');
    expect(bar).toBeInTheDocument();
  });

  it('4-status 세그먼트 바가 렌더링된다', async () => {
    render(<HomeActivityBar userId="user_123" />);

    const segmentBar = await screen.findByTestId('internalization-segment-bar');
    expect(segmentBar).toBeInTheDocument();
  });

  it('자기 이해 퍼센티지가 표시된다', async () => {
    render(<HomeActivityBar userId="user_123" />);

    const text = await screen.findByText(/자기 이해 60%/);
    expect(text).toBeInTheDocument();
  });

  it('4단계 범례가 모두 표시된다', async () => {
    render(<HomeActivityBar userId="user_123" />);

    await screen.findByTestId('internalization-segment-bar');

    expect(screen.getByText(/발견 2/)).toBeInTheDocument();
    expect(screen.getByText(/인식 2/)).toBeInTheDocument();
    expect(screen.getByText(/내재화 3/)).toBeInTheDocument();
    expect(screen.getByText(/자립 3/)).toBeInTheDocument();
  });

  it('내재화+자립 카운트가 표시된다', async () => {
    render(<HomeActivityBar userId="user_123" />);

    const count = await screen.findByText('6/10');
    expect(count).toBeInTheDocument();
  });
});
