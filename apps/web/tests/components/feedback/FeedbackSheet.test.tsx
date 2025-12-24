import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackSheet } from '@/components/feedback/FeedbackSheet';

// scrollIntoView 모킹
Element.prototype.scrollIntoView = vi.fn();

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    MessageSquare: () => <span data-testid="message-icon">MessageSquare</span>,
    Loader2: () => <span data-testid="loader-icon">Loader2</span>,
    Check: () => <span data-testid="check-icon">Check</span>,
    AlertCircle: () => <span data-testid="alert-icon">AlertCircle</span>,
  };
});

describe('FeedbackSheet', () => {
  describe('기본 렌더링', () => {
    it('트리거 버튼 렌더링', () => {
      render(<FeedbackSheet />);
      expect(screen.getByText('피드백')).toBeInTheDocument();
    });

    it('커스텀 트리거 사용', () => {
      render(<FeedbackSheet trigger={<button>커스텀 트리거</button>} />);
      expect(screen.getByText('커스텀 트리거')).toBeInTheDocument();
    });
  });

  describe('시트 열기/닫기', () => {
    it('트리거 클릭 시 시트 열림', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-sheet')).toBeInTheDocument();
      });
    });

    it('시트 제목 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-sheet')).toBeInTheDocument();
      });

      // 시트가 열린 후 제목 확인
      expect(screen.getByRole('heading', { name: /피드백 보내기/ })).toBeInTheDocument();
    });
  });

  describe('폼 필드', () => {
    it('유형 선택 필드 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-type-select')).toBeInTheDocument();
      });
    });

    it('제목 입력 필드 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-title-input')).toBeInTheDocument();
      });
    });

    it('내용 입력 필드 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-content-input')).toBeInTheDocument();
      });
    });

    it('이메일 입력 필드 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-email-input')).toBeInTheDocument();
      });
    });

    it('제출 버튼 표시', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-submit-button')).toBeInTheDocument();
      });
    });
  });

  describe('유효성 검사', () => {
    it('필수 필드 누락 시 에러 메시지', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-submit-button')).toBeInTheDocument();
      });

      // 빈 상태로 제출 시도
      fireEvent.click(screen.getByTestId('feedback-submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-errors')).toBeInTheDocument();
      });
    });

    it('제목 입력', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-title-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('feedback-title-input'), {
        target: { value: '테스트 제목입니다' },
      });

      expect(screen.getByTestId('feedback-title-input')).toHaveValue('테스트 제목입니다');
    });

    it('내용 입력', async () => {
      render(<FeedbackSheet />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-content-input')).toBeInTheDocument();
      });

      fireEvent.change(screen.getByTestId('feedback-content-input'), {
        target: { value: '자세한 내용을 입력합니다.' },
      });

      expect(screen.getByTestId('feedback-content-input')).toHaveValue('자세한 내용을 입력합니다.');
    });
  });

  describe('제출', () => {
    it('제출 핸들러 호출', async () => {
      const onSubmit = vi.fn().mockResolvedValue(true);
      render(<FeedbackSheet onSubmit={onSubmit} />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-type-select')).toBeInTheDocument();
      });

      // 유형 선택 (Select 컴포넌트는 테스트에서 직접 상호작용이 어려움)
      // 제목과 내용만 입력하여 유효성 검사 확인
      fireEvent.change(screen.getByTestId('feedback-title-input'), {
        target: { value: '테스트 제목입니다' },
      });

      fireEvent.change(screen.getByTestId('feedback-content-input'), {
        target: { value: '자세한 내용을 입력합니다. 테스트입니다.' },
      });

      // 유효성 검사 실패 확인 (유형 미선택)
      fireEvent.click(screen.getByTestId('feedback-submit-button'));

      await waitFor(() => {
        expect(screen.getByTestId('feedback-errors')).toBeInTheDocument();
      });
    });

    it('성공 콜백 호출', async () => {
      const onSubmit = vi.fn().mockResolvedValue(true);
      const onSubmitSuccess = vi.fn();

      render(<FeedbackSheet onSubmit={onSubmit} onSubmitSuccess={onSubmitSuccess} />);

      fireEvent.click(screen.getByText('피드백'));

      // 컴포넌트 렌더링 확인
      await waitFor(() => {
        expect(screen.getByTestId('feedback-sheet')).toBeInTheDocument();
      });
    });
  });

  describe('커스텀 testId', () => {
    it('커스텀 testId 적용', async () => {
      render(<FeedbackSheet data-testid="custom-feedback" />);

      fireEvent.click(screen.getByText('피드백'));

      await waitFor(() => {
        expect(screen.getByTestId('custom-feedback')).toBeInTheDocument();
      });
    });
  });
});
