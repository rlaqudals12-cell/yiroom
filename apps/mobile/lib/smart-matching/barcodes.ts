/**
 * 바코드 API 클라이언트
 * @description 바코드 스캔/조회/등록을 웹 정본 API에 위임
 */

import type { ProductBarcode } from '@/types/smart-matching';

import { missingSmartMatchingApi, requestSmartMatching } from './api-client';

type SerializedBarcode = Omit<ProductBarcode, 'createdAt' | 'updatedAt'> & {
  createdAt: string;
  updatedAt: string;
};

/**
 * 바코드 변환 함수
 */
function toBarcode(row: SerializedBarcode): ProductBarcode {
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

/**
 * 바코드로 제품 조회
 */
export async function findByBarcode(
  barcode: string,
  clerkToken?: string
): Promise<ProductBarcode | null> {
  const payload = await requestSmartMatching<{
    found: boolean;
    data?: SerializedBarcode;
  }>('/api/smart-matching/barcodes', clerkToken, {
    method: 'POST',
    body: JSON.stringify({ barcode, action: 'lookup' }),
  });

  return payload.found && payload.data ? toBarcode(payload.data) : null;
}

/**
 * 제품 ID로 바코드 조회
 */
export async function findByProductId(
  _productId: string,
  _clerkToken?: string
): Promise<ProductBarcode[]> {
  return missingSmartMatchingApi('제품별 바코드 조회');
}

/**
 * 바코드 등록
 */
export async function createBarcode(
  input: {
    barcode: string;
    barcodeType?: string;
    productId?: string;
    productName?: string;
    brand?: string;
    category?: string;
    imageUrl?: string;
    source?: string;
  },
  clerkToken?: string
): Promise<ProductBarcode | null> {
  const payload = await requestSmartMatching<{
    success: boolean;
    data?: SerializedBarcode;
  }>('/api/smart-matching/barcodes', clerkToken, {
    method: 'POST',
    body: JSON.stringify({
      barcode: input.barcode,
      action: 'register',
      productData: input,
    }),
  });

  return payload.success && payload.data ? toBarcode(payload.data) : null;
}

/**
 * 바코드-제품 연결
 */
export async function linkBarcodeToProduct(
  _barcodeId: string,
  _productId: string,
  _clerkToken?: string
): Promise<boolean> {
  return missingSmartMatchingApi('바코드 제품 연결');
}

/**
 * 바코드 검증 상태 업데이트
 */
export async function verifyBarcode(_barcodeId: string, _clerkToken?: string): Promise<boolean> {
  return missingSmartMatchingApi('바코드 검증');
}
