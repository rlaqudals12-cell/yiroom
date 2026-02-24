/**
 * 피부 분석 관련 타입 정의
 */

/** 피부 지표 */
export interface SkinMetrics {
  moisture: number;
  oil: number;
  pores: number;
  wrinkles: number;
  pigmentation: number;
  sensitivity: number;
  elasticity: number;
}

/** 이전 분석 대비 변화량 */
export interface SkinMetricsDelta {
  moisture: number;
  oil: number;
  pores: number;
  wrinkles: number;
  pigmentation: number;
  sensitivity: number;
  elasticity: number;
  overall: number;
}
