/**
 * GenderAdaptiveAccessories 컴포넌트 테스트
 */

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenderAdaptiveAccessories } from '@/components/analysis/GenderAdaptiveAccessories';
import type { SeasonType } from '@/lib/mock/personal-color';

describe('GenderAdaptiveAccessories', () => {
  const seasons: SeasonType[] = ['spring', 'summer', 'autumn', 'winter'];

  it.each(seasons)('%s 시즌에 렌더링된다', (season) => {
    render(<GenderAdaptiveAccessories seasonType={season} />);
    expect(screen.getByTestId('gender-adaptive-accessories')).toBeInTheDocument();
  });

  it('성별 탭이 표시된다', () => {
    render(<GenderAdaptiveAccessories seasonType="spring" />);

    expect(screen.getByTestId('gender-tab-neutral')).toBeInTheDocument();
    expect(screen.getByTestId('gender-tab-male')).toBeInTheDocument();
    expect(screen.getByTestId('gender-tab-female')).toBeInTheDocument();
  });

  it('기본값은 neutral이다', () => {
    render(<GenderAdaptiveAccessories seasonType="spring" />);

    const neutralTab = screen.getByTestId('gender-tab-neutral');
    expect(neutralTab).toHaveClass('bg-primary');
  });

  it('남성 탭 클릭 시 남성용 악세서리가 표시된다', () => {
    render(<GenderAdaptiveAccessories seasonType="spring" />);

    fireEvent.click(screen.getByTestId('gender-tab-male'));

    // 남성용 악세서리 카테고리 확인
    expect(screen.getByText('시계')).toBeInTheDocument();
    expect(screen.getByText('넥타이')).toBeInTheDocument();
  });

  it('여성 탭 클릭 시 여성용 악세서리가 표시된다', () => {
    render(<GenderAdaptiveAccessories seasonType="spring" />);

    fireEvent.click(screen.getByTestId('gender-tab-female'));

    // 여성용 악세서리 카테고리 확인
    expect(screen.getByText('주얼리')).toBeInTheDocument();
  });

  it('악세서리 항목에 색상 미리보기가 있다', () => {
    render(<GenderAdaptiveAccessories seasonType="autumn" />);

    // 색상 미리보기 확인 (스타일로 배경색이 설정됨)
    const colorPreviews = document.querySelectorAll('[style*="background-color"]');
    expect(colorPreviews.length).toBeGreaterThan(0);
  });

  it('브랜드 힌트 문구가 표시된다', () => {
    render(<GenderAdaptiveAccessories seasonType="winter" />);

    expect(screen.getByText(/추천 브랜드는 참고용/)).toBeInTheDocument();
  });

  it('className이 적용된다', () => {
    render(<GenderAdaptiveAccessories seasonType="summer" className="custom-class" />);

    const container = screen.getByTestId('gender-adaptive-accessories');
    expect(container).toHaveClass('custom-class');
  });
});
