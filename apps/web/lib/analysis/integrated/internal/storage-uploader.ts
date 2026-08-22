/**
 * 통합 분석 원본 비저장 초기화와 레거시 이미지 조회
 *
 * @module lib/analysis/integrated/internal/storage-uploader
 * @description
 *   신규 통합 분석 원본은 Storage에 남기지 않는다. 기존 레코드에 남아 있는
 *   `integrated-sessions/` 경로의 제한적 조회만 하위 호환으로 지원한다.
 *
 * @see docs/adr/ADR-100-integrated-analysis-ui.md §2.4
 * @see docs/specs/SDD-INTEGRATED-RESULT-UI.md §5
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import type { ExecutionDeadline } from '@/lib/utils/timeout';

const BUCKET_NAME = 'integrated-sessions';

export interface UploadedImageUrls {
  /** 신규 분석은 null. 레거시 호출부의 Storage 경로 반환형과 호환한다. */
  faceImageUrl: string | null;
  bodyImageUrl: string | null;
}

/**
 * 통합 분석 얼굴/전신 이미지의 서버 보존을 생략한다.
 *
 * 통합 세션에는 `image_consents`와 연결된 독립 보관기한 메타데이터가 없어서, 기존 PC/body
 * 동의를 빌려 저장하면 1년 만료 크론이 `integrated-sessions`를 찾지 못한다. 선택 저장 UI와
 * 보관기한 계약이 생기기 전까지 원본은 AI 처리 요청 메모리에서만 사용하고 Storage에는
 * 남기지 않는다. 기존 저장분의 조회/철회를 위해 아래 signed URL 함수와 purge 버킷은 유지한다.
 */
export async function uploadSessionImages(
  _sessionId: string,
  _clerkUserId: string,
  _faceBase64: string,
  _bodyBase64: string | null,
  deadline?: ExecutionDeadline
): Promise<UploadedImageUrls> {
  deadline?.throwIfExpired(0, '[Integrated storage] upload deadline exceeded');
  return { faceImageUrl: null, bodyImageUrl: null };
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
