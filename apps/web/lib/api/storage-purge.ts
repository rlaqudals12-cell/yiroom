/**
 * 사용자 스토리지 이미지 파기 유틸 (GDPR Art.17 / BIPA·PIPA 파기의무)
 *
 * 계정 즉시삭제·GDPR soft/hard delete 크론·미접속 정리 크론이 동일한 파기 로직을
 * 공유하도록 재귀 수집 + 전체 버킷 목록을 한 곳에 모은다.
 *
 * ⚠️ 일부 버킷은 `{userId}/{sessionId}/face.jpg` 처럼 중첩 폴더라 단순 list+remove로는
 *    폴더 안 파일이 안 지워진다 → 재귀 수집으로 모든 하위 파일을 파기한다.
 *    생체 이미지 버킷(integrated-sessions=온보딩 얼굴·체형, twins=AI 아바타)이
 *    누락되면 파기의무 위반이므로 사용자 소유 전 버킷을 포함한다.
 */
import type { createServiceRoleClient } from '@/lib/supabase/service-role';

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

/**
 * 사용자 소유 이미지가 저장될 수 있는 전체 버킷 (계정삭제·크론 공통 정본)
 * 실제 업로드 경로와 prod 버킷을 대조한 목록. 버킷 조회 실패는 파기 실패로 처리한다.
 */
export const USER_STORAGE_BUCKETS = [
  'skin-images', // S축 피부 (생체)
  'body-images', // C축 체형 (생체)
  'personal-color-images', // PC축 퍼스널컬러 (생체)
  'hair-images', // H축 헤어·두피 (생체)
  'makeup-images', // M축 메이크업 얼굴 (생체)
  'posture-images', // 자세 분석 전면·측면 (생체)
  'food-images', // 식단 기록 이미지
  'integrated-sessions', // 통합분석 얼굴·체형 캡처 (생체, 중첩 경로)
  'twins', // AI 아바타 (얼굴 유래 생체)
  'inventory-images', // 화장대·옷장 사진 (중첩 경로)
  'feed-images', // 피드 업로드
  'uploads', // 기타 업로드
] as const;

/**
 * 생체정보 동의 철회 시 파기할 분석 이미지 버킷.
 *
 * 음식·옷장·피드처럼 생체 분석과 무관한 사용자 파일은 철회 범위를 넘어가므로 제외한다.
 * AI 트윈은 원본이 아니라 생성 이미지이지만 얼굴에서 파생된 표현 데이터라 함께 파기한다.
 */
export const BIOMETRIC_STORAGE_BUCKETS = [
  'skin-images',
  'body-images',
  'personal-color-images',
  'hair-images',
  'makeup-images',
  'posture-images',
  'integrated-sessions',
  'twins',
] as const satisfies readonly (typeof USER_STORAGE_BUCKETS)[number][];

/** Supabase Storage list/remove API 한 번에 다루는 최대 파일 수. */
const STORAGE_PAGE_SIZE = 1000;

export interface PurgeResult {
  /** 삭제된 파일 총 개수 */
  deleted: number;
  /** 파기 실패한 버킷 라벨 목록 (`storage:<bucket>`) */
  failedBuckets: string[];
}

export type UserStorageBucket = (typeof USER_STORAGE_BUCKETS)[number];

export const IMAGE_CONSENT_STORAGE_BUCKETS = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
  hair: 'hair-images',
  makeup: 'makeup-images',
  twin: 'twins',
} as const satisfies Record<string, UserStorageBucket>;

export type ImageStorageAnalysisType = keyof typeof IMAGE_CONSENT_STORAGE_BUCKETS;

const ANALYSIS_IMAGE_POINTERS: Record<
  ImageStorageAnalysisType,
  { table: string; values: Record<string, string | null> }
> = {
  skin: { table: 'skin_analyses', values: { image_url: '' } },
  body: {
    table: 'body_analyses',
    values: {
      image_url: '',
      left_side_image_url: null,
      right_side_image_url: null,
      back_image_url: null,
    },
  },
  'personal-color': {
    table: 'personal_color_assessments',
    values: { face_image_url: null, left_image_url: null, right_image_url: null },
  },
  hair: { table: 'hair_analyses', values: { image_url: '' } },
  makeup: { table: 'makeup_analyses', values: { image_url: '' } },
  // 트윈은 image_path NOT NULL이라 포인터만 비울 수 없다. 저장 철회 시 레코드도 함께 파기한다.
  twin: { table: 'user_twins', values: {} },
};

export interface PointerCleanupResult {
  cleared: boolean;
  failedTarget: string | null;
}

/** 삭제된 원본 사진을 분석 결과가 계속 가리키지 않도록 축별 경로 필드를 비운다. */
export async function clearAnalysisImagePointers(
  supabase: ServiceClient,
  userId: string,
  analysisType: ImageStorageAnalysisType
): Promise<PointerCleanupResult> {
  const pointer = ANALYSIS_IMAGE_POINTERS[analysisType];

  try {
    if (analysisType === 'twin') {
      const { error } = await supabase.from(pointer.table).delete().eq('clerk_user_id', userId);
      return error
        ? { cleared: false, failedTarget: `db:${pointer.table}` }
        : { cleared: true, failedTarget: null };
    }

    const { error } = await supabase
      .from(pointer.table)
      .update(pointer.values)
      .eq('clerk_user_id', userId);

    if (error) {
      return { cleared: false, failedTarget: `db:${pointer.table}` };
    }
  } catch {
    return { cleared: false, failedTarget: `db:${pointer.table}` };
  }

  return { cleared: true, failedTarget: null };
}

/**
 * `{prefix}/` 하위의 모든 파일 경로를 재귀 수집한다.
 * Supabase Storage는 폴더 엔트리를 `id=null`로 반환하므로 이를 감지해 하위로 파고든다.
 */
async function collectUserFiles(
  supabase: ServiceClient,
  bucket: string,
  prefix: string
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: STORAGE_PAGE_SIZE,
      offset,
      // 페이지 사이에서 순서가 바뀌어 누락·중복되지 않도록 정렬 기준을 고정한다.
      sortBy: { column: 'name', order: 'asc' },
    });
    // 왜: 어느 페이지든 list 실패를 빈 폴더로 오인하면 실제 파일이 남아도 파기 성공으로
    // 보고되어 Clerk 계정까지 지워진다. 전체 수집이 끝나기 전에는 remove를 시작하지 않는다.
    if (error) throw error;
    if (!data) throw new Error(`Storage list returned no data for ${bucket}`);

    for (const entry of data) {
      const entryPath = `${prefix}/${entry.name}`;
      if (entry.id === null) {
        // 폴더 — 재귀로 하위 파일 수집
        paths.push(...(await collectUserFiles(supabase, bucket, entryPath)));
      } else {
        paths.push(entryPath);
      }
    }

    if (data.length < STORAGE_PAGE_SIZE) break;
    offset += STORAGE_PAGE_SIZE;
  }

  return paths;
}

/**
 * 특정 소유 prefix 아래 파일만 재귀 파기한다.
 * 통합 분석의 세션 행이 포인터를 잃었어도 `{userId}/{sessionId}`가 내구성 있는 회수 키가 된다.
 */
export async function purgeStoragePrefix(
  supabase: ServiceClient,
  bucket: UserStorageBucket,
  prefix: string
): Promise<number> {
  if (!prefix || prefix.startsWith('/') || prefix.endsWith('/') || prefix.includes('..')) {
    throw new Error('Unsafe storage prefix');
  }

  const filePaths = await collectUserFiles(supabase, bucket, prefix);
  for (let offset = 0; offset < filePaths.length; offset += STORAGE_PAGE_SIZE) {
    const chunk = filePaths.slice(offset, offset + STORAGE_PAGE_SIZE);
    const { error } = await supabase.storage.from(bucket).remove(chunk);
    if (error) throw error;
  }
  return filePaths.length;
}

/**
 * 사용자(userId=clerk_user_id)의 모든 버킷 이미지를 재귀 파기한다.
 *
 * - 비어있는 버킷만 건너뛴다. list 오류는 잔존 파일 여부를 알 수 없으므로 실패다.
 * - 개별 버킷 실패는 전체를 막지 않고 `failedBuckets`로 수집해 호출자가 감사에 기록하도록 한다.
 *
 * @param supabase Service Role 클라이언트 (RLS 우회)
 * @param userId Clerk 사용자 ID (스토리지 최상위 폴더명)
 */
export async function purgeUserStorageBuckets(
  supabase: ServiceClient,
  userId: string,
  buckets: readonly UserStorageBucket[]
): Promise<PurgeResult> {
  let deleted = 0;
  const failedBuckets: string[] = [];

  for (const bucket of buckets) {
    try {
      const filePaths = await collectUserFiles(supabase, bucket, userId);
      if (filePaths.length === 0) continue;

      // Storage API 요청 크기를 제한하고, 어느 청크든 실패하면 버킷 실패로 드러낸다.
      for (let offset = 0; offset < filePaths.length; offset += STORAGE_PAGE_SIZE) {
        const chunk = filePaths.slice(offset, offset + STORAGE_PAGE_SIZE);
        const { error } = await supabase.storage.from(bucket).remove(chunk);
        if (error) throw error;
        deleted += chunk.length;
      }
    } catch {
      // 개별 버킷 실패는 계속 수집하되, 호출자가 계정 삭제를 중단할 수 있게 드러낸다.
      failedBuckets.push(`storage:${bucket}`);
    }
  }

  return { deleted, failedBuckets };
}

/** 계정 삭제·보존기간 만료 시 사용자 소유 전체 스토리지를 파기한다. */
export async function purgeUserStorage(
  supabase: ServiceClient,
  userId: string
): Promise<PurgeResult> {
  return purgeUserStorageBuckets(supabase, userId, USER_STORAGE_BUCKETS);
}
