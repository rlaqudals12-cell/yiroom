/**
 * FAQ 페이지 테스트
 * @description FAQPage는 async Server Component이므로 FAQClient를 테스트
 * @see FAQClient.test.tsx - FAQClient 상세 테스트
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FAQClient } from '@/app/(main)/help/faq/FAQClient';
import type { FAQ } from '@/types/announcements';

// lucide-react 아이콘 모킹
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    ArrowLeft: () => <span data-testid="arrow-left-icon">ArrowLeft</span>,
    HelpCircle: () => <span data-testid="help-circle-icon">HelpCircle</span>,
    ChevronDown: () => <span data-testid="chevron-down-icon">ChevronDown</span>,
    ThumbsUp: () => <span data-testid="thumbs-up-icon">ThumbsUp</span>,
    ThumbsDown: () => <span data-testid="thumbs-down-icon">ThumbsDown</span>,
    Search: () => <span data-testid="search-icon">Search</span>,
  };
});

// FAQAccordion 컴포넌트 모킹
vi.mock('@/components/help', () => ({
  FAQAccordion: ({
    faqs,
    showSearch,
    onFeedback,
  }: {
    faqs: Array<{ id: string; question: string; answer: string }>;
    showSearch: boolean;
    onFeedback?: (id: string, helpful: boolean) => void;
  }) => (
    <div data-testid="faq-accordion" data-show-search={showSearch}>
      {faqs.map((faq) => (
        <div key={faq.id} data-testid={`faq-item-${faq.id}`}>
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
          {onFeedback && (
            <>
              <button onClick={() => onFeedback(faq.id, true)}>도움됨</button>
              <button onClick={() => onFeedback(faq.id, false)}>도움안됨</button>
            </>
          )}
        </div>
      ))}
    </div>
  ),
}));

// sonner toast 모킹
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// fetch 모킹
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock 데이터
const mockFAQs: FAQ[] = [
  {
    id: 'faq-1',
    category: 'general',
    question: '이룸은 어떤 앱인가요?',
    answer: '이룸은 개인 맞춤형 웰니스 앱입니다.',
    sortOrder: 1,
    isPublished: true,
    helpfulCount: 10,
    notHelpfulCount: 2,
    createdAt: new Date('2025-12-01'),
    updatedAt: new Date('2025-12-01'),
  },
  {
    id: 'faq-2',
    category: 'account',
    question: '회원가입은 어떻게 하나요?',
    answer: '구글 또는 카카오 계정으로 간편하게 가입할 수 있습니다.',
    sortOrder: 2,
    isPublished: true,
    helpfulCount: 15,
    notHelpfulCount: 1,
    createdAt: new Date('2025-12-02'),
    updatedAt: new Date('2025-12-02'),
  },
  {
    id: 'faq-3',
    category: 'workout',
    question: '운동 분석은 어떻게 받나요?',
    answer: '분석 페이지에서 전신 사진을 업로드하면 AI가 분석합니다.',
    sortOrder: 3,
    isPublished: true,
    helpfulCount: 20,
    notHelpfulCount: 3,
    createdAt: new Date('2025-12-03'),
    updatedAt: new Date('2025-12-03'),
  },
  {
    id: 'faq-4',
    category: 'nutrition',
    question: '음식 기록은 어떻게 하나요?',
    answer: '영양 탭에서 음식 사진을 찍으면 AI가 자동으로 영양소를 분석합니다.',
    sortOrder: 4,
    isPublished: true,
    helpfulCount: 5,
    notHelpfulCount: 0,
    createdAt: new Date('2025-12-04'),
    updatedAt: new Date('2025-12-04'),
  },
  {
    id: 'faq-5',
    category: 'technical',
    question: '앱이 제대로 작동하지 않아요.',
    answer: '앱을 완전히 종료 후 다시 시작해보세요. 문제가 지속되면 문의하기를 이용해주세요.',
    sortOrder: 5,
    isPublished: true,
    helpfulCount: 8,
    notHelpfulCount: 1,
    createdAt: new Date('2025-12-05'),
    updatedAt: new Date('2025-12-05'),
  },
];

describe('FAQPage (via FAQClient)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('기본 렌더링', () => {
    it('페이지 렌더링', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
    });

    it('뒤로가기 버튼 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('대시보드 링크', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const links = screen.getAllByRole('link');
      const dashboardLink = links.find((link) => link.getAttribute('href') === '/dashboard');
      expect(dashboardLink).toBeDefined();
    });

    it('HelpCircle 아이콘 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
    });

    it('설명 텍스트 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(
        screen.getByText('이룸 사용 중 궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요.')
      ).toBeInTheDocument();
    });
  });

  describe('FAQ 아코디언', () => {
    it('FAQAccordion 컴포넌트 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
    });

    it('검색 기능 활성화', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-accordion')).toHaveAttribute('data-show-search', 'true');
    });
  });

  describe('FAQ Mock 데이터', () => {
    it('일반 카테고리 FAQ 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('이룸은 어떤 앱인가요?')).toBeInTheDocument();
    });

    it('계정 카테고리 FAQ 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('회원가입은 어떻게 하나요?')).toBeInTheDocument();
    });

    it('운동 카테고리 FAQ 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('운동 분석은 어떻게 받나요?')).toBeInTheDocument();
    });

    it('영양 카테고리 FAQ 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('음식 기록은 어떻게 하나요?')).toBeInTheDocument();
    });

    it('기술 카테고리 FAQ 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('앱이 제대로 작동하지 않아요.')).toBeInTheDocument();
    });
  });

  describe('피드백 기능', () => {
    it('도움됨 피드백 API 호출', async () => {
      render(<FAQClient faqs={mockFAQs} />);
      const helpfulButton = screen.getAllByText('도움됨')[0];
      fireEvent.click(helpfulButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/faq/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId: 'faq-1', helpful: true }),
        });
      });
    });

    it('도움안됨 피드백 API 호출', async () => {
      render(<FAQClient faqs={mockFAQs} />);
      const notHelpfulButton = screen.getAllByText('도움안됨')[0];
      fireEvent.click(notHelpfulButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/faq/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId: 'faq-1', helpful: false }),
        });
      });
    });
  });

  describe('추가 문의 섹션', () => {
    it('문의하기 안내 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('원하는 답변을 찾지 못하셨나요?')).toBeInTheDocument();
    });

    it('문의하기 링크', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const feedbackLink = screen.getByText('문의하기');
      expect(feedbackLink).toHaveAttribute('href', '/help/feedback');
    });
  });

  describe('레이아웃', () => {
    it('컨테이너 최대 너비', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const title = screen.getByText('자주 묻는 질문');
      const container = title.closest('.container');
      expect(container).toHaveClass('max-w-2xl');
    });

    it('헤더 flex 레이아웃', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const title = screen.getByText('자주 묻는 질문');
      const headerRow = title.closest('.gap-4');
      expect(headerRow).toHaveClass('flex');
      expect(headerRow).toHaveClass('items-center');
    });
  });
});
