/**
 * BadgeToast 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeToast } from '@/components/gamification/BadgeToast';
import type { Badge } from '@/types/gamification';

// Mock 배지 데이터
const mockBadge: Badge = {
  id: 'badge-1',
  code: 'workout_streak_7day',
  name: '7일 연속 운동',
  description: '7일 연속으로 운동을 완료했습니다.',
  icon: '🔥',
  category: 'streak',
  rarity: 'common',
  requirement: {
    type: 'streak',
    domain: 'workout',
    days: 7,
  },
  xpReward: 25,
  sortOrder: 1,
  createdAt: new Date(),
};

describe('BadgeToast', () => {
  it('배지 정보를 올바르게 렌더링한다', () => {
    render(<BadgeToast badge={mockBadge} />);

    // 배지 이름 확인
    expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();

    // 배지 설명 확인
    expect(screen.getByText('7일 연속으로 운동을 완료했습니다.')).toBeInTheDocument();

    // 배지 아이콘 확인
    expect(screen.getByText('🔥')).toBeInTheDocument();

    // "배지 획득!" 라벨 확인
    expect(screen.getByText('배지 획득!')).toBeInTheDocument();
  });

  it('data-testid가 올바르게 설정된다', () => {
    render(<BadgeToast badge={mockBadge} />);

    expect(screen.getByTestId('badge-toast')).toBeInTheDocument();
  });

  it('rare 등급 배지를 렌더링한다', () => {
    const rareBadge: Badge = {
      ...mockBadge,
      rarity: 'rare',
      name: '14일 연속 운동',
    };

    render(<BadgeToast badge={rareBadge} />);

    expect(screen.getByText('14일 연속 운동')).toBeInTheDocument();
  });

  it('epic 등급 배지를 렌더링한다', () => {
    const epicBadge: Badge = {
      ...mockBadge,
      rarity: 'epic',
      name: '30일 연속 운동',
    };

    render(<BadgeToast badge={epicBadge} />);

    expect(screen.getByText('30일 연속 운동')).toBeInTheDocument();
  });

  it('legendary 등급 배지를 렌더링한다', () => {
    const legendaryBadge: Badge = {
      ...mockBadge,
      rarity: 'legendary',
      name: '100일 연속 운동',
    };

    render(<BadgeToast badge={legendaryBadge} />);

    expect(screen.getByText('100일 연속 운동')).toBeInTheDocument();
  });

  it('description이 null인 경우에도 렌더링된다', () => {
    const badgeWithoutDesc: Badge = {
      ...mockBadge,
      description: null,
    };

    render(<BadgeToast badge={badgeWithoutDesc} />);

    expect(screen.getByText('7일 연속 운동')).toBeInTheDocument();
  });
});
