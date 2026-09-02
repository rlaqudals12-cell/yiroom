import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { PINNED_FAST_VERDICT_MODEL, PINNED_VERDICT_MODEL } from '@/lib/gemini/model-contract';
import {
  checkConsentAndUploadImages,
  rollbackConsentImagesOrMarkCleanupPending,
} from '@/lib/api/image-consent';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export type VerdictAxis = 'personal-color' | 'skin' | 'body' | 'hair' | 'makeup';

export const VERDICT_CACHE_VERSION = 'verdict-v2' as const;

function getPinnedModel(axis: VerdictAxis) {
  return axis === 'skin' ? PINNED_FAST_VERDICT_MODEL : PINNED_VERDICT_MODEL;
}

const CACHE_TARGETS = {
  'personal-color': {
    table: 'personal_color_assessments',
    metadataColumn: 'image_analysis',
    imageColumns: { front: 'face_image_url' },
  },
  skin: {
    table: 'skin_analyses',
    metadataColumn: 'recommendations',
    imageColumns: { front: 'image_url' },
  },
  body: {
    table: 'body_analyses',
    metadataColumn: 'style_recommendations',
    imageColumns: {
      front: 'image_url',
      left_side: 'left_side_image_url',
      right_side: 'right_side_image_url',
      back: 'back_image_url',
    },
  },
  hair: {
    table: 'hair_analyses',
    metadataColumn: 'recommendations',
    imageColumns: { hair: 'image_url' },
  },
  makeup: {
    table: 'makeup_analyses',
    metadataColumn: 'recommendations',
    imageColumns: { makeup: 'image_url' },
  },
} as const satisfies Record<
  VerdictAxis,
  { table: string; metadataColumn: string; imageColumns: Record<string, string> }
>;

type JsonObject = Record<string, unknown>;

export interface VerdictCacheEntry<TPayload extends JsonObject = JsonObject> {
  version: typeof VERDICT_CACHE_VERSION;
  fingerprint: string;
  model: typeof PINNED_VERDICT_MODEL | typeof PINNED_FAST_VERDICT_MODEL;
  payload: TPayload;
}

export interface CachedVerdict<TPayload extends JsonObject = JsonObject> {
  data: JsonObject;
  payload: TPayload;
}

/** data URL의 표현 차이는 버리고 실제 이미지 바이트 문자열만 지문에 반영한다. */
function normalizeImageData(image: string): string {
  const commaIndex = image.indexOf(',');
  return (commaIndex >= 0 ? image.slice(commaIndex + 1) : image).replace(/\s/g, '');
}

/** 객체 키 순서와 undefined 표기 차이가 같은 판정을 다른 키로 만들지 않게 정규화한다. */
function stableSerialize(value: unknown): string {
  if (value === undefined) return 'undefined';
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(',')}]`;

  return `{${Object.entries(value)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, entry]) => `${JSON.stringify(key)}:${stableSerialize(entry)}`)
    .join(',')}}`;
}

/**
 * 축과 촬영 위치까지 포함한 SHA-256 지문을 만든다.
 * 원본은 보관하지 않으며, 같은 입력 순서에서는 항상 같은 지문을 반환한다.
 */
export function createAnalysisImageFingerprint(
  userId: string,
  axis: VerdictAxis,
  images: ReadonlyArray<readonly [label: string, image: string | null | undefined]>,
  decisionContext: unknown = null
): string {
  const availableImages = images.filter(
    (entry): entry is readonly [string, string] =>
      typeof entry[1] === 'string' && entry[1].length > 0
  );

  if (availableImages.length === 0) {
    throw new Error('이미지 지문을 만들 입력이 없습니다.');
  }

  const hash = createHash('sha256');
  // 사용자 범위를 키에 넣어 DB 노출 시 같은 원본의 사용자 간 상관분석을 어렵게 한다.
  hash.update(`${VERDICT_CACHE_VERSION}\0${axis}\0${userId}\0${stableSerialize(decisionContext)}`);
  for (const [label, image] of availableImages) {
    hash.update(`\0${label}\0`);
    hash.update(normalizeImageData(image));
  }
  return hash.digest('hex');
}

interface SyncCachedVerdictImagesOptions {
  userId: string;
  axis: VerdictAxis;
  cachedData: JsonObject;
  bucketName: string;
  images: Record<string, string | undefined>;
  imageStorageAllowed?: boolean;
}

/** 캐시 적중에서도 현재 회차의 원본 저장 선택을 처리하고 본인 소유 행에만 연결한다. */
export async function syncCachedVerdictImagesForUser({
  userId,
  axis,
  cachedData,
  bucketName,
  images,
  imageStorageAllowed,
}: SyncCachedVerdictImagesOptions): Promise<JsonObject> {
  const rowId = cachedData.id;
  if (typeof rowId !== 'string' || rowId.length === 0) return cachedData;

  const target = CACHE_TARGETS[axis];
  const imageColumns: Record<string, string> = target.imageColumns;
  const missingImages = Object.fromEntries(
    Object.entries(imageColumns)
      .filter(([suffix, column]) => {
        const source = images[suffix];
        const stored = cachedData[column];
        return (
          typeof source === 'string' &&
          source.length > 0 &&
          !(typeof stored === 'string' && stored.length > 0)
        );
      })
      .map(([suffix]) => [suffix, images[suffix]])
  );

  if (Object.keys(missingImages).length === 0) return cachedData;

  const supabase = createServiceRoleClient();
  const { uploadedImages } = await checkConsentAndUploadImages(
    supabase,
    userId,
    axis,
    bucketName,
    missingImages,
    { imageStorageAllowed }
  );
  const updates = Object.fromEntries(
    Object.entries(uploadedImages)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([suffix, path]) => [imageColumns[suffix], path])
      .filter(([column]) => typeof column === 'string')
  );

  if (Object.keys(updates).length === 0) return cachedData;

  let updateQuery = supabase
    .from(target.table)
    .update(updates)
    .eq('id', rowId)
    .eq('clerk_user_id', userId);
  for (const column of Object.keys(updates)) {
    const previous = cachedData[column];
    updateQuery =
      previous === null || previous === undefined
        ? updateQuery.is(column, null)
        : updateQuery.eq(column, previous);
  }
  const { data, error } = await updateQuery.select('*').maybeSingle();

  if (!error && data) return data as JsonObject;

  // CAS 패자나 DB 실패가 만든 새 업로드만 되돌려 소유자 없는 생체 원본을 남기지 않는다.
  const uploadedPaths = Object.values(updates).filter(
    (path): path is string => typeof path === 'string'
  );
  await rollbackConsentImagesOrMarkCleanupPending(
    supabase,
    userId,
    axis,
    bucketName,
    uploadedPaths
  );
  return cachedData;
}

export function createVerdictCacheEntry<TPayload extends JsonObject>(
  axis: VerdictAxis,
  fingerprint: string,
  payload: TPayload
): VerdictCacheEntry<TPayload> {
  return {
    version: VERDICT_CACHE_VERSION,
    fingerprint,
    model: getPinnedModel(axis),
    payload,
  };
}

function asJsonObject(value: unknown): JsonObject | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as JsonObject)
    : null;
}

/** 기존 결과 행의 JSONB 메타데이터에서 동일 판정을 찾는다. 조회 실패는 분석을 막지 않는다. */
export async function findCachedVerdict<TPayload extends JsonObject>(
  supabase: SupabaseClient,
  userId: string,
  axis: VerdictAxis,
  fingerprint: string
): Promise<CachedVerdict<TPayload> | null> {
  const target = CACHE_TARGETS[axis];

  try {
    const { data, error } = await supabase
      .from(target.table)
      .select('*')
      .eq('clerk_user_id', userId)
      .contains(target.metadataColumn, {
        verdictCache: {
          version: VERDICT_CACHE_VERSION,
          fingerprint,
          model: getPinnedModel(axis),
        },
      })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;

    const row = asJsonObject(data);
    const metadata = asJsonObject(row?.[target.metadataColumn]);
    const entry = asJsonObject(metadata?.verdictCache);
    const payload = asJsonObject(entry?.payload);

    if (
      !row ||
      !payload ||
      entry?.version !== VERDICT_CACHE_VERSION ||
      entry.fingerprint !== fingerprint ||
      entry.model !== getPinnedModel(axis)
    ) {
      return null;
    }

    return { data: row, payload: payload as TPayload };
  } catch {
    return null;
  }
}

/** 서비스 역할 클라이언트 생성 실패도 캐시 미스로 취급해 실제 분석 폴백을 유지한다. */
export async function findCachedVerdictForUser<TPayload extends JsonObject>(
  userId: string,
  axis: VerdictAxis,
  fingerprint: string
): Promise<CachedVerdict<TPayload> | null> {
  try {
    return await findCachedVerdict<TPayload>(createServiceRoleClient(), userId, axis, fingerprint);
  } catch {
    return null;
  }
}
