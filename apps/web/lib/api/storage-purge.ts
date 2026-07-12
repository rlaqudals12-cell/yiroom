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
 * prod 8버킷 대조 + 식단(food-images) 포함. 존재하지 않는 버킷은 조용히 건너뛴다.
 */
export const USER_STORAGE_BUCKETS = [
  'skin-images', // S축 피부 (생체)
  'body-images', // C축 체형 (생체)
  'personal-color-images', // PC축 퍼스널컬러 (생체)
  'food-images', // 식단 기록 이미지
  'integrated-sessions', // 통합분석 얼굴·체형 캡처 (생체, 중첩 경로)
  'twins', // AI 아바타 (얼굴 유래 생체)
  'inventory-images', // 화장대·옷장 사진 (중첩 경로)
  'feed-images', // 피드 업로드
  'uploads', // 기타 업로드
] as const;

export interface PurgeResult {
  /** 삭제된 파일 총 개수 */
  deleted: number;
  /** 파기 실패한 버킷 라벨 목록 (`storage:<bucket>`) */
  failedBuckets: string[];
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
  const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !data || data.length === 0) return [];

  const paths: string[] = [];
  for (const entry of data) {
    const entryPath = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      // 폴더 — 재귀로 하위 파일 수집
      paths.push(...(await collectUserFiles(supabase, bucket, entryPath)));
    } else {
      paths.push(entryPath);
    }
  }
  return paths;
}

/**
 * 사용자(userId=clerk_user_id)의 모든 버킷 이미지를 재귀 파기한다.
 *
 * - 버킷이 없거나 비어있으면 조용히 건너뛴다.
 * - 개별 버킷 실패는 전체를 막지 않고 `failedBuckets`로 수집해 호출자가 감사에 기록하도록 한다.
 *
 * @param supabase Service Role 클라이언트 (RLS 우회)
 * @param userId Clerk 사용자 ID (스토리지 최상위 폴더명)
 */
export async function purgeUserStorage(
  supabase: ServiceClient,
  userId: string
): Promise<PurgeResult> {
  let deleted = 0;
  const failedBuckets: string[] = [];

  for (const bucket of USER_STORAGE_BUCKETS) {
    try {
      const filePaths = await collectUserFiles(supabase, bucket, userId);
      if (filePaths.length === 0) continue;

      const { error } = await supabase.storage.from(bucket).remove(filePaths);
      if (error) {
        failedBuckets.push(`storage:${bucket}`);
      } else {
        deleted += filePaths.length;
      }
    } catch {
      // 버킷이 없거나 접근 불가 — 무시하고 다음 버킷 계속
    }
  }

  return { deleted, failedBuckets };
}
