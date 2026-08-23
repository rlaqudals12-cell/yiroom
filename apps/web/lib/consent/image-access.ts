import type { SupabaseClient } from '@supabase/supabase-js';
import type { AnalysisType } from '@/components/analysis/consent/types';
import { isImageConsentActive } from '@/lib/consent/version-check';
import { resolveSignedImageUrl, signPrivateImageUrls } from '@/lib/storage';

export const ANALYSIS_IMAGE_BUCKETS: Record<AnalysisType, string> = {
  skin: 'skin-images',
  body: 'body-images',
  'personal-color': 'personal-color-images',
  hair: 'hair-images',
  makeup: 'makeup-images',
};

/**
 * 축별 이미지 저장 동의와 글로벌 생체정보 동의가 모두 활성일 때만 사진 접근을 연다.
 * 조회 실패는 철회 직후 파기 지연 중인 경로를 노출하지 않도록 fail-closed로 처리한다.
 */
export async function hasActiveAnalysisImageAccess(
  supabase: SupabaseClient,
  analysisType: AnalysisType,
  userId?: string
): Promise<boolean> {
  try {
    let imageConsentQuery = supabase
      .from('image_consents')
      .select('consent_given, consent_version, retention_until')
      .eq('analysis_type', analysisType);
    let biometricConsentQuery = supabase.from('user_agreements').select('biometric_agreed');

    // service role 호출은 RLS를 우회하므로 반드시 사용자 조건을 직접 건다.
    if (userId) {
      imageConsentQuery = imageConsentQuery.eq('clerk_user_id', userId);
      biometricConsentQuery = biometricConsentQuery.eq('clerk_user_id', userId);
    }

    const [imageConsentResult, biometricConsentResult] = await Promise.all([
      imageConsentQuery.maybeSingle(),
      biometricConsentQuery.maybeSingle(),
    ]);

    if (imageConsentResult.error || biometricConsentResult.error) {
      console.error('[Image Access] Failed to verify image access consent');
      return false;
    }

    return (
      isImageConsentActive(imageConsentResult.data) &&
      biometricConsentResult.data?.biometric_agreed === true
    );
  } catch {
    console.error('[Image Access] Image access consent check threw');
    return false;
  }
}

/** 서버 응답 경계: 비활성 동의면 raw 경로를 일괄 null로 닫는다. */
export async function signConsentedAnalysisImageUrls(
  supabase: SupabaseClient,
  userId: string,
  analysisType: AnalysisType,
  values: ReadonlyArray<string | null | undefined>
): Promise<Array<string | null>> {
  const active = await hasActiveAnalysisImageAccess(supabase, analysisType, userId);
  if (!active) return values.map(() => null);

  return signPrivateImageUrls(supabase, ANALYSIS_IMAGE_BUCKETS[analysisType], values);
}

/** 클라이언트 결과 경계: 외부/레거시 URL도 동의 확인 전에는 통과시키지 않는다. */
export async function resolveConsentedAnalysisImageUrl(
  supabase: SupabaseClient,
  analysisType: AnalysisType,
  value: string | null | undefined
): Promise<string | null> {
  const active = await hasActiveAnalysisImageAccess(supabase, analysisType);
  if (!active) return null;

  return resolveSignedImageUrl(value, ANALYSIS_IMAGE_BUCKETS[analysisType]);
}
