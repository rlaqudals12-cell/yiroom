import { extractStoragePath } from './resolve-image-url';

const SIGNED_URL_TTL_SECONDS = 60 * 60;
const INTEGRATED_IMAGE_SENTINEL = 'integrated://';

/** 서버에서 비공개 이미지 경로를 일괄 서명하는 데 필요한 최소 클라이언트 계약. */
export interface BatchSignedUrlCapableClient {
  storage: {
    from(bucket: string): {
      createSignedUrls(
        paths: string[],
        expiresIn: number
      ): Promise<{
        data: Array<{
          path?: string | null;
          signedUrl?: string | null;
          error?: string | null;
        }> | null;
        error: { message: string } | null;
      }>;
    };
  };
}

function storagePath(value: string, bucket: string): string | null {
  if (value.startsWith(INTEGRATED_IMAGE_SENTINEL)) return null;

  if (/^https?:\/\//i.test(value)) {
    // 과거에 DB에 저장된 만료형/public Supabase URL도 다시 서명한다.
    return extractStoragePath(value, bucket);
  }

  // 알 수 없는 스킴은 렌더 가능한 이미지로 통과시키지 않는다.
  if (/^[a-z][a-z0-9+.-]*:/i.test(value)) return null;
  return value;
}

/**
 * 같은 버킷의 DB 이미지 값들을 한 번에 렌더 가능한 URL로 바꾼다.
 *
 * - 외부 http(s) URL은 레거시 호환을 위해 그대로 둔다.
 * - `integrated://`는 실제 객체가 아닌 세션 표식이므로 이미지 없음(null)이다.
 * - 비공개 경로는 한 번의 `createSignedUrls`로 서명한다.
 * - 서명에 실패한 경로는 원문을 노출하지 않고 null로 닫는다.
 */
export async function signPrivateImageUrls(
  client: BatchSignedUrlCapableClient,
  bucket: string,
  values: ReadonlyArray<string | null | undefined>
): Promise<Array<string | null>> {
  const paths = new Set<string>();

  for (const value of values) {
    if (!value) continue;
    const path = storagePath(value, bucket);
    if (path) paths.add(path);
  }

  const signedByPath = new Map<string, string>();
  const uniquePaths = [...paths];

  if (uniquePaths.length > 0) {
    try {
      const { data, error } = await client.storage
        .from(bucket)
        .createSignedUrls(uniquePaths, SIGNED_URL_TTL_SECONDS);

      if (error || !data) {
        console.error(`[storage] ${bucket} 이미지 일괄 서명 실패:`, error?.message);
      } else {
        data.forEach((entry, index) => {
          const path = entry.path ?? uniquePaths[index];
          if (path && entry.signedUrl) signedByPath.set(path, entry.signedUrl);
        });
      }
    } catch (error) {
      console.error(`[storage] ${bucket} 이미지 일괄 서명 예외:`, error);
    }
  }

  return values.map((value) => {
    if (!value || value.startsWith(INTEGRATED_IMAGE_SENTINEL)) return null;

    const path = storagePath(value, bucket);
    if (path) return signedByPath.get(path) ?? null;

    // 같은 버킷의 Supabase URL이 아니었던 외부 http(s) 이미지만 통과시킨다.
    return /^https?:\/\//i.test(value) ? value : null;
  });
}
