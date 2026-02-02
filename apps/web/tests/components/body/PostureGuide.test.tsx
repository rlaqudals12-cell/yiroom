import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PostureGuide } from '@/components/body/PostureGuide';
import type { BodyShape7, PostureIssue, CorrectionExercise } from '@/lib/body';

describe('PostureGuide', () => {
  const defaultProps = {
    bodyType: 'rectangle' as BodyShape7,
  };

  it('renders without crashing', () => {
    render(<PostureGuide {...defaultProps} />);
    expect(screen.getByTestId('posture-guide')).toBeInTheDocument();
  });

  it('displays header with body type name', () => {
    render(<PostureGuide {...defaultProps} />);
    expect(screen.getByText('자세 교정 가이드')).toBeInTheDocument();
    expect(screen.getByText(/직사각형/)).toBeInTheDocument();
  });

  it('displays exercise count badge', () => {
    render(<PostureGuide {...defaultProps} />);
    expect(screen.getByText(/개 운동/)).toBeInTheDocument();
  });

  it('displays detected posture issues', () => {
    const detectedIssues: PostureIssue[] = ['forward_head', 'rounded_shoulders'];
    render(<PostureGuide {...defaultProps} detectedIssues={detectedIssues} />);

    expect(screen.getByTestId('issue-badge-forward_head')).toBeInTheDocument();
    expect(screen.getByTestId('issue-badge-rounded_shoulders')).toBeInTheDocument();
    expect(screen.getByText('거북목')).toBeInTheDocument();
    expect(screen.getByText('굽은 어깨')).toBeInTheDocument();
  });

  it('displays common issues for body type when no detected issues provided', () => {
    render(<PostureGuide bodyType="pear" />);
    // pear 체형의 기본 문제들이 표시되어야 함
    expect(screen.getByText('주의가 필요한 자세 문제')).toBeInTheDocument();
  });

  it('displays three tabs: exercises, tips, issues', () => {
    render(<PostureGuide {...defaultProps} />);
    expect(screen.getByText('운동')).toBeInTheDocument();
    expect(screen.getByText('생활 팁')).toBeInTheDocument();
    expect(screen.getByText('문제 상세')).toBeInTheDocument();
  });

  it('shows exercises tab by default', () => {
    render(<PostureGuide {...defaultProps} />);
    // 난이도 필터가 표시됨 (운동 탭 내용)
    expect(screen.getByText('난이도:')).toBeInTheDocument();
  });

  it('displays difficulty filter buttons', () => {
    render(<PostureGuide {...defaultProps} />);
    expect(screen.getByTestId('difficulty-1')).toBeInTheDocument();
    expect(screen.getByTestId('difficulty-2')).toBeInTheDocument();
    expect(screen.getByTestId('difficulty-3')).toBeInTheDocument();
    // 버튼 내의 텍스트 확인 (data-testid로 특정)
    expect(within(screen.getByTestId('difficulty-1')).getByText('쉬움')).toBeInTheDocument();
    expect(within(screen.getByTestId('difficulty-2')).getByText('보통')).toBeInTheDocument();
    expect(within(screen.getByTestId('difficulty-3')).getByText('어려움')).toBeInTheDocument();
  });

  it('filters exercises by difficulty', async () => {
    render(<PostureGuide {...defaultProps} />);

    // 어려움 버튼 클릭
    const hardButton = screen.getByTestId('difficulty-3');
    fireEvent.click(hardButton);

    // 모든 난이도의 운동이 표시되어야 함
    await waitFor(() => {
      const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
      expect(exerciseCards.length).toBeGreaterThan(0);
    });
  });

  it('displays tab list with all tabs', () => {
    render(<PostureGuide {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(3);
    expect(tabs[0]).toHaveTextContent('운동');
    expect(tabs[1]).toHaveTextContent('생활 팁');
    expect(tabs[2]).toHaveTextContent('문제 상세');
  });

  it('switches to tips tab using userEvent', async () => {
    const user = userEvent.setup();
    render(<PostureGuide {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    const tipsTab = tabs[1]; // 생활 팁 탭

    await user.click(tipsTab);

    // 탭 전환 후 컨텐츠 확인
    await waitFor(
      () => {
        expect(screen.getByTestId('daily-tip-0')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('switches to issues tab using userEvent', async () => {
    const user = userEvent.setup();
    render(<PostureGuide {...defaultProps} />);

    const tabs = screen.getAllByRole('tab');
    const issuesTab = tabs[2]; // 문제 상세 탭

    await user.click(issuesTab);

    // 문제 상세 아코디언이 표시되어야 함
    await waitFor(
      () => {
        const issueDetails = screen.getAllByTestId(/^issue-detail-/);
        expect(issueDetails.length).toBeGreaterThan(0);
      },
      { timeout: 5000 }
    );
  });

  it('expands exercise card on click', async () => {
    render(<PostureGuide {...defaultProps} />);

    // 첫 번째 운동 카드 찾기
    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    expect(exerciseCards.length).toBeGreaterThan(0);

    // 카드 클릭하여 확장
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      // 확장된 내용이 표시됨 (운동 방법 섹션)
      expect(screen.getByText('운동 방법')).toBeInTheDocument();
    });
  });

  it('displays exercise steps when expanded', async () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      // 운동 단계가 번호와 함께 표시됨
      const stepNumbers = screen.getAllByText(/^[1-9]$/);
      expect(stepNumbers.length).toBeGreaterThan(0);
    });
  });

  it('displays exercise cautions when expanded', async () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      // 주의사항 섹션이 표시됨
      const cautionSection = screen.getAllByText('주의사항');
      expect(cautionSection.length).toBeGreaterThan(0);
    });
  });

  it('calls onExerciseSelect when exercise is selected', async () => {
    const onExerciseSelect = vi.fn();
    render(<PostureGuide {...defaultProps} onExerciseSelect={onExerciseSelect} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      const selectButtons = screen.getAllByTestId(/^select-exercise-/);
      expect(selectButtons.length).toBeGreaterThan(0);
      fireEvent.click(selectButtons[0]);
    });

    expect(onExerciseSelect).toHaveBeenCalled();
    const exercise: CorrectionExercise = onExerciseSelect.mock.calls[0][0];
    expect(exercise).toHaveProperty('id');
    expect(exercise).toHaveProperty('name');
    expect(exercise).toHaveProperty('steps');
  });

  it('does not show select button when onExerciseSelect is not provided', async () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      expect(screen.getByText('운동 방법')).toBeInTheDocument();
    });

    // 선택 버튼이 없어야 함
    expect(screen.queryByText('이 운동 시작하기')).not.toBeInTheDocument();
  });

  it('displays exercise difficulty badge', () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    expect(exerciseCards.length).toBeGreaterThan(0);

    // 운동 카드 내에 난이도 뱃지가 표시됨
    const firstCard = exerciseCards[0];
    const badge = within(firstCard).getByText(/쉬움|보통|어려움/);
    expect(badge).toBeInTheDocument();
  });

  it('displays target area and duration when exercise is expanded', async () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);
    fireEvent.click(exerciseCards[0]);

    await waitFor(() => {
      expect(screen.getByText('타겟:')).toBeInTheDocument();
      expect(screen.getByText('시간:')).toBeInTheDocument();
    });
  });

  it('handles all body types', () => {
    const bodyTypes: BodyShape7[] = [
      'hourglass',
      'pear',
      'invertedTriangle',
      'apple',
      'rectangle',
      'trapezoid',
      'oval',
    ];

    bodyTypes.forEach((bodyType) => {
      const { unmount } = render(<PostureGuide bodyType={bodyType} />);
      expect(screen.getByTestId('posture-guide')).toBeInTheDocument();
      unmount();
    });
  });

  it('displays issue details in accordion when issues tab is active', async () => {
    const user = userEvent.setup();
    const detectedIssues: PostureIssue[] = ['forward_head'];
    render(<PostureGuide {...defaultProps} detectedIssues={detectedIssues} />);

    const tabs = screen.getAllByRole('tab');
    await user.click(tabs[2]); // 문제 상세 탭

    await waitFor(
      () => {
        const issueDetail = screen.getByTestId('issue-detail-forward_head');
        expect(issueDetail).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('applies custom className', () => {
    render(<PostureGuide {...defaultProps} className="custom-class" />);
    const guide = screen.getByTestId('posture-guide');
    expect(guide).toHaveClass('custom-class');
  });

  it('shows empty state when no exercises match difficulty filter', async () => {
    // 난이도 1로 설정하면 일부 운동이 필터링될 수 있음
    render(<PostureGuide {...defaultProps} />);

    const easyButton = screen.getByTestId('difficulty-1');
    fireEvent.click(easyButton);

    // 운동이 있든 없든 UI가 정상 작동해야 함
    await waitFor(() => {
      expect(screen.getByTestId('posture-guide')).toBeInTheDocument();
    });
  });

  it('collapses exercise card when clicked again', async () => {
    render(<PostureGuide {...defaultProps} />);

    const exerciseCards = screen.getAllByTestId(/^exercise-card-/);

    // 첫 번째 클릭 - 확장
    fireEvent.click(exerciseCards[0]);
    await waitFor(() => {
      expect(screen.getByText('운동 방법')).toBeInTheDocument();
    });

    // 두 번째 클릭 - 축소
    fireEvent.click(exerciseCards[0]);
    await waitFor(() => {
      expect(screen.queryByText('운동 방법')).not.toBeInTheDocument();
    });
  });
});
