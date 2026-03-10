/**
 * 분석 이미지 Supabase Storage 업로드 헬퍼
 *
 * @see ADR-085
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/** 업로드 결과 */
export interface ImageUploadResult {
  path: string;
  url: string | null;
}

/**
 * Base64 이미지를 Supabase Storage에 업로드
 *
 * @param supabase - Supabase 클라이언트 (Service Role)
 * @param userId - Clerk user ID
 * @param base64Data - Base64 인코딩된 이미지 (data:image/... 접두사 포함)
 * @param bucket - Storage 버킷명
 * @param folder - 버킷 내 폴더 (e.g., 'skin', 'personal-color')
 * @returns 업로드된 경로 + 서명된 URL
 *
 * @example
 * const { path, url } = await uploadAnalysisImage(
 *   supabase, userId, imageBase64, 'analysis-images', 'skin'
 * );
 */
export async function uploadAnalysisImage(
  supabase: SupabaseClient,
  userId: string,
  base64Data: string,
  bucket: string,
  folder: string
): Promise<ImageUploadResult> {
  // Base64 → Buffer 변환
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');

  // 파일 경로 생성 (userId/folder/timestamp.jpg)
  const timestamp = Date.now();
  const path = `${userId}/${folder}/${timestamp}.jpg`;

  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: 'image/jpeg',
    upsert: false,
  });

  if (uploadError) {
    console.error(`[ImageUpload] ${folder} 업로드 실패:`, uploadError);
    return { path, url: null };
  }

  // 서명된 URL 생성 (1시간 만료)
  const { data: signedData } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);

  return { path, url: signedData?.signedUrl ?? null };
}
