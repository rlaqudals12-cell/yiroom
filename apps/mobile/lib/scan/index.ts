/**
 * 바코드/성분 스캔 모듈
 *
 * 바코드 검증, 제품 조회, 성분 파싱
 *
 * @module lib/scan
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── 타입 ────────────────────────────────────────────

export type BarcodeFormat = 'EAN13' | 'EAN8' | 'UPCA' | 'UNKNOWN';

export interface BarcodeResult {
  value: string;
  format: BarcodeFormat;
  isValid: boolean;
}

export interface ScannedProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string | null;
  category: string | null;
  image_url: string | null;
  ingredients: string[] | null;
}

export interface IngredientAnalysis {
  name: string;
  safetyGrade: 'safe' | 'caution' | 'warning';
  ewgScore: number | null;
  description: string;
}

export interface ScanHistory {
  id: string;
  clerk_user_id: string;
  barcode: string;
  product_name: string | null;
  scanned_at: string;
}

// ─── 바코드 검증 ────────────────────────────────────

/**
 * EAN-13 체크디짓 검증
 */
export function validateEAN13(barcode: string): boolean {
  if (!/^\d{13}$/.test(barcode)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[12]);
}

/**
 * EAN-8 체크디짓 검증
 */
export function validateEAN8(barcode: string): boolean {
  if (!/^\d{8}$/.test(barcode)) return false;

  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[7]);
}

/**
 * UPC-A 체크디짓 검증
 */
export function validateUPCA(barcode: string): boolean {
  if (!/^\d{12}$/.test(barcode)) return false;

  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += parseInt(barcode[i]) * (i % 2 === 0 ? 3 : 1);
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(barcode[11]);
}

/**
 * 바코드 형식 감지
 */
export function detectBarcodeFormat(barcode: string): BarcodeResult {
  const clean = barcode.replace(/\s/g, '');

  if (validateEAN13(clean)) {
    return { value: clean, format: 'EAN13', isValid: true };
  }
  if (validateEAN8(clean)) {
    return { value: clean, format: 'EAN8', isValid: true };
  }
  if (validateUPCA(clean)) {
    return { value: clean, format: 'UPCA', isValid: true };
  }

  return { value: clean, format: 'UNKNOWN', isValid: false };
}

// ─── 제품 조회 ──────────────────────────────────────

/**
 * 바코드로 제품 검색
 */
export async function lookupProduct(
  supabase: SupabaseClient,
  barcode: string
): Promise<ScannedProduct | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, barcode, name, brand, category, image_url, ingredients')
    .eq('barcode', barcode)
    .single();

  if (error) return null;
  return data as ScannedProduct;
}

/**
 * 제품명으로 검색
 */
export async function searchProducts(
  supabase: SupabaseClient,
  query: string,
  limit = 10
): Promise<ScannedProduct[]> {
  const { data } = await supabase
    .from('products')
    .select('id, barcode, name, brand, category, image_url, ingredients')
    .ilike('name', `%${query}%`)
    .limit(limit);

  return (data ?? []) as ScannedProduct[];
}

// ─── 성분 파싱 ──────────────────────────────────────

/**
 * 성분 텍스트 파싱
 *
 * "정제수, 글리세린, 나이아신아마이드" → ["정제수", "글리세린", "나이아신아마이드"]
 */
export function parseIngredientsText(text: string): string[] {
  return text
    .split(/[,;/]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

// ─── 스캔 히스토리 ──────────────────────────────────

/**
 * 스캔 기록 저장
 */
export async function recordScan(
  supabase: SupabaseClient,
  userId: string,
  barcode: string,
  productName: string | null
): Promise<void> {
  await supabase.from('scan_history').insert({
    clerk_user_id: userId,
    barcode,
    product_name: productName,
  });
}

/**
 * 최근 스캔 기록 조회
 */
export async function getRecentScans(
  supabase: SupabaseClient,
  userId: string,
  limit = 20
): Promise<ScanHistory[]> {
  const { data } = await supabase
    .from('scan_history')
    .select('id, clerk_user_id, barcode, product_name, scanned_at')
    .eq('clerk_user_id', userId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  return (data ?? []) as ScanHistory[];
}

// ─── 피부타입별 성분 가이드 ─────────────────────────

export const SKIN_TYPE_INGREDIENTS: Record<string, { good: string[]; caution: string[] }> = {
  dry: {
    good: ['히알루론산', '세라마이드', '스쿠알란', '시어버터'],
    caution: ['알코올', '살리실산', '벤조일퍼옥사이드'],
  },
  oily: {
    good: ['나이아신아마이드', '살리실산', '티트리', '카올린'],
    caution: ['코코넛오일', '미네랄오일', '라놀린'],
  },
  sensitive: {
    good: ['판테놀', '알란토인', '센텔라', '마데카소사이드'],
    caution: ['향료', '알코올', '파라벤', 'SLS'],
  },
  combination: {
    good: ['나이아신아마이드', '히알루론산', '녹차추출물'],
    caution: ['중쇄지방산', '미네랄오일'],
  },
};

/**
 * 성분-피부타입 적합도 확인
 */
export function checkIngredientForSkinType(
  ingredient: string,
  skinType: string
): 'good' | 'caution' | 'neutral' {
  const guide = SKIN_TYPE_INGREDIENTS[skinType];
  if (!guide) return 'neutral';

  const lower = ingredient.toLowerCase();
  if (guide.good.some((g) => lower.includes(g.toLowerCase()))) return 'good';
  if (guide.caution.some((c) => lower.includes(c.toLowerCase()))) return 'caution';
  return 'neutral';
}
