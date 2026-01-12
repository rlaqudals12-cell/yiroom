/**
 * Phase D: 피부 상담 컴포넌트 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkinConsultationChat, ChatMessage, QuickQuestions } from '@/components/skin-consultation';
import type {
  ChatMessage as ChatMessageType,
  SkinAnalysisSummary,
} from '@/types/skin-consultation';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

// Mock scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// Mock fetch API for /api/coach/chat
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock lucide-react
vi.mock('lucide-react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('lucide-react')>();
  return {
    ...actual,
    Send: () => <span data-testid="send-icon">Send</span>,
    Loader2: () => <span data-testid="loader-icon">Loading</span>,
    Droplets: () => <span data-testid="droplets-icon">Droplets</span>,
    Sun: () => <span data-testid="sun-icon">Sun</span>,
    Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
    User: () => <span data-testid="user-icon">User</span>,
    Bot: () => <span data-testid="bot-icon">Bot</span>,
    AlertCircle: () => <span data-testid="alert-icon">Alert</span>,
  };
});

describe('ChatMessage', () => {
  const mockUserMessage: ChatMessageType = {
    id: 'user-1',
    role: 'user',
    content: '피부가 건조해요',
    timestamp: new Date('2026-01-11T10:00:00'),
  };

  const mockAssistantMessage: ChatMessageType = {
    id: 'ai-1',
    role: 'assistant',
    content: '건조한 피부에는 보습이 중요해요!',
    timestamp: new Date('2026-01-11T10:00:30'),
    productRecommendations: [
      {
        id: 'product-1',
        name: '수분 크림',
        brand: '테스트 브랜드',
        category: '크림',
        reason: '깊은 보습 효과',
      },
    ],
  };

  it('renders user message correctly', () => {
    render(<ChatMessage message={mockUserMessage} />);

    expect(screen.getByText('피부가 건조해요')).toBeInTheDocument();
  });

  it('renders assistant message correctly', () => {
    render(<ChatMessage message={mockAssistantMessage} />);

    expect(screen.getByText('건조한 피부에는 보습이 중요해요!')).toBeInTheDocument();
  });

  it('renders product recommendations when present', () => {
    render(<ChatMessage message={mockAssistantMessage} />);

    expect(screen.getByText('수분 크림')).toBeInTheDocument();
    expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
    expect(screen.getByText('크림')).toBeInTheDocument();
  });

  it('calls onProductClick when product is clicked', async () => {
    const onProductClick = vi.fn();
    render(<ChatMessage message={mockAssistantMessage} onProductClick={onProductClick} />);

    const productCard = screen.getByTestId('product-card');
    await userEvent.click(productCard);
    expect(onProductClick).toHaveBeenCalledWith('product-1');
  });
});

describe('QuickQuestions', () => {
  it('renders quick question buttons', () => {
    render(<QuickQuestions onQuestionClick={vi.fn()} />);

    // QUICK_QUESTIONS의 실제 label 사용
    expect(screen.getByText('건조함')).toBeInTheDocument();
    expect(screen.getByText('모공')).toBeInTheDocument();
    expect(screen.getByText('트러블')).toBeInTheDocument();
  });

  it('calls onQuestionClick when button is clicked', async () => {
    const onQuestionClick = vi.fn();
    render(<QuickQuestions onQuestionClick={onQuestionClick} />);

    await userEvent.click(screen.getByText('건조함'));

    expect(onQuestionClick).toHaveBeenCalledWith(expect.stringContaining('건조'), 'dryness');
  });

  it('disables buttons when disabled prop is true', () => {
    render(<QuickQuestions onQuestionClick={vi.fn()} disabled />);

    const buttons = screen.getAllByRole('button');
    buttons.forEach((button) => {
      expect(button).toBeDisabled();
    });
  });
});

describe('SkinConsultationChat', () => {
  const mockSkinAnalysis: SkinAnalysisSummary = {
    skinType: '건성',
    hydration: 35,
    oiliness: 20,
    sensitivity: 45,
    analyzedAt: new Date('2026-01-10'),
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    // API mock 초기화
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          message:
            '건조한 피부에는 보습 케어가 중요해요. 세라마이드나 히알루론산 성분을 추천드려요.',
          suggestedQuestions: ['보습 제품 추천해줘', '수분 크림 어떤 게 좋아?'],
          products: [
            {
              id: 'prod-1',
              name: '수분 세럼',
              brand: '테스트 브랜드',
              category: '세럼',
              matchScore: 85,
              matchReasons: ['건성 피부에 적합'],
            },
          ],
        }),
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    mockFetch.mockReset();
  });

  it('renders with data-testid', () => {
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    expect(screen.getByTestId('skin-consultation-chat')).toBeInTheDocument();
  });

  it('shows analysis summary when skinAnalysis is provided', () => {
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    expect(screen.getByText('내 피부 분석 결과')).toBeInTheDocument();
    expect(screen.getByText('35')).toBeInTheDocument(); // hydration
    expect(screen.getByText('건성 피부 타입')).toBeInTheDocument();
  });

  it('shows greeting message on mount', () => {
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    expect(screen.getByText(/안녕하세요/)).toBeInTheDocument();
  });

  it('shows no analysis message when skinAnalysis is null', () => {
    render(<SkinConsultationChat skinAnalysis={null} />);

    expect(screen.getByText(/피부 분석 결과가 없어요/)).toBeInTheDocument();
  });

  it('shows quick questions when skinAnalysis is provided', () => {
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    expect(screen.getByText('건조함')).toBeInTheDocument();
  });

  it('hides quick questions when skinAnalysis is null', () => {
    render(<SkinConsultationChat skinAnalysis={null} />);

    expect(screen.queryByTestId('quick-questions')).not.toBeInTheDocument();
  });

  it('disables input when skinAnalysis is null', () => {
    render(<SkinConsultationChat skinAnalysis={null} />);

    const input = screen.getByPlaceholderText('먼저 피부 분석을 받아주세요');
    expect(input).toBeDisabled();
  });

  it('enables input when skinAnalysis is provided', () => {
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    const input = screen.getByPlaceholderText('피부 고민을 물어보세요...');
    expect(input).not.toBeDisabled();
  });

  it('sends message and receives response', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    // 메시지 입력
    const input = screen.getByPlaceholderText('피부 고민을 물어보세요...');
    await user.type(input, '피부가 건조해요');

    // 전송 버튼 찾기
    const form = input.closest('form');
    const submitButton = form?.querySelector('button[type="submit"]');
    expect(submitButton).toBeTruthy();
    await user.click(submitButton!);

    // 사용자 메시지 표시
    expect(screen.getByText('피부가 건조해요')).toBeInTheDocument();

    // AI 응답 대기 (API mock은 즉시 응답)
    await waitFor(() => {
      expect(screen.getByText(/보습 케어가 중요해요/)).toBeInTheDocument();
    });

    // fetch가 호출되었는지 확인
    expect(mockFetch).toHaveBeenCalledWith('/api/coach/chat', expect.any(Object));
  });

  it('handles quick question click', async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<SkinConsultationChat skinAnalysis={mockSkinAnalysis} />);

    // 빠른 질문 클릭
    await user.click(screen.getByText('건조함'));

    // 질문 메시지 표시 (질문 내용에 "건조" 포함)
    await waitFor(() => {
      expect(screen.getAllByText(/건조/).length).toBeGreaterThan(1);
    });

    // 응답 대기
    await vi.advanceTimersByTimeAsync(1000);
  });
});
