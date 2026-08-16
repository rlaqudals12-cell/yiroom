/**
 * 인벤토리(옷장·화장대) 이미지 URL 해석 — 웹 `apps/web/lib/inventory/image-url.ts` 미러
 *
 * @module lib/inventory/image-url
 * @description
 *   `inventory-images` 버킷은 **비공개**다(2026-08-16 보안 수리). 개인 사진이 들어가고
 *   경로 첫 세그먼트가 Clerk userId라, 영구 공개 URL을 DB에 저장하면 URL만 알면
 *   로그인 없이 열람되고 userId까지 노출된다.
 *
 *   그래서 `user_inventory.image_url`에는 **스토리지 경로**만 저장하고, 목록/상세를
 *   읽는 시점에 서명 URL로 바꾼다. 렌더 화면(<Image source={{uri}}>)은 손대지 않는다 —
 *   해석은 **읽기 경계 한 곳**에서만 한다.
 *
 *   하위호환: 이미 저장된 절대 URL(레거시 공개 URL·file:// 로컬 미리보기)은 그대로 통과.
 *
 * @see apps/web/app/api/inventory/upload/route.ts (경로를 반환하는 업로드 계약)
 */

export const INVENTORY_IMAGE_BUCKET = 'inventory-images';

/** 서명 URL 유효기간 — 앱을 오래 열어둬도 목록 이미지가 죽지 않도록 넉넉히 */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

/** 만료 여유 (캐시된 URL이 화면에서 죽기 전에 버린다) */
const CACHE_SAFETY_MARGIN_MS = 60 * 60 * 1000;

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * 값이 "스토리지 경로"인가 (= 서명이 필요한가).
 * 스킴(https:, file:, data: 등)이나 `/`로 시작하면 이미 렌더 가능한 값이다.
 */
export function isInventoryStoragePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  return !/^([a-z][a-z0-9+.-]*:|\/)/i.test(value);
}

/** supabase-js 중 이 모듈이 쓰는 부분만 */
export interface SignedUrlCapableClient {
  storage: {
    from(bucket: string): {
      createSignedUrls(
        paths: string[],
        expiresIn: number
      ): Promise<{
        data:
          | {
              path?: string | null;
              signedUrl?: string | null;
              error?: string | null;
            }[]
          | null;
        error: { message: string } | null;
      }>;
    };
  };
}

function readCache(path: string): string | null {
  const hit = signedUrlCache.get(path);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    signedUrlCache.delete(path);
    return null;
  }
  return hit.url;
}

/**
 * 스토리지 경로들을 한 번에 서명한다 (장당 요청 방지 — 모바일 네트워크에서 특히 중요).
 *
 * 실패해도 throw하지 않는다: 사진 한 장 때문에 옷장 목록 전체가 에러 화면이 되면 안 된다.
 * 서명하지 못한 경로는 맵에 없고 `resolveInventoryImageUrl`이 빈 문자열을 돌려준다.
 */
export async function signInventoryImagePaths(
  client: SignedUrlCapableClient,
  values: readonly (string | null | undefined)[]
): Promise<Map<string, string>> {
  const resolved = new Map<string, string>();
  const needsSigning = new Set<string>();

  for (const value of values) {
    if (!isInventoryStoragePath(value)) continue;
    const cached = readCache(value);
    if (cached) resolved.set(value, cached);
    else needsSigning.add(value);
  }

  if (needsSigning.size === 0) return resolved;

  const paths = [...needsSigning];

  try {
    const { data, error } = await client.storage
      .from(INVENTORY_IMAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      return resolved;
    }

    const expiresAt = Date.now() + SIGNED_URL_TTL_SECONDS * 1000 - CACHE_SAFETY_MARGIN_MS;
    data.forEach((entry, index) => {
      const path = entry.path ?? paths[index];
      if (!path || !entry.signedUrl) return;
      resolved.set(path, entry.signedUrl);
      signedUrlCache.set(path, { url: entry.signedUrl, expiresAt });
    });
  } catch {
    // 네트워크 실패 — 이미지 없이라도 목록은 뜬다
  }

  return resolved;
}

/**
 * 저장된 값을 렌더 가능한 URL로 해석한다.
 * 절대 URL은 그대로, 스토리지 경로는 서명 URL로, 해석 실패는 빈 문자열.
 */
export function resolveInventoryImageUrl(
  value: string | null | undefined,
  signed?: ReadonlyMap<string, string> | null
): string {
  if (!value) return '';
  if (!isInventoryStoragePath(value)) return value;
  return signed?.get(value) ?? '';
}

/** 테스트 전용 — 모듈 캐시 초기화 */
export function __resetInventoryImageUrlCache(): void {
  signedUrlCache.clear();
}
