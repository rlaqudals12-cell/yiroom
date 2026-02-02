import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StyleGallery } from '@/components/fashion/StyleGallery';

// lib/fashion mock
vi.mock('@/lib/fashion', () => ({
  getStyleBest10: vi.fn((category) => ({
    category,
    label: `${category} 라벨`,
    description: `${category} 설명`,
    outfits: [
      {
        id: '1',
        name: '코디 1',
        description: '설명 1',
        items: [{ name: '아이템1', category: 'top', color: '#FF0000' }],
        occasions: ['casual'],
        seasons: ['spring'],
        personalColors: ['Spring'],
      },
      {
        id: '2',
        name: '코디 2',
        description: '설명 2',
        items: [{ name: '아이템2', category: 'bottom', color: '#00FF00', tags: ['트렌드'] }],
        occasions: ['date'],
        seasons: ['summer'],
        personalColors: ['Summer'],
      },
    ],
  })),
  getAllStyleBest10: vi.fn(() => []),
  filterByPersonalColor: vi.fn((outfits, color) => outfits.filter((o: any) => o.personalColors.includes(color))),
  filterBySeason: vi.fn((outfits, season) => outfits.filter((o: any) => o.seasons.includes(season))),
  filterByOccasion: vi.fn((outfits, occasion) => outfits.filter((o: any) => o.occasions.includes(occasion))),
  isTrendItem2026: vi.fn((name: string) => name.includes('그래픽') || name.includes('트렌드')),
  STYLE_CATEGORY_LABELS: {
    casual: '캐주얼',
    formal: '포멀',
    street: '스트릿',
    minimal: '미니멀',
    sporty: '스포티',
    classic: '클래식',
    preppy: '프레피',
    hiphop: '힙합',
    romantic: '로맨틱',
    workwear: '워크웨어',
  },
}));

describe('StyleGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('갤러리 컨테이너를 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByTestId('style-gallery')).toBeInTheDocument();
  });

  it('스타일 카테고리 탭들을 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByTestId('category-tab-casual')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-formal')).toBeInTheDocument();
    expect(screen.getByTestId('category-tab-street')).toBeInTheDocument();
  });

  it('초기 카테고리가 선택되어야 한다', () => {
    render(<StyleGallery initialCategory="formal" />);

    const formalTab = screen.getByTestId('category-tab-formal');
    expect(formalTab).toHaveAttribute('data-state', 'active');
  });

  it('카테고리 탭 클릭 시 해당 컨텐츠가 표시되어야 한다', async () => {
    const user = userEvent.setup();
    render(<StyleGallery />);

    await user.click(screen.getByTestId('category-tab-street'));

    expect(screen.getByTestId('category-tab-street')).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('필터 버튼을 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByRole('button', { name: /필터/ })).toBeInTheDocument();
  });

  it('정렬 옵션을 렌더링해야 한다', () => {
    render(<StyleGallery />);

    // Select trigger should exist
    expect(screen.getByText('기본 순서')).toBeInTheDocument();
  });

  it('그리드/리스트 뷰 토글을 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByLabelText('그리드 보기')).toBeInTheDocument();
    expect(screen.getByLabelText('리스트 보기')).toBeInTheDocument();
  });

  it('기본적으로 그리드 뷰가 활성화되어야 한다', () => {
    render(<StyleGallery />);

    const gridButton = screen.getByLabelText('그리드 보기');
    // Button variant가 secondary일 때 활성화 상태
    expect(gridButton.className).toContain('secondary');
  });

  it('리스트 뷰로 전환할 수 있어야 한다', async () => {
    const user = userEvent.setup();
    render(<StyleGallery />);

    await user.click(screen.getByLabelText('리스트 보기'));

    const listButton = screen.getByLabelText('리스트 보기');
    // Button should be in secondary variant when selected
    expect(listButton.className).toContain('secondary');
  });

  it('스타일 설명 카드를 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByText(/casual 라벨/)).toBeInTheDocument();
    expect(screen.getByText(/casual 설명/)).toBeInTheDocument();
  });

  it('코디 개수 배지를 표시해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByText(/2개 코디/)).toBeInTheDocument();
  });

  it('코디 카드들을 렌더링해야 한다', () => {
    render(<StyleGallery />);

    expect(screen.getByText('코디 1')).toBeInTheDocument();
    expect(screen.getByText('코디 2')).toBeInTheDocument();
  });

  it('onOutfitSelect 콜백이 호출되어야 한다', async () => {
    const user = userEvent.setup();
    const onOutfitSelect = vi.fn();

    render(<StyleGallery onOutfitSelect={onOutfitSelect} />);

    await user.click(screen.getByTestId('best10-card-1'));

    expect(onOutfitSelect).toHaveBeenCalled();
  });

  it('className prop이 적용되어야 한다', () => {
    render(<StyleGallery className="custom-gallery-class" />);

    expect(screen.getByTestId('style-gallery')).toHaveClass('custom-gallery-class');
  });

  describe('필터링', () => {
    it('필터 드롭다운을 열 수 있어야 한다', async () => {
      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));

      expect(screen.getByText('시즌')).toBeInTheDocument();
      expect(screen.getByText('상황')).toBeInTheDocument();
      expect(screen.getByText('퍼스널컬러')).toBeInTheDocument();
    });

    it('시즌 필터 옵션을 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));

      expect(screen.getByText('봄')).toBeInTheDocument();
      expect(screen.getByText('여름')).toBeInTheDocument();
      expect(screen.getByText('가을')).toBeInTheDocument();
      expect(screen.getByText('겨울')).toBeInTheDocument();
    });

    it('상황 필터 옵션을 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));

      // 드롭다운 메뉴 내에서 상황 필터 옵션 확인
      // '캐주얼'은 탭에도 있으므로 getAllByText 사용
      expect(screen.getAllByText('캐주얼').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('포멀').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('데이트')).toBeInTheDocument();
    });

    it('퍼스널컬러 필터 옵션을 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));

      expect(screen.getByText('봄 웜톤')).toBeInTheDocument();
      expect(screen.getByText('여름 쿨톤')).toBeInTheDocument();
      expect(screen.getByText('가을 웜톤')).toBeInTheDocument();
      expect(screen.getByText('겨울 쿨톤')).toBeInTheDocument();
    });

    it('활성 필터 개수를 표시해야 한다', async () => {
      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));
      await user.click(screen.getByText('봄'));

      // Badge showing filter count should appear
      const filterButton = screen.getByRole('button', { name: /필터/ });
      expect(within(filterButton).getByText('1')).toBeInTheDocument();
    });
  });

  describe('정렬', () => {
    it('정렬 컨트롤이 렌더링되어야 한다', () => {
      render(<StyleGallery />);

      // Select trigger가 기본 순서를 표시하는지 확인
      expect(screen.getByText('기본 순서')).toBeInTheDocument();
    });

    it('정렬 옵션 텍스트가 표시되어야 한다', () => {
      render(<StyleGallery />);

      // Select trigger 확인 (Radix Select는 role="combobox" 사용)
      const selectTrigger = screen.getByRole('combobox');
      expect(selectTrigger).toBeInTheDocument();
    });
  });

  describe('빈 상태', () => {
    it('필터 결과가 없을 때 빈 상태를 표시해야 한다', async () => {
      const { filterByPersonalColor } = await import('@/lib/fashion');
      (filterByPersonalColor as any).mockReturnValue([]);

      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));
      await user.click(screen.getByText('겨울 쿨톤'));

      expect(screen.getByText(/필터 조건에 맞는 코디가 없습니다/)).toBeInTheDocument();
    });

    it('빈 상태에서 필터 초기화 링크가 있어야 한다', async () => {
      const { filterByPersonalColor } = await import('@/lib/fashion');
      (filterByPersonalColor as any).mockReturnValue([]);

      const user = userEvent.setup();
      render(<StyleGallery />);

      await user.click(screen.getByRole('button', { name: /필터/ }));
      await user.click(screen.getByText('겨울 쿨톤'));

      expect(screen.getByRole('button', { name: '필터 초기화' })).toBeInTheDocument();
    });
  });
});
