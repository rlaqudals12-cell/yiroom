import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  X: (props: Record<string, unknown>) => <div data-testid="icon-X" {...props} />,
  ChevronRight: (props: Record<string, unknown>) => (
    <div data-testid="icon-ChevronRight" {...props} />
  ),
  Target: (props: Record<string, unknown>) => <div data-testid="icon-Target" {...props} />,
}));

// cn mock
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

import { PostureFeedbackPanel } from '@/components/workout/analysis/PostureFeedbackPanel';
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

describe('PostureFeedbackPanel', () => {
  const defaultProps = {
    issue: createMockIssue(),
    onClose: vi.fn(),
  };

  describe('기본 렌더링', () => {
    it('issue가 null이면 아무것도 렌더링하지 않는다', () => {
      const { container } = render(<PostureFeedbackPanel issue={null} onClose={vi.fn()} />);
      expect(container.innerHTML).toBe('');
    });

    it('패널이 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByTestId('posture-feedback-panel')).toBeInTheDocument();
    });

    it('오버레이가 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByTestId('posture-feedback-overlay')).toBeInTheDocument();
    });

    it('문제 유형 라벨이 한글로 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByText('어깨')).toBeInTheDocument();
    });

    it('심각도 라벨이 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('설명이 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByText('어깨가 앞으로 말려있어요')).toBeInTheDocument();
    });

    it('교정 방법이 표시된다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByText('교정 방법')).toBeInTheDocument();
      expect(screen.getByText('가슴을 펴고 어깨를 뒤로 당겨주세요')).toBeInTheDocument();
    });
  });

  describe('각도 정보', () => {
    it('각도 정보가 있으면 표시한다', () => {
      render(
        <PostureFeedbackPanel
          {...defaultProps}
          issue={createMockIssue({ currentAngle: 15, idealAngle: 0 })}
        />
      );
      expect(screen.getByText('각도 분석')).toBeInTheDocument();
      expect(screen.getByText('현재 각도')).toBeInTheDocument();
      expect(screen.getByText('이상 각도')).toBeInTheDocument();
    });

    it('각도 정보가 없으면 각도 섹션이 없다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.queryByText('각도 분석')).not.toBeInTheDocument();
    });
  });

  describe('관련 운동 링크', () => {
    it('relatedExerciseId가 있고 onExerciseClick이 있으면 버튼이 표시된다', () => {
      render(
        <PostureFeedbackPanel
          {...defaultProps}
          issue={createMockIssue({ relatedExerciseId: 'ex-001' })}
          onExerciseClick={vi.fn()}
        />
      );
      expect(screen.getByText('교정 운동 보기')).toBeInTheDocument();
    });

    it('교정 운동 버튼 클릭 시 onExerciseClick이 호출된다', () => {
      const onExerciseClick = vi.fn();
      render(
        <PostureFeedbackPanel
          {...defaultProps}
          issue={createMockIssue({ relatedExerciseId: 'ex-001' })}
          onExerciseClick={onExerciseClick}
        />
      );
      fireEvent.click(screen.getByText('교정 운동 보기'));
      expect(onExerciseClick).toHaveBeenCalledWith('ex-001');
    });

    it('relatedExerciseId가 없으면 버튼이 없다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.queryByText('교정 운동 보기')).not.toBeInTheDocument();
    });
  });

  describe('닫기 동작', () => {
    it('닫기 버튼 클릭 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(<PostureFeedbackPanel {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByLabelText('패널 닫기'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('오버레이 클릭 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(<PostureFeedbackPanel {...defaultProps} onClose={onClose} />);
      fireEvent.click(screen.getByTestId('posture-feedback-overlay'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('ESC 키 입력 시 onClose가 호출된다', () => {
      const onClose = vi.fn();
      render(<PostureFeedbackPanel {...defaultProps} onClose={onClose} />);
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('접근성', () => {
    it('dialog role이 있다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    it('aria-modal이 true이다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    });

    it('aria-labelledby가 설정되어 있다', () => {
      render(<PostureFeedbackPanel {...defaultProps} />);
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-labelledby', 'posture-panel-title');
    });
  });

  describe('심각도별 표시', () => {
    it('good 심각도는 좋음을 표시한다', () => {
      render(
        <PostureFeedbackPanel {...defaultProps} issue={createMockIssue({ severity: 'good' })} />
      );
      expect(screen.getByText('좋음')).toBeInTheDocument();
    });

    it('critical 심각도는 교정 필요를 표시한다', () => {
      render(
        <PostureFeedbackPanel {...defaultProps} issue={createMockIssue({ severity: 'critical' })} />
      );
      expect(screen.getByText('교정 필요')).toBeInTheDocument();
    });
  });
});
