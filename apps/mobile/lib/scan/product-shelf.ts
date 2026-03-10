/**
 * 제품함 Repository
 * - 사용자 제품함 CRUD
 * - 스캔 히스토리 관리
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductIngredient } from '@/types/scan';
import type { CompatibilityResult } from './compatibility';

// 제품함 상태
export type ShelfStatus = 'owned' | 'wishlist' | 'used_up' | 'archived';

// 스캔 방법
export type ScanMethod = 'barcode' | 'ocr' | 'search' | 'manual';

// 제품함 아이템 타입
export interface ShelfItem {
  id: string;
  clerkUserId: string;
  productId?: string;
  productName: string;
  productBrand?: string;
  productBarcode?: string;
  productImageUrl?: string;
  productIngredients: ProductIngredient[];
  scannedAt: Date;
  scanMethod: ScanMethod;
  compatibilityScore?: number;
  analysisResult?: CompatibilityResult;
  status: ShelfStatus;
  userNote?: string;
  rating?: number;
  purchasedAt?: Date;
  openedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 제품함 추가 요청
export interface AddToShelfRequest {
  productId?: string;
  productName: string;
  productBrand?: string;
  productBarcode?: string;
  productImageUrl?: string;
  productIngredients?: ProductIngredient[];
  scanMethod: ScanMethod;
  compatibilityScore?: number;
  analysisResult?: CompatibilityResult;
  status?: ShelfStatus;
  userNote?: string;
}

// 제품함 업데이트 요청
export interface UpdateShelfItemRequest {
  status?: ShelfStatus;
  userNote?: string;
  rating?: number;
  purchasedAt?: string;
  openedAt?: string;
  expiresAt?: string;
}

// DB 행 타입
interface ShelfRow {
  id: string;
  clerk_user_id: string;
  product_id: string | null;
  product_name: string;
  product_brand: string | null;
  product_barcode: string | null;
  product_image_url: string | null;
  product_ingredients: ProductIngredient[] | null;
  scanned_at: string;
  scan_method: string | null;
  compatibility_score: number | null;
  analysis_result: CompatibilityResult | null;
  status: string;
  user_note: string | null;
  rating: number | null;
  purchased_at: string | null;
  opened_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * DB 행을 ShelfItem으로 변환
 */
function rowToShelfItem(row: ShelfRow): ShelfItem {
  return {
    id: row.id,
    clerkUserId: row.clerk_user_id,
    productId: row.product_id || undefined,
    productName: row.product_name,
    productBrand: row.product_brand || undefined,
    productBarcode: row.product_barcode || undefined,
    productImageUrl: row.product_image_url || undefined,
    productIngredients: row.product_ingredients || [],
    scannedAt: new Date(row.scanned_at),
    scanMethod: (row.scan_method as ScanMethod) || 'manual',
    compatibilityScore: row.compatibility_score || undefined,
    analysisResult: row.analysis_result || undefined,
    status: (row.status as ShelfStatus) || 'owned',
    userNote: row.user_note || undefined,
    rating: row.rating || undefined,
    purchasedAt: row.purchased_at ? new Date(row.purchased_at) : undefined,
    openedAt: row.opened_at ? new Date(row.opened_at) : undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 제품함 목록 조회
 */
export async function getShelfItems(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    status?: ShelfStatus;
    limit?: number;
    offset?: number;
  }
): Promise<{ items: ShelfItem[]; total: number }> {
  let query = supabase
    .from('user_product_shelf')
    .select('*', { count: 'exact' })
    .eq('clerk_user_id', userId)
    .order('scanned_at', { ascending: false });

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('[ProductShelf] Get items error:', error);
    throw error;
  }

  return {
    items: (data as ShelfRow[]).map(rowToShelfItem),
    total: count || 0,
  };
}

/**
 * 최근 스캔 히스토리 조회
 */
export async function getRecentScans(
  supabase: SupabaseClient,
  userId: string,
  limit: number = 10
): Promise<ShelfItem[]> {
  const { data, error } = await supabase
    .from('user_product_shelf')
    .select('*')
    .eq('clerk_user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[ProductShelf] Get recent scans error:', error);
    throw error;
  }

  return (data as ShelfRow[]).map(rowToShelfItem);
}

/**
 * 제품함에 추가
 */
export async function addToShelf(
  supabase: SupabaseClient,
  userId: string,
  request: AddToShelfRequest
): Promise<ShelfItem> {
  const { data, error } = await supabase
    .from('user_product_shelf')
    .insert({
      clerk_user_id: userId,
      product_id: request.productId,
      product_name: request.productName,
      product_brand: request.productBrand,
      product_barcode: request.productBarcode,
      product_image_url: request.productImageUrl,
      product_ingredients: request.productIngredients || [],
      scan_method: request.scanMethod,
      compatibility_score: request.compatibilityScore,
      analysis_result: request.analysisResult,
      status: request.status || 'owned',
      user_note: request.userNote,
    })
    .select()
    .single();

  if (error) {
    console.error('[ProductShelf] Add item error:', error);
    throw error;
  }

  return rowToShelfItem(data as ShelfRow);
}

/**
 * 제품함 아이템 조회
 */
export async function getShelfItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<ShelfItem | null> {
  const { data, error } = await supabase
    .from('user_product_shelf')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('id', itemId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[ProductShelf] Get item error:', error);
    throw error;
  }

  return rowToShelfItem(data as ShelfRow);
}

/**
 * 제품함 아이템 업데이트
 */
export async function updateShelfItem(
  supabase: SupabaseClient,
  userId: string,
  itemId: string,
  updates: UpdateShelfItemRequest
): Promise<ShelfItem> {
  const updateData: Record<string, unknown> = {};

  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.userNote !== undefined) updateData.user_note = updates.userNote;
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.purchasedAt !== undefined) updateData.purchased_at = updates.purchasedAt;
  if (updates.openedAt !== undefined) updateData.opened_at = updates.openedAt;
  if (updates.expiresAt !== undefined) updateData.expires_at = updates.expiresAt;

  const { data, error } = await supabase
    .from('user_product_shelf')
    .update(updateData)
    .eq('clerk_user_id', userId)
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('[ProductShelf] Update item error:', error);
    throw error;
  }

  return rowToShelfItem(data as ShelfRow);
}

/**
 * 제품함에서 삭제
 */
export async function removeFromShelf(
  supabase: SupabaseClient,
  userId: string,
  itemId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_product_shelf')
    .delete()
    .eq('clerk_user_id', userId)
    .eq('id', itemId);

  if (error) {
    console.error('[ProductShelf] Remove item error:', error);
    throw error;
  }
}

/**
 * 바코드로 기존 아이템 확인
 */
export async function findByBarcode(
  supabase: SupabaseClient,
  userId: string,
  barcode: string
): Promise<ShelfItem | null> {
  const { data, error } = await supabase
    .from('user_product_shelf')
    .select('*')
    .eq('clerk_user_id', userId)
    .eq('product_barcode', barcode)
    .order('scanned_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('[ProductShelf] Find by barcode error:', error);
    throw error;
  }

  return rowToShelfItem(data as ShelfRow);
}

/**
 * 상태별 아이템 수 조회
 */
export async function getShelfCounts(
  supabase: SupabaseClient,
  userId: string
): Promise<Record<ShelfStatus, number>> {
  const { data, error } = await supabase
    .from('user_product_shelf')
    .select('status')
    .eq('clerk_user_id', userId);

  if (error) {
    console.error('[ProductShelf] Get counts error:', error);
    throw error;
  }

  const counts: Record<ShelfStatus, number> = {
    owned: 0,
    wishlist: 0,
    used_up: 0,
    archived: 0,
  };

  for (const row of data || []) {
    const status = row.status as ShelfStatus;
    if (counts[status] !== undefined) {
      counts[status]++;
    }
  }

  return counts;
}
