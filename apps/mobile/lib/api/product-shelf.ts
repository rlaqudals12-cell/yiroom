/**
 * 제품함 웹 API 클라이언트.
 *
 * 모바일은 user_product_shelf를 직접 조회하지 않고 인증된 웹 API를 정본으로 사용한다.
 */
import type { CompatibilityResult, ProductIngredient } from '@/types/scan';

import { getApiBaseUrl } from './base-url';

export type ProductShelfStatus = 'owned' | 'wishlist' | 'used_up' | 'archived';
export type ProductShelfScanMethod = 'barcode' | 'ocr' | 'search' | 'manual';

export interface ProductShelfItem {
  id: string;
  productName: string;
  productBrand?: string;
  productImageUrl?: string;
  productIngredients: ProductIngredient[];
  scanMethod: string;
  status: ProductShelfStatus;
  compatibilityScore?: number;
  analysisResult?: CompatibilityResult;
  expiresAt?: string;
  scannedAt: string;
}

export interface AddProductShelfItemInput {
  productId?: string;
  productName: string;
  productBrand?: string;
  productBarcode?: string;
  productImageUrl?: string;
  productIngredients?: ProductIngredient[];
  scanMethod: ProductShelfScanMethod;
  status?: ProductShelfStatus;
  userNote?: string;
}

interface ProductShelfListResponse {
  items?: ProductShelfItem[];
  total?: number;
}

interface ProductShelfAddResponse {
  success?: boolean;
  data?: ProductShelfItem;
}

function requireToken(clerkToken: string): void {
  if (!clerkToken.trim()) throw new Error('로그인이 필요합니다.');
}

async function requestProductShelf(
  path: string,
  clerkToken: string,
  init: RequestInit,
  baseUrl?: string
): Promise<unknown> {
  requireToken(clerkToken);

  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl(baseUrl)}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${clerkToken}`,
        'x-yiroom-client': 'mobile',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...init.headers,
      },
    });
  } catch {
    throw new Error('제품함을 불러오지 못했어요. 네트워크 연결을 확인해주세요.');
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error('제품함을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
  }
  return payload;
}

export async function getProductShelf(
  clerkToken: string,
  baseUrl?: string
): Promise<{ items: ProductShelfItem[]; total: number }> {
  const payload = (await requestProductShelf(
    '/api/scan/shelf?limit=100&offset=0',
    clerkToken,
    { method: 'GET' },
    baseUrl
  )) as ProductShelfListResponse | null;

  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    total: typeof payload?.total === 'number' ? payload.total : 0,
  };
}

export async function addProductShelfItem(
  input: AddProductShelfItemInput,
  clerkToken: string,
  baseUrl?: string
): Promise<ProductShelfItem> {
  const payload = await requestProductShelf(
    '/api/scan/shelf',
    clerkToken,
    { method: 'POST', body: JSON.stringify(input) },
    baseUrl
  );
  if (!payload || typeof payload !== 'object') {
    throw new Error('제품함 추가 결과를 확인하지 못했어요.');
  }
  const envelope = payload as ProductShelfAddResponse;
  if (envelope.success !== true || !envelope.data) {
    throw new Error('제품함 추가 결과를 확인하지 못했어요.');
  }
  return envelope.data;
}

export async function getProductShelfItem(
  id: string,
  clerkToken: string,
  baseUrl?: string
): Promise<ProductShelfItem> {
  const payload = await requestProductShelf(
    `/api/scan/shelf/${encodeURIComponent(id)}`,
    clerkToken,
    { method: 'GET' },
    baseUrl
  );
  if (!payload || typeof payload !== 'object') {
    throw new Error('제품 정보를 확인하지 못했어요.');
  }
  return payload as ProductShelfItem;
}

export async function updateProductShelfItem(
  id: string,
  updates: { status?: ProductShelfStatus },
  clerkToken: string,
  baseUrl?: string
): Promise<ProductShelfItem> {
  const payload = await requestProductShelf(
    `/api/scan/shelf/${encodeURIComponent(id)}`,
    clerkToken,
    { method: 'PUT', body: JSON.stringify(updates) },
    baseUrl
  );
  if (!payload || typeof payload !== 'object') {
    throw new Error('제품함 변경 결과를 확인하지 못했어요.');
  }
  return payload as ProductShelfItem;
}
