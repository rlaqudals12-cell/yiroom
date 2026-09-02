/**
 * 인벤토리(옷장) 이미지 업로드 HTTP 클라이언트 (웹 API 재사용 — ADR-118 thin client)
 *
 * @module lib/api/inventory-upload
 * @description
 *   웹 POST /api/inventory/upload를 모바일에서 호출해 Supabase Storage(inventory-images)에
 *   올리고 **스토리지 경로**를 받는다.
 *
 *   왜 URL이 아니라 경로인가 (2026-08-16 보안 수리):
 *   inventory-images는 비공개 버킷이다. 예전엔 영구 공개 URL을 받아 그대로 image_url에
 *   저장했는데, 그러면 URL만 알면 로그인 없이 개인 사진이 열리고 경로 첫 세그먼트인
 *   Clerk userId까지 노출된다. 이제 경로만 저장하고, 목록/상세를 읽을 때
 *   resolveInventoryImageUrl()이 서명 URL로 바꿔 렌더한다.
 *
 *   왜 필요한가 (2026-08 실측 수리):
 *   모바일 옷 등록은 ImagePicker가 준 **기기 로컬 URI(file://...)**를 그대로 image_url에
 *   저장했다. 그 URI는 이 기기·이 앱 캐시에서만 유효하다 — 웹이나 다른 기기에서는 사진이
 *   깨지고, 앱 캐시가 정리되면 영구 유실된다. 저장 자체가 이제 성공하게 되면서 이 결함이
 *   실제로 발현되므로, 웹과 동일하게 스토리지에 올린 값만 저장한다.
 *
 *   업로드가 실패하면 등록도 실패시킨다. 로컬 URI를 몰래 저장하는 폴백은 두지 않는다
 *   (사용자에게는 "사진이 저장됐다"고 보이지만 실제로는 유실되는 거짓말이 되기 때문).
 *
 * @see apps/web/app/api/inventory/upload/route.ts (계약 정본)
 * @see apps/web/app/(main)/closet/add/page.tsx (웹 호출 순서 정본 — 업로드 → 경로 저장)
 */

import { getApiBaseUrl } from './base-url';

/** 서버 zod 화이트리스트와 1:1 (경로 조작 차단용) */
export type InventoryUploadCategory = 'closet' | 'beauty' | 'equipment' | 'supplement' | 'pantry';
export type InventoryUploadType = 'processed' | 'original';

export interface InventoryUploadOptions {
  /** 스토리지 경로 대분류 (기본 closet) */
  category?: InventoryUploadCategory;
  /** 경로 구성용 UUID — 미지정 시 생성한다(서버가 uuid 형식을 검증) */
  itemId?: string;
  /** 가공본/원본 구분 (기본 processed) */
  type?: InventoryUploadType;
  /** 테스트·로컬 dev 서버 지정용 */
  baseUrl?: string;
}

export type InventoryClassifyCategory =
  | 'outer'
  | 'top'
  | 'bottom'
  | 'dress'
  | 'shoes'
  | 'bag'
  | 'accessory';
export type InventoryClassifySeason = 'spring' | 'summer' | 'autumn' | 'winter';
export type InventoryClassifyOccasion =
  | 'casual'
  | 'formal'
  | 'workout'
  | 'date'
  | 'travel'
  | 'work'
  | 'wedding_guest';

export interface InventoryClassificationResult {
  suggestedName?: string;
  category?: InventoryClassifyCategory;
  colors: string[];
  seasons: InventoryClassifySeason[];
  occasions: InventoryClassifyOccasion[];
  usedFallback: boolean;
}

const CLASSIFY_CATEGORIES = new Set<InventoryClassifyCategory>([
  'outer',
  'top',
  'bottom',
  'dress',
  'shoes',
  'bag',
  'accessory',
]);
const CLASSIFY_SEASONS = new Set<InventoryClassifySeason>(['spring', 'summer', 'autumn', 'winter']);
const CLASSIFY_OCCASIONS = new Set<InventoryClassifyOccasion>([
  'casual',
  'formal',
  'workout',
  'date',
  'travel',
  'work',
  'wedding_guest',
]);

export class InventoryUploadError extends Error {
  public readonly status: number;
  public readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'InventoryUploadError';
    this.status = status;
    this.code = code;
  }
}

/**
 * 스토리지 경로용 UUID v4 생성.
 *
 * 여기서의 난수는 "결과를 지어내는 난수"가 아니라 **경로 충돌 회피**가 목적이므로
 * 결정론화 대상이 아니다. Hermes에 crypto.randomUUID가 없을 수 있어 폴백을 둔다
 * (lib/analytics/session.ts와 동일 패턴).
 */
export function createUploadItemId(): string {
  const webCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** RN FormData의 파일 파트 형태 — 웹 File/Blob과 달리 `{ uri, name, type }`를 받는다 */
interface FilePart {
  uri: string;
  name: string;
  type: string;
}

/** 상태코드별 정직한 안내 (원인을 일반 문구로 뭉개지 않는다 — 웹 uploadErrorMessage와 동일 취지) */
function statusMessage(status: number, serverMessage?: string): string {
  if (status === 401) return '로그인이 필요해요. 다시 로그인해주세요.';
  if (status === 413) return '사진 용량이 너무 커요. 다시 촬영하거나 다른 사진을 선택해주세요.';
  if (serverMessage) return serverMessage;
  return '사진 업로드에 실패했어요. 잠시 후 다시 시도해주세요.';
}

/** 웹 에러 봉투(플랫 `{error: string}` / 중첩 `{error: {userMessage}}`) 양쪽에서 메시지 추출 */
function extractApiError(json: unknown): { message?: string; code?: string } {
  if (typeof json !== 'object' || json === null) return {};
  const obj = json as Record<string, unknown>;
  const err = obj.error;

  if (typeof err === 'string') return { message: err };

  if (typeof err === 'object' && err !== null) {
    const e = err as Record<string, unknown>;
    const message =
      (typeof e.userMessage === 'string' && e.userMessage) ||
      (typeof e.message === 'string' ? e.message : undefined);
    return {
      message: message || undefined,
      code: typeof e.code === 'string' ? e.code : undefined,
    };
  }

  return {};
}

/**
 * 이미지를 서버 스토리지에 올리고 **스토리지 경로**를 반환한다.
 *
 * 반환값은 `${userId}/${category}/${itemId}_${type}.png` 형태이며 그대로 image_url에 저장한다.
 * 렌더 시점에 서명 URL로 해석된다(lib/inventory/image-url.ts).
 *
 * @param imageUri 업로드할 로컬 이미지 URI (전송 전 downscaleToUri로 축소해 넘길 것)
 * @param clerkToken Clerk JWT (getToken()) — 없으면 요청 없이 401
 * @throws InventoryUploadError 미인증(401)·용량초과(413)·서버(5xx)·네트워크·응답 경로 누락
 */
export async function uploadInventoryImage(
  imageUri: string,
  clerkToken: string | null,
  options: InventoryUploadOptions = {}
): Promise<string> {
  if (!clerkToken) {
    throw new InventoryUploadError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
  }
  if (!imageUri) {
    throw new InventoryUploadError('업로드할 사진이 없어요.', 0, 'VALIDATION_ERROR');
  }

  const url = getApiBaseUrl(options.baseUrl);
  const category = options.category ?? 'closet';
  const itemId = options.itemId ?? createUploadItemId();
  const type = options.type ?? 'processed';

  const form = new FormData();
  const filePart: FilePart = { uri: imageUri, name: 'image.jpg', type: 'image/jpeg' };
  // RN FormData는 파일 파트로 `{uri,name,type}` 객체를 받지만 DOM 타입에는 Blob만 있다
  form.append('file', filePart as unknown as Blob);
  form.append('category', category);
  form.append('itemId', itemId);
  form.append('type', type);

  let response: Response;
  try {
    response = await fetch(`${url}/api/inventory/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        // Content-Type은 지정하지 않는다 — RN이 multipart boundary를 직접 붙인다
        'x-yiroom-client': 'mobile',
      },
      body: form,
    });
  } catch {
    throw new InventoryUploadError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    // 413 등은 본문이 JSON이 아닐 수 있다
    json = {};
  }

  if (!response.ok) {
    const { message, code } = extractApiError(json);
    throw new InventoryUploadError(statusMessage(response.status, message), response.status, code);
  }

  const storagePath = (json as { path?: unknown }).path;
  // 서버가 경로를 안 줬는데 성공으로 취급하면 결국 로컬 URI가 저장된다 — 여기서 끊는다.
  // 스킴이 붙은 값(file://, https:// 등)이나 절대경로는 스토리지 경로가 아니므로 같이 거른다.
  if (
    typeof storagePath !== 'string' ||
    storagePath.length === 0 ||
    /^([a-z][a-z0-9+.-]*:|\/)/i.test(storagePath)
  ) {
    throw new InventoryUploadError(
      '사진 업로드 응답이 올바르지 않아요. 잠시 후 다시 시도해주세요.',
      response.status,
      'UPLOAD_ERROR'
    );
  }

  return storagePath;
}

/**
 * 선택 직후 축소한 의류 사진을 웹 분류 API로 보내 폼 프리필 후보를 받는다.
 * 인증·base URL은 이미지 업로드와 같은 모바일 thin-client 계약을 따른다.
 */
export async function classifyInventoryImage(
  imageBase64: string,
  clerkToken: string | null,
  baseUrl?: string
): Promise<InventoryClassificationResult> {
  if (!clerkToken) {
    throw new InventoryUploadError('로그인이 필요해요. 다시 로그인해주세요.', 401, 'AUTH_ERROR');
  }
  if (!imageBase64) {
    throw new InventoryUploadError('분류할 사진이 없어요.', 0, 'VALIDATION_ERROR');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}/api/inventory/classify`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
        'x-yiroom-client': 'mobile',
      },
      body: JSON.stringify({ imageBase64 }),
    });
  } catch {
    throw new InventoryUploadError('네트워크 연결을 확인해주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  if (!response.ok) {
    const { message, code } = extractApiError(json);
    throw new InventoryUploadError(
      message || '자동 분류에 실패했어요. 직접 입력해주세요.',
      response.status,
      code
    );
  }

  const raw = typeof json === 'object' && json !== null ? (json as Record<string, unknown>) : {};
  const rawCategory = raw.category;
  const category =
    typeof rawCategory === 'string' &&
    CLASSIFY_CATEGORIES.has(rawCategory as InventoryClassifyCategory)
      ? (rawCategory as InventoryClassifyCategory)
      : undefined;
  const colors = Array.isArray(raw.colors)
    ? raw.colors.filter((value): value is string => typeof value === 'string')
    : [];
  const seasons = Array.isArray(raw.seasons)
    ? raw.seasons.filter(
        (value): value is InventoryClassifySeason =>
          typeof value === 'string' && CLASSIFY_SEASONS.has(value as InventoryClassifySeason)
      )
    : [];
  const occasions = Array.isArray(raw.occasions)
    ? raw.occasions.filter(
        (value): value is InventoryClassifyOccasion =>
          typeof value === 'string' && CLASSIFY_OCCASIONS.has(value as InventoryClassifyOccasion)
      )
    : [];

  return {
    suggestedName: typeof raw.suggestedName === 'string' ? raw.suggestedName : undefined,
    category,
    colors,
    seasons,
    occasions,
    usedFallback: raw.usedFallback === true,
  };
}

/**
 * 옷장 쓰기 API를 Clerk 인증과 함께 호출한다.
 * 업로드와 같은 웹 API 경유 규약을 공유해 모바일이 DB 갱신 규칙을 복제하지 않게 한다.
 */
async function runInventoryAction(
  path: string,
  method: 'PATCH' | 'PUT',
  clerkToken: string | null,
  body?: Record<string, unknown>,
  baseUrl?: string
): Promise<void> {
  if (!clerkToken) {
    throw new InventoryUploadError('로그인이 필요해요. 다시 로그인해 주세요.', 401, 'AUTH_ERROR');
  }

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${clerkToken}`,
        'Content-Type': 'application/json',
        'x-yiroom-client': 'mobile',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new InventoryUploadError('네트워크 연결을 확인해 주세요.', 0, 'NETWORK_ERROR');
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    json = {};
  }

  if (!response.ok) {
    const { message, code } = extractApiError(json);
    throw new InventoryUploadError(
      message || '착용 기록을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
      response.status,
      code
    );
  }
}

/** 한 벌의 착용 횟수와 마지막 착용 시점을 서버 정본으로 갱신한다. */
export async function recordInventoryItemUsage(
  itemId: string,
  clerkToken: string | null,
  baseUrl?: string
): Promise<void> {
  await runInventoryAction(
    `/api/inventory/${encodeURIComponent(itemId)}`,
    'PATCH',
    clerkToken,
    { action: 'recordUsage' },
    baseUrl
  );
}

/** 코디와 그 구성 아이템의 착용 횟수를 웹 repository에서 함께 갱신한다. */
export async function recordInventoryOutfitWear(
  outfitId: string,
  clerkToken: string | null,
  baseUrl?: string
): Promise<void> {
  await runInventoryAction(
    `/api/inventory/outfits/${encodeURIComponent(outfitId)}?action=recordWear`,
    'PUT',
    clerkToken,
    undefined,
    baseUrl
  );
}
