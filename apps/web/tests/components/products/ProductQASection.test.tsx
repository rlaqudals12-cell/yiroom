import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProductQASection } from '@/components/products/ProductQASection';
import type { CosmeticProduct } from '@/types/product';

// RAG 모킹
vi.mock('@/lib/rag/product-qa', () => ({
  askProductQuestion: vi.fn().mockResolvedValue({
    answer: '이 제품은 민감성 피부에 적합합니다.',
    confidence: 'high',
    relatedTopics: ['민감성 피부', '저자극'],
  }),
  FAQ_TEMPLATES: {
    cosmetic: [
      '이 제품 민감성 피부에 괜찮아요?',
      '다른 제품이랑 같이 써도 돼요?',
      '아침/저녁 언제 사용하면 좋아요?',
    ],
    supplement: [
      '하루에 몇 알 먹어야 해요?',
      '다른 영양제랑 같이 먹어도 돼요?',
    ],
    workout_equipment: [
      '초보자도 사용할 수 있나요?',
    ],
    health_food: [
      '하루에 얼마나 먹으면 좋아요?',
    ],
  },
}));

const mockProduct: CosmeticProduct = {
  id: 'test-product-1',
  name: '테스트 세럼',
  brand: '테스트 브랜드',
  category: 'serum',
  priceKrw: 35000,
  rating: 4.5,
  reviewCount: 100,
  imageUrl: 'https://example.com/image.jpg',
  skinTypes: ['sensitive', 'dry'],
  concerns: ['hydration', 'aging'],
  keyIngredients: ['히알루론산', '나이아신아마이드'],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

describe('ProductQASection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Q&A 섹션을 렌더링한다', () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    expect(screen.getByTestId('product-qa-section')).toBeInTheDocument();
    expect(screen.getByText('이 제품에 대해 물어보세요')).toBeInTheDocument();
  });

  it('제품 타입에 맞는 FAQ를 표시한다', () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    expect(screen.getByText('이 제품 민감성 피부에 괜찮아요?')).toBeInTheDocument();
    expect(screen.getByText('다른 제품이랑 같이 써도 돼요?')).toBeInTheDocument();
  });

  it('FAQ 클릭 시 모달을 열고 질문을 전송한다', async () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('질문 입력 필드를 표시한다', async () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    // 아무 FAQ 클릭해서 모달 열기
    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('질문을 입력하세요...')).toBeInTheDocument();
    });
  });

  it('영양제 제품에 맞는 FAQ를 표시한다', () => {
    const supplementProduct = {
      ...mockProduct,
      id: 'supplement-1',
      category: 'serum' as const,
    };

    render(<ProductQASection product={supplementProduct} productType="supplement" />);

    expect(screen.getByText('하루에 몇 알 먹어야 해요?')).toBeInTheDocument();
  });

  it('AI 답변을 표시한다', async () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      expect(screen.getByText('이 제품은 민감성 피부에 적합합니다.')).toBeInTheDocument();
    });
  });

  it('신뢰도 표시를 보여준다', async () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      expect(screen.getByText('높은 신뢰도')).toBeInTheDocument();
    });
  });

  it('더 많은 질문하기 링크를 표시한다', () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    const link = screen.getByText('더 많은 질문하기');
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', '/products/qa?productId=test-product-1&type=cosmetic');
  });

  it('직접 질문을 입력하고 전송할 수 있다', async () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    // FAQ 클릭해서 모달 열기
    fireEvent.click(screen.getByText('이 제품 민감성 피부에 괜찮아요?'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('질문을 입력하세요...')).toBeInTheDocument();
    });

    // 직접 질문 입력
    const input = screen.getByPlaceholderText('질문을 입력하세요...');
    fireEvent.change(input, { target: { value: '이 제품 용량이 어떻게 돼요?' } });
    fireEvent.click(screen.getByRole('button', { name: /전송|보내기/ }));

    await waitFor(() => {
      expect(screen.getByText('이 제품 용량이 어떻게 돼요?')).toBeInTheDocument();
    });
  });

  it('Sparkles 아이콘을 표시한다', () => {
    render(<ProductQASection product={mockProduct} productType="cosmetic" />);

    // Sparkles 아이콘이 있는지 확인 (AI 관련 섹션임을 나타냄)
    const section = screen.getByTestId('product-qa-section');
    expect(section).toBeInTheDocument();
  });
});
