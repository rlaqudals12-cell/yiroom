/**
 * 이미지 동의 확인 공통 헬퍼
 *
 * PIPA(개인정보보호법) 준수를 위해 이미지 저장 전 동의 확인 필수
 * S-1, C-1, W-1 등 모든 분석 API에서 사용
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { isImageConsentActive } from '@/lib/consent/version-check';

// 분석 유형별 이미지 동의 타입
export type AnalysisType = 'skin' | 'body' | 'posture' | 'personal-color' | 'hair' | 'makeup';

// 동의 확인 결과
export interface ImageConsentResult {
  hasConsent: boolean;
  consentId: string | null;
}

interface ImageConsentState extends ImageConsentResult {
  rowId: string | null;
  consentGiven: boolean;
  withdrawalAt: string | null;
  updatedAt: string | null;
  retentionUntil: string | null;
}

/** Storage SDK 실패 뒤에도 정확한 후보 경로를 삭제할 수 있도록 보존한다. */
export class ImageUploadUncertainError extends Error {
  readonly candidatePath: string;

  constructor(candidatePath: string, cause?: unknown) {
    super('Image upload outcome is uncertain', { cause });
    this.name = 'ImageUploadUncertainError';
    this.candidatePath = candidatePath;
  }
}

const ANALYSIS_TYPES_REQUIRING_BIOMETRIC_CONSENT = new Set<AnalysisType>([
  'skin',
  'body',
  'personal-color',
  'hair',
  'makeup',
]);

async function readImageConsentState(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType
): Promise<ImageConsentState> {
  const imageConsentPromise = supabase
    .from('image_consents')
    .select('id, consent_given, consent_version, withdrawal_at, retention_until, updated_at')
    .eq('clerk_user_id', userId)
    .eq('analysis_type', analysisType)
    .maybeSingle();
  const agreementPromise = ANALYSIS_TYPES_REQUIRING_BIOMETRIC_CONSENT.has(analysisType)
    ? supabase
        .from('user_agreements')
        .select('biometric_agreed')
        .eq('clerk_user_id', userId)
        .maybeSingle()
    : Promise.resolve({ data: { biometric_agreed: true }, error: null });

  const [{ data: consentData, error }, agreementResult] = await Promise.all([
    imageConsentPromise,
    agreementPromise,
  ]);

  if (error || agreementResult.error) {
    console.error('[Image Consent] Failed to verify image storage consent');
    return {
      hasConsent: false,
      consentId: null,
      rowId: consentData?.id ?? null,
      consentGiven: consentData?.consent_given === true,
      withdrawalAt: consentData?.withdrawal_at ?? null,
      updatedAt: consentData?.updated_at ?? null,
      retentionUntil: consentData?.retention_until ?? null,
    };
  }

  const hasConsent =
    isImageConsentActive(consentData) && agreementResult.data?.biometric_agreed === true;

  return {
    hasConsent,
    consentId: hasConsent ? (consentData?.id ?? null) : null,
    rowId: consentData?.id ?? null,
    consentGiven: consentData?.consent_given === true,
    withdrawalAt: consentData?.withdrawal_at ?? null,
    updatedAt: consentData?.updated_at ?? null,
    retentionUntil: consentData?.retention_until ?? null,
  };
}

/**
 * 이미지 저장 동의 여부 확인
 *
 * @param supabase - Supabase 클라이언트 (service role 권장)
 * @param userId - Clerk 사용자 ID
 * @param analysisType - 분석 유형
 * @returns 동의 여부 및 동의 ID
 */
export async function checkImageConsent(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType
): Promise<ImageConsentResult> {
  const { hasConsent, consentId } = await readImageConsentState(supabase, userId, analysisType);
  return { hasConsent, consentId };
}

async function rollbackUploadedImages(
  supabase: SupabaseClient,
  bucketName: string,
  uploadedImages: Record<string, string | null>
): Promise<boolean> {
  const paths = Object.values(uploadedImages).filter((path): path is string => Boolean(path));
  if (paths.length === 0) return true;

  try {
    const { error } = await supabase.storage.from(bucketName).remove(paths);
    if (!error) return true;
    console.error(`[Image Consent] ${bucketName} rollback failed:`, error);
  } catch (error) {
    console.error(`[Image Consent] ${bucketName} rollback threw:`, error);
  }
  return false;
}

async function markCleanupPending(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType,
  state: ImageConsentState
): Promise<boolean> {
  if (!state.rowId || !state.updatedAt) {
    console.error('[Image Consent] Cannot mark cleanup pending without a consent CAS token');
    return false;
  }

  const withdrawalAt = new Date().toISOString();
  const { data, error } = await supabase
    .from('image_consents')
    .update({
      consent_given: false,
      withdrawal_at: withdrawalAt,
      retention_until: state.retentionUntil ?? withdrawalAt,
      cleanup_reconciled_at: null,
    })
    .eq('id', state.rowId)
    .eq('clerk_user_id', userId)
    .eq('analysis_type', analysisType)
    .eq('updated_at', state.updatedAt)
    .select('id')
    .maybeSingle();

  if (error || !data) {
    console.error('[Image Consent] Failed to mark rollback cleanup pending');
    return false;
  }

  return true;
}

async function ensureCleanupPending(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType,
  preferredState: ImageConsentState
): Promise<boolean> {
  if (await markCleanupPending(supabase, userId, analysisType, preferredState)) return true;

  // 첫 CAS가 철회/재동의와 경합했을 수 있으므로 최신 토큰으로 한 번만 재시도한다.
  const latestState = await readImageConsentState(supabase, userId, analysisType);
  if (!latestState.rowId) return false;
  if (
    latestState.consentGiven === false &&
    latestState.withdrawalAt !== null &&
    latestState.retentionUntil !== null
  ) {
    return true;
  }

  return markCleanupPending(supabase, userId, analysisType, latestState);
}

/**
 * Base64 이미지를 Supabase Storage에 업로드
 *
 * @param supabase - Supabase 클라이언트
 * @param bucketName - Storage 버킷 이름
 * @param userId - 사용자 ID (폴더 경로용)
 * @param base64 - Base64 인코딩된 이미지
 * @param suffix - 파일명 접미사 (front, left, right, side 등)
 * @returns Storage 경로 (성공 시) 또는 null (실패 시)
 */
export async function uploadImageToStorage(
  supabase: SupabaseClient,
  bucketName: string,
  userId: string,
  base64: string,
  suffix: string
): Promise<string> {
  // 저장 객체 식별자는 분석 결과의 결정론과 분리된 UUID를 쓴다. 시간값을 ID로 사용하지 않는다.
  const fileName = `${userId}/${crypto.randomUUID()}_${suffix}.jpg`;
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  try {
    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

    if (error || !data?.path) {
      console.error(`Image upload error (${suffix}):`, error);
      throw new ImageUploadUncertainError(fileName, error);
    }

    return data.path;
  } catch (error) {
    if (error instanceof ImageUploadUncertainError) throw error;
    throw new ImageUploadUncertainError(fileName, error);
  }

  // Private bucket이므로 경로만 저장 (결과 페이지에서 signed URL 생성)
}

/**
 * 동의 확인 + 이미지 업로드 통합 헬퍼
 *
 * @param supabase - Supabase 클라이언트
 * @param userId - 사용자 ID
 * @param analysisType - 분석 유형
 * @param bucketName - Storage 버킷 이름
 * @param images - 업로드할 이미지들 { suffix: base64 }
 * @returns 업로드 결과 { hasConsent, uploadedImages }
 */
export async function checkConsentAndUploadImages(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType,
  bucketName: string,
  images: Record<string, string | undefined>,
  options: { imageStorageAllowed?: boolean } = {}
): Promise<{
  hasConsent: boolean;
  consentId: string | null;
  uploadedImages: Record<string, string | null>;
}> {
  // 요청 단위 opt-out은 과거 DB 동의보다 우선한다. 조회 오류 뒤 건너뛰기에서도 저장을 막는다.
  if (options.imageStorageAllowed === false) {
    return {
      hasConsent: false,
      consentId: null,
      uploadedImages: Object.fromEntries(Object.keys(images).map((suffix) => [suffix, null])),
    };
  }

  // 1. 동의 확인
  const initialConsent = await readImageConsentState(supabase, userId, analysisType);
  const { hasConsent, consentId } = initialConsent;

  // 2. 동의가 없으면 업로드 건너뜀
  if (!hasConsent) {
    const emptyResults: Record<string, string | null> = {};
    for (const suffix of Object.keys(images)) {
      emptyResults[suffix] = null;
    }
    return { hasConsent: false, consentId: null, uploadedImages: emptyResults };
  }

  // 3. 동의가 있으면 이미지 업로드
  const uploadedImages: Record<string, string | null> = {};
  const rollbackCandidates: Record<string, string | null> = {};
  let uploadFailed = false;

  for (const [suffix, base64] of Object.entries(images)) {
    if (!base64) {
      uploadedImages[suffix] = null;
      continue;
    }

    try {
      const uploadedPath = await uploadImageToStorage(supabase, bucketName, userId, base64, suffix);
      uploadedImages[suffix] = uploadedPath;
      rollbackCandidates[suffix] = uploadedPath;
    } catch (error) {
      uploadFailed = true;
      uploadedImages[suffix] = null;
      if (error instanceof ImageUploadUncertainError) {
        rollbackCandidates[suffix] = error.candidatePath;
      }
      console.error(`[Image Consent] ${bucketName} upload failed with uncertain commit`);
      break;
    }
  }

  if (uploadFailed) {
    const rollbackSucceeded = await rollbackUploadedImages(
      supabase,
      bucketName,
      rollbackCandidates
    );
    if (!rollbackSucceeded) {
      const pendingMarked = await ensureCleanupPending(
        supabase,
        userId,
        analysisType,
        initialConsent
      );
      if (!pendingMarked) {
        console.error('[Image Consent audit] rollback and cleanup-pending marker both failed');
      }
    }

    return {
      hasConsent: rollbackSucceeded,
      consentId: rollbackSucceeded ? consentId : null,
      uploadedImages: Object.fromEntries(Object.keys(images).map((suffix) => [suffix, null])),
    };
  }

  // 업로드 중 철회/만료가 발생할 수 있으므로 객체 생성 직후 다시 확인한다.
  // 비활성이면 경로를 결과에 쓰기 전에 되돌리고, rollback 실패는 cron 재시도 상태로 남긴다.
  const finalConsent = await readImageConsentState(supabase, userId, analysisType);
  if (!finalConsent.hasConsent) {
    const rollbackSucceeded = await rollbackUploadedImages(supabase, bucketName, uploadedImages);
    if (!rollbackSucceeded) {
      await ensureCleanupPending(
        supabase,
        userId,
        analysisType,
        finalConsent.rowId ? finalConsent : initialConsent
      );
    }
    return {
      hasConsent: false,
      consentId: null,
      uploadedImages: Object.fromEntries(Object.keys(images).map((suffix) => [suffix, null])),
    };
  }

  return { hasConsent: true, consentId: finalConsent.consentId ?? consentId, uploadedImages };
}
