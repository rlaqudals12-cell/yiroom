/**
 * 이미지 동의 확인 공통 헬퍼
 *
 * PIPA(개인정보보호법) 준수를 위해 이미지 저장 전 동의 확인 필수
 * S-1, C-1, W-1 등 모든 분석 API에서 사용
 */

import { SupabaseClient } from '@supabase/supabase-js';

// 분석 유형별 이미지 동의 타입
export type AnalysisType = 'skin' | 'body' | 'posture' | 'personal-color' | 'hair' | 'makeup';

// 동의 확인 결과
export interface ImageConsentResult {
  hasConsent: boolean;
  consentId: string | null;
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
  const { data: consentData } = await supabase
    .from('image_consents')
    .select('id, consent_given')
    .eq('clerk_user_id', userId)
    .eq('analysis_type', analysisType)
    .maybeSingle();

  const hasConsent = consentData?.consent_given === true;

  console.log(`[${analysisType.toUpperCase()}] Image consent status: ${hasConsent ? 'granted' : 'not granted'}`);

  return {
    hasConsent,
    consentId: hasConsent ? consentData?.id : null,
  };
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
): Promise<string | null> {
  const fileName = `${userId}/${Date.now()}_${suffix}.jpg`;
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');

  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, buffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (error) {
    console.error(`Image upload error (${suffix}):`, error);
    return null;
  }

  // Private bucket이므로 경로만 저장 (결과 페이지에서 signed URL 생성)
  return data.path;
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
  images: Record<string, string | undefined>
): Promise<{
  hasConsent: boolean;
  consentId: string | null;
  uploadedImages: Record<string, string | null>;
}> {
  // 1. 동의 확인
  const { hasConsent, consentId } = await checkImageConsent(supabase, userId, analysisType);

  // 2. 동의가 없으면 업로드 건너뜀
  if (!hasConsent) {
    console.log(`[${analysisType.toUpperCase()}] No consent - skipping image upload`);
    const emptyResults: Record<string, string | null> = {};
    for (const suffix of Object.keys(images)) {
      emptyResults[suffix] = null;
    }
    return { hasConsent: false, consentId: null, uploadedImages: emptyResults };
  }

  // 3. 동의가 있으면 이미지 업로드
  console.log(`[${analysisType.toUpperCase()}] Consent granted - starting image upload`);
  const uploadedImages: Record<string, string | null> = {};

  for (const [suffix, base64] of Object.entries(images)) {
    if (base64) {
      uploadedImages[suffix] = await uploadImageToStorage(supabase, bucketName, userId, base64, suffix);
      console.log(`[${analysisType.toUpperCase()}] ${suffix} image upload: ${uploadedImages[suffix] ? 'success' : 'failed'}`);
    } else {
      uploadedImages[suffix] = null;
    }
  }

  return { hasConsent: true, consentId, uploadedImages };
}
