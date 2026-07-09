/**
 * HomeDailyCapsuleWidget — U2: 제품 칩 depth 무관 노출
 *
 * 내재화 수준(depth)이 낮아 reason/solution 텍스트가 숨겨져도,
 * 제품 칩("내 ○○" / "맞는 제품 보기")은 "행동"이라 항상 노출되어야 한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1' }, isLoaded: true, isSignedIn: true }),
}));

// depth를 'minimal'로 고정 — 텍스트 게이팅은 걸리지만 제품 칩은 노출되어야 함
vi.mock('@/lib/connection-awareness', () => ({
  exposeConnection: vi.fn().mockResolvedValue({ status: 'internalized' }),
  confirmConnection: vi.fn().mockResolvedValue({ status: 'internalized' }),
  getExplanationDepth: () => 'minimal',
  capsuleItemToExposeRequest: (moduleCode: string) => ({
    connectionId: `c-${moduleCode}`,
    moduleCode,
  }),
}));

import HomeDailyCapsuleWidget from '@/app/(main)/home/_components/HomeDailyCapsuleWidget';

function makeCapsule(items: Record<string, unknown>[]) {
  return {
    id: 'cap-1',
    userId: 'u1',
    date: '2026-07-10',
    totalCcs: 80,
    estimatedMinutes: 10,
    status: 'in_progress',
    completedAt: null,
    createdAt: '2026-07-10',
    items,
  };
}

const shelfItem = {
  id: 'i-shelf',
  moduleCode: 'S',
  name: '약산성 클렌저',
  reason: '노폐물 제거',
  solution: '거품 내어 30초',
  compatibilityScore: 80,
  isChecked: false,
  solutionProduct: {
    id: 'p1',
    name: '수분 토너',
    brand: '브랜드A',
    source: 'shelf',
    shelfItemId: 'sh1',
  },
};
const catalogItem = {
  id: 'i-catalog',
  moduleCode: 'S',
  name: '세라마이드 크림',
  reason: '수분 잠금',
  compatibilityScore: 80,
  isChecked: false,
  solutionProduct: { id: 'p2', name: '세라마이드 크림', brand: '브랜드B', source: 'catalog' },
};

describe('HomeDailyCapsuleWidget — 제품 칩 depth 무관 (U2)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: makeCapsule([shelfItem, catalogItem]) }),
      })
    );
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('depth=minimal이어도 shelf/catalog 제품 칩을 노출한다', async () => {
    render(<HomeDailyCapsuleWidget />);
    const owned = await screen.findByTestId('capsule-owned-chip');
    expect(owned).toHaveTextContent('내 수분 토너');
    expect(screen.getByTestId('capsule-catalog-chip')).toHaveTextContent('맞는 제품 보기');
  });

  it('depth=minimal이면 reason/solution 텍스트는 숨긴다 (칩만 노출)', async () => {
    render(<HomeDailyCapsuleWidget />);
    await screen.findByTestId('capsule-owned-chip'); // 로드 대기
    // reason/solution 텍스트는 depth 게이팅으로 미노출
    expect(screen.queryByText('노폐물 제거')).not.toBeInTheDocument();
    expect(screen.queryByText('거품 내어 30초')).not.toBeInTheDocument();
    // 스펙명(아이템 name)은 노출
    expect(screen.getByText('약산성 클렌저')).toBeInTheDocument();
  });
});
