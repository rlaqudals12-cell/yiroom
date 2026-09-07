import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { DrapingShareCard } from '@/components/share/DrapingShareCard';

vi.mock('@/lib/analysis/canvas-utils', () => ({
  getConstrainedCanvasSize: () => ({ width: 100, height: 100 }),
  createOptimizedContext: () => null,
}));

describe('DrapingShareCard AI 고지', () => {
  it('사진 합성 PNG 캡처 대상 ref 안에 AI 생성 고지가 포함된다', () => {
    const ref = { current: null as HTMLDivElement | null };
    render(<DrapingShareCard ref={ref} img={new Image()} drapeHex="#ffffff" bestColors={[]} />);
    expect(ref.current).toBe(screen.getByTestId('draping-share-card'));
    expect(within(ref.current!).getByTestId('ai-badge')).toHaveTextContent('AI 생성');
  });
});
