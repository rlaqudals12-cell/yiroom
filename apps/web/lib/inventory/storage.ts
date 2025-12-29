/**
 * 인벤토리 이미지 Storage 유틸리티
 * Supabase Storage 사용
 */

import { createClerkSupabaseClient } from '@/lib/supabase/server';

const BUCKET_NAME = 'inventory-images';

/**
 * 인벤토리 이미지 업로드
 * @param userId - 사용자 ID
 * @param category - 카테고리 (closet, beauty, etc.)
 * @param itemId - 아이템 ID
 * @param imageBlob - 이미지 Blob
 * @param type - 이미지 타입 (original: 원본, processed: 배경 제거됨)
 * @returns 업로드된 이미지 URL
 */
export async function uploadInventoryImage(
  userId: string,
  category: string,
  itemId: string,
  imageBlob: Blob,
  type: 'original' | 'processed' = 'processed'
): Promise<string> {
  const supabase = createClerkSupabaseClient();
  const path = `${userId}/${category}/${itemId}_${type}.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, imageBlob, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    console.error('[Storage] Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Public URL 생성
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * 인벤토리 이미지 삭제
 */
export async function deleteInventoryImage(
  userId: string,
  category: string,
  itemId: string
): Promise<void> {
  const supabase = createClerkSupabaseClient();

  // 원본과 처리된 이미지 모두 삭제
  const paths = [
    `${userId}/${category}/${itemId}_original.png`,
    `${userId}/${category}/${itemId}_processed.png`,
  ];

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    console.error('[Storage] Delete error:', error);
    // 삭제 실패해도 에러 던지지 않음 (이미지가 없을 수 있음)
  }
}

/**
 * 사용자의 모든 이미지 삭제 (계정 삭제 시)
 */
export async function deleteAllUserImages(userId: string): Promise<void> {
  const supabase = createClerkSupabaseClient();

  // 사용자 폴더의 모든 파일 목록
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(userId, {
      limit: 1000,
    });

  if (listError) {
    console.error('[Storage] List error:', listError);
    return;
  }

  if (!files || files.length === 0) {
    return;
  }

  // 파일 경로 배열 생성
  const paths = files.map(file => `${userId}/${file.name}`);

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  if (error) {
    console.error('[Storage] Delete all error:', error);
  }
}

/**
 * 이미지 URL에서 Storage 경로 추출
 */
export function extractStoragePath(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/([^?]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * 임시 업로드 URL 생성 (클라이언트에서 직접 업로드용)
 */
export async function createUploadSignedUrl(
  userId: string,
  category: string,
  itemId: string,
  type: 'original' | 'processed' = 'processed'
): Promise<{ signedUrl: string; path: string }> {
  const supabase = createClerkSupabaseClient();
  const path = `${userId}/${category}/${itemId}_${type}.png`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUploadUrl(path);

  if (error) {
    console.error('[Storage] Signed URL error:', error);
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return {
    signedUrl: data.signedUrl,
    path: data.path,
  };
}

/**
 * Storage에서 이미지 다운로드
 */
export async function downloadInventoryImage(
  path: string
): Promise<Blob | null> {
  const supabase = createClerkSupabaseClient();

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path);

  if (error) {
    console.error('[Storage] Download error:', error);
    return null;
  }

  return data;
}
