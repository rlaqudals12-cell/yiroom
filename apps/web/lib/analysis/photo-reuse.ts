/**
 * 사진 재사용 로직
 * - 퍼스널 컬러 분석 사진을 피부/체형 분석에 재사용
 * - 동의 기반 + 품질 조건 확인
 */

import { SupabaseClient } from '@supabase/supabase-js';

// 재사용 가능 여부 결과
export interface PhotoReuseEligibility {
  eligible: boolean;
  reason?: 'no_consent' | 'expired' | 'no_image' | 'low_quality' | 'wrong_angle';
  sourceImage?: {
    id: string;
    analysisType: 'personal-color';
    imageUrl: string;
    thumbnailUrl?: string;
    qualityScore: number;
    analyzedAt: Date;
  };
}

// 재사용 조건 상수
export const REUSE_CONDITIONS = {
  maxAgeDays: 7, // 7일 이내 촬영
  minQualityScore: 70, // 품질 70점 이상
  minLightingScore: 60, // 조명 60점 이상
  requiredAngle: 'front', // 정면 사진만
} as const;

// 이미지 정보 타입
interface AnalysisImageRow {
  id: string;
  clerk_user_id: string;
  analysis_type: string;
  storage_path: string;
  thumbnail_path: string | null;
  quality_score: number | null;
  lighting_score: number | null;
  angle: string | null;
  consent_given: boolean;
  retention_until: string | null;
  created_at: string;
}

/**
 * Supabase Storage에서 서명된 URL 가져오기
 */
async function getSignedUrl(
  supabase: SupabaseClient,
  storagePath: string,
  expiresIn = 3600
): Promise<string> {
  // storage_path 형식: bucket/path/to/file.jpg
  const [bucket, ...pathParts] = storagePath.split('/');
  const path = pathParts.join('/');

  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    console.error('[photo-reuse] Failed to get signed URL:', error);
    throw new Error('Failed to get signed URL');
  }

  return data.signedUrl;
}

/**
 * 사진 재사용 가능 여부 확인
 * @param supabase Supabase 클라이언트
 * @param targetAnalysisType 대상 분석 유형 (skin, body)
 */
export async function checkPhotoReuseEligibility(
  supabase: SupabaseClient,
  _targetAnalysisType: 'skin' | 'body'
): Promise<PhotoReuseEligibility> {
  try {
    // 최근 7일 내 동의받은 퍼스널컬러 이미지 조회
    const cutoffDate = new Date(
      Date.now() - REUSE_CONDITIONS.maxAgeDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const { data: images, error } = await supabase
      .from('analysis_images')
      .select('*')
      .eq('analysis_type', 'personal-color')
      .eq('consent_given', true)
      .eq('angle', REUSE_CONDITIONS.requiredAngle)
      .gte('quality_score', REUSE_CONDITIONS.minQualityScore)
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('[photo-reuse] DB query error:', error);
      return { eligible: false, reason: 'no_image' };
    }

    if (!images || images.length === 0) {
      return { eligible: false, reason: 'no_image' };
    }

    const image = images[0] as AnalysisImageRow;

    // 보존 기한 확인
    if (image.retention_until && new Date(image.retention_until) < new Date()) {
      return { eligible: false, reason: 'expired' };
    }

    // 조명 점수 확인
    if (image.lighting_score && image.lighting_score < REUSE_CONDITIONS.minLightingScore) {
      return { eligible: false, reason: 'low_quality' };
    }

    // 서명된 URL 생성
    const imageUrl = await getSignedUrl(supabase, image.storage_path);
    const thumbnailUrl = image.thumbnail_path
      ? await getSignedUrl(supabase, image.thumbnail_path)
      : undefined;

    return {
      eligible: true,
      sourceImage: {
        id: image.id,
        analysisType: 'personal-color',
        imageUrl,
        thumbnailUrl,
        qualityScore: image.quality_score ?? 75,
        analyzedAt: new Date(image.created_at),
      },
    };
  } catch (error) {
    console.error('[photo-reuse] Error checking eligibility:', error);
    return { eligible: false, reason: 'no_image' };
  }
}

/**
 * 분석 이미지 저장 (동의 포함)
 */
export async function saveAnalysisImage(
  supabase: SupabaseClient,
  params: {
    analysisType: 'personal-color' | 'skin' | 'body' | 'hair';
    storagePath: string;
    thumbnailPath?: string;
    qualityScore?: number;
    lightingScore?: number;
    angle?: 'front' | 'left' | 'right' | 'back';
    consentGiven: boolean;
    retentionDays?: number; // 기본 365일
    sourceAnalysisId?: string;
  }
): Promise<{ id: string } | null> {
  try {
    const retentionUntil = params.consentGiven
      ? new Date(Date.now() + (params.retentionDays ?? 365) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data, error } = await supabase
      .from('analysis_images')
      .insert({
        analysis_type: params.analysisType,
        storage_path: params.storagePath,
        thumbnail_path: params.thumbnailPath,
        quality_score: params.qualityScore,
        lighting_score: params.lightingScore,
        angle: params.angle ?? 'front',
        consent_given: params.consentGiven,
        retention_until: retentionUntil,
        source_analysis_id: params.sourceAnalysisId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[photo-reuse] Failed to save image:', error);
      return null;
    }

    return { id: data.id };
  } catch (error) {
    console.error('[photo-reuse] Error saving image:', error);
    return null;
  }
}

/**
 * 이미지 재사용 기록 (원본 이미지를 다른 분석에 연결)
 */
export async function reuseAnalysisImage(
  supabase: SupabaseClient,
  params: {
    sourceImageId: string;
    targetAnalysisType: 'skin' | 'body';
    targetAnalysisId: string;
  }
): Promise<boolean> {
  try {
    // 원본 이미지 정보 조회
    const { data: sourceImage, error: fetchError } = await supabase
      .from('analysis_images')
      .select('*')
      .eq('id', params.sourceImageId)
      .single();

    if (fetchError || !sourceImage) {
      console.error('[photo-reuse] Source image not found:', fetchError);
      return false;
    }

    // 새 분석에 대한 이미지 레코드 생성 (원본 참조)
    const { error: insertError } = await supabase.from('analysis_images').insert({
      analysis_type: params.targetAnalysisType,
      storage_path: sourceImage.storage_path,
      thumbnail_path: sourceImage.thumbnail_path,
      quality_score: sourceImage.quality_score,
      lighting_score: sourceImage.lighting_score,
      angle: sourceImage.angle,
      consent_given: sourceImage.consent_given,
      retention_until: sourceImage.retention_until,
      source_analysis_id: params.targetAnalysisId,
    });

    if (insertError) {
      console.error('[photo-reuse] Failed to reuse image:', insertError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[photo-reuse] Error reusing image:', error);
    return false;
  }
}

/**
 * 동의 철회 시 이미지 삭제
 */
export async function revokeImageConsent(
  supabase: SupabaseClient,
  imageId: string
): Promise<boolean> {
  try {
    // 이미지 정보 조회
    const { data: image, error: fetchError } = await supabase
      .from('analysis_images')
      .select('storage_path, thumbnail_path')
      .eq('id', imageId)
      .single();

    if (fetchError || !image) {
      console.error('[photo-reuse] Image not found:', fetchError);
      return false;
    }

    // Storage에서 파일 삭제
    const [bucket, ...pathParts] = image.storage_path.split('/');
    const path = pathParts.join('/');

    await supabase.storage.from(bucket).remove([path]);

    if (image.thumbnail_path) {
      const [thumbBucket, ...thumbPathParts] = image.thumbnail_path.split('/');
      await supabase.storage.from(thumbBucket).remove([thumbPathParts.join('/')]);
    }

    // DB 레코드 삭제
    const { error: deleteError } = await supabase
      .from('analysis_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('[photo-reuse] Failed to delete image record:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[photo-reuse] Error revoking consent:', error);
    return false;
  }
}
