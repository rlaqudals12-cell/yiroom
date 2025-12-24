import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FAQAccordion } from '@/components/help/FAQAccordion';
import type { FAQ } from '@/types/announcements';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Search: () => <span data-testid="search-icon">Search</span>,
    ThumbsUp: () => <span data-testid="thumbs-up-icon">ThumbsUp</span>,
    ThumbsDown: () => <span data-testid="thumbs-down-icon">ThumbsDown</span>,
    ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
  };
});

const mockFAQs: FAQ[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: '이룸은 어떤 앱인가요?',
    answer: '웰니스 플랫폼입니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 10,
    notHelpfulCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'faq-2',
    category: 'account',
    question: '회원가입은 어떻게 하나요?',
    answer: '이메일로 가입하세요.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 5,
    notHelpfulCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'faq-3',
    category: 'workout',
    question: '운동 기록은 어떻게 하나요?',
    answer: '대시보드에서 기록하세요.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 15,
    notHelpfulCount: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('FAQAccordion', () => {
  describe('기본 렌더링', () => {
    it('컴포넌트 렌더링', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
    });

    it('검색 입력 표시', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-search-input')).toBeInTheDocument();
    });

    it('검색 숨기기 옵션', () => {
      render(<FAQAccordion faqs={mockFAQs} showSearch={false} />);
      expect(screen.queryByTestId('faq-search-input')).not.toBeInTheDocument();
    });

    it('커스텀 testId', () => {
      render(<FAQAccordion faqs={mockFAQs} data-testid="custom-faq" />);
      expect(screen.getByTestId('custom-faq')).toBeInTheDocument();
    });
  });

  describe('카테고리 탭', () => {
    it('전체 탭 표시', () => {
      render(<FAQAccordion faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-category-all')).toBeInTheDocument();
    });

    it('FAQ가 있는 카테고리만 표시', () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      expect(screen.getByTestId('faq-category-general')).toBeInTheDocument();
      expect(screen.getByTestId('faq-category-account')).toBeInTheDocument();
      expect(screen.getByTestId('faq-category-workout')).toBeInTheDocument();
      expect(screen.queryByTestId('faq-category-nutrition')).not.toBeInTheDocument();
    });

    it('카테고리 클릭 시 필터링', async () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      // 처음에는 모든 FAQ 표시
      expect(screen.getByText('이룸은 어떤 앱인가요?')).toBeInTheDocument();
      expect(screen.getByText('회원가입은 어떻게 하나요?')).toBeInTheDocument();

      // 계정 카테고리 선택
      fireEvent.click(screen.getByTestId('faq-category-account'));

      await waitFor(() => {
        expect(screen.getByText('회원가입은 어떻게 하나요?')).toBeInTheDocument();
        expect(screen.queryByText('이룸은 어떤 앱인가요?')).not.toBeInTheDocument();
      });
    });
  });

  describe('검색 기능', () => {
    it('검색어 입력 시 필터링', async () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      fireEvent.change(screen.getByTestId('faq-search-input'), {
        target: { value: '운동' },
      });

      await waitFor(() => {
        expect(screen.getByText('운동 기록은 어떻게 하나요?')).toBeInTheDocument();
        expect(screen.queryByText('이룸은 어떤 앱인가요?')).not.toBeInTheDocument();
      });
    });

    it('검색 결과 없을 때 메시지', async () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      fireEvent.change(screen.getByTestId('faq-search-input'), {
        target: { value: '없는검색어' },
      });

      await waitFor(() => {
        expect(screen.getByTestId('faq-empty')).toBeInTheDocument();
        expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
      });
    });
  });

  describe('아코디언 동작', () => {
    it('질문 클릭 시 답변 표시', async () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      // 질문 클릭
      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByText('웰니스 플랫폼입니다.')).toBeInTheDocument();
      });
    });
  });

  describe('피드백 기능', () => {
    it('피드백 버튼 표시 (핸들러 있을 때)', async () => {
      const onFeedback = vi.fn();
      render(<FAQAccordion faqs={mockFAQs} onFeedback={onFeedback} />);

      // 질문 열기
      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByTestId('faq-helpful-faq-1')).toBeInTheDocument();
        expect(screen.getByTestId('faq-not-helpful-faq-1')).toBeInTheDocument();
      });
    });

    it('피드백 버튼 숨김 (핸들러 없을 때)', async () => {
      render(<FAQAccordion faqs={mockFAQs} />);

      // 질문 열기
      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByText('웰니스 플랫폼입니다.')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('faq-helpful-faq-1')).not.toBeInTheDocument();
    });

    it('도움됨 클릭 시 핸들러 호출', async () => {
      const onFeedback = vi.fn();
      render(<FAQAccordion faqs={mockFAQs} onFeedback={onFeedback} />);

      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByTestId('faq-helpful-faq-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

      expect(onFeedback).toHaveBeenCalledWith('faq-1', true);
    });

    it('아니요 클릭 시 핸들러 호출', async () => {
      const onFeedback = vi.fn();
      render(<FAQAccordion faqs={mockFAQs} onFeedback={onFeedback} />);

      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByTestId('faq-not-helpful-faq-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('faq-not-helpful-faq-1'));

      expect(onFeedback).toHaveBeenCalledWith('faq-1', false);
    });

    it('피드백 후 감사 메시지 표시', async () => {
      const onFeedback = vi.fn();
      render(<FAQAccordion faqs={mockFAQs} onFeedback={onFeedback} />);

      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByTestId('faq-helpful-faq-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

      await waitFor(() => {
        expect(screen.getByText('피드백을 주셔서 감사합니다!')).toBeInTheDocument();
      });
    });

    it('같은 FAQ에 중복 피드백 방지', async () => {
      const onFeedback = vi.fn();
      render(<FAQAccordion faqs={mockFAQs} onFeedback={onFeedback} />);

      fireEvent.click(screen.getByText('이룸은 어떤 앱인가요?'));

      await waitFor(() => {
        expect(screen.getByTestId('faq-helpful-faq-1')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

      // 피드백 버튼이 사라지고 감사 메시지로 대체
      await waitFor(() => {
        expect(screen.queryByTestId('faq-helpful-faq-1')).not.toBeInTheDocument();
      });

      // 핸들러는 한 번만 호출
      expect(onFeedback).toHaveBeenCalledTimes(1);
    });
  });

  describe('빈 상태', () => {
    it('FAQ 없을 때 메시지', () => {
      render(<FAQAccordion faqs={[]} />);

      expect(screen.getByTestId('faq-empty')).toBeInTheDocument();
      expect(screen.getByText('FAQ가 없습니다')).toBeInTheDocument();
    });
  });

  describe('초기 카테고리', () => {
    it('초기 카테고리 설정', () => {
      render(<FAQAccordion faqs={mockFAQs} initialCategory="workout" />);

      // 운동 카테고리만 표시
      expect(screen.getByText('운동 기록은 어떻게 하나요?')).toBeInTheDocument();
      expect(screen.queryByText('이룸은 어떤 앱인가요?')).not.toBeInTheDocument();
    });
  });
});
