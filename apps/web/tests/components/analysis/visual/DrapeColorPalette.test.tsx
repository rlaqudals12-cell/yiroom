/**
 * DrapeColorPalette 테스트 (W1 이슈 1·2)
 * - getRecommendedMetal: 웜/쿨 → 골드/실버 추천 로직
 * - 금속 추천 배지 · 진단 서브톤 라벨 · 4계절 필터 렌더
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// next-intl 목 (라벨은 키 그대로 반환)
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

import DrapeColorPalette, {
  getRecommendedMetal,
} from '@/components/analysis/visual/DrapeColorPalette';
import type { DeviceCapability } from '@/types/visual-analysis';

const HIGH_DEVICE: DeviceCapability = {
  tier: 'high',
  drapeColors: 128,
  landmarkCount: 468,
  useGPU: true,
};

function renderPalette(props: Partial<React.ComponentProps<typeof DrapeColorPalette>> = {}) {
  return render(
    <DrapeColorPalette
      deviceCapability={HIGH_DEVICE}
      selectedColor={null}
      onColorSelect={vi.fn()}
      metalType="gold"
      onMetalTypeChange={vi.fn()}
      {...props}
    />
  );
}

describe('getRecommendedMetal', () => {
  it('웜 시즌(봄·가을)은 골드를 추천한다', () => {
    expect(getRecommendedMetal('spring')).toBe('gold');
    expect(getRecommendedMetal('autumn')).toBe('gold');
  });

  it('쿨 시즌(여름·겨울)은 실버를 추천한다', () => {
    expect(getRecommendedMetal('summer')).toBe('silver');
    expect(getRecommendedMetal('winter')).toBe('silver');
  });

  it('시즌이 없으면 추천하지 않는다', () => {
    expect(getRecommendedMetal(undefined)).toBeNull();
  });
});

describe('DrapeColorPalette', () => {
  it('쿨 시즌 사용자에게 금속 추천 배지를 노출한다', () => {
    renderPalette({ userSeason: 'summer' });
    // 추천 배지가 정확히 1개 존재 (실버)
    expect(screen.getByTestId('metal-recommended')).toHaveTextContent('추천');
    // 실버 버튼 안에 배지가 있다
    expect(screen.getByRole('button', { name: /실버/ })).toHaveTextContent('추천');
  });

  it('시즌이 없으면 금속 추천 배지가 없다', () => {
    renderPalette();
    expect(screen.queryByTestId('metal-recommended')).toBeNull();
  });

  it('진단 서브톤 라벨을 강조 표시한다', () => {
    renderPalette({ userSeason: 'summer', userSubtypeLabel: '여름 쿨 뮤트' });
    expect(screen.getByTestId('user-subtype-label')).toHaveTextContent('여름 쿨 뮤트');
  });

  it('시즌 필터는 4계절 + 전체(5개) 버튼을 렌더한다', () => {
    renderPalette({ userSeason: 'summer' });
    // 봄 라벨(하드코딩)로 계절 필터 존재 확인
    expect(screen.getByRole('button', { name: /봄/ })).toBeInTheDocument();
    // 금속 2개(실버·골드) + 계절 필터 5개 + 색상 스와치 다수
    const seasonFilterKeys = [
      'drapeColorPalette18',
      'drapeColorPalette19',
      'drapeColorPalette20',
      'drapeColorPalette21',
    ];
    seasonFilterKeys.forEach((key) => {
      expect(screen.getAllByRole('button').some((b) => b.textContent?.includes(key))).toBe(true);
    });
  });
});
