/**
 * 사용자 스토리지 파기 유틸 테스트
 * @see lib/api/storage-purge.ts
 */
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  BIOMETRIC_STORAGE_BUCKETS,
  purgeStoragePrefix,
  purgeUserStorage,
  purgeUserStorageBuckets,
  USER_STORAGE_BUCKETS,
} from '@/lib/api/storage-purge';

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
  const listCalls: Array<{
    bucket: string;
    prefix: string;
    options: { limit?: number; offset?: number; sortBy?: { column: string; order: string } };
  }> = [];
  const from = vi.fn((bucket: string) => ({
    list: vi.fn(
      async (
        prefix: string,
        options: {
          limit?: number;
          offset?: number;
          sortBy?: { column: string; order: string };
        } = {}
      ) => {
        listCalls.push({ bucket, prefix, options });
        const offsetKey = `${bucket}:${prefix}:${options.offset ?? 0}`;
        const firstPageKey = `${bucket}:${prefix}`;
        return (
          listMap[offsetKey] ??
          ((options.offset ?? 0) === 0 ? listMap[firstPageKey] : undefined) ?? {
            data: [],
            error: null,
          }
        );
      }
    ),
    remove,
  }));
  // service-role 클라이언트는 storage만 사용하므로 최소 형태로 캐스팅
  const supabase = { storage: { from } } as never;
  return { supabase, remove, from, listCalls };
}

describe('purgeUserStorage', () => {
  it('세션 prefix만 재귀 수집해 포인터 없는 통합 원본을 회수한다', async () => {
    const prefix = 'user-1/00000000-0000-4000-8000-000000000001';
    const { supabase, remove } = makeStorageMock({
      [`integrated-sessions:${prefix}`]: {
        data: [
          { name: 'face.jpg', id: 'face-1' },
          { name: 'nested', id: null },
        ],
        error: null,
      },
      [`integrated-sessions:${prefix}/nested`]: {
        data: [{ name: 'body.webp', id: 'body-1' }],
        error: null,
      },
    });

    await expect(purgeStoragePrefix(supabase, 'integrated-sessions', prefix)).resolves.toBe(2);
    expect(remove).toHaveBeenCalledWith([`${prefix}/face.jpg`, `${prefix}/nested/body.webp`]);
  });

  it('빈 경로·상위 이동을 prefix 파기로 전달하지 않는다', async () => {
    const { supabase, from } = makeStorageMock({});

    await expect(purgeStoragePrefix(supabase, 'integrated-sessions', '../user-1')).rejects.toThrow(
      'Unsafe storage prefix'
    );
    expect(from).not.toHaveBeenCalled();
  });

  it('생체 철회 범위에는 통합분석을 포함하고 음식·옷장·피드는 포함하지 않는다', async () => {
    expect(BIOMETRIC_STORAGE_BUCKETS).toContain('integrated-sessions');
    expect(BIOMETRIC_STORAGE_BUCKETS).toContain('hair-images');
    expect(BIOMETRIC_STORAGE_BUCKETS).toContain('makeup-images');
    expect(BIOMETRIC_STORAGE_BUCKETS).not.toContain('food-images' as never);
    expect(BIOMETRIC_STORAGE_BUCKETS).not.toContain('inventory-images' as never);
    expect(BIOMETRIC_STORAGE_BUCKETS).not.toContain('feed-images' as never);

    const { supabase, from } = makeStorageMock({});
    await purgeUserStorageBuckets(supabase, 'user-1', BIOMETRIC_STORAGE_BUCKETS);

    const visitedBuckets = new Set(from.mock.calls.map(([bucket]) => bucket));
    expect(visitedBuckets).toEqual(new Set(BIOMETRIC_STORAGE_BUCKETS));
  });

  it('실제 업로드 코드가 쓰는 모든 사용자 버킷을 파기 대상에 포함한다', () => {
    const uploadBucketContracts = [
      ['skin-images', 'app/api/analyze/skin/route.ts'],
      ['body-images', 'app/api/analyze/body/route.ts'],
      ['personal-color-images', 'app/api/analyze/personal-color/route.ts'],
      ['hair-images', 'app/api/analyze/hair/route.ts'],
      ['makeup-images', 'app/api/analyze/makeup/route.ts'],
      ['posture-images', 'app/api/analyze/posture/route.ts'],
      ['integrated-sessions', 'lib/analysis/integrated/internal/storage-uploader.ts'],
      ['twins', 'lib/visual-expression/twin/internal/store.ts'],
      ['inventory-images', 'app/api/inventory/upload/route.ts'],
    ] as const;

    for (const [bucket, sourcePath] of uploadBucketContracts) {
      // 소스와 기대값이 따로 표류하지 않도록 실제 업로드 파일에도 버킷명이 있는지 함께 고정한다.
      const source = readFileSync(join(process.cwd(), sourcePath), 'utf8');
      expect(source, `${sourcePath}가 더 이상 ${bucket}을 사용하지 않음`).toContain(bucket);
      expect(USER_STORAGE_BUCKETS, `${bucket} 파기 대상 누락`).toContain(bucket);
    }
  });

  it('1001개 파일을 다음 페이지까지 수집하고 1000개 이하로 나눠 삭제한다', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      name: `file-${String(index).padStart(4, '0')}.jpg`,
      id: `id-${index}`,
    }));
    const { supabase, remove, listCalls } = makeStorageMock({
      'skin-images:user-1:0': { data: firstPage, error: null },
      'skin-images:user-1:1000': {
        data: [{ name: 'file-1000.jpg', id: 'id-1000' }],
        error: null,
      },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result).toEqual({ deleted: 1001, failedBuckets: [] });
    expect(
      listCalls
        .filter((call) => call.bucket === 'skin-images' && call.prefix === 'user-1')
        .map((call) => call.options.offset ?? 0)
    ).toEqual([0, 1000]);
    expect(remove).toHaveBeenCalledTimes(2);
    expect(remove.mock.calls[0]?.[0]).toHaveLength(1000);
    expect(remove.mock.calls[1]?.[0]).toEqual(['user-1/file-1000.jpg']);
  });

  it('후속 페이지 list가 실패하면 앞 페이지 파일도 지우지 않고 버킷 실패로 닫는다', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      name: `file-${String(index).padStart(4, '0')}.jpg`,
      id: `id-${index}`,
    }));
    const { supabase, remove } = makeStorageMock({
      'skin-images:user-1:0': { data: firstPage, error: null },
      'skin-images:user-1:1000': {
        data: null,
        error: { message: 'second page unavailable' },
      },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(0);
    expect(result.failedBuckets).toContain('storage:skin-images');
    expect(remove).not.toHaveBeenCalled();
  });

  it('후속 remove 청크가 실패하면 성공으로 위장하지 않고 버킷 실패를 남긴다', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      name: `file-${String(index).padStart(4, '0')}.jpg`,
      id: `id-${index}`,
    }));
    const { supabase, remove } = makeStorageMock(
      {
        'skin-images:user-1:0': { data: firstPage, error: null },
        'skin-images:user-1:1000': {
          data: [{ name: 'file-1000.jpg', id: 'id-1000' }],
          error: null,
        },
      },
      (paths) => ({
        error: paths.includes('user-1/file-1000.jpg') ? { message: 'second remove failed' } : null,
      })
    );

    const result = await purgeUserStorage(supabase, 'user-1');

    // 첫 청크의 실제 삭제 수는 보존하되 실패 표식으로 계정 파기 흐름은 fail-closed 된다.
    expect(result.deleted).toBe(1000);
    expect(result.failedBuckets).toContain('storage:skin-images');
    expect(remove).toHaveBeenCalledTimes(2);
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

  it('버킷 list 오류를 파기 실패로 기록한다', async () => {
    const { supabase, remove } = makeStorageMock({
      'skin-images:user-1': { data: null, error: { message: 'storage unavailable' } },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(0);
    // 회귀: list 실패를 빈 목록으로 취급하면 이미지 잔존 상태에서 계정 삭제가 성공한다.
    expect(result.failedBuckets).toContain('storage:skin-images');
    expect(remove).not.toHaveBeenCalled();
  });

  it('중첩 폴더 list 오류도 해당 버킷의 파기 실패로 기록한다', async () => {
    const { supabase, remove } = makeStorageMock({
      'twins:user-1': { data: [{ name: 'sessionA', id: null }], error: null },
      'twins:user-1/sessionA': { data: null, error: { message: 'nested list failed' } },
    });

    const result = await purgeUserStorage(supabase, 'user-1');

    expect(result.deleted).toBe(0);
    expect(result.failedBuckets).toContain('storage:twins');
    expect(remove).not.toHaveBeenCalled();
  });
});
