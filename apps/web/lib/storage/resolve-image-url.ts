/**
 * 비공개 스토리지 이미지 URL 해석 — 저장 형태(경로 vs 레거시 전체 URL)를 서명 URL로 환원.
 *
 * 왜 필요한가: 구세대 레코드는 `image_url`에 만료형 서명 URL(또는 비공개 전환 전 public URL)
 * 전체가 저장돼 있다. 이를 재서명 없이 <img src>로 쓰면 발급 1시간 뒤 영구 "이미지 로드 실패"가
 * 된다(2026-08-17 피부 시각화 탭 결함). 경로만 저장된 신세대 값도 같은 진입점으로 서명한다.
 *
 * 클라이언트 전용 — 상대 경로 fetch(/api/storage/signed-url)를 사용한다.
 *
 * @module lib/storage
 */

const STORAGE_OBJECT_MARKER = '/storage/v1/object/';

/**
 * 전체 URL에서 해당 버킷의 스토리지 경로를 추출한다.
 * `https://<proj>.supabase.co/storage/v1/object/{public|sign|authenticated}/<bucket>/<path>` 형태만
 * 인식하며, 다른 버킷이거나 스토리지 URL이 아니면 null (외부 URL은 호출측이 원본 유지).
 */
export function extractStoragePath(value: string, bucket: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return null;
  }

  const markerIndex = parsed.pathname.indexOf(STORAGE_OBJECT_MARKER);
  if (markerIndex === -1) return null;

  const afterMarker = parsed.pathname.slice(markerIndex + STORAGE_OBJECT_MARKER.length);
  const segments = afterMarker.split('/');
  // [0] = public|sign|authenticated, [1] = bucket, 나머지 = 경로
  if (segments.length < 3 || segments[1] !== bucket) return null;

  const path = segments.slice(2).join('/');
  return path ? decodeURIComponent(path) : null;
}

/**
 * 저장된 이미지 값(경로 or 레거시 전체 URL)을 유효한 서명 URL로 해석한다.
 *
 * - 스토리지 경로 → 서명 API로 서명 URL 발급
 * - 해당 버킷의 전체 URL(만료 서명/public) → 경로 추출 후 재서명
 * - 외부 URL(스토리지 아님) → 원본 그대로 반환 (기존 동작 보존)
 * - 발급 실패 → null (호출측이 "이미지 없음" 안내로 우아하게 실패)
 *
 * expiresIn 기본 24시간: 짧은 TTL은 탭을 오래 열어둔 사용자에게 만료를 재발시킨다
 * (lib/inventory/image-url.ts와 동일한 근거).
 */
export async function resolveSignedImageUrl(
  value: string | null | undefined,
  bucket: string,
  expiresIn: number = 86400
): Promise<string | null> {
  if (!value) return null;

  let path = value;
  if (value.startsWith('http')) {
    const extracted = extractStoragePath(value, bucket);
    if (!extracted) return value; // 외부/타 버킷 URL — 원본 통과
    path = extracted;
  }

  try {
    const response = await fetch('/api/storage/signed-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bucket, path, expiresIn }),
    });
    if (!response.ok) {
      console.error('[storage] 서명 URL 발급 실패:', response.status);
      return null;
    }
    const { signedUrl } = (await response.json()) as { signedUrl?: unknown };
    return typeof signedUrl === 'string' && signedUrl.length > 0 ? signedUrl : null;
  } catch (error) {
    console.error('[storage] 서명 URL 요청 실패:', error);
    return null;
  }
}
