/**
 * 바코드 → 제품 상세/구매 페이지 브릿지
 * - product_barcodes DB 조회 (내부 매핑)
 * - 내부 제품 매핑 시 → 제품 상세 URL + 어필리에이트 링크 생성
 * - 미매핑 시 → Open Beauty Facts 결과 반환
 */

import { findByBarcode } from '@/lib/smart-matching/barcodes';
import { lookupProduct } from './product-lookup';
import { searchAffiliateProducts } from '@/lib/affiliate';

// ============================================
// 타입 정의
// ============================================

/** 내부 제품 타입 */
export type InternalProductType = 'cosmetic' | 'supplement' | 'equipment' | 'health_food';

/** 어필리에이트 링크 정보 */
export interface AffiliateLink {
  partner: string;
  url: string;
  price?: number;
}

/** 내부 제품 정보 */
export interface InternalProduct {
  id: string;
  type: InternalProductType;
  name: string;
  brand: string;
  imageUrl?: string;
}

/** 바코드 → 제품 조회 결과 */
export interface BarcodeProductResult {
  found: boolean;
  internalProduct?: InternalProduct;
  affiliateLinks: AffiliateLink[];
  detailUrl: string;
  externalInfo?: {
    source: string;
    name: string;
    brand: string;
  };
}

// ============================================
// 카테고리 → 제품 타입 매핑
// ============================================

const CATEGORY_TO_TYPE: Record<string, InternalProductType> = {
  skincare: 'cosmetic',
  makeup: 'cosmetic',
  bodycare: 'cosmetic',
  haircare: 'cosmetic',
  suncare: 'cosmetic',
  fragrance: 'cosmetic',
  supplement: 'supplement',
  other: 'cosmetic',
};

// ============================================
// 어필리에이트 링크 생성
// ============================================

/**
 * 제품명+브랜드로 어필리에이트 제품 검색 후 링크 배열 생성
 */
async function buildAffiliateLinks(productName: string, brand: string): Promise<AffiliateLink[]> {
  try {
    const keyword = `${brand} ${productName}`.trim();
    const affiliateProducts = await searchAffiliateProducts(keyword, 5);

    if (!affiliateProducts || affiliateProducts.length === 0) {
      return [];
    }

    return affiliateProducts.map((p) => ({
      partner: p.partnerId ?? 'unknown',
      url: p.affiliateUrl,
      price: p.priceKrw,
    }));
  } catch (error) {
    console.error('[BarcodeProductBridge] 어필리에이트 링크 조회 실패:', error);
    return [];
  }
}

// ============================================
// 메인 함수
// ============================================

/**
 * 바코드를 제품 상세/구매 정보로 변환
 *
 * 1. product_barcodes DB에서 내부 매핑 조회
 * 2. 매핑 존재 → 내부 제품 상세 URL + 어필리에이트 링크
 * 3. 미매핑 → Open Beauty Facts 폴백 → 외부 정보 반환
 */
export async function resolveBarcode(barcode: string): Promise<BarcodeProductResult> {
  // 빈 바코드 방어
  if (!barcode || barcode.trim().length === 0) {
    return {
      found: false,
      affiliateLinks: [],
      detailUrl: '',
    };
  }

  const trimmed = barcode.trim();

  // 1단계: product_barcodes DB에서 내부 제품 매핑 조회
  const barcodeRecord = await findByBarcode(trimmed);

  if (barcodeRecord?.productId) {
    // 내부 제품에 매핑된 경우
    const productType = CATEGORY_TO_TYPE[barcodeRecord.category ?? ''] ?? 'cosmetic';
    const detailUrl = `/beauty/${barcodeRecord.productId}`;

    // 어필리에이트 링크 검색
    const affiliateLinks = await buildAffiliateLinks(
      barcodeRecord.productName ?? '',
      barcodeRecord.brand ?? ''
    );

    return {
      found: true,
      internalProduct: {
        id: barcodeRecord.productId,
        type: productType,
        name: barcodeRecord.productName ?? '알 수 없는 제품',
        brand: barcodeRecord.brand ?? '알 수 없음',
        imageUrl: barcodeRecord.imageUrl,
      },
      affiliateLinks,
      detailUrl,
    };
  }

  // 2단계: product-lookup (내부 시드 + Open Beauty Facts) 폴백
  const lookupResult = await lookupProduct(trimmed);

  if (lookupResult.found && lookupResult.product) {
    const product = lookupResult.product;
    const isInternal = lookupResult.source === 'internal_db';
    const productType = CATEGORY_TO_TYPE[product.category] ?? 'cosmetic';

    // 내부 DB 제품인 경우 상세 페이지 URL
    const detailUrl = isInternal ? `/beauty/${product.id}` : '';

    // 어필리에이트 링크 검색
    const affiliateLinks = await buildAffiliateLinks(product.name, product.brand);

    if (isInternal) {
      return {
        found: true,
        internalProduct: {
          id: product.id,
          type: productType,
          name: product.name,
          brand: product.brand,
          imageUrl: product.imageUrl,
        },
        affiliateLinks,
        detailUrl,
      };
    }

    // 외부 소스 (Open Beauty Facts)
    return {
      found: true,
      affiliateLinks,
      detailUrl: '',
      externalInfo: {
        source: lookupResult.source,
        name: product.name,
        brand: product.brand,
      },
    };
  }

  // 3단계: 전부 미발견
  return {
    found: false,
    affiliateLinks: [],
    detailUrl: '',
  };
}
