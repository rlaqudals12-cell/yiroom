/**
 * 통합 분석 원본 이미지 저장 경계.
 *
 * 사용자가 해당 회차에서 명시적으로 동의한 경우에만 비공개 Storage에 저장한다.
 * 업로드 실패·deadline 초과·DB 포인터 부착 실패 때는 이 모듈의 한 rollback 경로를
 * 거쳐, 정리가 확인되기 전에는 호출자에게 제어를 돌려주지 않는다.
 *
 * @internal 도메인 외부 import 금지 (테스트 제외)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { DeadlineExceededError, type ExecutionDeadline } from '@/lib/utils/timeout';

const BUCKET_NAME = 'integrated-sessions';

export interface UploadedImageUrls {
  /** Storage의 bucket-relative 경로. 미동의/사진 없음은 null. */
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
}

export type ImageStorageFailureStage =
  | 'face_upload'
  | 'face_deadline'
  | 'body_prepare'
  | 'body_upload'
  | 'body_deadline'
  | 'consent_recheck'
  | 'pointer_attach';

/** 원본 저장은 실패했지만, 업로드됐을 수 있는 객체가 모두 정리됐음을 뜻한다. */
export class ImageStorageOperationError extends Error {
  readonly cleanupConfirmed = true;

  constructor(
    readonly stage: ImageStorageFailureStage,
    readonly originalError: unknown
  ) {
    super(
      `[Integrated storage] ${stage} failed; rollback confirmed: ${errorMessage(originalError)}`
    );
    this.name = 'ImageStorageOperationError';
  }
}

/** rollback 자체가 실패해 Storage 잔존 가능성을 배제할 수 없음을 뜻한다. */
export class ImageStorageRollbackError extends Error {
  readonly cleanupConfirmed = false;

  constructor(
    readonly stage: ImageStorageFailureStage,
    readonly originalError: unknown,
    readonly rollbackError: unknown,
    /** 로그가 아닌 failed session 재시도 큐에 소유시킬 bucket-relative 후보 경로. */
    readonly candidatePaths: string[]
  ) {
    super(
      `[Integrated storage] ${stage} failed and rollback failed; ` +
        `original=${errorMessage(originalError)}; rollback=${errorMessage(rollbackError)}`
    );
    this.name = 'ImageStorageRollbackError';
  }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) throw new Error('Invalid data URL format');
  const [, contentType, base64Body] = match;
  return { buffer: Buffer.from(base64Body, 'base64'), contentType };
}

function extensionFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  if (mime === 'image/heic') return 'heic';
  if (mime === 'image/heif') return 'heif';
  return 'jpg';
}

/**
 * 모든 보상 삭제가 공유하는 단일 경계.
 * Supabase는 reject뿐 아니라 resolved `{ error }`도 실패이므로 둘 다 검사한다.
 */
async function rollbackPathsOrThrow(
  supabase: ReturnType<typeof createServiceRoleClient>,
  paths: Array<string | null>,
  originalError: unknown,
  stage: ImageStorageFailureStage
): Promise<never> {
  const rollbackPaths = [...new Set(paths)].filter(
    (path): path is string => typeof path === 'string' && path.length > 0
  );

  if (rollbackPaths.length > 0) {
    try {
      const { error } = await supabase.storage.from(BUCKET_NAME).remove(rollbackPaths);
      if (error) throw new Error(`[Storage] rollback remove failed: ${error.message}`);
    } catch (rollbackError) {
      const combined = new ImageStorageRollbackError(
        stage,
        originalError,
        rollbackError,
        rollbackPaths
      );
      // 경로·원본 데이터는 기록하지 않고 두 오류만 남겨 운영자가 잔존 가능성을 감사할 수 있게 한다.
      console.error('[Integrated storage audit] rollback failed', {
        stage,
        originalError: errorMessage(originalError),
        rollbackError: errorMessage(rollbackError),
      });
      throw combined;
    }
  }

  throw new ImageStorageOperationError(stage, originalError);
}

/**
 * 세션 ID 기반으로 얼굴/전신 원본을 선택 저장한다.
 * 경로: `{clerkUserId}/{sessionId}/{face|body}.{ext}`
 */
export async function uploadSessionImages(
  sessionId: string,
  clerkUserId: string,
  faceBase64: string,
  bodyBase64: string | null,
  imageStorageConsent = false,
  deadline?: ExecutionDeadline
): Promise<UploadedImageUrls> {
  if (imageStorageConsent !== true) {
    return { faceImageUrl: null, bodyImageUrl: null };
  }

  const supabase = createServiceRoleClient();
  try {
    deadline?.throwIfExpired(0, '[Integrated storage] upload deadline exceeded');
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [], error, 'face_upload');
  }

  let face: ReturnType<typeof dataUrlToBuffer>;
  try {
    face = dataUrlToBuffer(faceBase64);
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [], error, 'face_upload');
  }

  const facePath = `${clerkUserId}/${sessionId}/face.${extensionFromMime(face.contentType)}`;
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(facePath, face.buffer, { contentType: face.contentType, upsert: false });
    if (error) throw new Error(`[Storage] Face upload failed: ${error.message}`);
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [facePath], error, 'face_upload');
  }

  if (deadline?.expired()) {
    return rollbackPathsOrThrow(
      supabase,
      [facePath],
      new DeadlineExceededError('[Integrated storage] face upload completed too late'),
      'face_deadline'
    );
  }

  if (!bodyBase64) {
    return { faceImageUrl: facePath, bodyImageUrl: null };
  }

  try {
    deadline?.throwIfExpired(0, '[Integrated storage] body upload deadline exceeded');
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [facePath], error, 'body_prepare');
  }

  let body: ReturnType<typeof dataUrlToBuffer>;
  try {
    body = dataUrlToBuffer(bodyBase64);
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [facePath], error, 'body_prepare');
  }

  const bodyPath = `${clerkUserId}/${sessionId}/body.${extensionFromMime(body.contentType)}`;
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(bodyPath, body.buffer, { contentType: body.contentType, upsert: false });
    if (error) throw new Error(`[Storage] Body upload failed: ${error.message}`);
  } catch (error) {
    return rollbackPathsOrThrow(supabase, [facePath, bodyPath], error, 'body_upload');
  }

  if (deadline?.expired()) {
    return rollbackPathsOrThrow(
      supabase,
      [facePath, bodyPath],
      new DeadlineExceededError('[Integrated storage] body upload completed too late'),
      'body_deadline'
    );
  }

  return { faceImageUrl: facePath, bodyImageUrl: bodyPath };
}

/** 포인터 부착 실패 때도 업로더와 동일한 rollback 검증 경계를 사용한다. */
export async function rollbackUploadedSessionImages(
  urls: UploadedImageUrls,
  originalError: unknown,
  stage: ImageStorageFailureStage = 'pointer_attach'
): Promise<never> {
  const supabase = createServiceRoleClient();
  return rollbackPathsOrThrow(
    supabase,
    [urls.faceImageUrl, urls.bodyImageUrl],
    originalError,
    stage
  );
}

/** Storage 경로 → 서명 URL (기본 1시간). */
export async function getSignedImageUrl(
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data) {
    console.error('[Storage] Signed URL failed:', error?.message);
    return null;
  }
  return data.signedUrl;
}
