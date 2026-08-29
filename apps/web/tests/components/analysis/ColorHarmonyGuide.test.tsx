import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ColorHarmonyGuide } from '@/components/analysis/ColorHarmonyGuide';

describe('ColorHarmonyGuide', () => {
  it('한국어 색 이름을 주 라벨로, HEX를 보조 정보로 표시한다', () => {
    render(<ColorHarmonyGuide baseHex="#FF0000" baseName="레드" />);

    expect(screen.getAllByText('레드').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/^#[0-9A-F]{6}$/u).length).toBeGreaterThan(0);
  });

  it('각 색면에 한국어 색 이름과 HEX를 함께 읽는 스크린리더 라벨을 둔다', () => {
    render(<ColorHarmonyGuide baseHex="#FF0000" />);

    const swatches = screen.getAllByRole('img');
    expect(swatches.length).toBeGreaterThan(0);
    for (const swatch of swatches) {
      expect(swatch).toHaveAccessibleName(/.+, 색상값 #[0-9A-F]{6}/u);
    }
  });
});
