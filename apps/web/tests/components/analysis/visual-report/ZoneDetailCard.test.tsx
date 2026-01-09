import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react 아이콘 mock
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  const createMockIcon = (name: string) => {
    const MockIcon = ({ className }: { className?: string }) => (
      <svg data-testid={`icon-${name}`} className={className} />
    );
    MockIcon.displayName = name;
    return MockIcon;
  };

  return {
    ...actual,
    X: createMockIcon('X'),
    AlertCircle: createMockIcon('AlertCircle'),
    Lightbulb: createMockIcon('Lightbulb'),
  };
});

import { ZoneDetailCard } from '@/components/analysis/visual-report/ZoneDetailCard';

describe('ZoneDetailCard', () => {
  const defaultProps = {
    zoneId: 'tZone',
    zoneName: 'T존',
    score: 62,
    status: 'normal' as const,
    concerns: ['모공이 눈에 띄어요', '유분이 많은 편이에요'],
    recommendations: ['주 2회 클레이 마스크', 'BHA 성분 토너 사용'],
  };

  describe('정상 케이스', () => {
    it('컴포넌트가 올바르게 렌더링된다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByTestId('zone-detail-card')).toBeInTheDocument();
    });

    it('존 이름을 제목으로 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByText('T존 상태')).toBeInTheDocument();
    });

    it('점수를 올바르게 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByText('62')).toBeInTheDocument();
      expect(screen.getByText('/ 100')).toBeInTheDocument();
    });

    it('상태 배지를 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByText(/보통/)).toBeInTheDocument();
    });

    it('data-zone-id 속성을 가진다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      const card = screen.getByTestId('zone-detail-card');
      expect(card).toHaveAttribute('data-zone-id', 'tZone');
    });
  });

  describe('문제 목록', () => {
    it('발견된 문제를 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByText('발견된 문제')).toBeInTheDocument();
      expect(screen.getByTestId('icon-AlertCircle')).toBeInTheDocument();
      expect(screen.getByText('모공이 눈에 띄어요')).toBeInTheDocument();
      expect(screen.getByText('유분이 많은 편이에요')).toBeInTheDocument();
    });

    it('문제가 없을 때 문제 섹션을 표시하지 않는다', () => {
      render(<ZoneDetailCard {...defaultProps} concerns={[]} />);

      expect(screen.queryByText('발견된 문제')).not.toBeInTheDocument();
    });
  });

  describe('추천 관리', () => {
    it('추천 관리를 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.getByText('추천 관리')).toBeInTheDocument();
      expect(screen.getByTestId('icon-Lightbulb')).toBeInTheDocument();
      expect(screen.getByText('주 2회 클레이 마스크')).toBeInTheDocument();
      expect(screen.getByText('BHA 성분 토너 사용')).toBeInTheDocument();
    });

    it('추천이 없을 때 추천 섹션을 표시하지 않는다', () => {
      render(<ZoneDetailCard {...defaultProps} recommendations={[]} />);

      expect(screen.queryByText('추천 관리')).not.toBeInTheDocument();
    });
  });

  describe('문제 및 추천 없음', () => {
    it('문제와 추천이 모두 없을 때 안내 메시지를 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} concerns={[]} recommendations={[]} />);

      expect(screen.getByText('현재 상태가 양호해요! 지금처럼 유지해주세요.')).toBeInTheDocument();
    });
  });

  describe('닫기 버튼', () => {
    it('onClose 콜백이 있을 때 닫기 버튼을 표시한다', () => {
      render(<ZoneDetailCard {...defaultProps} onClose={vi.fn()} />);

      expect(screen.getByRole('button', { name: '닫기' })).toBeInTheDocument();
      expect(screen.getByTestId('icon-X')).toBeInTheDocument();
    });

    it('닫기 버튼 클릭 시 onClose 콜백을 호출한다', () => {
      const onClose = vi.fn();
      render(<ZoneDetailCard {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByRole('button', { name: '닫기' });
      fireEvent.click(closeButton);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('onClose가 없을 때 닫기 버튼을 표시하지 않는다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      expect(screen.queryByRole('button', { name: '닫기' })).not.toBeInTheDocument();
    });
  });

  describe('상태별 스타일', () => {
    it('good 상태일 때 emerald 색상을 사용한다', () => {
      render(<ZoneDetailCard {...defaultProps} score={85} status="good" />);

      const badge = screen.getByText(/좋음/);
      expect(badge).toHaveClass('bg-emerald-100');
      expect(badge).toHaveClass('text-emerald-600');
    });

    it('normal 상태일 때 yellow 색상을 사용한다', () => {
      render(<ZoneDetailCard {...defaultProps} score={62} status="normal" />);

      const badge = screen.getByText(/보통/);
      expect(badge).toHaveClass('bg-yellow-100');
      expect(badge).toHaveClass('text-yellow-600');
    });

    it('warning 상태일 때 red 색상을 사용한다', () => {
      render(<ZoneDetailCard {...defaultProps} score={35} status="warning" />);

      const badge = screen.getByText(/주의 필요/);
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-600');
    });
  });

  describe('엣지 케이스', () => {
    it('점수가 100을 초과할 때 100으로 제한된다', () => {
      render(<ZoneDetailCard {...defaultProps} score={150} />);

      expect(screen.getByText('100')).toBeInTheDocument();
    });

    it('점수가 0 미만일 때 0으로 제한된다', () => {
      render(<ZoneDetailCard {...defaultProps} score={-10} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('커스텀 className을 적용한다', () => {
      render(<ZoneDetailCard {...defaultProps} className="custom-class" />);

      expect(screen.getByTestId('zone-detail-card')).toHaveClass('custom-class');
    });

    it('긴 문제 목록도 올바르게 렌더링된다', () => {
      const longConcerns = ['문제 1', '문제 2', '문제 3', '문제 4', '문제 5'];

      render(<ZoneDetailCard {...defaultProps} concerns={longConcerns} />);

      longConcerns.forEach((concern) => {
        expect(screen.getByText(concern)).toBeInTheDocument();
      });
    });

    it('긴 추천 목록도 올바르게 렌더링된다', () => {
      const longRecommendations = ['추천 1', '추천 2', '추천 3', '추천 4', '추천 5'];

      render(<ZoneDetailCard {...defaultProps} recommendations={longRecommendations} />);

      longRecommendations.forEach((rec) => {
        expect(screen.getByText(rec)).toBeInTheDocument();
      });
    });
  });

  describe('애니메이션', () => {
    it('슬라이드인 애니메이션 클래스가 적용된다', () => {
      render(<ZoneDetailCard {...defaultProps} />);

      const card = screen.getByTestId('zone-detail-card');
      expect(card).toHaveClass('animate-in');
      expect(card).toHaveClass('slide-in-from-bottom-2');
    });
  });
});
