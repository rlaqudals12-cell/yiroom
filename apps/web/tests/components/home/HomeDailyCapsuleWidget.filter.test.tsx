/**
 * HomeDailyCapsuleWidget — 활성 시간대 필터 (2026-07-25 홈/상세 분업)
 *
 * 홈 위젯은 활성 시간대(아침/저녁/언제든)의 미체크 상위 3개만 노출하고,
 * 남은 미체크 수를 '더 보기' 라인으로 안내한다. 전체 목록은 /capsule/daily 담당.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// 로그인 사용자로 오버라이드 (기본 setup은 signed-out)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1' }, isLoaded: true, isSignedIn: true }),
}));

// ConnectionAwareness — 부작용 훅 stub
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

function makeItem(id: string, overrides: Item = {}): Item {
  return {
    id,
    moduleCode: 'S',
    name: `루틴 ${id}`,
    reason: '',
    compatibilityScore: 80,
    isChecked: false,
    timeOfDay: 'morning',
    ...overrides,
  };
}

function stubFetch(items: Item[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          id: 'cap-1',
          userId: 'u1',
          date: '2026-07-25',
          totalCcs: 80,
          estimatedMinutes: 10,
          status: 'in_progress',
          completedAt: null,
          createdAt: '2026-07-25',
          items,
        },
      }),
    })
  );
}

describe('HomeDailyCapsuleWidget — 활성 시간대 필터', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('아침(9시)에는 아침 미체크 상위 3개만 노출하고 남은 미체크 수를 안내한다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    stubFetch([
      makeItem('m1'),
      makeItem('m2', { isChecked: true }), // 체크됨 → 제외
      makeItem('m3'),
      makeItem('m4'),
      makeItem('m5'),
      makeItem('e1', { timeOfDay: 'evening' }),
    ]);
    render(<HomeDailyCapsuleWidget />);

    expect(await screen.findByText('루틴 m1')).toBeInTheDocument();
    expect(screen.getByText('루틴 m3')).toBeInTheDocument();
    expect(screen.getByText('루틴 m4')).toBeInTheDocument();
    // 4번째 아침 미체크·체크된 아이템·저녁 아이템은 미노출
    expect(screen.queryByText('루틴 m5')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 m2')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 e1')).not.toBeInTheDocument();
    // 남은 미체크(m5, e1) → 더 보기 라인 (i18n mock은 키 반환)
    expect(screen.getByText('capsuleMoreItems')).toBeInTheDocument();
  });

  it('저녁(20시)에는 저녁 미체크 아이템을 우선 노출한다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(20);
    stubFetch([makeItem('m1'), makeItem('e1', { timeOfDay: 'evening' })]);
    render(<HomeDailyCapsuleWidget />);

    expect(await screen.findByText('루틴 e1')).toBeInTheDocument();
    expect(screen.queryByText('루틴 m1')).not.toBeInTheDocument();
  });

  it('활성 그룹에 미체크가 없으면 다음 그룹의 미체크로 폴백한다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    stubFetch([
      makeItem('m1', { isChecked: true }),
      makeItem('a1', { timeOfDay: 'anytime', moduleCode: 'PC' }),
    ]);
    render(<HomeDailyCapsuleWidget />);

    expect(await screen.findByText('루틴 a1')).toBeInTheDocument();
    expect(screen.queryByText('루틴 m1')).not.toBeInTheDocument();
  });

  it('미체크가 전혀 없으면 앞 3개를 폴백 노출한다 (빈 위젯 방지)', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    stubFetch([makeItem('m1', { isChecked: true }), makeItem('m2', { isChecked: true })]);
    render(<HomeDailyCapsuleWidget />);

    expect(await screen.findByText('루틴 m1')).toBeInTheDocument();
    expect(screen.getByText('루틴 m2')).toBeInTheDocument();
  });
});
