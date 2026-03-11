/**
 * S-2 존별 제품 타겟팅 모듈
 * 12존 분석 결과 + 제품 카테고리 → 존별 맞춤 추천
 *
 * @description 각 존의 메트릭과 관심사를 기반으로 적합한 제품 카테고리와
 *   존별 사용 팁을 생성합니다.
 * @see docs/principles/skin-physiology.md
 * @see ./twelve-zone-extractor.ts - analyzeDetailedZoneConcerns
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import { DETAILED_ZONE_LABELS } from '@/types/skin-zones';
import type { ZoneMetricsV2 } from './types';
import { analyzeDetailedZoneConcerns } from './twelve-zone-extractor';

// =============================================================================
// 타입
// =============================================================================

/** 추천 제품 */
export interface RecommendedProduct {
  /** 제품 카테고리 (예: '세럼', '크림') */
  category: string;
  /** 해결 대상 관심사 */
  concern: string;
  /** 한국어 1줄 추천 설명 */
  description: string;
  /** 존별 사용 팁 */
  applicationTip?: string;
}

/** 존별 제품 추천 */
export interface ZoneProductRecommendation {
  /** 존 ID */
  zoneId: DetailedZoneId;
  /** 한국어 존 이름 */
  label: string;
  /** 감지된 관심사 */
  concerns: string[];
  /** 추천 제품 (최대 3개) */
  products: RecommendedProduct[];
  /** 우선순위 (점수 기반) */
  priority: 'high' | 'medium' | 'low';
}

// =============================================================================
// 관심사 → 제품 매핑
// =============================================================================

/** 관심사별 추천 제품 목록 */
interface ProductMapping {
  category: string;
  description: string;
}

// 기본 관심사 → 제품 매핑
const CONCERN_PRODUCT_MAP: Record<string, ProductMapping[]> = {
  건조함: [
    { category: '보습 세럼', description: '히알루론산 세럼으로 수분을 집중 공급하세요' },
    { category: '수분 크림', description: '세라마이드 수분 크림으로 장벽을 강화하세요' },
  ],
  '과다 유분': [
    { category: '프라이머', description: '매트 프라이머로 유분을 조절하세요' },
    { category: '클레이 마스크', description: '주 1-2회 클레이 마스크로 피지를 관리하세요' },
  ],
  '모공 확대': [
    { category: 'BHA 토너', description: 'BHA 토너로 모공 속 노폐물을 제거하세요' },
    { category: '모공 세럼', description: '나이아신아마이드 세럼으로 모공을 정돈하세요' },
  ],
  '피부결 거침': [
    { category: 'AHA 필링', description: 'AHA 필링으로 묵은 각질을 부드럽게 제거하세요' },
    { category: '각질 제거제', description: '주 2-3회 부드러운 각질 제거로 피부결을 정돈하세요' },
  ],
  색소침착: [
    { category: '비타민C 세럼', description: '비타민C 세럼으로 칙칙한 톤을 밝게 케어하세요' },
    { category: '미백 크림', description: '알부틴 크림으로 색소 침착을 개선하세요' },
  ],
  민감함: [
    { category: '진정 크림', description: '판테놀 크림으로 자극받은 피부를 진정시키세요' },
    { category: '시카 세럼', description: '시카(CICA) 세럼으로 피부 장벽을 회복하세요' },
  ],
  '탄력 저하': [
    { category: '레티놀 크림', description: '저농도 레티놀 크림으로 탄력을 개선하세요' },
    { category: '콜라겐 에센스', description: '펩타이드 에센스로 피부 탄력을 강화하세요' },
  ],
  // 존별 특화 관심사
  '눈가 잔주름': [
    { category: '아이크림', description: '펩타이드 아이크림으로 눈가 잔주름을 케어하세요' },
  ],
  '블랙헤드 위험': [
    { category: '블랙헤드 패치', description: '블랙헤드 패치로 코 부위 피지를 제거하세요' },
  ],
  '턱 여드름 위험': [
    { category: '스팟 패치', description: '살리실산 스팟 패치로 턱선 트러블을 관리하세요' },
  ],
  '이마 번들거림': [
    { category: 'T존 세럼', description: 'T존 전용 세럼으로 이마 유분을 잡아주세요' },
  ],
};

// =============================================================================
// 존별 사용 팁
// =============================================================================

// 존 그룹별 관심사 → 사용 팁 매핑
type ZoneGroup = 'eye' | 'forehead' | 'nose' | 'cheek' | 'chin';

const ZONE_TIP_MAP: Record<ZoneGroup, Record<string, string>> = {
  eye: {
    _default: '눈가는 약지로 가볍게 두드리듯 바르세요',
  },
  forehead: {
    '과다 유분': 'T존에 집중 도포하고 나머지 부위는 가볍게 펴 바르세요',
    '이마 번들거림': 'T존에 집중 도포하고 나머지 부위는 가볍게 펴 바르세요',
    건조함: '이마 헤어라인까지 꼼꼼히 도포하세요',
  },
  nose: {
    '모공 확대': '코를 따라 위아래로 부드럽게 문질러 도포하세요',
    '블랙헤드 위험': '코를 따라 위아래로 부드럽게 문질러 도포하세요',
    '과다 유분': '코 양옆까지 골고루 도포하세요',
  },
  cheek: {
    건조함: '볼 안쪽에서 바깥쪽으로 펴 바르세요',
    민감함: '자극을 피해 가볍게 두드리듯 흡수시키세요',
  },
  chin: {
    '턱 여드름 위험': '턱선을 따라 스팟 케어를 집중하세요',
    '탄력 저하': '턱선을 따라 아래에서 위로 리프팅하듯 바르세요',
  },
};

// 존 ID → 존 그룹 매핑
function getZoneGroup(zoneId: DetailedZoneId): ZoneGroup | null {
  if (zoneId === 'eye_left' || zoneId === 'eye_right') return 'eye';
  if (zoneId.startsWith('forehead_')) return 'forehead';
  if (zoneId === 'nose_bridge' || zoneId === 'nose_tip') return 'nose';
  if (zoneId === 'cheek_left' || zoneId === 'cheek_right') return 'cheek';
  if (zoneId.startsWith('chin_')) return 'chin';
  return null;
}

/**
 * 존과 관심사 조합에 따른 사용 팁 반환
 */
export function getZoneApplicationTip(zoneId: DetailedZoneId, concern: string): string | undefined {
  const group = getZoneGroup(zoneId);
  if (!group) return undefined;

  const tips = ZONE_TIP_MAP[group];
  return tips._default ?? tips[concern];
}

// =============================================================================
// 핵심 함수
// =============================================================================

/**
 * 점수 기반 우선순위 결정
 * 낮은 점수 = 높은 우선순위 (상태가 나쁜 존에 우선 추천)
 */
function determinePriority(score: number): 'high' | 'medium' | 'low' {
  if (score < 40) return 'high';
  if (score < 65) return 'medium';
  return 'low';
}

/**
 * 관심사에 대한 추천 제품 생성
 */
function getProductsForConcerns(zoneId: DetailedZoneId, concerns: string[]): RecommendedProduct[] {
  const products: RecommendedProduct[] = [];

  for (const concern of concerns) {
    const mappings = CONCERN_PRODUCT_MAP[concern];
    if (!mappings) continue;

    for (const mapping of mappings) {
      // 중복 카테고리 방지
      if (products.some((p) => p.category === mapping.category)) continue;

      const tip = getZoneApplicationTip(zoneId, concern);

      products.push({
        category: mapping.category,
        concern,
        description: mapping.description,
        ...(tip ? { applicationTip: tip } : {}),
      });

      // 존당 최대 3개 제품
      if (products.length >= 3) return products;
    }
  }

  return products;
}

/**
 * 12존 분석 결과를 기반으로 존별 제품 추천 생성
 *
 * @param zoneScores - 존별 종합 점수 (0-100)
 * @param zoneMetrics - 존별 상세 메트릭
 * @returns 관심사가 있는 존만 포함한 추천 목록 (우선순위 순 정렬)
 */
export function generateZoneProductRecommendations(
  zoneScores: Record<DetailedZoneId, number>,
  zoneMetrics: Record<DetailedZoneId, ZoneMetricsV2>
): ZoneProductRecommendation[] {
  const recommendations: ZoneProductRecommendation[] = [];

  const allZoneIds = Object.keys(zoneScores) as DetailedZoneId[];

  for (const zoneId of allZoneIds) {
    const score = zoneScores[zoneId];
    const metrics = zoneMetrics[zoneId];
    if (!metrics) continue;

    // 관심사 감지 (기존 twelve-zone-extractor 재활용)
    const concerns = analyzeDetailedZoneConcerns(zoneId, metrics);

    // 건강한 존은 건너뜀
    if (concerns.length === 0) continue;

    const priority = determinePriority(score);
    const products = getProductsForConcerns(zoneId, concerns);

    // 추천 제품이 있는 경우만 포함
    if (products.length === 0) continue;

    recommendations.push({
      zoneId,
      label: DETAILED_ZONE_LABELS[zoneId],
      concerns,
      products,
      priority,
    });
  }

  // 우선순위 정렬: high → medium → low, 동일 우선순위 시 점수 오름차순
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => {
    const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (pDiff !== 0) return pDiff;
    return zoneScores[a.zoneId] - zoneScores[b.zoneId];
  });

  return recommendations;
}
