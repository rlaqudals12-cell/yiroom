import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ClosetIntegration, MatchScoreCard } from '@/components/fashion/ClosetIntegration';
import type { MatchScore, ClosetRecommendation } from '@/lib/inventory/closetMatcher';
import type { InventoryItem, ClothingMetadata } from '@/types/inventory';

// 옷장 아이템 타입
type ClosetItem = InventoryItem;

// 테스트용 옷장 아이템 생성 헬퍼
function createMockClosetItem(overrides: Partial<ClosetItem> = {}): ClosetItem {
  return {
    id: `item-${Math.random().toString(36).slice(2)}`,
    clerkUserId: 'test-user',
    category: 'closet',
    subCategory: 'top',
    name: '테스트 아이템',
    imageUrl: 'https://example.com/image.jpg',
    originalImageUrl: null,
    brand: null,
    tags: [],
    isFavorite: false,
    useCount: 0,
    lastUsedAt: null,
    expiryDate: null,
    metadata: {
      color: ['#FF0000'],
      season: ['spring'],
      occasion: ['casual'],
    } as ClothingMetadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  } as ClosetItem;
}

// 테스트용 매칭 점수 생성 헬퍼
function createMockMatchScore(overrides: Partial<MatchScore> = {}): MatchScore {
  return {
    total: 75,
    colorScore: 80,
    bodyTypeScore: 70,
    seasonScore: 75,
    styleScore: 65,
    trendBonus: 5,
    ...overrides,
  };
}

// 테스트용 옷장 추천 생성 헬퍼
function createMockClosetRecommendation(
  overrides: Partial<ClosetRecommendation> = {}
): ClosetRecommendation {
  return {
    item: createMockClosetItem(),
    score: createMockMatchScore(),
    reasons: ['컬러가 잘 어울려요', '체형에 맞는 핏이에요'],
    ...overrides,
  };
}

describe('ClosetIntegration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('컴포넌트 컨테이너를 렌더링해야 한다', () => {
    render(<ClosetIntegration closetItems={[]} />);

    expect(screen.getByTestId('closet-integration')).toBeInTheDocument();
  });

  describe('매칭 점수 요약', () => {
    it('매칭 점수가 있으면 요약 카드를 표시해야 한다', () => {
      const matchScore = createMockMatchScore({ total: 85 });

      render(
        <ClosetIntegration closetItems={[]} matchScore={matchScore} />
      );

      expect(screen.getByTestId('match-score-summary')).toBeInTheDocument();
      expect(screen.getByText('매칭 분석')).toBeInTheDocument();
    });

    it('총점을 표시해야 한다', () => {
      const matchScore = createMockMatchScore({ total: 85 });

      render(
        <ClosetIntegration closetItems={[]} matchScore={matchScore} />
      );

      expect(screen.getByText('85점')).toBeInTheDocument();
    });

    it('등급을 표시해야 한다', () => {
      const matchScore = createMockMatchScore({ total: 92 });

      render(
        <ClosetIntegration closetItems={[]} matchScore={matchScore} />
      );

      expect(screen.getByText('완벽')).toBeInTheDocument();
    });

    it('상세 점수들을 표시해야 한다', () => {
      const matchScore = createMockMatchScore({
        colorScore: 80,
        bodyTypeScore: 70,
        seasonScore: 75,
        styleScore: 65,
      });

      render(
        <ClosetIntegration closetItems={[]} matchScore={matchScore} />
      );

      const scoreDetails = screen.getByTestId('score-details');
      expect(within(scoreDetails).getByText('색상 조화')).toBeInTheDocument();
      expect(within(scoreDetails).getByText('체형 적합도')).toBeInTheDocument();
      expect(within(scoreDetails).getByText('계절 적합도')).toBeInTheDocument();
      expect(within(scoreDetails).getByText('스타일 매칭')).toBeInTheDocument();
    });

    it('트렌드 보너스가 있으면 배지를 표시해야 한다', () => {
      const matchScore = createMockMatchScore({ trendBonus: 10 });

      render(
        <ClosetIntegration closetItems={[]} matchScore={matchScore} />
      );

      expect(screen.getByText(/트렌드 보너스/)).toBeInTheDocument();
      expect(screen.getByText(/\+10/)).toBeInTheDocument();
    });

    it('스타일 카테고리를 표시해야 한다', () => {
      const matchScore = createMockMatchScore();

      render(
        <ClosetIntegration
          closetItems={[]}
          matchScore={matchScore}
          styleCategory="formal"
        />
      );

      expect(screen.getByText(/포멀 스타일 기준/)).toBeInTheDocument();
    });
  });

  describe('옷장 추천 아이템', () => {
    it('추천 아이템 목록을 표시해야 한다', () => {
      const recommendations = [
        createMockClosetRecommendation({
          item: createMockClosetItem({ name: '화이트 셔츠' }),
        }),
        createMockClosetRecommendation({
          item: createMockClosetItem({ name: '블랙 팬츠' }),
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      expect(screen.getByTestId('closet-recommendations')).toBeInTheDocument();
      expect(screen.getByText('화이트 셔츠')).toBeInTheDocument();
      expect(screen.getByText('블랙 팬츠')).toBeInTheDocument();
    });

    it('아이템 점수를 표시해야 한다', () => {
      const recommendations = [
        createMockClosetRecommendation({
          item: createMockClosetItem({ name: '테스트 아이템' }),
          score: createMockMatchScore({ total: 85 }),
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      expect(screen.getByText('85점')).toBeInTheDocument();
    });

    it('아이템 색상 미리보기를 표시해야 한다', () => {
      const recommendations = [
        createMockClosetRecommendation({
          item: createMockClosetItem({
            metadata: { color: ['#FF5733'], season: ['spring'], occasion: ['casual'] },
          }),
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      const colorPreview = item.querySelector('[style*="background-color"]');
      expect(colorPreview).toBeInTheDocument();
    });

    it('아이템 확장 시 추천 이유를 표시해야 한다', async () => {
      const user = userEvent.setup();
      const recommendations = [
        createMockClosetRecommendation({
          reasons: ['컬러가 잘 어울려요', '체형에 맞는 핏이에요'],
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      // Accordion trigger 클릭
      const item = screen.getByTestId('closet-item-0');
      const trigger = within(item).getByRole('button');
      await user.click(trigger);

      expect(screen.getByText('컬러가 잘 어울려요')).toBeInTheDocument();
      expect(screen.getByText('체형에 맞는 핏이에요')).toBeInTheDocument();
    });

    it('아이템 확장 시 상세 점수를 표시해야 한다', async () => {
      const user = userEvent.setup();
      const recommendations = [
        createMockClosetRecommendation({
          score: createMockMatchScore({
            colorScore: 80,
            bodyTypeScore: 70,
            seasonScore: 75,
            styleScore: 65,
          }),
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      const trigger = within(item).getByRole('button');
      await user.click(trigger);

      expect(screen.getByText('색상')).toBeInTheDocument();
      expect(screen.getByText('체형')).toBeInTheDocument();
      expect(screen.getByText('계절')).toBeInTheDocument();
      expect(screen.getByText('스타일')).toBeInTheDocument();
    });
  });

  describe('아이템 선택', () => {
    it('아이템 선택 버튼이 있어야 한다', async () => {
      const user = userEvent.setup();
      const recommendations = [createMockClosetRecommendation()];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      const trigger = within(item).getByRole('button');
      await user.click(trigger);

      expect(screen.getByRole('button', { name: '코디에 추가' })).toBeInTheDocument();
    });

    it('아이템 선택 시 onItemSelect 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const onItemSelect = vi.fn();
      const mockItem = createMockClosetItem({ name: '선택할 아이템' });
      const recommendations = [
        createMockClosetRecommendation({ item: mockItem }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
          onItemSelect={onItemSelect}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      const trigger = within(item).getByRole('button');
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: '코디에 추가' }));

      expect(onItemSelect).toHaveBeenCalledWith(mockItem);
    });

    it('선택된 아이템은 "선택됨" 버튼으로 변경되어야 한다', async () => {
      const user = userEvent.setup();
      const recommendations = [createMockClosetRecommendation()];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      const trigger = within(item).getByRole('button');
      await user.click(trigger);
      await user.click(screen.getByRole('button', { name: '코디에 추가' }));

      expect(screen.getByRole('button', { name: /선택됨/ })).toBeInTheDocument();
    });

    it('선택된 아이템 요약이 표시되어야 한다', async () => {
      const user = userEvent.setup();
      const recommendations = [
        createMockClosetRecommendation(),
        createMockClosetRecommendation({
          item: createMockClosetItem({ id: 'item-2', name: '아이템 2' }),
        }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
        />
      );

      // 첫 번째 아이템 선택
      const item0 = screen.getByTestId('closet-item-0');
      await user.click(within(item0).getByRole('button'));
      await user.click(screen.getByRole('button', { name: '코디에 추가' }));

      expect(screen.getByTestId('selected-items-summary')).toBeInTheDocument();
      expect(screen.getByText(/1개 아이템 선택됨/)).toBeInTheDocument();
    });

    it('코디 완성 버튼 클릭 시 onCompleteOutfit 콜백이 호출되어야 한다', async () => {
      const user = userEvent.setup();
      const onCompleteOutfit = vi.fn();
      const mockItem = createMockClosetItem();
      const recommendations = [
        createMockClosetRecommendation({ item: mockItem }),
      ];

      render(
        <ClosetIntegration
          closetItems={[]}
          closetRecommendations={recommendations}
          onCompleteOutfit={onCompleteOutfit}
        />
      );

      const item = screen.getByTestId('closet-item-0');
      await user.click(within(item).getByRole('button'));
      await user.click(screen.getByRole('button', { name: '코디에 추가' }));
      await user.click(screen.getByRole('button', { name: /코디 완성/ }));

      expect(onCompleteOutfit).toHaveBeenCalledWith([mockItem]);
    });
  });

  describe('빈 상태', () => {
    it('옷장이 비어있을 때 빈 상태를 표시해야 한다', () => {
      render(<ClosetIntegration closetItems={[]} />);

      expect(screen.getByTestId('empty-closet')).toBeInTheDocument();
      expect(screen.getByText('옷장이 비어 있어요')).toBeInTheDocument();
    });

    it('빈 상태에서 아이템 추가 버튼이 있어야 한다', () => {
      render(<ClosetIntegration closetItems={[]} />);

      expect(
        screen.getByRole('button', { name: '옷장에 아이템 추가하기' })
      ).toBeInTheDocument();
    });
  });

  it('className prop이 적용되어야 한다', () => {
    render(<ClosetIntegration closetItems={[]} className="custom-class" />);

    expect(screen.getByTestId('closet-integration')).toHaveClass('custom-class');
  });
});

describe('MatchScoreCard', () => {
  it('매칭 점수 카드를 렌더링해야 한다', () => {
    const score = createMockMatchScore({ total: 85 });

    render(<MatchScoreCard score={score} />);

    expect(screen.getByTestId('match-score-card')).toBeInTheDocument();
  });

  it('제목을 표시해야 한다', () => {
    const score = createMockMatchScore();

    render(<MatchScoreCard score={score} title="커스텀 제목" />);

    expect(screen.getByText('커스텀 제목')).toBeInTheDocument();
  });

  it('총점을 표시해야 한다', () => {
    const score = createMockMatchScore({ total: 92 });

    render(<MatchScoreCard score={score} />);

    expect(screen.getByText('92')).toBeInTheDocument();
  });

  it('등급을 표시해야 한다', () => {
    const score = createMockMatchScore({ total: 85 });

    render(<MatchScoreCard score={score} />);

    expect(screen.getByText('아주 좋음')).toBeInTheDocument();
  });

  it('상세 점수들을 표시해야 한다', () => {
    const score = createMockMatchScore({
      colorScore: 80,
      bodyTypeScore: 70,
      seasonScore: 75,
      styleScore: 65,
    });

    render(<MatchScoreCard score={score} />);

    expect(screen.getByText('색상 조화')).toBeInTheDocument();
    expect(screen.getByText('체형 적합도')).toBeInTheDocument();
    expect(screen.getByText('계절 적합도')).toBeInTheDocument();
    expect(screen.getByText('스타일 매칭')).toBeInTheDocument();
  });

  it('트렌드 보너스가 있으면 표시해야 한다', () => {
    const score = createMockMatchScore({ trendBonus: 5 });

    render(<MatchScoreCard score={score} />);

    expect(screen.getByText('트렌드 보너스')).toBeInTheDocument();
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('className prop이 적용되어야 한다', () => {
    const score = createMockMatchScore();

    render(<MatchScoreCard score={score} className="custom-class" />);

    expect(screen.getByTestId('match-score-card')).toHaveClass('custom-class');
  });
});
