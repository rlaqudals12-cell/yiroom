/**
 * Phase D: AI 피부 상담 타입 정의
 */

/** 피부 고민 카테고리 */
export type SkinConcern =
  | 'dryness'
  | 'oiliness'
  | 'acne'
  | 'wrinkles'
  | 'pigmentation'
  | 'sensitivity'
  | 'pores'
  | 'general';

/** 피부 고민 라벨 */
export const SKIN_CONCERN_LABELS: Record<SkinConcern, string> = {
  dryness: '건조함',
  oiliness: '과다 유분',
  acne: '트러블',
  wrinkles: '잔주름',
  pigmentation: '잡티/색소',
  sensitivity: '민감성',
  pores: '모공',
  general: '일반 상담',
};

/** 피부 고민 이모지 */
export const SKIN_CONCERN_ICONS: Record<SkinConcern, string> = {
  dryness: '💧',
  oiliness: '✨',
  acne: '🩹',
  wrinkles: '🌿',
  pigmentation: '🌸',
  sensitivity: '🛡️',
  pores: '🔍',
  general: '💬',
};

/** 채팅 메시지 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  productRecommendations?: ProductRecommendation[];
}

/** 제품 추천 */
export interface ProductRecommendation {
  id: string;
  name: string;
  brand: string;
  category?: string;
  imageUrl?: string;
  reason?: string;
  matchRate?: number;
}

/** 빠른 질문 */
export interface QuickQuestion {
  concern: SkinConcern;
  label: string;
  question: string;
}

/** 상담 응답 템플릿 */
export interface ConsultationResponse {
  concern: SkinConcern;
  skinType?: string;
  messages: string[];
  tips: string[];
  ingredients: string[];
}

/** S-1 피부 분석 요약 (상담용) */
export interface SkinAnalysisSummary {
  skinType: string;
  hydration: number;
  oiliness: number;
  sensitivity: number;
  concerns?: SkinConcern[];
  analyzedAt: Date;
}
