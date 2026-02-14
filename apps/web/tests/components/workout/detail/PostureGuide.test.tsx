import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Info: (props: Record<string, unknown>) => <div data-testid="icon-Info" {...props} />,
  Lightbulb: (props: Record<string, unknown>) => <div data-testid="icon-Lightbulb" {...props} />,
}));

import { vi } from 'vitest';
import PostureGuide from '@/components/workout/detail/PostureGuide';

describe('PostureGuide', () => {
  const defaultProps = {
    instructions: [
      '발을 어깨너비로 벌린다',
      '무릎이 발끝을 넘지 않게 앉는다',
      '허리를 곧게 유지한다',
    ],
  };

  describe('자세 가이드', () => {
    it('자세 가이드 타이틀이 표시된다', () => {
      render(<PostureGuide {...defaultProps} />);
      expect(screen.getByText('자세 가이드')).toBeInTheDocument();
    });

    it('모든 인스트럭션이 표시된다', () => {
      render(<PostureGuide {...defaultProps} />);
      expect(screen.getByText('발을 어깨너비로 벌린다')).toBeInTheDocument();
      expect(screen.getByText('무릎이 발끝을 넘지 않게 앉는다')).toBeInTheDocument();
      expect(screen.getByText('허리를 곧게 유지한다')).toBeInTheDocument();
    });

    it('순서 번호가 표시된다', () => {
      render(<PostureGuide {...defaultProps} />);
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('팁 섹션', () => {
    it('팁이 없으면 팁 섹션이 없다', () => {
      render(<PostureGuide {...defaultProps} />);
      expect(screen.queryByText('팁')).not.toBeInTheDocument();
    });

    it('팁이 있으면 팁 섹션이 표시된다', () => {
      render(
        <PostureGuide
          {...defaultProps}
          tips={['거울을 보면서 자세를 확인하세요', '호흡을 잊지 마세요']}
        />
      );
      expect(screen.getByText('팁')).toBeInTheDocument();
      expect(screen.getByText('거울을 보면서 자세를 확인하세요')).toBeInTheDocument();
      expect(screen.getByText('호흡을 잊지 마세요')).toBeInTheDocument();
    });

    it('빈 팁 배열이면 팁 섹션이 없다', () => {
      render(<PostureGuide {...defaultProps} tips={[]} />);
      expect(screen.queryByText('팁')).not.toBeInTheDocument();
    });
  });
});
