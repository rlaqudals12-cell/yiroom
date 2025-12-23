import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelProgress, LevelCard, TierBadge } from '@/components/gamification/LevelProgress';
import type { LevelInfo } from '@/types/gamification';

const mockLevelInfo: LevelInfo = {
  level: 5,
  tier: 'beginner',
  tierName: '비기너',
  currentXp: 250,
  xpForNextLevel: 500,
  xpProgress: 50,
  totalXp: 1250,
};

const practitionerLevel: LevelInfo = {
  level: 15,
  tier: 'practitioner',
  tierName: '프랙티셔너',
  currentXp: 800,
  xpForNextLevel: 1500,
  xpProgress: 53,
  totalXp: 10300,
};

describe('LevelProgress', () => {
  it('레벨 숫자 표시', () => {
    render(<LevelProgress levelInfo={mockLevelInfo} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('티어명 표시', () => {
    render(<LevelProgress levelInfo={mockLevelInfo} />);

    expect(screen.getByText('비기너')).toBeInTheDocument();
  });

  it('XP 진행률 표시', () => {
    render(<LevelProgress levelInfo={mockLevelInfo} />);

    expect(screen.getByText('250 / 500 XP')).toBeInTheDocument();
  });

  it('프로그레스 바 너비가 진행률과 일치', () => {
    render(<LevelProgress levelInfo={mockLevelInfo} />);

    const progressBar = screen.getByTestId('level-progress').querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '50%' });
  });

  it('showDetails=false일 때 상세 숨김', () => {
    render(<LevelProgress levelInfo={mockLevelInfo} showDetails={false} />);

    expect(screen.queryByText('비기너')).not.toBeInTheDocument();
    expect(screen.queryByText('250 / 500 XP')).not.toBeInTheDocument();
  });

  describe('사이즈 변경', () => {
    it('size=sm일 때 작은 뱃지', () => {
      render(<LevelProgress levelInfo={mockLevelInfo} size="sm" />);

      const badge = screen.getByText('5');
      expect(badge.closest('div')).toHaveClass('w-8', 'h-8');
    });

    it('size=lg일 때 큰 뱃지', () => {
      render(<LevelProgress levelInfo={mockLevelInfo} size="lg" />);

      const badge = screen.getByText('5');
      expect(badge.closest('div')).toHaveClass('w-12', 'h-12');
    });
  });
});

describe('LevelCard', () => {
  it('레벨 카드 렌더링', () => {
    render(<LevelCard levelInfo={mockLevelInfo} />);

    const card = screen.getByTestId('level-card');
    expect(card).toBeInTheDocument();
  });

  it('레벨과 티어 표시', () => {
    render(<LevelCard levelInfo={mockLevelInfo} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('비기너')).toBeInTheDocument();
    expect(screen.getByText('현재 레벨')).toBeInTheDocument();
  });

  it('XP 정보 표시', () => {
    render(<LevelCard levelInfo={mockLevelInfo} />);

    expect(screen.getByText('250 / 500 XP')).toBeInTheDocument();
    expect(screen.getByText(/총.*1,250.*XP/)).toBeInTheDocument();
  });

  it('프랙티셔너 티어 스타일', () => {
    render(<LevelCard levelInfo={practitionerLevel} />);

    expect(screen.getByText('프랙티셔너')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('커스텀 className 적용', () => {
    render(<LevelCard levelInfo={mockLevelInfo} className="custom-class" />);

    const card = screen.getByTestId('level-card');
    expect(card).toHaveClass('custom-class');
  });
});

describe('TierBadge', () => {
  it('티어 뱃지 렌더링', () => {
    render(<TierBadge tier="beginner" level={5} />);

    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('title 속성에 레벨과 티어 정보', () => {
    render(<TierBadge tier="expert" level={35} />);

    const badge = screen.getByText('35').closest('div');
    expect(badge).toHaveAttribute('title', '레벨 35 - 엑스퍼트');
  });

  describe('사이즈 변경', () => {
    it('size=sm일 때 작은 뱃지', () => {
      render(<TierBadge tier="beginner" level={5} size="sm" />);

      const badge = screen.getByText('5').closest('div');
      expect(badge).toHaveClass('w-6', 'h-6');
    });

    it('size=lg일 때 큰 뱃지', () => {
      render(<TierBadge tier="master" level={55} size="lg" />);

      const badge = screen.getByText('55').closest('div');
      expect(badge).toHaveClass('w-10', 'h-10');
    });
  });
});
