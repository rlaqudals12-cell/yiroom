/**
 * A/B 테스트 프레임워크
 * @description 채널 순서 최적화 등 A/B 테스트 지원
 */

import type { AffiliatePartnerName } from '@/types/affiliate';
import { affiliateLogger } from '@/lib/utils/logger';

/** 실험 정의 */
export interface ABExperiment {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  isActive: boolean;
  startDate: string;
  endDate?: string;
}

/** 변형 정의 */
export interface ABVariant {
  id: string;
  name: string;
  weight: number; // 트래픽 비율 (0-100)
  config: Record<string, unknown>;
}

/** 실험 결과 */
export interface ABResult {
  experimentId: string;
  variantId: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
}

/** 사용자 할당 정보 */
export interface UserAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: string;
}

// 현재 활성 실험들 (추후 DB에서 로드)
const ACTIVE_EXPERIMENTS: ABExperiment[] = [
  {
    id: 'channel-order-v1',
    name: '채널 순서 최적화',
    description: '제품 카드에서 구매 채널 표시 순서 테스트',
    isActive: true,
    startDate: '2025-01-01',
    variants: [
      {
        id: 'control',
        name: '기본 순서',
        weight: 50,
        config: {
          channelOrder: ['coupang', 'iherb', 'musinsa'] as AffiliatePartnerName[],
        },
      },
      {
        id: 'price-first',
        name: '가격순',
        weight: 50,
        config: {
          channelOrder: 'price-asc' as const, // 가격 낮은 순
        },
      },
    ],
  },
  {
    id: 'cta-style-v1',
    name: 'CTA 버튼 스타일',
    description: '구매 버튼 텍스트 및 스타일 테스트',
    isActive: false, // 비활성
    startDate: '2025-01-15',
    variants: [
      {
        id: 'control',
        name: '기본 스타일',
        weight: 50,
        config: {
          buttonText: '구매하기',
          buttonStyle: 'default',
        },
      },
      {
        id: 'urgency',
        name: '긴급 스타일',
        weight: 50,
        config: {
          buttonText: '지금 구매',
          buttonStyle: 'urgent',
        },
      },
    ],
  },
];

// 쿠키 키 접두사
const COOKIE_PREFIX = 'ab_';

/**
 * 실험 목록 조회
 */
export function getExperiments(activeOnly = true): ABExperiment[] {
  if (activeOnly) {
    return ACTIVE_EXPERIMENTS.filter((exp) => exp.isActive);
  }
  return ACTIVE_EXPERIMENTS;
}

/**
 * 특정 실험 조회
 */
export function getExperiment(experimentId: string): ABExperiment | null {
  return ACTIVE_EXPERIMENTS.find((exp) => exp.id === experimentId) || null;
}

/**
 * 가중치 기반 변형 선택
 */
function selectVariant(experiment: ABExperiment): ABVariant {
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;

  for (const variant of experiment.variants) {
    random -= variant.weight;
    if (random <= 0) {
      return variant;
    }
  }

  // 기본값 (첫 번째 변형)
  return experiment.variants[0];
}

/**
 * 사용자에게 변형 할당 (클라이언트 사이드)
 * @description 쿠키 기반으로 일관된 경험 제공
 */
export function assignVariant(experimentId: string, existingAssignment?: string): ABVariant | null {
  const experiment = getExperiment(experimentId);
  if (!experiment || !experiment.isActive) {
    return null;
  }

  // 기존 할당이 있으면 해당 변형 반환
  if (existingAssignment) {
    const variant = experiment.variants.find((v) => v.id === existingAssignment);
    if (variant) {
      return variant;
    }
  }

  // 새로운 변형 할당
  return selectVariant(experiment);
}

/**
 * 쿠키에서 할당 정보 읽기
 */
export function getAssignmentFromCookie(cookies: string, experimentId: string): string | null {
  const cookieKey = `${COOKIE_PREFIX}${experimentId}`;
  const match = cookies.match(new RegExp(`${cookieKey}=([^;]+)`));
  return match ? match[1] : null;
}

/**
 * 쿠키에 할당 정보 저장 (클라이언트용)
 */
export function setAssignmentCookie(experimentId: string, variantId: string, days = 30): string {
  const cookieKey = `${COOKIE_PREFIX}${experimentId}`;
  const expires = new Date();
  expires.setDate(expires.getDate() + days);

  return `${cookieKey}=${variantId}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}

/**
 * 채널 순서 결정 (A/B 테스트 적용)
 */
export function getChannelOrder(
  variantConfig: Record<string, unknown>,
  channels: { partnerId: AffiliatePartnerName; priceKrw: number }[]
): AffiliatePartnerName[] {
  const channelOrder = variantConfig.channelOrder;

  // 고정 순서
  if (Array.isArray(channelOrder)) {
    return channelOrder as AffiliatePartnerName[];
  }

  // 가격순 정렬
  if (channelOrder === 'price-asc') {
    return channels.sort((a, b) => a.priceKrw - b.priceKrw).map((c) => c.partnerId);
  }

  // 기본 순서
  return channels.map((c) => c.partnerId);
}

/**
 * A/B 테스트 이벤트 기록 (클릭/전환)
 */
export interface ABEvent {
  experimentId: string;
  variantId: string;
  eventType: 'impression' | 'click' | 'conversion';
  productId?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// 메모리 버퍼 (실제로는 API로 전송)
const eventBuffer: ABEvent[] = [];

/**
 * 이벤트 기록
 */
export function trackABEvent(event: Omit<ABEvent, 'timestamp'>): void {
  const fullEvent: ABEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  eventBuffer.push(fullEvent);

  // 버퍼가 일정 크기 이상이면 플러시 (실제 구현에서는 API 호출)
  if (eventBuffer.length >= 10) {
    flushEvents();
  }

  // 개발 모드 로깅
  if (process.env.NODE_ENV === 'development') {
    affiliateLogger.debug('AB Test 이벤트:', fullEvent);
  }
}

/**
 * 이벤트 버퍼 플러시
 */
export async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer.length = 0;

  // 실제 구현에서는 API 호출
  // await fetch('/api/affiliate/ab-events', {
  //   method: 'POST',
  //   body: JSON.stringify({ events }),
  // });

  affiliateLogger.debug(`AB Test: ${events.length}개 이벤트 플러시됨`);
}

/**
 * Mock 결과 데이터 생성
 */
export function getMockResults(experimentId: string): ABResult[] {
  const experiment = getExperiment(experimentId);
  if (!experiment) return [];

  return experiment.variants.map((variant) => {
    const baseClicks = 500 + Math.floor(Math.random() * 200);
    const conversionRate = 2 + Math.random() * 3;
    const conversions = Math.floor(baseClicks * (conversionRate / 100));
    const revenue = conversions * (1000 + Math.floor(Math.random() * 2000));

    return {
      experimentId,
      variantId: variant.id,
      clicks: baseClicks,
      conversions,
      revenue,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
    };
  });
}

/**
 * 통계적 유의성 계산 (간단한 z-test)
 */
export function calculateSignificance(
  controlConversions: number,
  controlClicks: number,
  treatmentConversions: number,
  treatmentClicks: number
): { isSignificant: boolean; pValue: number; lift: number } {
  const p1 = controlClicks > 0 ? controlConversions / controlClicks : 0;
  const p2 = treatmentClicks > 0 ? treatmentConversions / treatmentClicks : 0;

  const lift = p1 > 0 ? ((p2 - p1) / p1) * 100 : 0;

  // 간단한 z-test
  const n1 = controlClicks;
  const n2 = treatmentClicks;

  if (n1 === 0 || n2 === 0) {
    return { isSignificant: false, pValue: 1, lift: 0 };
  }

  const pooledP = (controlConversions + treatmentConversions) / (n1 + n2);
  const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return { isSignificant: false, pValue: 1, lift };
  }

  const z = (p2 - p1) / se;
  // 간단한 p-value 근사 (정규분포 테이블 대신)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  return {
    isSignificant: pValue < 0.05,
    pValue: parseFloat(pValue.toFixed(4)),
    lift: parseFloat(lift.toFixed(2)),
  };
}

// 표준 정규분포 CDF 근사
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}
