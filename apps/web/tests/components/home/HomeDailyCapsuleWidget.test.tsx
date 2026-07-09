/**
 * HomeDailyCapsuleWidget — ADR-117 제품 연결 렌더 테스트
 *
 * 오늘의 루틴 아이템에 붙는 solutionProduct를 source에 따라 렌더:
 *  - shelf: "내 {제품}" 보유 배지
 *  - catalog(+id): "맞는 제품 보기" 제품 상세 링크
 *  - catalog(id 없음): 링크 없는 안내 칩
 *  - source 없음(구 데이터): 미표시
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
    stubFetch([shelfItem, catalogItem, plainItem]);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('shelf source 아이템에 "내 {제품}" 보유 배지를 렌더한다', async () => {
    render(<HomeDailyCapsuleWidget />);
    const chip = await screen.findByTestId('capsule-owned-chip');
    expect(chip).toHaveTextContent('내 수분 토너');
  });

  it('catalog source 아이템에 "맞는 제품 보기" 칩을 제품 상세 링크로 렌더한다', async () => {
    render(<HomeDailyCapsuleWidget />);
    const chip = await screen.findByTestId('capsule-catalog-chip');
    expect(chip).toHaveTextContent('맞는 제품 보기');
    expect(chip.closest('a')).toHaveAttribute('href', '/beauty/p2');
  });

  it('source가 없는(구 데이터) 아이템에는 제품 칩을 렌더하지 않는다', async () => {
    render(<HomeDailyCapsuleWidget />);
    await screen.findByTestId('capsule-owned-chip'); // 로드 대기
    // shelf 1개 + catalog 1개만, plain(source 없음)은 미표시
    expect(screen.getAllByTestId('capsule-owned-chip')).toHaveLength(1);
    expect(screen.getAllByTestId('capsule-catalog-chip')).toHaveLength(1);
  });

  it('catalog source에 제품 id가 없으면 링크 없는 칩으로 렌더한다', async () => {
    vi.unstubAllGlobals();
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
    expect(chip.closest('a')).toBeNull(); // 제품 id 없음 → 링크 아님
  });
});
