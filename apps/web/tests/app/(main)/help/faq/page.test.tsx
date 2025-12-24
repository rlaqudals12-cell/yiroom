import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import FAQPage from '@/app/(main)/help/faq/page';

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
    onFeedback: (id: string, helpful: boolean) => void;
  }) => (
    <div data-testid="faq-accordion" data-show-search={showSearch}>
      {faqs.map((faq) => (
        <div key={faq.id} data-testid={`faq-item-${faq.id}`}>
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
          <button onClick={() => onFeedback(faq.id, true)}>도움됨</button>
          <button onClick={() => onFeedback(faq.id, false)}>도움안됨</button>
        </div>
      ))}
    </div>
  ),
}));

describe('FAQPage', () => {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('페이지 렌더링', () => {
      render(<FAQPage />);
      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
    });

    it('뒤로가기 버튼 표시', () => {
      render(<FAQPage />);
      expect(screen.getByTestId('arrow-left-icon')).toBeInTheDocument();
    });

    it('대시보드 링크', () => {
      render(<FAQPage />);
      const links = screen.getAllByRole('link');
      const dashboardLink = links.find(
        (link) => link.getAttribute('href') === '/dashboard'
      );
      expect(dashboardLink).toBeDefined();
    });

    it('HelpCircle 아이콘 표시', () => {
      render(<FAQPage />);
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument();
    });

    it('설명 텍스트 표시', () => {
      render(<FAQPage />);
      expect(
        screen.getByText(
          '이룸 사용 중 궁금한 점이 있으신가요? 아래에서 답변을 찾아보세요.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('FAQ 아코디언', () => {
    it('FAQAccordion 컴포넌트 표시', () => {
      render(<FAQPage />);
      expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
    });

    it('검색 기능 활성화', () => {
      render(<FAQPage />);
      expect(screen.getByTestId('faq-accordion')).toHaveAttribute(
        'data-show-search',
        'true'
      );
    });
  });

  describe('FAQ Mock 데이터', () => {
    it('일반 카테고리 FAQ 표시', () => {
      render(<FAQPage />);
      expect(screen.getByText('이룸은 어떤 앱인가요?')).toBeInTheDocument();
    });

    it('계정 카테고리 FAQ 표시', () => {
      render(<FAQPage />);
      expect(screen.getByText('회원가입은 어떻게 하나요?')).toBeInTheDocument();
    });

    it('운동 카테고리 FAQ 표시', () => {
      render(<FAQPage />);
      expect(screen.getByText('운동 분석은 어떻게 받나요?')).toBeInTheDocument();
    });

    it('영양 카테고리 FAQ 표시', () => {
      render(<FAQPage />);
      expect(screen.getByText('음식 기록은 어떻게 하나요?')).toBeInTheDocument();
    });

    it('기술 카테고리 FAQ 표시', () => {
      render(<FAQPage />);
      expect(
        screen.getByText('앱이 제대로 작동하지 않아요.')
      ).toBeInTheDocument();
    });
  });

  describe('피드백 기능', () => {
    it('도움됨 피드백 로그', () => {
      render(<FAQPage />);
      const helpfulButton = screen.getAllByText('도움됨')[0];
      helpfulButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('FAQ faq-1: helpful');
    });

    it('도움안됨 피드백 로그', () => {
      render(<FAQPage />);
      const notHelpfulButton = screen.getAllByText('도움안됨')[0];
      notHelpfulButton.click();

      expect(consoleSpy).toHaveBeenCalledWith('FAQ faq-1: not helpful');
    });
  });

  describe('추가 문의 섹션', () => {
    it('문의하기 안내 표시', () => {
      render(<FAQPage />);
      expect(
        screen.getByText('원하는 답변을 찾지 못하셨나요?')
      ).toBeInTheDocument();
    });

    it('문의하기 링크', () => {
      render(<FAQPage />);
      const feedbackLink = screen.getByText('문의하기');
      expect(feedbackLink).toHaveAttribute('href', '/help/feedback');
    });
  });

  describe('레이아웃', () => {
    it('컨테이너 최대 너비', () => {
      render(<FAQPage />);
      // 자주 묻는 질문 -> div (flex items-center gap-2) -> div (flex items-center gap-4) -> div (container max-w-2xl)
      const title = screen.getByText('자주 묻는 질문');
      const container = title.closest('.container');
      expect(container).toHaveClass('max-w-2xl');
    });

    it('헤더 flex 레이아웃', () => {
      render(<FAQPage />);
      // 헤더는 flex items-center gap-4 클래스를 가짐
      const title = screen.getByText('자주 묻는 질문');
      const headerRow = title.closest('.gap-4');
      expect(headerRow).toHaveClass('flex');
      expect(headerRow).toHaveClass('items-center');
    });
  });
});
