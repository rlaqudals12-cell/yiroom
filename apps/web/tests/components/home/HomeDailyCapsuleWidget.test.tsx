/**
 * HomeDailyCapsuleWidget — 대표 행동 1건의 제품 연결 렌더 테스트
 *
 * 홈은 현재 시간대의 첫 행동만 보여주며, 그 행동에 연결된 제품도 카드 하단 한 곳에만
 * 렌더한다. 전체 단계별 제품 연결은 상세 루틴 화면의 책임이다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// 로그인 사용자로 오버라이드 (기본 setup은 signed-out)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1' }, isLoaded: true, isSignedIn: true }),
}));

// ConnectionAwareness — 부작용 훅 stub. depth는 항상 full로 고정해 제품 칩 노출.
vi.mock('@/lib/connection-awareness', () => ({
  exposeConnection: vi.fn().mockResolvedValue({ status: 'new' }),
  confirmConnection: vi.fn().mockResolvedValue({ status: 'new' }),
  getExplanationDepth: () => 'full',
  capsuleItemToExposeRequest: (moduleCode: string) => ({
    connectionId: `c-${moduleCode}`,
    moduleCode,
  }),
}));

import HomeDailyCapsuleWidget from '@/app/(main)/home/_components/HomeDailyCapsuleWidget';

type Item = Record<string, unknown>;

function makeCapsule(items: Item[]) {
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

function stubFetch(items: Item[]) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: makeCapsule(items) }),
    })
  );
}

const shelfItem = {
  id: 'i-shelf',
  moduleCode: 'S',
  name: '토너 바르기',
  reason: '수분 공급',
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
  name: '선크림 바르기',
  reason: '자외선 차단',
  compatibilityScore: 80,
  isChecked: false,
  solutionProduct: { id: 'p2', name: '데일리 선크림', brand: '브랜드B', source: 'catalog' },
};
const plainItem = {
  id: 'i-plain',
  moduleCode: 'PC',
  name: '립 컬러',
  reason: '',
  compatibilityScore: 70,
  isChecked: false,
  // source 없음 → 제품 칩 미표시 (구 데이터 안전)
  solutionProduct: { id: 'p3', name: '코랄 립', brand: '브랜드C' },
};

describe('HomeDailyCapsuleWidget — 제품 연결', () => {
  beforeEach(() => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('첫 행동이 shelf 제품을 쓰면 카드 하단에 보유 제품으로 표시한다', async () => {
    stubFetch([shelfItem, catalogItem, plainItem]);
    render(<HomeDailyCapsuleWidget />);
    const chip = await screen.findByTestId('capsule-owned-chip');
    expect(chip).toHaveTextContent('보유 제품 · 수분 토너');
    expect(screen.queryByTestId('capsule-catalog-chip')).not.toBeInTheDocument();
  });

  it('첫 행동이 catalog 제품을 쓰면 단일 "맞는 제품 보기" 링크를 렌더한다', async () => {
    stubFetch([catalogItem, shelfItem, plainItem]);
    render(<HomeDailyCapsuleWidget />);
    const chip = await screen.findByTestId('capsule-catalog-chip');
    expect(chip).toHaveTextContent('맞는 제품 보기');
    expect(chip.closest('a')).toHaveAttribute('href', '/beauty/p2');
    expect(screen.getAllByTestId('capsule-catalog-chip')).toHaveLength(1);
    expect(screen.queryByTestId('capsule-owned-chip')).not.toBeInTheDocument();
  });

  it('첫 행동에 제품 연결이 없고 제품 탐색 대상 축도 아니면 제품 CTA를 만들지 않는다', async () => {
    stubFetch([plainItem, catalogItem]);
    render(<HomeDailyCapsuleWidget />);
    expect(await screen.findByText('립 컬러')).toBeInTheDocument();
    expect(screen.queryByTestId('capsule-owned-chip')).not.toBeInTheDocument();
    expect(screen.queryByTestId('capsule-catalog-chip')).not.toBeInTheDocument();
    // 두 번째 행동에 제품이 있어도 홈에서는 대표 행동 외 CTA를 추가하지 않는다.
    expect(screen.queryByText('선크림 바르기')).not.toBeInTheDocument();
  });

  it('catalog 제품 id가 없으면 정직하게 뷰티 탐색 링크로 폴백한다', async () => {
    stubFetch([
      {
        id: 'i-noid',
        moduleCode: 'S',
        name: '앰플',
        reason: '',
        compatibilityScore: 70,
        isChecked: false,
        solutionProduct: { id: '', name: '앰플 제품', brand: '브랜드', source: 'catalog' },
      },
    ]);
    render(<HomeDailyCapsuleWidget />);
    const chip = await screen.findByTestId('capsule-catalog-chip');
    expect(chip).toHaveTextContent('맞는 제품 보기');
    expect(chip.closest('a')).toHaveAttribute('href', '/beauty');
  });
});
