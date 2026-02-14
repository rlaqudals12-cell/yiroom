import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// cn mock
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { PostureMarker } from '@/components/workout/analysis/PostureMarker';
import type { PostureIssue } from '@/types/workout-posture';

function createMockIssue(overrides: Partial<PostureIssue> = {}): PostureIssue {
  return {
    id: 'issue-1',
    type: 'shoulder_alignment',
    severity: 'warning',
    location: { x: 50, y: 30, radius: 12 },
    description: '어깨가 앞으로 말려있어요',
    correction: '가슴을 펴고 어깨를 뒤로 당겨주세요',
    ...overrides,
  };
}

describe('PostureMarker', () => {
  const defaultProps = {
    issue: createMockIssue(),
    onClick: vi.fn(),
  };

  it('마커가 렌더링된다', () => {
    render(<PostureMarker {...defaultProps} />);
    expect(screen.getByTestId('posture-marker-issue-1')).toBeInTheDocument();
  });

  it('접근성 aria-label이 포함된다', () => {
    render(<PostureMarker {...defaultProps} />);
    const button = screen.getByTestId('posture-marker-issue-1');
    expect(button).toHaveAttribute('aria-label', '어깨 - 어깨가 앞으로 말려있어요');
  });

  it('클릭 시 onClick이 호출된다', () => {
    const onClick = vi.fn();
    render(<PostureMarker {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByTestId('posture-marker-issue-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  describe('위치 스타일', () => {
    it('left/top이 location 기반으로 설정된다', () => {
      render(<PostureMarker {...defaultProps} />);
      const button = screen.getByTestId('posture-marker-issue-1');
      expect(button.style.left).toBe('50%');
      expect(button.style.top).toBe('30%');
    });
  });

  describe('라벨 표시', () => {
    it('showLabel이 true이면 라벨이 표시된다', () => {
      render(<PostureMarker {...defaultProps} showLabel={true} />);
      expect(screen.getByText('어깨')).toBeInTheDocument();
    });

    it('showLabel이 false이면 라벨이 표시되지 않는다', () => {
      render(<PostureMarker {...defaultProps} showLabel={false} />);
      expect(screen.queryByText('어깨')).not.toBeInTheDocument();
    });

    it('기본값으로 라벨이 표시된다', () => {
      render(<PostureMarker {...defaultProps} />);
      expect(screen.getByText('어깨')).toBeInTheDocument();
    });
  });

  describe('선택 상태', () => {
    it('isSelected가 true이면 zIndex가 20이다', () => {
      render(<PostureMarker {...defaultProps} isSelected={true} />);
      const button = screen.getByTestId('posture-marker-issue-1');
      expect(button.style.zIndex).toBe('20');
    });

    it('isSelected가 false이면 zIndex가 10이다', () => {
      render(<PostureMarker {...defaultProps} isSelected={false} />);
      const button = screen.getByTestId('posture-marker-issue-1');
      expect(button.style.zIndex).toBe('10');
    });
  });

  describe('최소 터치 타겟 크기', () => {
    it('radius가 작아도 최소 44px이 보장된다', () => {
      const { container } = render(
        <PostureMarker
          {...defaultProps}
          issue={createMockIssue({ location: { x: 50, y: 50, radius: 8 } })}
        />
      );
      const markerCircle = container.querySelector('.rounded-full.border-2');
      // Math.max(8 * 2, 44) = 44
      expect(markerCircle?.getAttribute('style')).toContain('width: 44px');
    });

    it('radius가 충분히 크면 radius * 2가 사용된다', () => {
      const { container } = render(
        <PostureMarker
          {...defaultProps}
          issue={createMockIssue({ location: { x: 50, y: 50, radius: 30 } })}
        />
      );
      const markerCircle = container.querySelector('.rounded-full.border-2');
      // Math.max(30 * 2, 44) = 60
      expect(markerCircle?.getAttribute('style')).toContain('width: 60px');
    });
  });

  describe('심각도별 펄스 애니메이션', () => {
    it('warning 심각도에서 펄스 애니메이션이 있다', () => {
      const { container } = render(
        <PostureMarker {...defaultProps} issue={createMockIssue({ severity: 'warning' })} />
      );
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).toBeInTheDocument();
    });

    it('good 심각도에서 펄스 애니메이션이 없다', () => {
      const { container } = render(
        <PostureMarker {...defaultProps} issue={createMockIssue({ severity: 'good' })} />
      );
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });

    it('선택된 상태에서 펄스 애니메이션이 없다', () => {
      const { container } = render(
        <PostureMarker
          {...defaultProps}
          issue={createMockIssue({ severity: 'warning' })}
          isSelected={true}
        />
      );
      const pulseElement = container.querySelector('.animate-ping');
      expect(pulseElement).not.toBeInTheDocument();
    });
  });
});
