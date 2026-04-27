/**
 * 통합 분석 이미지 Storage 업로드
 *
 * @module lib/analysis/integrated/internal/storage-uploader
 * @description
 *   Base64 이미지를 Supabase Storage의 `integrated-sessions/` 버킷에 업로드.
 *   Phase A의 sentinel URL(`integrated://...`)을 실제 Storage 경로로 교체.
 *
 * @see docs/adr/ADR-100-integrated-analysis-ui.md §2.4
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §5
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';

const BUCKET_NAME = 'integrated-sessions';

export interface UploadedImageUrls {
  /** Storage 경로 (bucket-relative). 결과 페이지에서 서명된 URL로 변환해 사용 */
  faceImageUrl: string;
  bodyImageUrl: string | null;
}

/**
 * data URL (Base64) → Buffer 변환.
 * `data:image/jpeg;base64,XXXXX` 형식에서 XXXXX만 추출.
 */
function dataUrlToBuffer(dataUrl: string): { buffer: Buffer; contentType: string } {
  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  const [, contentType, base64Body] = match;
  return {
    buffer: Buffer.from(base64Body, 'base64'),
    contentType,
  };
}

/**
 * MIME 타입에서 파일 확장자 추출.
 * image/jpeg → jpg, image/png → png, image/webp → webp
 */
function extensionFromMime(mime: string): string {
  if (mime === 'image/jpeg' || mime === 'image/jpg') return 'jpg';
  if (mime === 'image/png') return 'png';
  if (mime === 'image/webp') return 'webp';
  return 'jpg'; // 기본값
}

/**
 * 세션 ID 기반으로 얼굴/전신 이미지를 Storage에 업로드.
 *
 * 경로 패턴: `{clerkUserId}/{sessionId}/{face|body}.{ext}`
 *
 * @throws 업로드 실패 시 Error
 */
export async function uploadSessionImages(
  sessionId: string,
  clerkUserId: string,
  faceBase64: string,
  bodyBase64: string | null
): Promise<UploadedImageUrls> {
  const supabase = createServiceRoleClient();

  // 얼굴 이미지 업로드 (필수)
  const face = dataUrlToBuffer(faceBase64);
  const faceExt = extensionFromMime(face.contentType);
  const facePath = `${clerkUserId}/${sessionId}/face.${faceExt}`;

  const { error: faceError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(facePath, face.buffer, {
      contentType: face.contentType,
      upsert: false,
    });

  if (faceError) {
    throw new Error(`[Storage] Face upload failed: ${faceError.message}`);
  }

  // 전신 이미지 업로드 (선택)
  let bodyImageUrl: string | null = null;
  if (bodyBase64) {
    const body = dataUrlToBuffer(bodyBase64);
    const bodyExt = extensionFromMime(body.contentType);
    const bodyPath = `${clerkUserId}/${sessionId}/body.${bodyExt}`;

    const { error: bodyError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(bodyPath, body.buffer, {
        contentType: body.contentType,
        upsert: false,
      });

    if (bodyError) {
      // 왜: 얼굴은 성공했으나 전신 실패 시, 얼굴 이미지 정리를 시도하고 throw
      await supabase.storage
        .from(BUCKET_NAME)
        .remove([facePath])
        .catch(() => {});
      throw new Error(`[Storage] Body upload failed: ${bodyError.message}`);
    }

    bodyImageUrl = bodyPath;
  }

  return { faceImageUrl: facePath, bodyImageUrl };
}

/**
 * Storage 경로 → 서명된 URL (1시간 만료).
 * 결과 페이지에서 이미지를 표시할 때 사용.
 *
 * @returns 서명된 URL, 또는 실패 시 null
 */
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
