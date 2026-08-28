/** cleanup-consents 반복 배치·실패 재시도 계약 테스트 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  storageFrom: vi.fn(),
  purgeStoragePrefix: vi.fn(),
  purgeUserStorageBuckets: vi.fn(),
  clearAnalysisImagePointers: vi.fn(),
}));

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: mocks.from,
    storage: { from: mocks.storageFrom },
  }),
}));

vi.mock('@/lib/api/storage-purge', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/api/storage-purge')>()),
  purgeStoragePrefix: mocks.purgeStoragePrefix,
  purgeUserStorageBuckets: mocks.purgeUserStorageBuckets,
  clearAnalysisImagePointers: mocks.clearAnalysisImagePointers,
}));

import { GET, POST } from '@/app/api/cron/cleanup-consents/route';

interface TableOptions {
  fetchError?: { message: string };
  updateErrorIds?: Set<string>;
  staleClaimIds?: Set<string>;
  staleFinalizeIds?: Set<string>;
  /** DB가 같은 첫 100건을 반환하는 대신 keyset 조건을 실제로 적용하는 회귀 테스트용 원본. */
  keysetRows?: Array<Record<string, unknown>>;
  /** retention=NULL 완료 행은 withdrawal_at 별도 keyset으로 공급한다. */
  reconciliationRows?: Array<Record<string, unknown>>;
}

function pagedTable(batches: Array<Array<Record<string, unknown>>>, options: TableOptions = {}) {
  let page = 0;
  let cursor: { column: 'created_at' | 'retention_until'; value: string; id: string } | null = null;
  let reconciliationCursor: { withdrawalAt: string; id: string } | null = null;
  const updates: Array<{ payload: Record<string, unknown>; id: string }> = [];
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.or = vi.fn((filter: string) => {
    const match =
      /(created_at|retention_until)\.gt\.([^,]+),and\(\1\.eq\.([^,]+),id\.gt\.([^)]+)\)/.exec(
        filter
      );
    if (match) {
      cursor = {
        column: match[1] as 'created_at' | 'retention_until',
        value: match[2],
        id: match[4],
      };
    }
    return chain;
  });
  chain.is = vi.fn(() => chain);
  chain.order = vi.fn(() => chain);
  chain.limit = vi.fn(async (limit = 100) => {
    if (options.fetchError) return { data: null, error: options.fetchError };
    const data = options.keysetRows
      ? options.keysetRows
          .filter((row) => {
            if (!cursor) return true;
            const value = String(row[cursor.column] ?? '');
            return value > cursor.value || (value === cursor.value && String(row.id) > cursor.id);
          })
          .slice(0, limit)
      : (batches[Math.min(page, Math.max(0, batches.length - 1))] ?? []);
    page++;
    return { data, error: null };
  });
  const reconciliationChain: Record<string, ReturnType<typeof vi.fn>> = {};
  reconciliationChain.eq = vi.fn(() => reconciliationChain);
  reconciliationChain.not = vi.fn(() => reconciliationChain);
  reconciliationChain.is = vi.fn(() => reconciliationChain);
  reconciliationChain.lt = vi.fn(() => reconciliationChain);
  reconciliationChain.or = vi.fn((filter: string) => {
    const match =
      /withdrawal_at\.gt\.([^,]+),and\(withdrawal_at\.eq\.([^,]+),id\.gt\.([^)]+)\)/.exec(filter);
    if (match) reconciliationCursor = { withdrawalAt: match[1], id: match[3] };
    return reconciliationChain;
  });
  reconciliationChain.order = vi.fn(() => reconciliationChain);
  reconciliationChain.limit = vi.fn(async (limit = 100) => {
    const rows = options.reconciliationRows ?? [];
    const data = rows
      .filter((row) => {
        if (!reconciliationCursor) return true;
        const withdrawalAt = String(row.withdrawal_at ?? '');
        return (
          withdrawalAt > reconciliationCursor.withdrawalAt ||
          (withdrawalAt === reconciliationCursor.withdrawalAt &&
            String(row.id) > reconciliationCursor.id)
        );
      })
      .slice(0, limit);
    return { data, error: null };
  });
  const select = vi.fn((columns?: string) =>
    columns?.includes('cleanup_reconciled_at') ? reconciliationChain : chain
  );
  const update = vi.fn((payload: Record<string, unknown>) => {
    let id = '';
    const mutationResult = () => ({
      data: null,
      error: options.updateErrorIds?.has(id) ? { message: 'update failed' } : null,
    });
    const mutation = {
      eq: vi.fn((column: string, value: string) => {
        if (column === 'id') {
          id = value;
          updates.push({ payload, id });
        }
        return mutation;
      }),
      select: vi.fn(async () => {
        const isClaim =
          payload.consent_given === false && !Object.hasOwn(payload, 'retention_until');
        const stale = isClaim ? options.staleClaimIds?.has(id) : options.staleFinalizeIds?.has(id);
        return {
          data: stale
            ? []
            : [
                {
                  id,
                  updated_at: `claimed-${id}`,
                  withdrawal_at: payload.withdrawal_at,
                },
              ],
          error: mutationResult().error,
        };
      }),
      then: (resolve: (value: ReturnType<typeof mutationResult>) => unknown) =>
        Promise.resolve(mutationResult()).then(resolve),
    };
    return mutation;
  });
  return { select, update, chain, reconciliationChain, updates };
}

function consentRow(index: number, overrides: Record<string, unknown> = {}) {
  return {
    id: `consent-${index}`,
    clerk_user_id: `user-${index}`,
    analysis_type: 'skin',
    retention_until: '2025-01-01T00:00:00.000Z',
    withdrawal_at: null,
    updated_at: '2026-08-20T00:00:00.000Z',
    ...overrides,
  };
}

function reconciledCandidateRow(index: number, overrides: Record<string, unknown> = {}) {
  return consentRow(index, {
    id: `reconcile-${String(index).padStart(3, '0')}`,
    retention_until: null,
    withdrawal_at: '2026-08-20T00:00:00.000Z',
    cleanup_reconciled_at: null,
    ...overrides,
  });
}

function sessionRow(index: number, overrides: Record<string, unknown> = {}) {
  const sessionId = `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
  return {
    id: sessionId,
    clerk_user_id: `user-${index}`,
    face_image_url: `user-${index}/${sessionId}/face.jpg`,
    body_image_url: null,
    questionnaire: { imageStorageConsent: true },
    created_at: '2025-01-01T00:00:00.000Z',
    image_cleanup_pending: false,
    status: 'completed',
    ...overrides,
  };
}

function configureTables(consentTable = pagedTable([[]]), integratedTable = pagedTable([[]])) {
  mocks.from.mockImplementation((table: string) => {
    if (table === 'image_consents') return consentTable;
    if (table === 'integrated_analysis_sessions') return integratedTable;
    throw new Error(`unexpected table: ${table}`);
  });
  return { consentTable, integratedTable };
}

function request(method = 'GET') {
  return new NextRequest('http://localhost:3000/api/cron/cleanup-consents', { method });
}

describe('GET /api/cron/cleanup-consents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NODE_ENV', 'development');
    mocks.purgeUserStorageBuckets.mockResolvedValue({ deleted: 1, failedBuckets: [] });
    mocks.purgeStoragePrefix.mockResolvedValue(1);
    mocks.clearAnalysisImagePointers.mockResolvedValue({ cleared: true, failedTarget: null });
    mocks.storageFrom.mockReturnValue({
      remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('프로덕션 무인증 요청은 Storage/DB 접근 전에 401이다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('CRON_SECRET이 없는 운영 환경은 임의 x-vercel 헤더도 신뢰하지 않는다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', '');
    const forged = new NextRequest('http://localhost:3000/api/cron/cleanup-consents', {
      headers: { 'x-vercel-cron-signature': 'forged' },
    });

    const response = await GET(forged);

    expect(response.status).toBe(401);
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('운영 환경은 설정된 CRON_SECRET Bearer만 허용한다', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CRON_SECRET', 'cron-secret');
    configureTables();
    const authorized = new NextRequest('http://localhost:3000/api/cron/cleanup-consents', {
      headers: { Authorization: 'Bearer cron-secret' },
    });

    expect((await GET(authorized)).status).toBe(200);
  });

  it('빈 큐는 성공과 backlog 없음 지표를 반환한다', async () => {
    configureTables();
    const response = await GET(request());
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toMatchObject({ success: true, processed: 0, remaining: false });
    expect(json.cleanup.imageConsents.batches).toBe(1);
    expect(json.cleanup.integratedSessions.batches).toBe(1);
  });

  it('일반 축은 만료 동의와 철회 purge-pending을 함께 조회하고 성공 뒤 retention만 비운다', async () => {
    const consentTable = pagedTable([
      [
        consentRow(1, {
          analysis_type: 'hair',
          withdrawal_at: '2026-08-22T00:00:00.000Z',
        }),
      ],
    ]);
    configureTables(consentTable);

    const json = await (await GET(request())).json();

    expect(consentTable.chain.or).toHaveBeenCalledWith(
      expect.stringContaining('consent_given.eq.false,withdrawal_at.not.is.null')
    );
    expect(mocks.purgeUserStorageBuckets).toHaveBeenCalledWith(expect.anything(), 'user-1', [
      'hair-images',
    ]);
    expect(consentTable.updates[0]).toEqual({
      id: 'consent-1',
      payload: {
        consent_given: false,
        withdrawal_at: '2026-08-22T00:00:00.000Z',
      },
    });
    expect(consentTable.updates[1]).toEqual({
      id: 'consent-1',
      payload: {
        consent_given: false,
        withdrawal_at: '2026-08-22T00:00:00.000Z',
        retention_until: null,
      },
    });
    const finalizeMutation = consentTable.update.mock.results[1].value;
    expect(finalizeMutation.eq).toHaveBeenCalledWith('withdrawal_at', '2026-08-22T00:00:00.000Z');
    expect(finalizeMutation.eq).toHaveBeenCalledWith('updated_at', 'claimed-consent-1');
    expect(json.processed).toBe(1);
  });

  it('레거시 twin 파기 대기는 twins 객체와 user_twins 행 정리 경로로 보낸다', async () => {
    const consentTable = pagedTable([
      [
        consentRow(1, {
          analysis_type: 'twin',
          withdrawal_at: '2026-08-27T00:00:00.000Z',
        }),
      ],
    ]);
    configureTables(consentTable);

    const json = await (await GET(request())).json();

    expect(mocks.purgeUserStorageBuckets).toHaveBeenCalledWith(expect.anything(), 'user-1', [
      'twins',
    ]);
    expect(mocks.clearAnalysisImagePointers).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'twin'
    );
    expect(json.processed).toBe(1);
  });

  it('일반 동의 101건을 100건 상한에 멈추지 않고 두 페이지 모두 처리한다', async () => {
    const first = Array.from({ length: 100 }, (_, index) => consentRow(index));
    const consentTable = pagedTable([first, [consentRow(100)]]);
    configureTables(consentTable);

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(101);
    expect(json.cleanup.imageConsents).toMatchObject({ batches: 2, remaining: false });
    expect(consentTable.chain.limit).toHaveBeenCalledTimes(2);
  });

  it('일반 동의 중간 실패는 뒤 행을 계속 처리하고 remaining으로 다음 실행 재시도를 알린다', async () => {
    const failed = consentRow(50);
    const first = Array.from({ length: 100 }, (_, index) => consentRow(index));
    const consentTable = pagedTable([first, [failed, consentRow(100)]]);
    configureTables(consentTable);
    mocks.purgeUserStorageBuckets.mockImplementation(async (_client, userId: string) =>
      userId === 'user-50'
        ? { deleted: 0, failedBuckets: ['storage:skin-images'] }
        : { deleted: 1, failedBuckets: [] }
    );

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(100);
    expect(json.remaining).toBe(true);
    expect(json.cleanup.imageConsents.remainingReason).toBe('retryable_failures');
    expect(mocks.purgeUserStorageBuckets).toHaveBeenCalledWith(expect.anything(), 'user-100', [
      'skin-images',
    ]);
  });

  it('철회 완료 행은 24시간 뒤 pending claim으로 잠그고 한 번 더 purge한 뒤 재조정 완료한다', async () => {
    const candidate = reconciledCandidateRow(1, { analysis_type: 'personal-color' });
    const consentTable = pagedTable([[]], { reconciliationRows: [candidate] });
    configureTables(consentTable);

    const json = await (await GET(request())).json();

    expect(mocks.purgeUserStorageBuckets).toHaveBeenCalledWith(expect.anything(), 'user-1', [
      'personal-color-images',
    ]);
    expect(consentTable.updates[0]).toEqual({
      id: candidate.id,
      payload: {
        retention_until: expect.any(String),
        cleanup_reconciled_at: null,
      },
    });
    expect(consentTable.updates[1]).toEqual({
      id: candidate.id,
      payload: {
        retention_until: null,
        cleanup_reconciled_at: expect.any(String),
      },
    });
    expect(json.processed).toBe(1);
  });

  it('재조정 첫 100건 purge가 실패해도 withdrawal_at keyset으로 101번째를 처리한다', async () => {
    const rows = Array.from({ length: 101 }, (_, index) => reconciledCandidateRow(index));
    const failedUsers = new Set(rows.slice(0, 100).map((row) => String(row.clerk_user_id)));
    const consentTable = pagedTable([[]], { reconciliationRows: rows });
    configureTables(consentTable);
    mocks.purgeUserStorageBuckets.mockImplementation(async (_client, userId: string) =>
      failedUsers.has(userId)
        ? { deleted: 0, failedBuckets: ['storage:skin-images'] }
        : { deleted: 1, failedBuckets: [] }
    );

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(1);
    expect(json.cleanup.imageConsents.reconciliation).toMatchObject({
      batches: 2,
      remaining: true,
      remainingReason: 'retryable_failures',
    });
    expect(mocks.purgeUserStorageBuckets).toHaveBeenCalledWith(expect.anything(), 'user-100', [
      'skin-images',
    ]);
    expect(consentTable.reconciliationChain.or).toHaveBeenCalledWith(
      expect.stringContaining('withdrawal_at.gt.')
    );
  });

  it('통합 큐는 1년 만료와 cleanup-pending을 함께 조회한다', async () => {
    const integratedTable = pagedTable([[]]);
    configureTables(pagedTable([[]]), integratedTable);
    await GET(request());

    expect(integratedTable.chain.or).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('questionnaire->>_imageStorageCleanupPending.eq.true')
    );
    expect(integratedTable.chain.or).toHaveBeenCalledWith(
      expect.stringContaining('status.in.(failed,pending)')
    );
    expect(integratedTable.chain.is).toHaveBeenCalledWith(
      'questionnaire->>_imageStoragePurgedAt',
      null
    );
    expect(integratedTable.chain.limit).toHaveBeenCalledWith(100);
  });

  it('통합 세션 201건도 세 페이지를 모두 처리한다', async () => {
    const first = Array.from({ length: 100 }, (_, index) => sessionRow(index));
    const second = Array.from({ length: 100 }, (_, index) => sessionRow(index + 100));
    const integratedTable = pagedTable([first, second, [sessionRow(200)]]);
    configureTables(pagedTable([[]]), integratedTable);

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(201);
    expect(json.deletedImages).toBe(201);
    expect(json.cleanup.integratedSessions).toMatchObject({ batches: 3, remaining: false });
  });

  it('포인터 없는 오래된 pending 101건도 canonical prefix로 회수해 첫 페이지가 굶기지 않는다', async () => {
    const abandoned = (index: number) =>
      sessionRow(index, {
        face_image_url: null,
        body_image_url: null,
        image_cleanup_pending: true,
        status: 'pending',
        created_at: '2026-08-20T00:00:00.000Z',
      });
    const first = Array.from({ length: 100 }, (_, index) => abandoned(index));
    const integratedTable = pagedTable([first, [abandoned(100)]]);
    configureTables(pagedTable([[]]), integratedTable);

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(101);
    expect(json.cleanup.integratedSessions).toMatchObject({ batches: 2, remaining: false });
    expect(mocks.purgeStoragePrefix).toHaveBeenCalledTimes(101);
    expect(mocks.purgeStoragePrefix).toHaveBeenLastCalledWith(
      expect.anything(),
      'integrated-sessions',
      `user-100/${abandoned(100).id}`
    );
    expect(integratedTable.updates).toHaveLength(101);
  });

  it('첫 100건이 영구 실패해도 안정 keyset으로 101번째 세션까지 진행한다', async () => {
    const rows = Array.from({ length: 101 }, (_, index) =>
      sessionRow(index, { image_cleanup_pending: true })
    );
    const firstHundredIds = new Set(rows.slice(0, 100).map((row) => String(row.id)));
    const integratedTable = pagedTable([], { keysetRows: rows });
    configureTables(pagedTable([[]]), integratedTable);
    mocks.purgeStoragePrefix.mockImplementation(async (_client, _bucket, prefix: string) => {
      const sessionId = prefix.split('/')[1] ?? '';
      if (firstHundredIds.has(sessionId)) throw new Error('permanent remove failure');
      return 1;
    });

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(1);
    expect(json.cleanup.integratedSessions).toMatchObject({
      batches: 2,
      remaining: true,
      remainingReason: 'retryable_failures',
    });
    expect(mocks.purgeStoragePrefix).toHaveBeenCalledWith(
      expect.anything(),
      'integrated-sessions',
      `user-100/${String(rows[100]?.id)}`
    );
    expect(integratedTable.chain.or).toHaveBeenCalledWith(
      expect.stringContaining('created_at.gt.')
    );
  });

  it('오염된 DB 포인터는 remove에 넘기지 않고 검증된 소유자·세션 prefix만 파기한다', async () => {
    const poisoned = sessionRow(1, {
      face_image_url: 'victim-user/foreign-session/face.jpg',
      image_cleanup_pending: true,
    });
    configureTables(pagedTable([[]]), pagedTable([[poisoned]]));

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(1);
    expect(mocks.purgeStoragePrefix).toHaveBeenCalledWith(
      expect.anything(),
      'integrated-sessions',
      `user-1/${poisoned.id}`
    );
    expect(mocks.purgeStoragePrefix).not.toHaveBeenCalledWith(
      expect.anything(),
      'integrated-sessions',
      expect.stringContaining('victim-user')
    );
  });

  it('통합 rollback cleanup-pending 성공은 회복 표식과 파기 시각을 남긴다', async () => {
    const integratedTable = pagedTable([
      [
        sessionRow(1, {
          questionnaire: {
            imageStorageConsent: true,
            _imageStorageFailure: 'cleanup_failed',
            _imageStorageCleanupPending: true,
          },
        }),
      ],
    ]);
    configureTables(pagedTable([[]]), integratedTable);

    await GET(request());

    expect(integratedTable.updates[0].payload).toMatchObject({
      face_image_url: null,
      body_image_url: null,
      image_cleanup_pending: false,
      questionnaire: {
        _imageStorageCleanupPending: false,
        _imageStorageFailure: 'cleanup_recovered',
        _imageStoragePurgedAt: expect.any(String),
        _imageStorageCleanupRecoveredAt: expect.any(String),
      },
    });
  });

  it('통합 중간 remove 실패도 뒤 페이지를 배출하고 실패 경로는 다음 실행용으로 유지한다', async () => {
    const failed = sessionRow(50);
    const first = Array.from({ length: 100 }, (_, index) => sessionRow(index));
    const integratedTable = pagedTable([first, [failed, sessionRow(100)]]);
    configureTables(pagedTable([[]]), integratedTable);
    mocks.purgeStoragePrefix.mockImplementation(async (_client, _bucket, prefix: string) => {
      if (prefix.endsWith(failed.id)) throw new Error('remove failed');
      return 1;
    });

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(100);
    expect(json.cleanup.integratedSessions.remainingReason).toBe('retryable_failures');
    expect(integratedTable.updates.some(({ id }) => id === failed.id)).toBe(false);
    expect(integratedTable.updates.some(({ id }) => id === sessionRow(100).id)).toBe(true);
  });

  it('일반 동의 조회 오류는 500이며 성공으로 위장하지 않는다', async () => {
    configureTables(pagedTable([[]], { fetchError: { message: 'DB Error' } }));
    const response = await GET(request());
    expect(response.status).toBe(500);
  });

  it('purge 전 CAS claim이 0행이면 새 업로드를 지우지 않고 stale로 건너뛴다', async () => {
    const consentTable = pagedTable([[consentRow(1)]], {
      staleClaimIds: new Set(['consent-1']),
    });
    configureTables(consentTable);

    const json = await (await GET(request())).json();

    expect(json.processed).toBe(0);
    expect(json.cleanup.imageConsents.staleSkipped).toBe(1);
    expect(mocks.purgeUserStorageBuckets).not.toHaveBeenCalled();
    const mutation = consentTable.update.mock.results[0].value;
    expect(mutation.eq).toHaveBeenCalledWith('updated_at', '2026-08-20T00:00:00.000Z');
  });

  it('POST도 같은 정리 경로를 사용한다', async () => {
    configureTables();
    expect((await POST(request('POST'))).status).toBe(200);
  });
});
