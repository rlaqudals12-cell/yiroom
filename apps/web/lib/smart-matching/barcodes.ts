/**
 * 바코드 Repository
 * @description 바코드 스캔/조회/등록
 */

import { supabase } from '@/lib/supabase/client';
import type { ProductBarcode, ProductBarcodeDB } from '@/types/smart-matching';

/**
 * 바코드 변환 함수
 */
function toBarcode(row: ProductBarcodeDB): ProductBarcode {
  return {
    id: row.id,
    barcode: row.barcode,
    barcodeType: row.barcode_type as ProductBarcode['barcodeType'],
    productId: row.product_id ?? undefined,
    productName: row.product_name ?? undefined,
    brand: row.brand ?? undefined,
    category: row.category ?? undefined,
    imageUrl: row.image_url ?? undefined,
    source: row.source ?? undefined,
    verified: row.verified,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

/**
 * 바코드로 제품 조회
 */
export async function findByBarcode(barcode: string): Promise<ProductBarcode | null> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*')
    .eq('barcode', barcode)
    .single();

  if (error || !data) {
    return null;
  }

  return toBarcode(data as ProductBarcodeDB);
}

/**
 * 제품 ID로 바코드 조회
 */
export async function findByProductId(productId: string): Promise<ProductBarcode[]> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .select('*')
    .eq('product_id', productId);

  if (error || !data) {
    return [];
  }

  return (data as ProductBarcodeDB[]).map(toBarcode);
}

/**
 * 바코드 등록
 */
export async function createBarcode(input: {
  barcode: string;
  barcodeType?: string;
  productId?: string;
  productName?: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  source?: string;
}): Promise<ProductBarcode | null> {
  const { data, error } = await supabase
    .from('product_barcodes')
    .insert({
      barcode: input.barcode,
      barcode_type: input.barcodeType || 'EAN13',
      product_id: input.productId ?? null,
      product_name: input.productName ?? null,
      brand: input.brand ?? null,
      category: input.category ?? null,
      image_url: input.imageUrl ?? null,
      source: input.source || 'user_report',
      verified: false,
    })
    .select()
    .single();

  if (error) {
    console.error('[Barcode] 등록 실패:', error);
    return null;
  }

  return toBarcode(data as ProductBarcodeDB);
}

/**
 * 바코드-제품 연결
 */
export async function linkBarcodeToProduct(
  barcodeId: string,
  productId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('product_barcodes')
    .update({
      product_id: productId,
      verified: true,
    })
    .eq('id', barcodeId);

  if (error) {
    console.error('[Barcode] 연결 실패:', error);
    return false;
  }

  return true;
}

/**
 * 바코드 검증 상태 업데이트
 */
export async function verifyBarcode(barcodeId: string): Promise<boolean> {
  const { error } = await supabase
    .from('product_barcodes')
    .update({ verified: true })
    .eq('id', barcodeId);

  if (error) {
    console.error('[Barcode] 검증 실패:', error);
    return false;
  }

  return true;
}
