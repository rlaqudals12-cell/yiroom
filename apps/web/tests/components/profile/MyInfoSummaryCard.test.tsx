/**
 * MyInfoSummaryCard 테스트 (배치 C2·C3)
 * - 알러지 블록은 WELLNESS_PHASE2 게이팅 (현재 false → 미노출)
 * - 완성도 분모는 게이팅과 동기 (4→3), 그라데 진행바 대신 "N/3 채움" 도트 표기
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyInfoSummaryCard } from '@/components/profile/MyInfoSummaryCard';
import { useUserProfile } from '@/hooks/useUserProfile';

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

function mockProfile(over: Partial<ReturnType<typeof useUserProfile>['profile']> = {}): void {
  vi.mocked(useUserProfile).mockReturnValue({
    profile: {
      gender: 'female',
      heightCm: 165,
      weightKg: 55,
      allergies: [],
      ...over,
    },
    isLoading: false,
  } as unknown as ReturnType<typeof useUserProfile>);
}

describe('MyInfoSummaryCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('알러지가 있어도 WELLNESS_PHASE2=false에서는 알러지 칩을 표시하지 않는다', () => {
    mockProfile({ allergies: ['땅콩', '우유'] });
    render(<MyInfoSummaryCard />);

    expect(screen.getByTestId('my-info-summary-card')).toBeInTheDocument();
    expect(screen.queryByText('땅콩')).not.toBeInTheDocument();
    expect(screen.queryByText('우유')).not.toBeInTheDocument();
  });

  it('완성도 분모는 알러지를 제외한 3이다 — 전부 입력 시 "3/3 채움"', () => {
    mockProfile({ allergies: ['땅콩'] });
    render(<MyInfoSummaryCard />);

    expect(screen.getByText('3/3 채움')).toBeInTheDocument();
  });

  it('일부만 입력하면 채움 수가 반영된다 — 성별·키만 입력 시 "2/3 채움"', () => {
    mockProfile({ weightKg: null });
    render(<MyInfoSummaryCard />);

    expect(screen.getByText('2/3 채움')).toBeInTheDocument();
  });

  it('정보가 하나도 없으면 입력 유도 문구를 표시한다', () => {
    mockProfile({ gender: null, heightCm: null, weightKg: null, allergies: [] });
    render(<MyInfoSummaryCard />);

    expect(screen.getByText('아직 등록된 정보가 없어요')).toBeInTheDocument();
  });
});
