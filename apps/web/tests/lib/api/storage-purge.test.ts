/**
 * 사용자 스토리지 파기 유틸 테스트
 * @see lib/api/storage-purge.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { purgeUserStorage, USER_STORAGE_BUCKETS } from '@/lib/api/storage-purge';

interface ListResult {
  data: Array<{ name: string; id: string | null }> | null;
  error: unknown;
}

/**
 * storage 목 생성.
 * @param listMap `${bucket}:${prefix}` → list 결과. 없으면 빈 폴더로 간주.
 * @param removeImpl remove 동작 (기본 성공)
 */
function makeStorageMock(
  listMap: Record<string, ListResult>,
  removeImpl?: (paths: string[]) => { error: unknown }
) {
  const remove = vi.fn(async (paths: string[]) =>
    removeImpl ? removeImpl(paths) : { error: null }
  );
  const from = vi.fn((bucket: string) => ({
    list: vi.fn(
      async (prefix: string) => listMap[`${bucket}:${prefix}`] ?? { data: [], error: null }
    ),
    remove,
  }));
  // service-role 클라이언트는 storage만 사용하므로 최소 형태로 캐스팅
  const supabase = { storage: { from } } as never;
  return { supabase, remove, from };
}

describe('purgeUserStorage', () => {
  it('생체 버킷(integrated-sessions·twins)을 파기 대상에 포함한다', () => {
    expect(USER_STORAGE_BUCKETS).toContain('integrated-sessions');
    expect(USER_STORAGE_BUCKETS).toContain('twins');
    expect(USER_STORAGE_BUCKETS).toContain('skin-images');
  });

  it('버킷의 평면 파일을 모두 삭제하고 개수를 반환한다', async () => {
    const { supabase, remove } = makeStorageMock({
      'skin-images:user-1': {
        data: [
          { name: 'a.jpg', id: '1' },
          { name: 'b.jpg', id: '2' },
        ],
        error: null,
      },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(2);
    expect(result.failedBuckets).toEqual([]);
    expect(remove).toHaveBeenCalledWith(['user-1/a.jpg', 'user-1/b.jpg']);
  });

  it('중첩 폴더(id=null)를 재귀 수집해 하위 파일까지 삭제한다', async () => {
    const { supabase, remove } = makeStorageMock({
      // 폴더 엔트리는 id=null 로 반환됨
      'twins:user-1': { data: [{ name: 'sessionA', id: null }], error: null },
      'twins:user-1/sessionA': { data: [{ name: 'face.jpg', id: 'f1' }], error: null },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(1);
    expect(remove).toHaveBeenCalledWith(['user-1/sessionA/face.jpg']);
  });

  it('remove 실패 시 해당 버킷을 failedBuckets에 기록한다', async () => {
    const { supabase } = makeStorageMock(
      { 'skin-images:user-1': { data: [{ name: 'a.jpg', id: '1' }], error: null } },
      () => ({ error: { message: 'remove failed' } })
    );

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(0);
    expect(result.failedBuckets).toContain('storage:skin-images');
  });

  it('버킷 list 오류/부재 시 조용히 건너뛰고 예외를 던지지 않는다', async () => {
    const { supabase, remove } = makeStorageMock({
      'skin-images:user-1': { data: null, error: { message: 'bucket not found' } },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(0);
    expect(result.failedBuckets).toEqual([]);
    expect(remove).not.toHaveBeenCalled();
  });
});
