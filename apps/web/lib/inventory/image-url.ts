/**
 * 인벤토리(옷장·화장대) 이미지 URL 해석
 *
 * @module lib/inventory/image-url
 * @description
 *   `inventory-images` 버킷은 **비공개**다(2026-08-16 보안 수리). 개인 사진이 들어가고
 *   경로 첫 세그먼트가 Clerk userId이므로, 예전처럼 영구 공개 URL을 DB에 박아두면
 *   URL을 아는 누구나 로그인 없이 열람할 수 있고 userId까지 노출된다.
 *
 *   그래서 DB(`user_inventory.image_url` / `original_image_url`)에는 **스토리지 경로**
 *   (`${userId}/${category}/${itemId}_${type}.png`)만 저장하고, 조회 시점에 서명 URL로 바꾼다.
 *
 *   하위호환: 이미 저장된 절대 공개 URL(레거시), 로컬 미리보기용 dataURL/blob URL은
 *   그대로 통과시킨다. 즉 값 하나로 두 세대를 모두 렌더할 수 있다 — 렌더 컴포넌트는
 *   손대지 않고 **읽기 경계 한 곳**에서만 해석한다(P4: 30여 곳 렌더 사이트로 번지는 것 방지).
 *
 * @see apps/web/app/api/inventory/upload/route.ts (경로를 반환하는 업로드 계약)
 * @see supabase/migrations/20260711_user_inventory_closet.sql (버킷 비공개 + RLS)
 */

export const INVENTORY_IMAGE_BUCKET = 'inventory-images';

/**
 * 서명 URL 유효기간.
 *
 * 24시간으로 길게 잡는 이유: next/image 최적화 캐시는 src 문자열을 키로 쓰는데
 * Supabase 서명 토큰은 호출마다 달라진다. 짧은 TTL + 매 호출 재서명이면 캐시가 계속 빗나가
 * 이미지 변환 비용이 불어난다. 아래 메모리 캐시와 함께 같은 세션에서 같은 URL을 재사용한다.
 */
const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24;

/** 만료 여유 (서명 직후 캐시된 URL이 화면에서 죽지 않도록 TTL보다 일찍 버린다) */
const CACHE_SAFETY_MARGIN_MS = 60 * 60 * 1000;

/** path → 서명 URL 메모리 캐시 (탭/서버 인스턴스 수명) */
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();

/**
 * 값이 "스토리지 경로"인가 (= 서명이 필요한가).
 *
 * 절대 URL(https:, data:, blob:, file:)·앱 상대경로(/...)·프로토콜 상대(//...)는 경로가 아니다.
 */
export function isInventoryStoragePath(value: unknown): value is string {
  if (typeof value !== 'string' || value.length === 0) return false;
  // 스킴(`https:`, `data:` 등) 또는 `/`·`//`로 시작하면 이미 렌더 가능한 URL
  return !/^([a-z][a-z0-9+.-]*:|\/)/i.test(value);
}

/** supabase-js 클라이언트 중 이 모듈이 쓰는 부분만 (RLS 클라이언트·service role 양쪽 수용) */
export interface SignedUrlCapableClient {
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
 * 스토리지 경로들을 한 번에 서명한다 (N+1 요청 방지).
 *
 * 실패해도 throw하지 않는다 — 사진 한 장 때문에 목록 조회 전체가 죽으면 안 된다.
 * 서명하지 못한 경로는 맵에 없고, `resolveInventoryImageUrl`이 빈 문자열을 돌려준다
 * (렌더 측 onError/플레이스홀더 경로로 흘러가도록).
 *
 * @param client RLS 클라이언트(클라이언트 컴포넌트) 또는 service role 클라이언트(서버)
 * @param values DB에서 읽은 image_url/original_image_url 값들 (URL·null 섞여 있어도 됨)
 */
export async function signInventoryImagePaths(
  client: SignedUrlCapableClient,
  values: ReadonlyArray<string | null | undefined>
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
  const expiresAt = Date.now() + SIGNED_URL_TTL_SECONDS * 1000 - CACHE_SAFETY_MARGIN_MS;

  const remember = (path: string, url: string): void => {
    resolved.set(path, url);
    signedUrlCache.set(path, { url, expiresAt });
  };

  Object.entries(await signViaClient(client, paths)).forEach(([path, url]) => remember(path, url));

  // 브라우저 폴백: storage.objects의 SELECT 정책은 `TO authenticated`라서,
  // 세션 토큰에 role claim이 없으면 클라이언트 직접 서명이 통째로 실패한다.
  // 그 경우 옷장 썸네일이 전부 빈칸이 되므로, 서버(service role + 경로 소유권 검증)를
  // 거쳐 한 번 더 시도한다. 정상 환경에서는 위에서 이미 다 채워져 여기까지 오지 않는다.
  const unresolved = paths.filter((path) => !resolved.has(path));
  if (unresolved.length > 0 && typeof window !== 'undefined') {
    Object.entries(await signViaServerApi(unresolved)).forEach(([path, url]) =>
      remember(path, url)
    );
  }

  return resolved;
}

/** Supabase 클라이언트로 직접 서명 (실패는 빈 결과로 흡수) */
async function signViaClient(
  client: SignedUrlCapableClient,
  paths: string[]
): Promise<Record<string, string>> {
  const signed: Record<string, string> = {};

  try {
    const { data, error } = await client.storage
      .from(INVENTORY_IMAGE_BUCKET)
      .createSignedUrls(paths, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      console.error('[inventory/image-url] createSignedUrls failed:', error?.message);
      return signed;
    }

    data.forEach((entry, index) => {
      // supabase-js는 요청 순서를 보존하지만, path를 돌려주면 그 값을 우선 신뢰한다
      const path = entry.path ?? paths[index];
      if (path && entry.signedUrl) signed[path] = entry.signedUrl;
    });
  } catch (err) {
    console.error('[inventory/image-url] createSignedUrls threw:', err);
  }

  return signed;
}

/** 서버 서명 API 경유 (브라우저 전용 폴백) */
async function signViaServerApi(paths: string[]): Promise<Record<string, string>> {
  try {
    const response = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: INVENTORY_IMAGE_BUCKET,
        paths,
        expiresIn: SIGNED_URL_TTL_SECONDS,
      }),
    });

    if (!response.ok) return {};

    const { signedUrls } = (await response.json()) as { signedUrls?: Record<string, string> };
    return signedUrls ?? {};
  } catch (err) {
    console.error('[inventory/image-url] signed-url API fallback failed:', err);
    return {};
  }
}

/**
 * 저장된 값을 렌더 가능한 URL로 해석한다.
 *
 * - 절대 URL(레거시 공개 URL·dataURL·blob) → 그대로
 * - 스토리지 경로 → 서명 URL (맵에 없으면 빈 문자열)
 * - null/undefined → 빈 문자열
 *
 * 경로를 그대로 돌려주지 않는 이유: next/image는 `/`로 시작하지 않는 상대 경로를 만나면
 * 예외를 던져 페이지가 통째로 깨진다. 해석 실패는 "이미지 없음"으로 흘러가야 한다.
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
