/**
 * 인사이트 타입 정의
 *
 * @module lib/insights/types
 * @description 크로스 모듈 인사이트 생성을 위한 타입 시스템
 * @see docs/specs/SDD-CROSS-MODULE-PROTOCOL.md
 */

// ============================================
// 분석 모듈 타입
// ============================================

/**
 * 분석 모듈 식별자
 */
export type AnalysisModule = 'personal_color' | 'face' | 'skin' | 'body' | 'hair' | 'oral_health';

/**
 * 인사이트 카테고리
 */
export type InsightCategory =
  | 'color_match' // 컬러 매칭 (PC + 다른 모듈)
  | 'skin_care' // 스킨케어 추천 (S-1 기반)
  | 'style_tip' // 스타일링 팁 (C-1, F-1 기반)
  | 'product_recommendation' // 제품 추천 (통합)
  | 'health_alert' // 건강 관련 알림
  | 'routine_suggestion' // 루틴 제안
  | 'synergy'; // 모듈 간 시너지

/**
 * 인사이트 우선순위
 */
export type InsightPriority = 'critical' | 'high' | 'medium' | 'low';

// ============================================
// 인사이트 인터페이스
// ============================================

/**
 * 기본 인사이트 구조
 */
export interface BaseInsight {
  /** 고유 식별자 */
  id: string;
  /** 인사이트 카테고리 */
  category: InsightCategory;
  /** 제목 (짧고 명확하게) */
  title: string;
  /** 상세 설명 */
  description: string;
  /** 관련 분석 모듈 */
  relatedModules: AnalysisModule[];
  /** 우선순위 */
  priority: InsightPriority;
  /** 우선순위 점수 (0-100) */
  priorityScore: number;
  /** 생성 시간 */
  createdAt: string;
}

/**
 * 컬러 매칭 인사이트
 */
export interface ColorMatchInsight extends BaseInsight {
  category: 'color_match';
  /** 추천 컬러 팔레트 */
  recommendedColors?: string[];
  /** 피해야 할 컬러 */
  avoidColors?: string[];
  /** 시즌 타입 */
  seasonType?: string;
}

/**
 * 스킨케어 인사이트
 */
export interface SkinCareInsight extends BaseInsight {
  category: 'skin_care';
  /** 피부 고민 */
  skinConcerns?: string[];
  /** 추천 성분 */
  recommendedIngredients?: string[];
  /** 피해야 할 성분 */
  avoidIngredients?: string[];
}

/**
 * 스타일 팁 인사이트
 */
export interface StyleTipInsight extends BaseInsight {
  category: 'style_tip';
  /** 체형 타입 */
  bodyType?: string;
  /** 추천 실루엣 */
  recommendedSilhouettes?: string[];
  /** 강조 포인트 */
  accentPoints?: string[];
}

/**
 * 제품 추천 인사이트
 */
export interface ProductRecommendationInsight extends BaseInsight {
  category: 'product_recommendation';
  /** 제품 카테고리 */
  productCategory?: string;
  /** 추천 이유 */
  reason?: string;
  /** 관련 제품 ID */
  productIds?: string[];
}

/**
 * 건강 알림 인사이트
 */
export interface HealthAlertInsight extends BaseInsight {
  category: 'health_alert';
  /** 알림 심각도 */
  severity: 'info' | 'warning' | 'urgent';
  /** 권장 조치 */
  recommendedAction?: string;
}

/**
 * 루틴 제안 인사이트
 */
export interface RoutineSuggestionInsight extends BaseInsight {
  category: 'routine_suggestion';
  /** 루틴 타입 */
  routineType: 'morning' | 'evening' | 'weekly';
  /** 루틴 단계 */
  steps?: string[];
}

/**
 * 시너지 인사이트 (모듈 간 조합 효과)
 */
export interface SynergyInsight extends BaseInsight {
  category: 'synergy';
  /** 시너지 효과 설명 */
  synergyEffect?: string;
  /** 시너지 점수 (0-100) */
  synergyScore?: number;
}

/**
 * 모든 인사이트 타입 유니온
 */
export type Insight =
  | ColorMatchInsight
  | SkinCareInsight
  | StyleTipInsight
  | ProductRecommendationInsight
  | HealthAlertInsight
  | RoutineSuggestionInsight
  | SynergyInsight;

// ============================================
// 분석 결과 입력 타입
// ============================================

/**
 * 퍼스널컬러 분석 결과 (인사이트 생성용)
 */
export interface PersonalColorData {
  season: string;
  undertone: string;
  confidence: number;
  subType?: string;
  colorPalette?: string[];
}

/**
 * 피부 분석 결과 (인사이트 생성용)
 */
export interface SkinData {
  skinType: string;
  concerns?: string[];
  hydrationLevel?: number;
  oilLevel?: number;
  sensitivityLevel?: number;
}

/**
 * 체형 분석 결과 (인사이트 생성용)
 */
export interface BodyData {
  bodyType: string;
  shoulderType?: string;
  proportions?: {
    shoulderToHip: number;
    legToTorso: number;
  };
}

/**
 * 얼굴형 분석 결과 (인사이트 생성용)
 */
export interface FaceData {
  faceShape: string;
  facialFeatures?: string[];
}

/**
 * 모발 분석 결과 (인사이트 생성용)
 */
export interface HairData {
  hairType: string;
  hairCondition?: string;
  scalpCondition?: string;
}

/**
 * 구강 건강 분석 결과 (인사이트 생성용)
 */
export interface OralHealthData {
  gumHealthStatus: string;
  toothShade?: string;
  inflammationScore?: number;
}

/**
 * 통합 분석 데이터 (인사이트 생성 입력)
 */
export interface AnalysisDataBundle {
  personalColor?: PersonalColorData | null;
  skin?: SkinData | null;
  body?: BodyData | null;
  face?: FaceData | null;
  hair?: HairData | null;
  oralHealth?: OralHealthData | null;
}

// ============================================
// 인사이트 생성 옵션
// ============================================

/**
 * 인사이트 생성 옵션
 */
export interface InsightGeneratorOptions {
  /** 최대 인사이트 개수 */
  maxInsights?: number;
  /** 최소 우선순위 점수 */
  minPriorityScore?: number;
  /** 포함할 카테고리 */
  includeCategories?: InsightCategory[];
  /** 제외할 카테고리 */
  excludeCategories?: InsightCategory[];
  /** 언어 */
  language?: 'ko' | 'en';
}

/**
 * 인사이트 생성 결과
 */
export interface InsightGenerationResult {
  insights: Insight[];
  /** 생성된 총 인사이트 수 */
  totalGenerated: number;
  /** 필터링 후 반환된 수 */
  returnedCount: number;
  /** 사용된 분석 모듈 */
  usedModules: AnalysisModule[];
  /** 생성 시간 (ms) */
  generationTime: number;
}
