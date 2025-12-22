import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProductQAPage from '@/app/(main)/products/qa/page';

// Next.js 라우터 모킹
const mockBack = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: mockBack,
  }),
  useSearchParams: () => ({
    get: vi.fn().mockReturnValue(null),
  }),
}));

// RAG 모킹
vi.mock('@/lib/rag/product-qa', () => ({
  askProductQuestion: vi.fn().mockResolvedValue({
    answer: '특정 제품을 선택하면 더 정확한 답변을 드릴 수 있어요.',
    confidence: 'low',
  }),
  FAQ_TEMPLATES: {
    cosmetic: [
      '이 제품 민감성 피부에 괜찮아요?',
      '다른 제품이랑 같이 써도 돼요?',
      '아침/저녁 언제 사용하면 좋아요?',
      '얼마나 오래 사용해야 효과가 나타나요?',
    ],
    supplement: [
      '하루에 몇 알 먹어야 해요?',
      '다른 영양제랑 같이 먹어도 돼요?',
    ],
    workout_equipment: [],
    health_food: [],
  },
}));

describe('ProductQAPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // scrollIntoView 모킹 (jsdom에서 지원하지 않음)
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('페이지를 렌더링한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByTestId('product-qa-page')).toBeInTheDocument();
    expect(screen.getByText('제품 Q&A')).toBeInTheDocument();
  });

  it('FAQ 질문을 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByText('이 제품 민감성 피부에 괜찮아요?')).toBeInTheDocument();
    expect(screen.getByText('다른 제품이랑 같이 써도 돼요?')).toBeInTheDocument();
  });

  it('초기 안내 메시지를 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByText('무엇이든 물어보세요!')).toBeInTheDocument();
    expect(screen.getByText('제품에 대한 궁금한 점을 AI에게 질문해보세요')).toBeInTheDocument();
  });

  it('제품 미선택 시 안내를 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByText('제품을 선택해주세요')).toBeInTheDocument();
    expect(screen.getByText('제품 둘러보기 →')).toBeInTheDocument();
  });

  it('채팅 입력창을 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByPlaceholderText('궁금한 점을 입력하세요...')).toBeInTheDocument();
  });

  it('빈 입력시 전송 버튼이 비활성화된다', () => {
    render(<ProductQAPage />);

    const input = screen.getByPlaceholderText('궁금한 점을 입력하세요...');
    expect(input).toHaveValue('');

    // Send 버튼 찾기 (disabled 상태)
    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.querySelector('[data-testid="lucide-send"]'));
    expect(sendButton).toBeDisabled();
  });

  it('입력 시 전송 버튼이 활성화된다', () => {
    render(<ProductQAPage />);

    const input = screen.getByPlaceholderText('궁금한 점을 입력하세요...');
    fireEvent.change(input, { target: { value: '테스트 질문' } });

    const buttons = screen.getAllByRole('button');
    const sendButton = buttons.find(btn => btn.querySelector('[data-testid="lucide-send"]'));
    expect(sendButton).not.toBeDisabled();
  });

  it('FAQ 클릭 시 메시지를 추가한다', async () => {
    render(<ProductQAPage />);

    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      // 유저 메시지가 표시되어야 함
      const chatMessages = screen.getAllByTestId('chat-message');
      expect(chatMessages.length).toBeGreaterThan(0);
    });
  });

  it('뒤로가기 버튼을 클릭하면 router.back이 호출된다', () => {
    render(<ProductQAPage />);

    // ArrowLeft 아이콘이 있는 버튼 클릭
    const buttons = screen.getAllByRole('button');
    const backButton = buttons.find(btn => btn.querySelector('[data-testid="lucide-arrowleft"]'));

    if (backButton) {
      fireEvent.click(backButton);
      expect(mockBack).toHaveBeenCalled();
    }
  });

  it('AI 안내 문구를 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByText('AI 답변은 참고용이며, 정확한 정보는 제조사에 문의해주세요')).toBeInTheDocument();
  });

  it('자주 묻는 질문 섹션을 표시한다', () => {
    render(<ProductQAPage />);

    expect(screen.getByText('자주 묻는 질문')).toBeInTheDocument();
  });
});
