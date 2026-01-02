/**
 * Smart Matching API 클라이언트
 * 웹 API를 호출하여 사이즈 추천 등 스마트 매칭 기능 제공
 */

import Constants from 'expo-constants';

// API 베이스 URL (환경변수 또는 기본값)
const API_BASE_URL =
  Constants.expoConfig?.extra?.apiBaseUrl ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://yiroom.vercel.app';

// ============================================
// 타입 정의
// ============================================

export type ClothingCategory = 'top' | 'bottom' | 'outer' | 'dress' | 'shoes';
export type SizeRecommendationBasis =
  | 'history'
  | 'measurements'
  | 'brand_chart'
  | 'general';
export type SizeFit = 'small' | 'perfect' | 'large';
export type PreferredFit = 'tight' | 'regular' | 'loose';

export interface SizeRecommendation {
  recommendedSize: string;
  confidence: number;
  basis: SizeRecommendationBasis;
  alternatives: { size: string; note: string }[];
  brandInfo?: {
    fitStyle?: string;
    sizeNote?: string;
  };
}

export interface UserBodyMeasurements {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  hip?: number;
  shoulder?: number;
  preferredFit: PreferredFit;
}

export interface SizeHistoryItem {
  id: string;
  brandId: string;
  brandName: string;
  category: string;
  size: string;
  fit?: SizeFit;
  createdAt: string;
}

// ============================================
// API 클라이언트 함수
// ============================================

/**
 * 사이즈 추천 요청
 */
export async function getSizeRecommendation(
  token: string,
  params: {
    brandId: string;
    brandName: string;
    category: ClothingCategory;
    productId?: string;
  }
): Promise<SizeRecommendation> {
  const response = await fetch(
    `${API_BASE_URL}/api/smart-matching/size-recommend`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.recommendation;
}

/**
 * 사용자 신체 치수 조회
 */
export async function getMeasurements(
  token: string
): Promise<UserBodyMeasurements | null> {
  const response = await fetch(
    `${API_BASE_URL}/api/smart-matching/measurements`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.measurements;
}

/**
 * 사용자 신체 치수 저장
 */
export async function saveMeasurements(
  token: string,
  measurements: Partial<UserBodyMeasurements>
): Promise<UserBodyMeasurements> {
  const response = await fetch(
    `${API_BASE_URL}/api/smart-matching/measurements`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(measurements),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.measurements;
}

/**
 * 사이즈 기록 조회
 */
export async function getSizeHistory(
  token: string
): Promise<SizeHistoryItem[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/smart-matching/size-history`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.history || [];
}

/**
 * 사이즈 기록 저장
 */
export async function addSizeHistory(
  token: string,
  item: {
    brandId: string;
    brandName: string;
    category: ClothingCategory;
    size: string;
    fit?: SizeFit;
    productId?: string;
  }
): Promise<SizeHistoryItem> {
  const response = await fetch(
    `${API_BASE_URL}/api/smart-matching/size-history`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(item),
    }
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  const data = await response.json();
  return data.history;
}

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 신뢰도 레이블 반환
 */
export function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'green' | 'yellow' | 'gray';
} {
  if (confidence >= 80) {
    return { label: '매우 정확', color: 'green' };
  } else if (confidence >= 60) {
    return { label: '정확', color: 'green' };
  } else if (confidence >= 40) {
    return { label: '참고용', color: 'yellow' };
  } else {
    return { label: '추정', color: 'gray' };
  }
}

/**
 * 추천 근거 설명
 */
export function getBasisDescription(basis: SizeRecommendationBasis): string {
  switch (basis) {
    case 'history':
      return '이전 구매 기록 기반';
    case 'brand_chart':
      return '브랜드 사이즈 차트 + 내 치수 기반';
    case 'measurements':
      return '내 신체 치수 기반';
    case 'general':
      return '일반적인 사이즈 추정';
    default:
      return '';
  }
}

/**
 * 카테고리 한글명
 */
export function getCategoryLabel(category: ClothingCategory): string {
  const labels: Record<ClothingCategory, string> = {
    top: '상의',
    bottom: '하의',
    outer: '아우터',
    dress: '원피스',
    shoes: '신발',
  };
  return labels[category] || category;
}
