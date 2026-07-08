/**
 * HomeStateNew 테스트 (ADR-114)
 * "첫 미팅" — NewUserHero(통합 분석 CTA)만 슬림하게 렌더한다.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/app/(main)/home/_components/NewUserHero', () => ({
  default: () => <div data-testid="home-new-hero" />,
}));

import HomeStateNew from '@/app/(main)/home/_components/HomeStateNew';

describe('HomeStateNew', () => {
  it('data-testid="home-state-new"가 존재한다', () => {
    render(<HomeStateNew />);
    expect(screen.getByTestId('home-state-new')).toBeInTheDocument();
  });

  it('첫 미팅 히어로(NewUserHero)를 렌더한다', () => {
    render(<HomeStateNew />);
    expect(screen.getByTestId('home-new-hero')).toBeInTheDocument();
  });
});
