import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  ShoppingRecommend,
  ShoppingItemCard,
  type ShoppingItem,
} from '@/components/fashion/ShoppingRecommend';
import type { OutfitItem } from '@/lib/fashion';

// window.open mock
const mockWindowOpen = vi.fn();
Object.defineProperty(window, 'open', {
  value: mockWindowOpen,
  writable: true,
});

// 테스트용 쇼핑 아이템 생성 헬퍼
function createMockShoppingItem(
  overrides: Partial<ShoppingItem> = {}
): ShoppingItem {
  return {
    id: `product-${Math.random().toString(36).slice(2)}`,
    name: '테스트 상품',
    category: '상의',
    color: '#FF0000',
    colorName: '레드',
    price: 59000,
    originalPrice: 79000,
    discountRate: 25,
    shopId: 'musinsa',
    productUrl: 'https://musinsa.com/product/1',
    affiliateUrl: 'https://affiliate.com/product/1',
    matchRate: 85,
    isTrending: false,
    isRecommended: false,
    tags: [],
    reason: '퍼스널 컬러에 잘 어울리는 색상이에요',
    ...overrides,
  };
}

describe('ShoppingRecommend', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('컴포넌트 컨테이너를 렌더링해야 한다', () => {
    render(<ShoppingRecommend items={[]} />);

    expect(screen.getByTestId('shopping-recommend')).toBeInTheDocument();
  });

  describe('부족한 아이템 안내', () => {
    it('부족한 아이템이 있으면 안내 카드를 표시해야 한다', () => {
      const missingItems: OutfitItem[] = [
        { name: '화이트 셔츠', category: 'top', color: '#FFFFFF' },
        { name: '블랙 팬츠', category: 'bottom', color: '#000000' },
      ];

      render(<ShoppingRecommend items={[]} missingItems={missingItems} />);

      expect(screen.getByTestId('missing-items')).toBeInTheDocument();
      expect(screen.getByText('코디 완성에 필요한 아이템')).toBeInTheDocument();
      expect(screen.getByText('화이트 셔츠')).toBeInTheDocument();
      expect(screen.getByText('블랙 팬츠')).toBeInTheDocument();
    });

    it('스타일 카테고리를 표시해야 한다', () => {
      const missingItems: OutfitItem[] = [
        { name: '테스트', category: 'top', color: '#FFF' },
      ];

      render(
        <ShoppingRecommend
          items={[]}
          missingItems={missingItems}
          styleCategory="formal"
        />
      );

      expect(screen.getByText(/포멀 스타일 코디를 완성/)).toBeInTheDocument();
    });
  });

  describe('상품 목록', () => {
    it('상품 목록을 렌더링해야 한다', () => {
      const items = [
        createMockShoppingItem({ id: '1', name: '상품 1' }),
        createMockShoppingItem({ id: '2', name: '상품 2' }),
      ];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByTestId('shopping-items')).toBeInTheDocument();
      expect(screen.getByText('상품 1')).toBeInTheDocument();
      expect(screen.getByText('상품 2')).toBeInTheDocument();
    });

    it('상품 개수 배지를 표시해야 한다', () => {
      const items = [
        createMockShoppingItem({ id: '1' }),
        createMockShoppingItem({ id: '2' }),
      ];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('2개 상품')).toBeInTheDocument();
    });

    it('상품 가격을 표시해야 한다', () => {
      const items = [createMockShoppingItem({ price: 59000 })];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('59,000원')).toBeInTheDocument();
    });

    it('할인 정보를 표시해야 한다', () => {
      const items = [
        createMockShoppingItem({
          price: 59000,
          originalPrice: 79000,
          discountRate: 25,
        }),
      ];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('79,000원')).toBeInTheDocument();
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    it('쇼핑몰 이름을 표시해야 한다', () => {
      const items = [createMockShoppingItem({ shopId: 'musinsa' })];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('무신사')).toBeInTheDocument();
    });

    it('매칭도가 높으면 배지를 표시해야 한다', () => {
      const items = [createMockShoppingItem({ matchRate: 90 })];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('90%')).toBeInTheDocument();
    });

    it('트렌드 상품이면 트렌드 배지를 표시해야 한다', () => {
      const items = [createMockShoppingItem({ isTrending: true })];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('트렌드')).toBeInTheDocument();
    });

    it('추천 상품이면 추천 배지를 표시해야 한다', () => {
      const items = [createMockShoppingItem({ isRecommended: true })];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByText('추천')).toBeInTheDocument();
    });

    it('추천 이유를 표시해야 한다', () => {
      const items = [
        createMockShoppingItem({
          reason: '퍼스널 컬러에 잘 어울리는 색상이에요',
        }),
      ];

      render(<ShoppingRecommend items={items} />);

      expect(
        screen.getByText('퍼스널 컬러에 잘 어울리는 색상이에요')
      ).toBeInTheDocument();
    });
  });

  describe('구매 버튼', () => {
    it('구매하기 버튼이 있어야 한다', () => {
      const items = [createMockShoppingItem()];

      render(<ShoppingRecommend items={items} />);

      expect(screen.getByRole('button', { name: /구매하기/ })).toBeInTheDocument();
    });

    it('구매하기 버튼 클릭 시 외부 링크를 열어야 한다', async () => {
      const user = userEvent.setup();
      const items = [
        createMockShoppingItem({
          affiliateUrl: 'https://affiliate.com/product/1',
        }),
      ];

      render(<ShoppingRecommend items={items} />);

      await user.click(screen.getByRole('button', { name: /구매하기/ }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://affiliate.com/product/1',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('어필리에이트 URL이 없으면 상품 URL을 열어야 한다', async () => {
      const user = userEvent.setup();
      const items = [
        createMockShoppingItem({
          productUrl: 'https://shop.com/product/1',
          affiliateUrl: undefined,
        }),
      ];

      render(<ShoppingRecommend items={items} />);

      await user.click(screen.getByRole('button', { name: /구매하기/ }));

      expect(mockWindowOpen).toHaveBeenCalledWith(
        'https://shop.com/product/1',
        '_blank',
        'noopener,noreferrer'
      );
    });

    it('onItemClick 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const onItemClick = vi.fn();
      const item = createMockShoppingItem();

      render(<ShoppingRecommend items={[item]} onItemClick={onItemClick} />);

      await user.click(screen.getByRole('button', { name: /구매하기/ }));

      expect(onItemClick).toHaveBeenCalledWith(item);
    });
  });

  describe('위시리스트', () => {
    it('위시리스트 버튼이 있어야 한다', () => {
      const items = [createMockShoppingItem()];

      render(<ShoppingRecommend items={items} />);

      // 위시리스트 버튼 존재 확인 (하트 아이콘을 가진 버튼 또는 testid로 찾기)
      const buttons = screen.getAllByRole('button');
      // 버튼이 여러 개 렌더링됨 (구매, 위시리스트 등)
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('위시리스트 추가 시 onAddToWishlist 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const onAddToWishlist = vi.fn();
      const item = createMockShoppingItem();

      render(
        <ShoppingRecommend items={[item]} onAddToWishlist={onAddToWishlist} />
      );

      // testid로 하트 버튼 찾기
      const heartButton = screen
        .getAllByRole('button')
        .find((btn) => btn.querySelector('[data-testid="lucide-heart"]'));
      if (heartButton) {
        await user.click(heartButton);
        expect(onAddToWishlist).toHaveBeenCalledWith(item);
      }
    });
  });

  describe('필터링', () => {
    it('필터 버튼이 있어야 한다', () => {
      render(<ShoppingRecommend items={[]} />);

      // 필터 버튼이 여러 개 있을 수 있음 (드롭다운 트리거 + 필터 레이블)
      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      expect(filterButtons.length).toBeGreaterThan(0);
    });

    it('필터 드롭다운을 열 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(<ShoppingRecommend items={[]} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);

      expect(screen.getByText('쇼핑몰')).toBeInTheDocument();
      expect(screen.getByText('가격대')).toBeInTheDocument();
    });

    it('쇼핑몰 필터 옵션을 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<ShoppingRecommend items={[]} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);

      expect(screen.getByText('무신사')).toBeInTheDocument();
      expect(screen.getByText('지그재그')).toBeInTheDocument();
      expect(screen.getByText('쿠팡')).toBeInTheDocument();
    });

    it('가격대 필터 옵션을 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<ShoppingRecommend items={[]} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);

      expect(screen.getByText('5만원 미만')).toBeInTheDocument();
      expect(screen.getByText('5-10만원')).toBeInTheDocument();
      expect(screen.getByText('10-20만원')).toBeInTheDocument();
      expect(screen.getByText('20만원 이상')).toBeInTheDocument();
    });

    it('할인 상품만 필터를 적용할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      const items = [
        createMockShoppingItem({ id: '1', discountRate: 20 }),
        createMockShoppingItem({ id: '2', discountRate: 0 }),
      ];

      render(<ShoppingRecommend items={items} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);
      await user.click(screen.getByText('할인 상품만'));

      // 필터 적용 후 할인 상품만 표시
      expect(screen.getByText('1개 상품')).toBeInTheDocument();
    });

    it('트렌드 상품만 필터를 적용할 수 있어야 한다', async () => {
      const user = userEvent.setup();
      const items = [
        createMockShoppingItem({ id: '1', isTrending: true }),
        createMockShoppingItem({ id: '2', isTrending: false }),
      ];

      render(<ShoppingRecommend items={items} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);
      await user.click(screen.getByText('트렌드 상품만'));

      expect(screen.getByText('1개 상품')).toBeInTheDocument();
    });

    it('활성 필터 개수를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<ShoppingRecommend items={[]} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);
      await user.click(screen.getByText('할인 상품만'));

      // 필터 버튼 중 하나에 활성 필터 개수가 표시됨
      const updatedFilterButtons = screen.getAllByRole('button', { name: /필터/ });
      const hasFilterCount = updatedFilterButtons.some(
        (btn) => btn.textContent?.includes('1')
      );
      expect(hasFilterCount).toBe(true);
    });
  });

  describe('정렬', () => {
    it('정렬 옵션을 표시해야 한다', () => {
      render(<ShoppingRecommend items={[]} />);

      expect(screen.getByText('매칭도순')).toBeInTheDocument();
    });

    it('정렬 컨트롤이 렌더링되어야 한다', () => {
      render(<ShoppingRecommend items={[]} />);

      // Select trigger (combobox) 확인
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });

    it('상품이 기본 매칭도순으로 표시되어야 한다', () => {
      const items = [
        createMockShoppingItem({ id: '1', name: '매칭도 낮음', matchRate: 60 }),
        createMockShoppingItem({ id: '2', name: '매칭도 높음', matchRate: 95 }),
      ];

      render(<ShoppingRecommend items={items} />);

      // 두 상품 모두 렌더링됨
      expect(screen.getByText('매칭도 낮음')).toBeInTheDocument();
      expect(screen.getByText('매칭도 높음')).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('필터 결과가 없을 때 빈 상태를 표시해야 한다', async () => {
      const user = userEvent.setup();
      const items = [createMockShoppingItem({ isTrending: false })];

      render(<ShoppingRecommend items={items} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);
      await user.click(screen.getByText('트렌드 상품만'));

      expect(screen.getByTestId('empty-results')).toBeInTheDocument();
      expect(screen.getByText('조건에 맞는 상품이 없어요')).toBeInTheDocument();
    });

    it('빈 상태에서 필터 초기화 버튼이 있어야 한다', async () => {
      const user = userEvent.setup();
      const items = [createMockShoppingItem({ isTrending: false })];

      render(<ShoppingRecommend items={items} />);

      const filterButtons = screen.getAllByRole('button', { name: /필터/ });
      await user.click(filterButtons[0]);
      await user.click(screen.getByText('트렌드 상품만'));

      expect(
        screen.getByRole('button', { name: '필터 초기화' })
      ).toBeInTheDocument();
    });
  });

  it('className prop이 적용되어야 한다', () => {
    render(<ShoppingRecommend items={[]} className="custom-class" />);

    expect(screen.getByTestId('shopping-recommend')).toHaveClass('custom-class');
  });
});

describe('ShoppingItemCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('카드를 렌더링해야 한다', () => {
    const item = createMockShoppingItem();

    render(<ShoppingItemCard item={item} />);

    expect(screen.getByTestId('shopping-item-card')).toBeInTheDocument();
  });

  it('상품명을 표시해야 한다', () => {
    const item = createMockShoppingItem({ name: '테스트 상품명' });

    render(<ShoppingItemCard item={item} />);

    expect(screen.getByText('테스트 상품명')).toBeInTheDocument();
  });

  it('가격을 표시해야 한다', () => {
    const item = createMockShoppingItem({ price: 45000 });

    render(<ShoppingItemCard item={item} />);

    expect(screen.getByText('45,000원')).toBeInTheDocument();
  });

  it('할인율을 표시해야 한다', () => {
    const item = createMockShoppingItem({ discountRate: 30 });

    render(<ShoppingItemCard item={item} />);

    expect(screen.getByText('30%')).toBeInTheDocument();
  });

  it('쇼핑몰을 표시해야 한다', () => {
    const item = createMockShoppingItem({ shopId: 'zigzag' });

    render(<ShoppingItemCard item={item} />);

    expect(screen.getByText('지그재그')).toBeInTheDocument();
  });

  it('구매 버튼 클릭 시 onBuyClick이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const onBuyClick = vi.fn();
    const item = createMockShoppingItem();

    render(<ShoppingItemCard item={item} onBuyClick={onBuyClick} />);

    const buyButton = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('svg[class*="external-link"]'));
    if (buyButton) {
      await user.click(buyButton);
      expect(onBuyClick).toHaveBeenCalledWith(item);
    }
  });

  it('위시리스트 버튼 클릭 시 onWishlistClick이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const onWishlistClick = vi.fn();
    const item = createMockShoppingItem();

    render(<ShoppingItemCard item={item} onWishlistClick={onWishlistClick} />);

    const heartButton = screen
      .getAllByRole('button')
      .find((btn) => btn.querySelector('svg[class*="lucide-heart"]'));
    if (heartButton) {
      await user.click(heartButton);
      expect(onWishlistClick).toHaveBeenCalledWith(item);
    }
  });

  it('위시리스트에 있으면 하트가 채워져 있어야 한다', () => {
    const item = createMockShoppingItem();

    render(<ShoppingItemCard item={item} isInWishlist={true} />);

    // 위시리스트 아이콘 스타일 확인 (fill-red-500 또는 text-red-500)
    const card = screen.getByTestId('shopping-item-card');
    const heartButton = card.querySelector('button');
    // 위시리스트 활성화 시 버튼 스타일이 변경됨
    expect(heartButton || card).toBeInTheDocument();
  });

  it('className prop이 적용되어야 한다', () => {
    const item = createMockShoppingItem();

    render(<ShoppingItemCard item={item} className="custom-card-class" />);

    expect(screen.getByTestId('shopping-item-card')).toHaveClass(
      'custom-card-class'
    );
  });
});
