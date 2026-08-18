/**
 * HomeDailyCapsuleWidget — 체크 API 계약 (2026-08-01 자동 리뷰 수리)
 *
 * ①체크 PATCH가 정본 경로(/api/capsule/daily/[id])로 나가는지 —
 *   구 check/[id] 이중화 재발 방지(모바일 APK 하드코딩 경로와 동일해야 함).
 * ②서버 거부(!res.ok) 시 로컬 체크 상태를 갱신하지 않는지 —
 *   새로고침 때 체크가 사라지는 무음 유실 방지.
 */

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// 로그인 사용자로 오버라이드 (기본 setup은 signed-out)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ user: { id: 'u1' }, isLoaded: true, isSignedIn: true }),
}));

// ConnectionAwareness — 부작용 훅 stub
vi.mock('@/lib/connection-awareness', () => ({
  exposeConnection: vi.fn(),
  confirmConnection: vi.fn(),
  getExplanationDepth: () => 'full',
  capsuleItemToExposeRequest: (moduleCode: string) => ({
    connectionId: `c-${moduleCode}`,
    moduleCode,
  }),
}));

import { exposeConnection, confirmConnection } from '@/lib/connection-awareness';
import HomeDailyCapsuleWidget from '@/app/(main)/home/_components/HomeDailyCapsuleWidget';

const CAPSULE = {
  id: 'cap-1',
  userId: 'u1',
  date: '2026-08-01',
  totalCcs: 80,
  estimatedMinutes: 10,
  status: 'in_progress',
  completedAt: null,
  createdAt: '2026-08-01',
  items: [
    {
      id: 'i1',
      moduleCode: 'S',
      name: '루틴 i1',
      reason: '',
      compatibilityScore: 80,
      isChecked: false,
      timeOfDay: 'morning',
    },
  ],
};

// URL·메서드를 기록하고 PATCH 응답 ok 여부를 주입할 수 있는 fetch stub
function stubFetch(patchOk: boolean): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'PATCH') {
      return { ok: patchOk, json: async () => ({ success: patchOk }) };
    }
    return { ok: true, json: async () => ({ success: true, data: CAPSULE }) };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('HomeDailyCapsuleWidget — 체크 API 계약', () => {
  beforeEach(() => {
    // restoreAllMocks가 모듈 팩토리 vi.fn 구현을 지우므로 테스트마다 재주입
    vi.mocked(exposeConnection).mockResolvedValue({ status: 'new' } as never);
    vi.mocked(confirmConnection).mockResolvedValue({ status: 'new' } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('체크 PATCH는 정본 경로 /api/capsule/daily/[id]로 나간다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    const fetchMock = stubFetch(true);
    render(<HomeDailyCapsuleWidget />);

    fireEvent.click(await screen.findByText('루틴 i1'));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
      expect(patchCall).toBeDefined();
      expect(patchCall![0]).toBe('/api/capsule/daily/cap-1');
      // 구 이중화 경로 재발 방지
      expect(String(patchCall![0])).not.toContain('/api/capsule/check/');
    });
    // 성공 시 마지막 행동을 다시 취소선으로 꺼내지 않고 완료 상태로 전환한다.
    await waitFor(() => {
      expect(screen.getByTestId('capsule-complete-message')).toHaveTextContent(
        '오늘 루틴을 모두 마쳤어요.'
      );
    });
    expect(screen.queryByText('루틴 i1')).not.toBeInTheDocument();
  });

  it('서버가 거부하면(!res.ok) 로컬 체크 상태를 갱신하지 않는다', async () => {
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
    const fetchMock = stubFetch(false);
    render(<HomeDailyCapsuleWidget />);

    fireEvent.click(await screen.findByText('루틴 i1'));

    await waitFor(() => {
      expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true);
    });
    // 거부됐으므로 미체크 상태 유지(취소선 없음) — 무음 유실 방지
    expect(screen.getByText('루틴 i1')).toBeInTheDocument();
    expect(screen.getByText('루틴 i1')).not.toHaveClass('line-through');
  });
});
