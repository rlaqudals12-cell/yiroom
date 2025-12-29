/**
 * AI 채팅 시스템 타입 정의
 * @see docs/SPEC-AI-CHAT.md
 */

// 채팅 메시지
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ChatMessageMetadata;
}

// 메시지 메타데이터
export interface ChatMessageMetadata {
  productRecommendations?: ProductRecommendation[];
  relatedAnalysis?: 'skin' | 'personal-color' | 'body' | 'nutrition' | 'workout' | 'product';
}

// 제품 추천
export interface ProductRecommendation {
  productId: string;
  productName: string;
  reason: string;
  category?: string;
  affiliateUrl?: string;
}

// 채팅 세션
export interface ChatSession {
  id: string;
  clerkUserId: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// 채팅 컨텍스트 (사용자 분석 결과)
export interface ChatContext {
  skinAnalysis?: {
    skinType: string;
    moisture: number;
    concerns: string[];
    recommendedIngredients: string[];
    analyzedAt: string;
  };
  personalColor?: {
    season: string;
    tone: string;
    bestColors: string[];
    worstColors: string[];
    analyzedAt: string;
  };
  bodyAnalysis?: {
    bodyType: string;
    bmi: number;
    muscleBalance: string;
    analyzedAt: string;
  };
  workoutPlan?: {
    goal: string;
    level: string;
    frequency: number;
  };
  nutritionGoals?: {
    dailyCalories: number;
    proteinTarget: number;
  };
  recentProducts?: Array<{
    id: string;
    name: string;
    category: string;
  }>;
}

// API 요청
export interface ChatRequest {
  message: string;
  sessionId?: string;
}

// API 응답
export interface ChatResponse {
  success: boolean;
  data?: {
    message: ChatMessage;
    sessionId: string;
    productRecommendations?: ProductRecommendation[];
  };
  error?: string;
}

// 추천 질문
export interface SuggestedQuestion {
  id: string;
  text: string;
  category: 'skin' | 'color' | 'body' | 'nutrition' | 'product';
}
