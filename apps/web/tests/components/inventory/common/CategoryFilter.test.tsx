/**
 * CategoryFilter 컴포넌트 테스트
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter, SubCategoryFilter } from '@/components/inventory/common/CategoryFilter';

describe('CategoryFilter', () => {
  it('renders all category options', () => {
    render(
      <CategoryFilter
        type="category"
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('전체')).toBeInTheDocument();
    expect(screen.getByText('아우터')).toBeInTheDocument();
    expect(screen.getByText('상의')).toBeInTheDocument();
    expect(screen.getByText('하의')).toBeInTheDocument();
    expect(screen.getByText('원피스')).toBeInTheDocument();
    expect(screen.getByText('신발')).toBeInTheDocument();
    expect(screen.getByText('가방')).toBeInTheDocument();
    expect(screen.getByText('액세서리')).toBeInTheDocument();
  });

  it('renders season options', () => {
    render(
      <CategoryFilter
        type="season"
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('봄')).toBeInTheDocument();
    expect(screen.getByText('여름')).toBeInTheDocument();
    expect(screen.getByText('가을')).toBeInTheDocument();
    expect(screen.getByText('겨울')).toBeInTheDocument();
  });

  it('renders occasion options', () => {
    render(
      <CategoryFilter
        type="occasion"
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('캐주얼')).toBeInTheDocument();
    expect(screen.getByText('포멀')).toBeInTheDocument();
    expect(screen.getByText('운동')).toBeInTheDocument();
    expect(screen.getByText('데이트')).toBeInTheDocument();
    expect(screen.getByText('여행')).toBeInTheDocument();
  });

  it('calls onChange when option is selected', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        type="category"
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('상의'));
    expect(onChange).toHaveBeenCalledWith(['top']);
  });

  it('clears selection when "all" is clicked', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        type="category"
        selected={['top']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('전체'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('supports multiple selection', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        type="category"
        selected={['top']}
        onChange={onChange}
        multiple
      />
    );

    fireEvent.click(screen.getByText('하의'));
    expect(onChange).toHaveBeenCalledWith(['top', 'bottom']);
  });

  it('removes selection when already selected in multiple mode', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        type="category"
        selected={['top', 'bottom']}
        onChange={onChange}
        multiple
      />
    );

    fireEvent.click(screen.getByText('상의'));
    expect(onChange).toHaveBeenCalledWith(['bottom']);
  });

  it('toggles single selection', () => {
    const onChange = vi.fn();
    render(
      <CategoryFilter
        type="category"
        selected={['top']}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('상의'));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('applies selected styles', () => {
    render(
      <CategoryFilter
        type="category"
        selected={['top']}
        onChange={() => {}}
      />
    );

    const topButton = screen.getByText('상의');
    expect(topButton).toHaveClass('bg-primary');
  });

  it('renders custom options', () => {
    const customOptions = [
      { value: 'option1', label: '옵션 1' },
      { value: 'option2', label: '옵션 2' },
    ];

    render(
      <CategoryFilter
        type="custom"
        options={customOptions}
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('옵션 1')).toBeInTheDocument();
    expect(screen.getByText('옵션 2')).toBeInTheDocument();
  });

  it('hides "all" option when showAll is false', () => {
    render(
      <CategoryFilter
        type="category"
        selected={[]}
        onChange={() => {}}
        showAll={false}
      />
    );

    expect(screen.queryByText('전체')).not.toBeInTheDocument();
  });

  it('uses custom allLabel', () => {
    render(
      <CategoryFilter
        type="category"
        selected={[]}
        onChange={() => {}}
        allLabel="모두 보기"
      />
    );

    expect(screen.getByText('모두 보기')).toBeInTheDocument();
  });
});

describe('SubCategoryFilter', () => {
  it('renders subcategories for top', () => {
    render(
      <SubCategoryFilter
        category="top"
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('티셔츠')).toBeInTheDocument();
    expect(screen.getByText('셔츠')).toBeInTheDocument();
    expect(screen.getByText('블라우스')).toBeInTheDocument();
    expect(screen.getByText('니트')).toBeInTheDocument();
  });

  it('renders subcategories for outer', () => {
    render(
      <SubCategoryFilter
        category="outer"
        selected={[]}
        onChange={() => {}}
      />
    );

    expect(screen.getByText('코트')).toBeInTheDocument();
    expect(screen.getByText('자켓')).toBeInTheDocument();
    expect(screen.getByText('패딩')).toBeInTheDocument();
  });

  it('calls onChange with selected subcategory', () => {
    const onChange = vi.fn();
    render(
      <SubCategoryFilter
        category="top"
        selected={[]}
        onChange={onChange}
      />
    );

    fireEvent.click(screen.getByText('티셔츠'));
    expect(onChange).toHaveBeenCalledWith(['티셔츠']);
  });
});
