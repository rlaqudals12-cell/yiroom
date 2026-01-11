/**
 * 분석 이력 서비스
 * @description Before/After 비교 기능을 위한 분석 이력 조회 서비스
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AnalysisType,
  AnalysisHistoryItem,
  AnalysisHistoryResponse,
  AnalysisCompareResponse,
  SkinAnalysisHistoryItem,
  BodyAnalysisHistoryItem,
  PersonalColorHistoryItem,
  HairAnalysisHistoryItem,
  MakeupAnalysisHistoryItem,
  PeriodFilter,
} from '@/types/analysis-history';

// 기간별 일수 매핑
const PERIOD_DAYS_MAP: Record<PeriodFilter, number | null> = {
  '1w': 7,
  '1m': 30,
  '3m': 90,
  '6m': 180,
  '1y': 365,
  all: null,
};

// 테이블 매핑
const TABLE_MAP: Record<AnalysisType, string> = {
  skin: 'skin_analyses',
  body: 'body_analyses',
  'personal-color': 'personal_color_assessments',
  hair: 'hair_analyses',
  makeup: 'makeup_analyses',
};

export interface HistoryQueryOptions {
  /** 분석 타입 */
  type: AnalysisType;
  /** 조회 개수 (기본: 10, 최대: 50) */
  limit?: number;
  /** 기간 필터 */
  period?: PeriodFilter;
  /** 사용자 ID */
  userId: string;
}

export interface CompareQueryOptions {
  /** 분석 타입 */
  type: AnalysisType;
  /** 이전 분석 ID */
  fromId: string;
  /** 이후 분석 ID */
  toId: string;
  /** 사용자 ID */
  userId: string;
}

/**
 * 피부 분석 데이터를 이력 아이템으로 변환
 */
function transformSkinAnalysis(item: Record<string, unknown>): SkinAnalysisHistoryItem {
  return {
    id: item.id as string,
    date: item.created_at as string,
    overallScore: (item.overall_score as number) || 0,
    imageUrl: item.image_url as string | undefined,
    type: 'skin',
    details: {
      skinType: (item.skin_type as string) || '',
      hydration: (item.hydration as number) || 0,
      oilLevel: (item.oil_level as number) || 0,
      pores: (item.pores as number) || 0,
      pigmentation: (item.pigmentation as number) || 0,
      wrinkles: (item.wrinkles as number) || 0,
      sensitivity: (item.sensitivity as number) || 0,
    },
  };
}

/**
 * 체형 분석 데이터를 이력 아이템으로 변환
 */
function transformBodyAnalysis(item: Record<string, unknown>): BodyAnalysisHistoryItem {
  const avgScore = Math.round(
    (((item.shoulder as number) || 0) +
      ((item.waist as number) || 0) +
      ((item.hip as number) || 0)) /
      3
  );

  return {
    id: item.id as string,
    date: item.created_at as string,
    overallScore: avgScore,
    imageUrl: item.image_url as string | undefined,
    type: 'body',
    details: {
      bodyType: (item.body_type as string) || '',
      height: item.height ? parseFloat(item.height as string) : undefined,
      weight: item.weight ? parseFloat(item.weight as string) : undefined,
      shoulder: (item.shoulder as number) || 0,
      waist: (item.waist as number) || 0,
      hip: (item.hip as number) || 0,
      ratio: item.ratio ? parseFloat(item.ratio as string) : undefined,
    },
  };
}

/**
 * 퍼스널 컬러 분석 데이터를 이력 아이템으로 변환
 */
function transformPersonalColorAnalysis(item: Record<string, unknown>): PersonalColorHistoryItem {
  return {
    id: item.id as string,
    date: item.created_at as string,
    overallScore: (item.confidence as number) || 0,
    imageUrl: item.face_image_url as string | undefined,
    type: 'personal-color',
    details: {
      season: (item.season as string) || '',
      undertone: (item.undertone as string) || 'Neutral',
      confidence: (item.confidence as number) || 0,
    },
  };
}

/**
 * 헤어 분석 데이터를 이력 아이템으로 변환
 */
function transformHairAnalysis(item: Record<string, unknown>): HairAnalysisHistoryItem {
  return {
    id: item.id as string,
    date: item.created_at as string,
    overallScore: (item.overall_score as number) || 0,
    imageUrl: item.image_url as string | undefined,
    type: 'hair',
    details: {
      hairType: (item.hair_type as string) || 'straight',
      scalpHealth: (item.scalp_health as number) || 0,
      hairDensity: (item.hair_density as number) || 0,
      hairThickness: (item.hair_thickness as number) || 0,
      damageLevel: (item.damage_level as number) || 0,
    },
  };
}

/**
 * 메이크업 분석 데이터를 이력 아이템으로 변환
 */
function transformMakeupAnalysis(item: Record<string, unknown>): MakeupAnalysisHistoryItem {
  return {
    id: item.id as string,
    date: item.created_at as string,
    overallScore: (item.overall_score as number) || 0,
    imageUrl: item.image_url as string | undefined,
    type: 'makeup',
    details: {
      undertone: (item.undertone as string) || 'neutral',
      faceShape: (item.face_shape as string) || 'oval',
      eyeShape: item.eye_shape as string | undefined,
      lipShape: item.lip_shape as string | undefined,
    },
  };
}

/**
 * 트렌드 계산 (최근 2개 비교)
 */
export function calculateTrend(
  analyses: AnalysisHistoryItem[]
): 'improving' | 'declining' | 'stable' {
  if (analyses.length < 2) {
    return 'stable';
  }

  const latestScore = analyses[0].overallScore;
  const previousScore = analyses[1].overallScore;
  const diff = latestScore - previousScore;

  if (diff > 2) {
    return 'improving';
  } else if (diff < -2) {
    return 'declining';
  }

  return 'stable';
}

/**
 * 기간 문자열 계산
 */
export function calculatePeriod(fromDate: string, toDate: string): string {
  const from = new Date(fromDate);
  const to = new Date(toDate);
  const diffMs = to.getTime() - from.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays}일`;
  } else if (diffDays < 30) {
    return `${Math.round(diffDays / 7)}주`;
  } else if (diffDays < 365) {
    return `${Math.round(diffDays / 30)}개월`;
  } else {
    return `${Math.round(diffDays / 365)}년`;
  }
}

/**
 * 비교 인사이트 생성
 */
export function generateCompareInsights(
  type: AnalysisType,
  before: AnalysisHistoryItem,
  after: AnalysisHistoryItem,
  detailChanges: Record<string, number>
): string[] {
  const insights: string[] = [];
  const overallChange = after.overallScore - before.overallScore;

  if (type === 'skin') {
    if (overallChange > 5) {
      insights.push('전반적인 피부 상태가 크게 개선되었어요!');
    } else if (overallChange > 0) {
      insights.push('피부 상태가 조금씩 좋아지고 있어요.');
    } else if (overallChange < -5) {
      insights.push('피부 상태가 다소 악화되었어요. 관리가 필요해요.');
    }

    if (detailChanges.hydration && detailChanges.hydration > 5) {
      insights.push('수분감이 크게 향상되었어요!');
    }
    if (detailChanges.pores && detailChanges.pores > 5) {
      insights.push('모공 상태가 개선되고 있어요.');
    }
    if (detailChanges.wrinkles && detailChanges.wrinkles > 5) {
      insights.push('주름이 눈에 띄게 줄었어요!');
    }
    if (detailChanges.oilLevel && detailChanges.oilLevel < -5) {
      insights.push('유분 밸런스가 좋아지고 있어요.');
    }
  } else if (type === 'body') {
    if (overallChange > 5) {
      insights.push('체형 밸런스가 크게 개선되었어요!');
    } else if (overallChange > 0) {
      insights.push('체형이 조금씩 변화하고 있어요.');
    }

    if (detailChanges.shoulder && detailChanges.shoulder > 5) {
      insights.push('어깨 라인이 좋아지고 있어요.');
    }
    if (detailChanges.waist && detailChanges.waist > 5) {
      insights.push('허리 라인이 개선되고 있어요.');
    }
    if (detailChanges.hip && detailChanges.hip > 5) {
      insights.push('힙 라인이 더 균형잡혔어요.');
    }
  } else if (type === 'hair') {
    if (overallChange > 5) {
      insights.push('전반적인 모발 상태가 크게 개선되었어요!');
    } else if (overallChange > 0) {
      insights.push('모발 상태가 조금씩 좋아지고 있어요.');
    } else if (overallChange < -5) {
      insights.push('모발 관리가 필요해 보여요.');
    }

    if (detailChanges.scalpHealth && detailChanges.scalpHealth > 5) {
      insights.push('두피 건강이 눈에 띄게 개선되었어요!');
    }
    if (detailChanges.hairDensity && detailChanges.hairDensity > 5) {
      insights.push('모발 밀도가 좋아지고 있어요.');
    }
    if (detailChanges.damageLevel && detailChanges.damageLevel < -5) {
      insights.push('모발 손상도가 줄었어요!');
    }
  } else if (type === 'makeup') {
    insights.push('메이크업 스타일 변화를 확인해보세요!');
  }

  // 기본 인사이트
  if (insights.length === 0) {
    insights.push('꾸준한 관리가 중요해요. 계속 화이팅!');
  }

  return insights;
}

/**
 * 분석 이력 조회 서비스
 */
export async function getAnalysisHistory(
  supabase: SupabaseClient,
  options: HistoryQueryOptions
): Promise<AnalysisHistoryResponse> {
  const { type, limit = 10, period = 'all', userId } = options;
  const effectiveLimit = Math.min(limit, 50);
  const periodDays = PERIOD_DAYS_MAP[period];

  // 기간 필터 날짜 계산
  let startDate: string | null = null;
  if (periodDays) {
    const date = new Date();
    date.setDate(date.getDate() - periodDays);
    startDate = date.toISOString();
  }

  const tableName = TABLE_MAP[type];
  let query = supabase.from(tableName).select('*').eq('clerk_user_id', userId);

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .limit(effectiveLimit);

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  // 타입별 변환
  let analyses: AnalysisHistoryItem[] = [];

  switch (type) {
    case 'skin':
      analyses = (data || []).map(transformSkinAnalysis);
      break;
    case 'body':
      analyses = (data || []).map(transformBodyAnalysis);
      break;
    case 'personal-color':
      analyses = (data || []).map(transformPersonalColorAnalysis);
      break;
    case 'hair':
      analyses = (data || []).map(transformHairAnalysis);
      break;
    case 'makeup':
      analyses = (data || []).map(transformMakeupAnalysis);
      break;
  }

  const trend = calculateTrend(analyses);

  return {
    analyses,
    trend,
    totalCount: analyses.length,
  };
}

/**
 * 두 분석 비교 서비스
 */
export async function compareAnalyses(
  supabase: SupabaseClient,
  options: CompareQueryOptions
): Promise<AnalysisCompareResponse> {
  const { type, fromId, toId, userId } = options;

  // 퍼스널 컬러는 점수 비교가 의미없으므로 지원하지 않음
  if (type === 'personal-color') {
    throw new Error('Personal color comparison not supported');
  }

  const tableName = TABLE_MAP[type];

  // 두 분석 조회
  const { data: fromData, error: fromError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', fromId)
    .eq('clerk_user_id', userId)
    .single();

  if (fromError || !fromData) {
    throw new Error('From analysis not found or unauthorized');
  }

  const { data: toData, error: toError } = await supabase
    .from(tableName)
    .select('*')
    .eq('id', toId)
    .eq('clerk_user_id', userId)
    .single();

  if (toError || !toData) {
    throw new Error('To analysis not found or unauthorized');
  }

  // 타입별 변환
  let beforeItem: AnalysisHistoryItem;
  let afterItem: AnalysisHistoryItem;
  let detailChanges: Record<string, number> = {};

  switch (type) {
    case 'skin':
      beforeItem = transformSkinAnalysis(fromData);
      afterItem = transformSkinAnalysis(toData);
      const skinBefore = beforeItem as SkinAnalysisHistoryItem;
      const skinAfter = afterItem as SkinAnalysisHistoryItem;
      detailChanges = {
        hydration: skinAfter.details.hydration - skinBefore.details.hydration,
        oilLevel: skinAfter.details.oilLevel - skinBefore.details.oilLevel,
        pores: skinAfter.details.pores - skinBefore.details.pores,
        pigmentation: skinAfter.details.pigmentation - skinBefore.details.pigmentation,
        wrinkles: skinAfter.details.wrinkles - skinBefore.details.wrinkles,
        sensitivity: skinAfter.details.sensitivity - skinBefore.details.sensitivity,
      };
      break;

    case 'body':
      beforeItem = transformBodyAnalysis(fromData);
      afterItem = transformBodyAnalysis(toData);
      const bodyBefore = beforeItem as BodyAnalysisHistoryItem;
      const bodyAfter = afterItem as BodyAnalysisHistoryItem;
      detailChanges = {
        shoulder: bodyAfter.details.shoulder - bodyBefore.details.shoulder,
        waist: bodyAfter.details.waist - bodyBefore.details.waist,
        hip: bodyAfter.details.hip - bodyBefore.details.hip,
      };
      break;

    case 'hair':
      beforeItem = transformHairAnalysis(fromData);
      afterItem = transformHairAnalysis(toData);
      const hairBefore = beforeItem as HairAnalysisHistoryItem;
      const hairAfter = afterItem as HairAnalysisHistoryItem;
      detailChanges = {
        scalpHealth: hairAfter.details.scalpHealth - hairBefore.details.scalpHealth,
        hairDensity: hairAfter.details.hairDensity - hairBefore.details.hairDensity,
        hairThickness: hairAfter.details.hairThickness - hairBefore.details.hairThickness,
        damageLevel: hairAfter.details.damageLevel - hairBefore.details.damageLevel,
      };
      break;

    case 'makeup':
      beforeItem = transformMakeupAnalysis(fromData);
      afterItem = transformMakeupAnalysis(toData);
      // makeup은 점수 변화보다 스타일 변화가 중요
      detailChanges = {};
      break;

    default:
      throw new Error('Invalid analysis type');
  }

  const overallChange = afterItem.overallScore - beforeItem.overallScore;
  const period = calculatePeriod(beforeItem.date, afterItem.date);
  const insights = generateCompareInsights(type, beforeItem, afterItem, detailChanges);

  return {
    before: beforeItem,
    after: afterItem,
    changes: {
      overall: overallChange,
      period,
      details: detailChanges,
    },
    insights,
  };
}

/**
 * 타임라인 차트용 데이터 조회
 * @description 시계열 데이터를 차트에 표시하기 좋은 형태로 변환
 */
export async function getTimelineData(
  supabase: SupabaseClient,
  options: HistoryQueryOptions
): Promise<{ date: string; value: number; label?: string }[]> {
  const { analyses } = await getAnalysisHistory(supabase, options);

  // 날짜순 정렬 (오래된 것부터)
  const sortedAnalyses = [...analyses].reverse();

  return sortedAnalyses.map((item) => ({
    date: item.date,
    value: item.overallScore,
    label: item.date,
  }));
}
