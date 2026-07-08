/**
 * 표현 레이어 — 트윈 저장소(Storage+DB) 테스트 (ADR-115)
 *
 * service-role Supabase 클라이언트를 체이너블 목으로 대체.
 * 검증: 승인 1개 원칙(기존 approved→rejected), 삭제=파일+행, 삽입=pending.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const { state } = vi.hoisted(() => {
  return {
    state: {} as {
      queue: unknown[];
      storage: Record<string, ReturnType<typeof vi.fn>>;
      from: ReturnType<typeof vi.fn>;
      builder: Record<string, unknown>;
    },
  };
});

vi.mock('@/lib/supabase/service-role', () => ({
  createServiceRoleClient: () => ({
    from: state.from,
    storage: { from: () => state.storage },
  }),
}));

function resetClient() {
  state.queue = [];
  const shift = () => state.queue.shift() ?? { data: null, error: null };
  const builder: Record<string, unknown> = {};
  const self = () => builder;
  builder.select = vi.fn(self);
  builder.insert = vi.fn(self);
  builder.update = vi.fn(self);
  builder.delete = vi.fn(self);
  builder.eq = vi.fn(self);
  builder.order = vi.fn(self);
  builder.limit = vi.fn(self);
  builder.single = vi.fn(() => Promise.resolve(shift()));
  builder.maybeSingle = vi.fn(() => Promise.resolve(shift()));
  // update().eq().eq() 처럼 select 없이 await되는 경우 대응(thenable)
  builder.then = (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
    Promise.resolve(shift()).then(resolve, reject);
  state.builder = builder;
  state.from = vi.fn(() => builder);
  state.storage = {
    createSignedUrl: vi.fn(async () => ({
      data: { signedUrl: 'https://signed/url' },
      error: null,
    })),
    upload: vi.fn(async () => ({ error: null })),
    remove: vi.fn(async () => ({ error: null })),
    download: vi.fn(async () => ({ data: new Blob(['x'], { type: 'image/png' }), error: null })),
  };
}

async function load() {
  return import('@/lib/visual-expression/twin/internal/store');
}

const TARGET_ROW = {
  id: 't-1',
  clerk_user_id: 'user-1',
  image_path: 'user-1/t-1.png',
  status: 'pending',
  source_meta: null,
  created_at: '2026-07-10',
};

describe('insertTwin', () => {
  beforeEach(resetClient);

  it('이미지를 업로드하고 pending 행을 삽입해 서명 URL 레코드를 반환한다', async () => {
    state.queue = [{ data: { ...TARGET_ROW }, error: null }];
    const { insertTwin } = await load();

    const record = await insertTwin({
      userId: 'user-1',
      imageBase64: 'QUJD',
      mimeType: 'image/png',
      sourceMeta: { promptVersion: 'twin-v1', bodyType: null },
    });

    expect(state.storage.upload).toHaveBeenCalledOnce();
    expect(record.status).toBe('pending');
    expect(record.aiGenerated).toBe(true);
    expect(record.imageUrl).toBe('https://signed/url');
  });
});

describe('approveTwin — 승인 1개 원칙', () => {
  beforeEach(resetClient);

  it('기존 approved를 rejected로 강등한 뒤 대상을 approved로 전환한다', async () => {
    state.queue = [
      { data: { ...TARGET_ROW }, error: null }, // getTwinRowById(maybeSingle)
      { error: null }, // strip update (await)
      { data: { ...TARGET_ROW, status: 'approved' }, error: null }, // final update(single)
    ];
    const { approveTwin } = await load();

    const record = await approveTwin('user-1', 't-1');

    expect(record.status).toBe('approved');
    // update가 최소 2회 호출됨(강등 + 승인)
    const updateMock = state.builder.update as ReturnType<typeof vi.fn>;
    expect(updateMock).toHaveBeenCalledTimes(2);
    // 첫 update가 rejected 강등
    expect(updateMock.mock.calls[0][0]).toMatchObject({ status: 'rejected' });
    // 두번째 update가 approved
    expect(updateMock.mock.calls[1][0]).toMatchObject({ status: 'approved' });
  });

  it('트윈이 없으면 TwinNotFoundError를 던진다', async () => {
    state.queue = [{ data: null, error: null }];
    const { approveTwin } = await load();
    const { TwinNotFoundError } = await import('@/lib/visual-expression/twin/internal/errors');
    await expect(approveTwin('user-1', 'missing')).rejects.toBeInstanceOf(TwinNotFoundError);
  });
});

describe('deleteTwin — 파일 + 행 동시 삭제', () => {
  beforeEach(resetClient);

  it('Storage 파일을 제거하고 행을 삭제한다', async () => {
    state.queue = [
      { data: { ...TARGET_ROW }, error: null }, // getTwinRowById
      { error: null }, // delete().eq().eq() await
    ];
    const { deleteTwin } = await load();

    await deleteTwin('user-1', 't-1');

    expect(state.storage.remove).toHaveBeenCalledWith(['user-1/t-1.png']);
    expect(state.builder.delete).toHaveBeenCalledOnce();
  });

  it('트윈이 없으면 삭제하지 않고 TwinNotFoundError를 던진다', async () => {
    state.queue = [{ data: null, error: null }];
    const { deleteTwin } = await load();
    const { TwinNotFoundError } = await import('@/lib/visual-expression/twin/internal/errors');
    await expect(deleteTwin('user-1', 'missing')).rejects.toBeInstanceOf(TwinNotFoundError);
    expect(state.storage.remove).not.toHaveBeenCalled();
  });
});
