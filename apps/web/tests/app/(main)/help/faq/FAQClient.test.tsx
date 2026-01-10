/**
 * FAQClient 컴포넌트 테스트
 * @description FAQ 페이지 클라이언트 컴포넌트 단위 테스트
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
  };
});

// FAQAccordion 컴포넌트 모킹
vi.mock('@/components/help', () => ({
  FAQAccordion: ({
    faqs,
    showSearch,
    onFeedback,
  }: {
    faqs: FAQ[];
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
              <button
                data-testid={`faq-helpful-${faq.id}`}
                onClick={() => onFeedback(faq.id, true)}
              >
                도움됨
              </button>
              <button
                data-testid={`faq-not-helpful-${faq.id}`}
                onClick={() => onFeedback(faq.id, false)}
              >
                도움안됨
              </button>
            </>
          )}
        </div>
      ))}
    </div>
  ),
}));

// sonner toast 모킹 (호이스팅 대응)
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// 모킹된 toast 참조
import { toast as mockToast } from 'sonner';

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
];

describe('FAQClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({ ok: true });
  });

  describe('기본 렌더링', () => {
    it('페이지 제목 표시', () => {
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

    it('FAQ 목록 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-accordion')).toBeInTheDocument();
    });

    it('검색 기능 활성화', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByTestId('faq-accordion')).toHaveAttribute('data-show-search', 'true');
    });

    it('문의하기 링크 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const feedbackLink = screen.getByText('문의하기');
      expect(feedbackLink).toHaveAttribute('href', '/help/feedback');
    });
  });

  describe('빈 목록 처리', () => {
    it('faqs가 빈 배열일 때 안내 메시지 표시', () => {
      render(<FAQClient faqs={[]} />);
      expect(screen.getByText('등록된 FAQ가 없습니다.')).toBeInTheDocument();
    });

    it('빈 목록일 때 FAQAccordion 미표시', () => {
      render(<FAQClient faqs={[]} />);
      expect(screen.queryByTestId('faq-accordion')).not.toBeInTheDocument();
    });

    it('빈 목록일 때도 헤더는 표시', () => {
      render(<FAQClient faqs={[]} />);
      expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
    });

    it('빈 목록일 때도 문의하기 링크 표시', () => {
      render(<FAQClient faqs={[]} />);
      expect(screen.getByText('문의하기')).toBeInTheDocument();
    });
  });

  describe('피드백 기능', () => {
    it('도움됨 피드백 API 호출', async () => {
      render(<FAQClient faqs={mockFAQs} />);
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

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
      fireEvent.click(screen.getByTestId('faq-not-helpful-faq-1'));

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/faq/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ faqId: 'faq-1', helpful: false }),
        });
      });
    });

    it('도움됨 피드백 성공 시 토스트 표시', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<FAQClient faqs={mockFAQs} />);
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('감사합니다!');
      });
    });

    it('도움안됨 피드백 성공 시 토스트 표시', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<FAQClient faqs={mockFAQs} />);
      fireEvent.click(screen.getByTestId('faq-not-helpful-faq-1'));

      await waitFor(() => {
        expect(mockToast.success).toHaveBeenCalledWith('의견 감사합니다. 개선하겠습니다.');
      });
    });

    it('중복 피드백 방지 - 같은 FAQ에 두 번 피드백 시도', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<FAQClient faqs={mockFAQs} />);

      // 첫 번째 피드백
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 같은 FAQ에 두 번째 피드백 시도
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('이미 의견을 주셨습니다');
      });

      // API는 한 번만 호출됨
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('중복 피드백 방지 - 도움됨 후 도움안됨 시도', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<FAQClient faqs={mockFAQs} />);

      // 도움됨 클릭
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 같은 FAQ에 도움안됨 시도
      fireEvent.click(screen.getByTestId('faq-not-helpful-faq-1'));
      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('이미 의견을 주셨습니다');
      });

      // API는 한 번만 호출됨
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('다른 FAQ에는 각각 피드백 가능', async () => {
      mockFetch.mockResolvedValue({ ok: true });
      render(<FAQClient faqs={mockFAQs} />);

      // 첫 번째 FAQ 피드백
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 두 번째 FAQ 피드백
      fireEvent.click(screen.getByTestId('faq-not-helpful-faq-2'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });

      // 세 번째 FAQ 피드백
      fireEvent.click(screen.getByTestId('faq-helpful-faq-3'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(3);
      });
    });

    it('API 에러 시에도 UI는 정상 처리', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FAQClient faqs={mockFAQs} />);
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));

      await waitFor(() => {
        // 에러가 발생해도 토스트는 표시됨
        expect(mockToast.success).toHaveBeenCalledWith('의견 감사합니다');
      });

      // 에러 로그 확인
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('API 에러 후에도 중복 피드백 방지', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));
      vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<FAQClient faqs={mockFAQs} />);

      // 첫 번째 피드백 (에러 발생)
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // 두 번째 피드백 시도
      fireEvent.click(screen.getByTestId('faq-helpful-faq-1'));
      await waitFor(() => {
        expect(mockToast.info).toHaveBeenCalledWith('이미 의견을 주셨습니다');
      });

      // API는 한 번만 호출됨 (에러 후에도 피드백 상태 저장)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('FAQ 데이터', () => {
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

    it('FAQ 답변 표시', () => {
      render(<FAQClient faqs={mockFAQs} />);
      expect(screen.getByText('이룸은 개인 맞춤형 웰니스 앱입니다.')).toBeInTheDocument();
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

    it('footer 영역 border-t 클래스', () => {
      render(<FAQClient faqs={mockFAQs} />);
      const feedbackLink = screen.getByText('문의하기');
      const footer = feedbackLink.closest('.border-t');
      expect(footer).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('단일 FAQ 항목', () => {
      const singleFAQ: FAQ[] = [mockFAQs[0]];
      render(<FAQClient faqs={singleFAQ} />);
      expect(screen.getByTestId('faq-item-faq-1')).toBeInTheDocument();
      expect(screen.queryByTestId('faq-item-faq-2')).not.toBeInTheDocument();
    });

    it('많은 FAQ 항목 (10개)', () => {
      const manyFAQs: FAQ[] = Array.from({ length: 10 }, (_, i) => ({
        id: `faq-${i + 1}`,
        category: 'general' as const,
        question: `질문 ${i + 1}`,
        answer: `답변 ${i + 1}`,
        sortOrder: i + 1,
        isPublished: true,
        helpfulCount: 0,
        notHelpfulCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      render(<FAQClient faqs={manyFAQs} />);

      // 모든 항목이 렌더링되는지 확인
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByTestId(`faq-item-faq-${i}`)).toBeInTheDocument();
      }
    });

    it('특수 문자가 포함된 FAQ', () => {
      const specialFAQ: FAQ[] = [
        {
          id: 'special-1',
          category: 'general',
          question: '가격 정책 (VAT 포함)?',
          answer: '모든 가격은 VAT 10%가 포함되어 있습니다. <br> 문의: support@yiroom.com',
          sortOrder: 1,
          isPublished: true,
          helpfulCount: 0,
          notHelpfulCount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      render(<FAQClient faqs={specialFAQ} />);
      expect(screen.getByText('가격 정책 (VAT 포함)?')).toBeInTheDocument();
    });
  });
});
