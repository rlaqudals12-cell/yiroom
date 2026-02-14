import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import StretchingRecommendation from '@/components/analysis/posture/StretchingRecommendation';
import type { StretchingRecommendation as StretchingRecommendationType } from '@/lib/mock/posture-analysis';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Dumbbell: (props: Record<string, unknown>) => <div data-testid="icon-Dumbbell" {...props} />,
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Calendar: (props: Record<string, unknown>) => <div data-testid="icon-Calendar" {...props} />,
}));

// 테스트용 스트레칭 데이터 생성 헬퍼
function createStretch(overrides = {}): StretchingRecommendationType {
  return {
    name: '턱 당기기 운동',
    targetArea: '목 앞쪽',
    duration: '10회 x 3세트',
    frequency: '하루 3회',
    description: '턱을 목 쪽으로 당겨 목 정렬을 바로잡아요',
    difficulty: 'easy' as const,
    ...overrides,
  };
}

describe('StretchingRecommendation', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 렌더링된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByTestId('stretching-recommendation')).toBeInTheDocument();
    });

    it('섹션 제목이 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('추천 스트레칭')).toBeInTheDocument();
    });

    it('운동 개수가 표시된다', () => {
      const recommendations = [
        createStretch({ name: '운동 1' }),
        createStretch({ name: '운동 2' }),
        createStretch({ name: '운동 3' }),
      ];
      render(<StretchingRecommendation recommendations={recommendations} />);
      expect(screen.getByText('3개 운동')).toBeInTheDocument();
    });

    it('안내 문구가 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText(/꾸준한 스트레칭이 자세 교정의 핵심이에요/)).toBeInTheDocument();
    });

    it('className이 적용된다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch()]} className="custom-class" />
      );
      const section = screen.getByTestId('stretching-recommendation');
      expect(section).toHaveClass('custom-class');
    });
  });

  describe('빈 상태', () => {
    it('빈 배열이면 아무것도 렌더링하지 않는다', () => {
      const { container } = render(<StretchingRecommendation recommendations={[]} />);
      expect(container.innerHTML).toBe('');
    });

    it('undefined recommendations이면 아무것도 렌더링하지 않는다', () => {
      const { container } = render(
        <StretchingRecommendation
          recommendations={undefined as unknown as StretchingRecommendationType[]}
        />
      );
      expect(container.innerHTML).toBe('');
    });
  });

  describe('스트레칭 카드', () => {
    it('각 스트레칭 카드에 data-testid가 부여된다', () => {
      const recommendations = [
        createStretch({ name: '운동 1' }),
        createStretch({ name: '운동 2' }),
      ];
      render(<StretchingRecommendation recommendations={recommendations} />);
      expect(screen.getByTestId('stretching-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('stretching-card-1')).toBeInTheDocument();
    });

    it('스트레칭 이름이 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('턱 당기기 운동')).toBeInTheDocument();
    });

    it('타겟 부위가 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('목 앞쪽')).toBeInTheDocument();
    });

    it('설명이 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('턱을 목 쪽으로 당겨 목 정렬을 바로잡아요')).toBeInTheDocument();
    });

    it('소요시간이 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('10회 x 3세트')).toBeInTheDocument();
    });

    it('빈도가 표시된다', () => {
      render(<StretchingRecommendation recommendations={[createStretch()]} />);
      expect(screen.getByText('하루 3회')).toBeInTheDocument();
    });
  });

  describe('난이도 표시', () => {
    it('easy 난이도는 쉬움으로 표시된다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'easy' })]} />
      );
      expect(screen.getByText('쉬움')).toBeInTheDocument();
    });

    it('medium 난이도는 보통으로 표시된다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'medium' })]} />
      );
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('hard 난이도는 어려움으로 표시된다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'hard' })]} />
      );
      expect(screen.getByText('어려움')).toBeInTheDocument();
    });

    it('easy 난이도는 녹색 스타일을 가진다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'easy' })]} />
      );
      const badge = screen.getByText('쉬움');
      expect(badge).toHaveClass('bg-green-100');
      expect(badge).toHaveClass('text-green-700');
    });

    it('medium 난이도는 황색 스타일을 가진다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'medium' })]} />
      );
      const badge = screen.getByText('보통');
      expect(badge).toHaveClass('bg-amber-100');
      expect(badge).toHaveClass('text-amber-700');
    });

    it('hard 난이도는 적색 스타일을 가진다', () => {
      render(
        <StretchingRecommendation recommendations={[createStretch({ difficulty: 'hard' })]} />
      );
      const badge = screen.getByText('어려움');
      expect(badge).toHaveClass('bg-red-100');
      expect(badge).toHaveClass('text-red-700');
    });
  });

  describe('여러 스트레칭 렌더링', () => {
    it('모든 스트레칭이 순서대로 렌더링된다', () => {
      const recommendations = [
        createStretch({ name: '턱 당기기', difficulty: 'easy' as const }),
        createStretch({ name: '목 스트레칭', difficulty: 'easy' as const }),
        createStretch({ name: '흉추 운동', difficulty: 'medium' as const }),
      ];
      render(<StretchingRecommendation recommendations={recommendations} />);

      expect(screen.getByText('턱 당기기')).toBeInTheDocument();
      expect(screen.getByText('목 스트레칭')).toBeInTheDocument();
      expect(screen.getByText('흉추 운동')).toBeInTheDocument();

      // 카드 인덱스 확인
      expect(screen.getByTestId('stretching-card-0')).toBeInTheDocument();
      expect(screen.getByTestId('stretching-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('stretching-card-2')).toBeInTheDocument();
    });

    it('각 카드 안에 올바른 난이도가 표시된다', () => {
      const recommendations = [
        createStretch({ name: '쉬운 운동', difficulty: 'easy' as const }),
        createStretch({ name: '보통 운동', difficulty: 'medium' as const }),
        createStretch({ name: '어려운 운동', difficulty: 'hard' as const }),
      ];
      render(<StretchingRecommendation recommendations={recommendations} />);

      const card0 = screen.getByTestId('stretching-card-0');
      const card1 = screen.getByTestId('stretching-card-1');
      const card2 = screen.getByTestId('stretching-card-2');

      expect(within(card0).getByText('쉬움')).toBeInTheDocument();
      expect(within(card1).getByText('보통')).toBeInTheDocument();
      expect(within(card2).getByText('어려움')).toBeInTheDocument();
    });
  });
});
