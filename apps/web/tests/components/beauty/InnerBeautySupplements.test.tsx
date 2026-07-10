/**
 * InnerBeautySupplements 테스트
 * 이너뷰티 실제품 연결(2026-07-08): supplement_products 실DB에서 피부 효능(skin) 제품을
 * 콜라겐/비타민/오메가 카테고리별 1개씩 노출. 함량은 지어내지 않는다.
 *
 * 수수료 귀속(2026-07-11): 구매 클릭은 생 <a> 직행이 아니라
 * 어필리에이트 게이트웨이(openAffiliateLink) 경유 — 클릭 트래킹 + 쿠팡 태깅.
 * affiliate_url이 있으면 purchase_url보다 우선한다.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// 실DB 형태의 mock 행 (가격 오름차순 정렬로 반환된다고 가정)
const mockSupplementRows = [
  {
    id: 'supp-vit-1',
    name: '비타민C 1000',
    brand: '고려은단',
    category: 'vitamin',
    price_krw: 15000,
    purchase_url: 'https://www.coupang.com/np/search?q=%EB%B9%84%ED%83%80%EB%AF%BCC',
    affiliate_url: null,
  },
  {
    id: 'supp-vit-2',
    name: '비타민E 400IU',
    brand: '뉴트리코스트',
    category: 'vitamin',
    price_krw: 18000,
    purchase_url: 'https://example.com/vitamin-e',
    affiliate_url: null,
  },
  {
    id: 'supp-omega-1',
    name: '알티지 오메가3',
    brand: '뉴트리원',
    category: 'omega',
    price_krw: 28000,
    purchase_url: 'https://example.com/omega',
    // 어필리에이트 링크가 있으면 우선 사용
    affiliate_url: 'https://www.coupang.com/vp/products/999?lptag=AF1075777',
  },
  {
    id: 'supp-col-1',
    name: '저분자 콜라겐 펩타이드',
    brand: '뉴트리디데이',
    category: 'collagen',
    price_krw: 38000,
    purchase_url: null, // 구매 링크 없는 제품 — 링크 미표시
    affiliate_url: null,
  },
];

let mockData: typeof mockSupplementRows | [] = mockSupplementRows;
let mockError: { message: string } | null = null;

function createQueryMock() {
  const query: Record<string, unknown> = {};
  for (const method of ['select', 'eq', 'in', 'contains', 'order', 'limit']) {
    query[method] = vi.fn().mockReturnValue(query);
  }
  (query as { then?: unknown }).then = (
    resolve: (value: { data: typeof mockData; error: typeof mockError }) => void
  ) => resolve({ data: mockData, error: mockError });
  return query;
}

vi.mock('@/lib/supabase/clerk-client', () => ({
  useClerkSupabaseClient: () => ({ from: () => createQueryMock() }),
}));

vi.mock('@clerk/nextjs', () => ({
  useAuth: () => ({ userId: 'user_test_1' }),
}));

// 게이트웨이 mock — 생 <a> 대신 이 경로를 타는지 검증
const openAffiliateLinkMock = vi.fn();
vi.mock('@/lib/products/affiliate', () => ({
  openAffiliateLink: (...args: unknown[]) => openAffiliateLinkMock(...args),
}));

import { InnerBeautySupplements } from '@/components/beauty/InnerBeautySupplements';

describe('InnerBeautySupplements', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockData = mockSupplementRows;
    mockError = null;
  });

  it('콜라겐/비타민/오메가 카테고리별 1개씩만 노출한다', async () => {
    render(<InnerBeautySupplements />);

    expect(await screen.findByTestId('beauty-supplement-products')).toBeInTheDocument();
    // 카테고리별 첫 번째(최저가) 제품만
    expect(screen.getByText('비타민C 1000')).toBeInTheDocument();
    expect(screen.getByText('알티지 오메가3')).toBeInTheDocument();
    expect(screen.getByText('저분자 콜라겐 펩타이드')).toBeInTheDocument();
    // 같은 카테고리 두 번째 제품은 미표시
    expect(screen.queryByText('비타민E 400IU')).not.toBeInTheDocument();
  });

  it('실데이터 그대로 브랜드·가격을 표시하고 구매 클릭은 게이트웨이를 경유한다', async () => {
    render(<InnerBeautySupplements />);
    await screen.findByText('비타민C 1000');

    expect(screen.getByText(/고려은단/)).toBeInTheDocument();
    expect(screen.getByText('15,000원')).toBeInTheDocument();

    const buyButton = screen.getByLabelText('비타민C 1000 구매 페이지 열기');
    fireEvent.click(buyButton);

    // 재발 방지: 생 <a> href 직행이 아니라 트래킹+태깅 게이트웨이 호출
    expect(openAffiliateLinkMock).toHaveBeenCalledWith(
      'https://www.coupang.com/np/search?q=%EB%B9%84%ED%83%80%EB%AF%BCC',
      'supplement',
      'supp-vit-1',
      'user_test_1'
    );
    // 생 <a>가 남아있지 않음
    expect(buyButton.tagName).toBe('BUTTON');
    expect(buyButton).not.toHaveAttribute('href');
  });

  it('affiliate_url이 있으면 purchase_url보다 우선한다 (수수료 귀속)', async () => {
    render(<InnerBeautySupplements />);
    await screen.findByText('알티지 오메가3');

    fireEvent.click(screen.getByLabelText('알티지 오메가3 구매 페이지 열기'));

    expect(openAffiliateLinkMock).toHaveBeenCalledWith(
      'https://www.coupang.com/vp/products/999?lptag=AF1075777',
      'supplement',
      'supp-omega-1',
      'user_test_1'
    );
  });

  it('구매 링크가 없는 제품은 링크를 표시하지 않는다', async () => {
    render(<InnerBeautySupplements />);
    await screen.findByText('저분자 콜라겐 펩타이드');

    expect(
      screen.queryByLabelText('저분자 콜라겐 펩타이드 구매 페이지 열기')
    ).not.toBeInTheDocument();
  });

  it('함량·복용법 확인 안내를 표시한다 (함량을 지어내지 않음)', async () => {
    render(<InnerBeautySupplements />);
    await screen.findByText('비타민C 1000');

    expect(screen.getByText('함량·복용법은 제품 정보에서 확인하세요.')).toBeInTheDocument();
  });

  it('데이터가 없으면 아무것도 렌더링하지 않는다 (가짜 제품 없음)', async () => {
    mockData = [];
    const { container } = render(<InnerBeautySupplements />);

    // 비동기 로드 완료 대기
    await vi.waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });

  it('조회 에러 시에도 조용히 미표시한다 (섹션 안내 문구만 남음)', async () => {
    mockError = { message: 'boom' };
    mockData = [];
    const { container } = render(<InnerBeautySupplements />);

    await vi.waitFor(() => {
      expect(container).toBeEmptyDOMElement();
    });
  });
});
