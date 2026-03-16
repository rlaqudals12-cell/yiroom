/**
 * CrossDomainChallengeCard 컴포넌트 테스트
 *
 * @description 크로스도메인 챌린지 카드 UI 테스트
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CrossDomainChallengeCard } from '@/components/gamification/CrossDomainChallengeCard';
import type { CrossDomainProgressView } from '@/lib/gamification/cross-domain-challenges';

const mockView: CrossDomainProgressView = {
  challengeId: 'cross-triple-start',
  name: '트리플 스타트',
  description: '뷰티 분석, 운동, 식단 기록을 각 1회 완료하세요.',
  domainProgress: [
    { domain: 'beauty', current: 1, target: 1, completed: true },
    { domain: 'workout', current: 0, target: 1, completed: false },
    { domain: 'nutrition', current: 0, target: 1, completed: false },
  ],
  overallPercent: 33,
  allCompleted: false,
  xpReward: 150,
};

const completedView: CrossDomainProgressView = {
  ...mockView,
  domainProgress: [
    { domain: 'beauty', current: 1, target: 1, completed: true },
    { domain: 'workout', current: 1, target: 1, completed: true },
    { domain: 'nutrition', current: 1, target: 1, completed: true },
  ],
  overallPercent: 100,
  allCompleted: true,
};

describe('CrossDomainChallengeCard', () => {
  describe('렌더링', () => {
    it('카드가 정상적으로 렌더링된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByTestId('cross-domain-challenge-card')).toBeInTheDocument();
    });

    it('챌린지 이름이 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText('트리플 스타트')).toBeInTheDocument();
    });

    it('챌린지 설명이 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText(/뷰티 분석, 운동, 식단 기록/)).toBeInTheDocument();
    });

    it('전체 진행률이 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('XP 보상이 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText('150 XP')).toBeInTheDocument();
    });
  });

  describe('도메인 진행 바', () => {
    it('모든 도메인 진행 바가 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getAllByTestId('domain-progress-bar')).toHaveLength(3);
    });

    it('도메인 라벨이 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText('뷰티')).toBeInTheDocument();
      expect(screen.getByText('운동')).toBeInTheDocument();
      expect(screen.getByText('식단')).toBeInTheDocument();
    });

    it('진행 수치가 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} />);
      expect(screen.getByText('1/1')).toBeInTheDocument();
      expect(screen.getAllByText('0/1')).toHaveLength(2);
    });
  });

  describe('도전하기 버튼', () => {
    it('onJoin이 있고 미참여 상태이면 도전하기 버튼이 표시된다', () => {
      const onJoin = vi.fn();
      render(<CrossDomainChallengeCard view={mockView} onJoin={onJoin} />);
      expect(screen.getByText('도전하기')).toBeInTheDocument();
    });

    it('도전하기 클릭 시 onJoin이 호출된다', () => {
      const onJoin = vi.fn();
      render(<CrossDomainChallengeCard view={mockView} onJoin={onJoin} />);
      fireEvent.click(screen.getByText('도전하기'));
      expect(onJoin).toHaveBeenCalledWith('cross-triple-start');
    });

    it('이미 참여 중이면 도전하기 버튼 대신 안내 메시지가 표시된다', () => {
      render(<CrossDomainChallengeCard view={mockView} onJoin={vi.fn()} isJoined />);
      expect(screen.queryByText('도전하기')).not.toBeInTheDocument();
      expect(screen.getByText(/진행 중이에요/)).toBeInTheDocument();
    });
  });

  describe('완료 상태', () => {
    it('모든 도메인 완료 시 완료 메시지가 표시된다', () => {
      render(<CrossDomainChallengeCard view={completedView} />);
      expect(screen.getByText(/챌린지 완료!/)).toBeInTheDocument();
    });

    it('완료 시 도전하기 버튼이 숨겨진다', () => {
      render(<CrossDomainChallengeCard view={completedView} onJoin={vi.fn()} />);
      expect(screen.queryByText('도전하기')).not.toBeInTheDocument();
    });
  });

  describe('스타일링', () => {
    it('className prop이 적용된다', () => {
      render(<CrossDomainChallengeCard view={mockView} className="custom-class" />);
      expect(screen.getByTestId('cross-domain-challenge-card')).toHaveClass('custom-class');
    });
  });
});
