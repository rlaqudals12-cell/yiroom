/**
 * 오늘의 루틴 상세 페이지 — IA 재편(2026-07-25 구세대 섬 전환 Phase 3) 분기 테스트
 *
 * - verdict-first '지금 블록': 활성 시간대 첫 미체크가 세리프 히어로로 노출
 * - 접기: 지금 블록 아이템 행만 자동 펼침, 나머지는 행 탭 시 전개
 * - 완주: 전 항목 체크 시 진행 카드가 완료 상태(인장)로 전환
 * - PATCH 실패: res.ok 검사 → 낙관적 체크 롤백 + 토스트 (기존 무음 실패 수리)
 * - 모듈 클러스터 '모두 완료': 미체크 아이템 일괄 체크
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// 로그인 사용자로 오버라이드 (기본 setup은 signed-out)
vi.mock('@clerk/nextjs', () => ({
  useUser: () => ({ isSignedIn: true, user: { id: 'u1' }, isLoaded: true }),
}));

// 토스트 — 저장 실패 안내 검증용
vi.mock('sonner', () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

import { toast } from 'sonner';
import DailyCapsulePage from '@/app/(main)/capsule/daily/page';

type Item = Record<string, unknown>;

function makeItem(id: string, overrides: Item = {}): Item {
  return {
    id,
    moduleCode: 'S',
    name: `아이템 ${id}`,
    isChecked: false,
    timeOfDay: 'morning',
    ...overrides,
  };
}

function makeCapsule(items: Item[], estimatedMinutes = 12) {
  return { id: 'd1', date: '2026-07-25', estimatedMinutes, items };
}

interface PatchCall {
  itemId?: string;
  itemIds?: string[];
  isChecked: boolean;
}

/** GET은 캡슐, PATCH는 patchOk에 따라 성공/실패 — PATCH 바디를 기록해 반환 */
function stubFetch(capsule: unknown, patchOk = true): PatchCall[] {
  const patchCalls: PatchCall[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_url: string, init?: RequestInit) => {
      if (init?.method === 'PATCH') {
        patchCalls.push(JSON.parse(String(init.body)) as PatchCall);
        return { ok: patchOk, json: async () => ({ success: patchOk }) };
      }
      return { ok: true, json: async () => ({ success: true, data: capsule }) };
    })
  );
  return patchCalls;
}

describe('DailyCapsulePage — 지금 블록 / 완주 / 체크 저장', () => {
  beforeEach(() => {
    // 아침 시간대(9시)로 고정 — 활성 그룹 = morning
    vi.spyOn(Date.prototype, 'getHours').mockReturnValue(9);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('활성 시간대(아침)의 첫 미체크 아이템을 지금 블록 히어로로 노출한다', async () => {
    stubFetch(
      makeCapsule([
        makeItem('m1', { reason: '피부 진정', solution: '저자극 토너로' }),
        makeItem('m2'),
        makeItem('e1', { timeOfDay: 'evening' }),
      ])
    );
    render(<DailyCapsulePage />);

    const nowBlock = await screen.findByTestId('daily-now-block');
    expect(nowBlock).toHaveTextContent('지금 · 아침 루틴');
    expect(nowBlock).toHaveTextContent('아이템 m1');
    expect(nowBlock).toHaveTextContent('저자극 토너로');
    // 진행률 게이지 대신 텍스트 1줄 (아침 그룹 2단계 + 예상 시간)
    expect(screen.getByTestId('daily-progress-line')).toHaveTextContent(
      '아침 2단계 중 0 완료 · 약 12분'
    );
  });

  it('지금 블록 아이템 행만 자동 펼침되고, 다른 행은 탭 시 전개된다', async () => {
    stubFetch(
      makeCapsule([
        makeItem('m1', { reason: '피부 진정' }),
        makeItem('m2', { reason: '수분 보습' }),
      ])
    );
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    // 자동 펼침 = 활성 그룹 첫 미체크(m1)만
    expect(screen.getByTestId('daily-detail-m1')).toBeInTheDocument();
    expect(screen.queryByTestId('daily-detail-m2')).not.toBeInTheDocument();

    // m2 행 탭 → 상세 전개
    fireEvent.click(screen.getByTestId('daily-row-m2'));
    expect(screen.getByTestId('daily-detail-m2')).toHaveTextContent('수분 보습');
  });

  it('지금 블록 체크 시 PATCH 전송 후 다음 미체크로 히어로가 넘어간다', async () => {
    const patchCalls = stubFetch(makeCapsule([makeItem('m1'), makeItem('m2')]));
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-now-check'));

    await waitFor(() => {
      expect(patchCalls).toEqual([{ itemId: 'm1', isChecked: true }]);
    });
    expect(screen.getByTestId('daily-now-block')).toHaveTextContent('아이템 m2');
  });

  it('활성 그룹이 전부 완료면 다음 그룹에서 지금 블록을 승계한다', async () => {
    stubFetch(
      makeCapsule([
        makeItem('m1', { isChecked: true }),
        makeItem('a1', { timeOfDay: 'anytime', moduleCode: 'PC' }),
      ])
    );
    render(<DailyCapsulePage />);

    const nowBlock = await screen.findByTestId('daily-now-block');
    expect(nowBlock).toHaveTextContent('지금 · 언제든 루틴');
    expect(nowBlock).toHaveTextContent('아이템 a1');
  });

  it('전 항목 완료 시 진행 카드가 완료 상태(인장+홈 링크)로 전환된다', async () => {
    stubFetch(makeCapsule([makeItem('m1', { isChecked: true }), makeItem('m2')]));
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-check-m2'));

    const completeCard = await screen.findByTestId('daily-complete-card');
    expect(completeCard).toHaveTextContent('오늘 루틴 완료');
    expect(completeCard).toHaveTextContent('내일 아침 브리핑에서 만나요');
    expect(completeCard.querySelector('a')).toHaveAttribute('href', '/home');
    expect(screen.queryByTestId('daily-now-block')).not.toBeInTheDocument();
  });

  it('PATCH 실패 시 체크를 롤백하고 토스트로 안내한다 (무음 실패 수리)', async () => {
    stubFetch(makeCapsule([makeItem('m1'), makeItem('m2')]), false);
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-now-check'));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        '체크를 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
      );
    });
    // 롤백 → 히어로가 여전히 m1
    expect(screen.getByTestId('daily-now-block')).toHaveTextContent('아이템 m1');
    expect(screen.getByTestId('daily-progress-line')).toHaveTextContent('2단계 중 0 완료');
  });

  it("모듈 클러스터 '모두 완료'가 배치 PATCH 1회로 전체를 저장한다 (경합 유실 수리)", async () => {
    const patchCalls = stubFetch(
      makeCapsule([
        makeItem('m1'),
        makeItem('m2'),
        makeItem('m3'),
        makeItem('m4'),
        makeItem('a1', { timeOfDay: 'anytime', moduleCode: 'PC' }),
      ])
    );
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-cluster-complete-S'));

    await waitFor(() => {
      // 단건 4발 병렬(마지막 쓰기 승리로 3개 유실)이 아니라 배치 1회
      expect(patchCalls).toEqual([{ itemIds: ['m1', 'm2', 'm3', 'm4'], isChecked: true }]);
    });
    // 아침 클러스터 완료 → 지금 블록은 언제든 그룹으로 승계
    expect(screen.getByTestId('daily-now-block')).toHaveTextContent('아이템 a1');
  });

  it("'모두 완료'는 이미 체크된 아이템을 배치에서 제외한다", async () => {
    const patchCalls = stubFetch(
      makeCapsule([makeItem('m1', { isChecked: true }), makeItem('m2'), makeItem('m3')])
    );
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-cluster-complete-S'));

    await waitFor(() => {
      expect(patchCalls).toEqual([{ itemIds: ['m2', 'm3'], isChecked: true }]);
    });
  });

  it('연속 체크는 직렬 전송된다 — 앞 저장이 끝난 뒤 다음 요청 (덮어쓰기 유실 방지)', async () => {
    // PATCH 응답을 수동으로 풀어 겹침을 재현: 첫 요청이 미완료인 동안 둘째를 탭한다
    const started: string[] = [];
    const releases: Array<() => void> = [];
    const capsule = makeCapsule([makeItem('m1'), makeItem('m2')]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url: string, init?: RequestInit) => {
        if (init?.method === 'PATCH') {
          const body = JSON.parse(String(init.body)) as PatchCall;
          started.push(String(body.itemId));
          await new Promise<void>((resolve) => releases.push(resolve));
          return { ok: true, json: async () => ({ success: true }) };
        }
        return { ok: true, json: async () => ({ success: true, data: capsule }) };
      })
    );

    render(<DailyCapsulePage />);
    await screen.findByTestId('daily-now-block');

    fireEvent.click(screen.getByTestId('daily-check-m1'));
    await waitFor(() => expect(started).toEqual(['m1']));

    // 첫 요청이 아직 응답 전인데 둘째 탭 → 큐에 대기(전송되지 않아야 함)
    fireEvent.click(screen.getByTestId('daily-check-m2'));
    await waitFor(() => expect(screen.getByTestId('daily-complete-card')).toBeInTheDocument());
    expect(started).toEqual(['m1']);

    // 첫 응답을 풀면 그제서야 둘째가 나간다
    releases[0]();
    await waitFor(() => expect(started).toEqual(['m1', 'm2']));
    releases[1]();
  });

  it("'모두 완료' 저장 실패 시 일괄 체크를 롤백하고 안내한다", async () => {
    stubFetch(makeCapsule([makeItem('m1'), makeItem('m2'), makeItem('m3')]), false);
    render(<DailyCapsulePage />);

    await screen.findByTestId('daily-now-block');
    fireEvent.click(screen.getByTestId('daily-cluster-complete-S'));

    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        '체크를 저장하지 못했어요. 잠시 후 다시 시도해주세요.'
      );
    });
    // 롤백 → 히어로·진행 라인 모두 미완료 상태 유지 (화면만 완료로 남는 거짓 표시 방지)
    expect(screen.getByTestId('daily-now-block')).toHaveTextContent('아이템 m1');
    expect(screen.getByTestId('daily-progress-line')).toHaveTextContent('아침 3단계 중 0 완료');
  });
});
