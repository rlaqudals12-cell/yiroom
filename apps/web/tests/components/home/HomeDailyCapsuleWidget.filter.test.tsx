/**
 * HomeDailyCapsuleWidget — 활성 시간대 대표 행동 선택
 *
 * 홈 위젯은 활성 시간대(아침/저녁/언제든)의 첫 미완료 행동 1개만 노출하고,
 * 나머지는 개수로 압박하지 않은 채 전체 루틴 화면으로 연결한다.
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

  it('아침(9시)에는 첫 아침 미완료 행동 1개만 노출한다', async () => {
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
    expect(screen.queryByText('오늘 먼저 할 일')).not.toBeInTheDocument();
    // 같은 시간대의 후속 행동·체크된 행동·저녁 행동은 모두 홈에서 미노출
    expect(screen.queryByText('루틴 m3')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 m4')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 m5')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 m2')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 e1')).not.toBeInTheDocument();

    const allRoutineLink = screen.getByRole('link', { name: /전체 루틴 보기/ });
    expect(allRoutineLink).toHaveAttribute('href', '/capsule/daily');
    // 홈에서는 진행률·예상 시간·남은 개수를 표시하지 않는다(i18n mock은 키 반환).
    expect(screen.queryByText('todayRoutine')).not.toBeInTheDocument();
    expect(screen.queryByText('capsuleMinutes')).not.toBeInTheDocument();
    expect(screen.queryByText('capsuleMoreItems')).not.toBeInTheDocument();
    expect(screen.queryByText(/^\d+\/\d+$/)).not.toBeInTheDocument();
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

  it('모든 행동을 마치면 취소선 행동 대신 완료 문장과 전체 루틴 링크만 노출한다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    stubFetch([makeItem('m1', { isChecked: true }), makeItem('m2', { isChecked: true })]);
    render(<HomeDailyCapsuleWidget />);

    expect(await screen.findByTestId('capsule-complete-message')).toHaveTextContent(
      '오늘 루틴을 모두 마쳤어요.'
    );
    expect(screen.queryByText('루틴 m1')).not.toBeInTheDocument();
    expect(screen.queryByText('루틴 m2')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /전체 루틴 보기/ })).toHaveAttribute(
      'href',
      '/capsule/daily'
    );
  });
});
