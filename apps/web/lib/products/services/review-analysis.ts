/**
 * AI 리뷰 분석 서비스
 * @description Gemini AI를 사용한 제품 리뷰 분석 및 요약
 * @see ADR-092 리뷰 트리거 + 24시간 캐싱
 *
 * 정직성 원칙: Gemini 실패 시 조작된 요약(Mock)을 만들지 않고 null을 반환한다.
 * 가짜 키워드·요약을 "AI 리뷰 분석"으로 표시하는 것은 표시광고법(FTC 가짜 리뷰 규정)
 * 리스크이며, prod 가짜 평점 소거와 동일한 원칙 적용 대상 (2026-07-12 감사).
 */

import { generateContent, isGeminiAvailable } from '@/lib/gemini/client';
import { extractAndParseJson } from '@/lib/utils/json-extract';
import { productLogger } from '@/lib/utils/logger';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getProductReviews } from './reviews';
import type { ReviewProductType } from '@/types/review';
import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

// =============================================================================
// 상수 정의
// =============================================================================

/** API 타임아웃 (3초) */
const TIMEOUT_MS = 3000;

/** 최대 재시도 횟수 */
const MAX_RETRIES = 2;

/** 캐시 TTL (24시간) */
const CACHE_TTL_HOURS = 24;

/** 분석에 사용할 최대 리뷰 수 */
const MAX_REVIEWS_FOR_ANALYSIS = 50;

/** 최소 리뷰 수 (이 미만이면 분석 불가) */
const MIN_REVIEWS_FOR_ANALYSIS = 5;

// =============================================================================
// 타입 정의
// =============================================================================

/**
 * AI 리뷰 분석 키워드
 */
export interface ReviewAIKeyword {
  text: string;
  count: number;
  sentiment: 'positive' | 'negative' | 'neutral';
}

/**
 * AI 리뷰 분석 요약 결과
 */
export interface ReviewAISummary {
  /** 긍정 키워드 TOP 5 */
  positiveKeywords: ReviewAIKeyword[];
  /** 부정 키워드 TOP 5 */
  negativeKeywords: ReviewAIKeyword[];
  /** 리뷰 핵심 요약 (1-2문장) */
  summary: string;
  /** 추천 포인트 */
  pros: string[];
  /** 주의 포인트 */
  cons: string[];
  /** 전반적 감성 */
  overallSentiment: 'positive' | 'mixed' | 'negative';
  /** 분석된 리뷰 수 */
  analyzedCount: number;
}

// Zod 스키마: Gemini 응답 검증용
const reviewAIResponseSchema = z.object({
  positiveKeywords: z.array(
    z.object({
      text: z.string(),
      count: z.number(),
    })
  ),
  negativeKeywords: z.array(
    z.object({
      text: z.string(),
      count: z.number(),
    })
  ),
  summary: z.string(),
  pros: z.array(z.string()),
  cons: z.array(z.string()),
  overallSentiment: z.enum(['positive', 'mixed', 'negative']),
});

// =============================================================================
// Gemini AI 분석
// =============================================================================

/**
 * Gemini 프롬프트 생성
 */
function buildReviewAnalysisPrompt(reviews: Array<{ rating: number; content?: string }>): string {
  const reviewTexts = reviews
    .filter((r) => r.content && r.content.trim().length > 0)
    .map((r, i) => `[리뷰${i + 1}] ★${r.rating} - ${r.content}`)
    .join('\n');

  return `아래 제품 리뷰를 분석하여 핵심 키워드와 요약을 생성해주세요.

## 리뷰 데이터
${reviewTexts}

## 출력 형식 (JSON)
{
  "positiveKeywords": [{"text": "키워드", "count": 언급횟수}],
  "negativeKeywords": [{"text": "키워드", "count": 언급횟수}],
  "summary": "리뷰 핵심 요약 1-2문장 (한국어, 해요체)",
  "pros": ["추천 포인트 (해요체)"],
  "cons": ["주의 포인트 (해요체)"],
  "overallSentiment": "positive | mixed | negative"
}

## 규칙
- 긍정 키워드: 최대 5개, 언급 빈도 내림차순
- 부정 키워드: 최대 5개, 언급 빈도 내림차순
- 요약: 자연스럽고 정중한 한국어 (해요체)
- pros/cons: 각 최대 3개
- overallSentiment: 긍정 리뷰가 70%+ → positive, 50-70% → mixed, 50% 미만 → negative
- 반드시 JSON만 출력해주세요.`;
}

/**
 * Gemini로 리뷰 분석 실행 (타임아웃 + 재시도)
 */
async function callGeminiForReviewAnalysis(
  reviews: Array<{ rating: number; content?: string }>
): Promise<ReviewAISummary | null> {
  const prompt = buildReviewAnalysisPrompt(reviews);

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Promise.race 타임아웃 — 기존 AbortController는 signal 미전달로 작동하지 않던 죽은 코드였음
      const response = await Promise.race([
        generateContent({
          contents: prompt,
          config: {
            temperature: 0.2,
            topP: 0.8,
            topK: 40,
            responseMimeType: 'application/json',
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`리뷰AI 타임아웃 (${TIMEOUT_MS}ms)`)), TIMEOUT_MS)
        ),
      ]);

      // JSON 파싱 및 Zod 검증
      const parsed = extractAndParseJson<unknown>(response.text);
      if (!parsed) {
        productLogger.warn('리뷰AI JSON 파싱 실패, 재시도:', attempt + 1);
        continue;
      }

      const validated = reviewAIResponseSchema.safeParse(parsed);
      if (!validated.success) {
        productLogger.warn('리뷰AI Zod 검증 실패:', validated.error.message);
        continue;
      }

      const data = validated.data;

      return {
        positiveKeywords: data.positiveKeywords.map((k) => ({
          ...k,
          sentiment: 'positive' as const,
        })),
        negativeKeywords: data.negativeKeywords.map((k) => ({
          ...k,
          sentiment: 'negative' as const,
        })),
        summary: data.summary,
        pros: data.pros,
        cons: data.cons,
        overallSentiment: data.overallSentiment,
        analyzedCount: reviews.length,
      };
    } catch (error) {
      productLogger.warn('리뷰AI Gemini 호출 실패, 재시도:', attempt + 1, error);
    }
  }

  return null;
}

// =============================================================================
// 캐시 관리
// =============================================================================

/**
 * 캐시에서 분석 결과 조회
 */
async function getCachedAnalysis(
  supabase: SupabaseClient,
  productId: string,
  productType: string
): Promise<ReviewAISummary | null> {
  const { data, error } = await supabase
    .from('product_review_ai_cache')
    .select('summary, analyzed_count')
    .eq('product_id', productId)
    .eq('product_type', productType)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) return null;

  try {
    const summary = data.summary as ReviewAISummary;
    return summary;
  } catch {
    return null;
  }
}

/**
 * 분석 결과를 캐시에 저장 (service_role 사용)
 */
async function saveCacheAnalysis(
  productId: string,
  productType: string,
  summary: ReviewAISummary
): Promise<void> {
  try {
    const serviceClient = createServiceRoleClient();
    const expiresAt = new Date(Date.now() + CACHE_TTL_HOURS * 60 * 60 * 1000).toISOString();

    const { error } = await serviceClient.from('product_review_ai_cache').upsert(
      {
        product_id: productId,
        product_type: productType,
        summary: summary as unknown as Record<string, unknown>,
        analyzed_count: summary.analyzedCount,
        expires_at: expiresAt,
      },
      { onConflict: 'product_id,product_type' }
    );

    if (error) {
      productLogger.error('리뷰AI 캐시 저장 실패:', error);
    }
  } catch (error) {
    productLogger.error('리뷰AI 캐시 저장 에러:', error);
  }
}

// =============================================================================
// 공개 API
// =============================================================================

/**
 * 제품 리뷰 AI 분석
 *
 * 1. 캐시 확인 (24시간 TTL)
 * 2. 캐시 미스 시 리뷰 조회 + Gemini 호출
 * 3. 결과 캐시 저장
 * 4. Gemini 실패 시 Mock Fallback
 *
 * @param supabase Supabase 클라이언트 (캐시 읽기용)
 * @param productId 제품 ID
 * @param productType 제품 타입
 * @returns AI 리뷰 요약 또는 null (리뷰 부족 시)
 */
export async function analyzeProductReviews(
  supabase: SupabaseClient,
  productId: string,
  productType: ReviewProductType
): Promise<ReviewAISummary | null> {
  // 1. 캐시 확인
  const cached = await getCachedAnalysis(supabase, productId, productType);
  if (cached) {
    productLogger.info('리뷰AI 캐시 히트:', productId);
    return cached;
  }

  // 2. 리뷰 조회
  const reviews = await getProductReviews(productType, productId, {
    limit: MAX_REVIEWS_FOR_ANALYSIS,
    sortBy: 'recent',
  });

  // 리뷰 부족 시 분석 불가
  if (reviews.length < MIN_REVIEWS_FOR_ANALYSIS) {
    return null;
  }

  // 3. AI 분석 (Gemini 사용 가능 시)
  let result: ReviewAISummary | null = null;

  if (isGeminiAvailable()) {
    const reviewData = reviews.map((r) => ({
      rating: r.rating,
      content: r.content,
    }));
    result = await callGeminiForReviewAnalysis(reviewData);
  }

  // 4. Gemini 실패/미가용 시 정직하게 null 반환 — 조작된 Mock 요약을 실분석처럼
  //    노출·캐시(24h 전 사용자 오염)하지 않는다 (UI는 null 시 섹션 숨김)
  if (!result) {
    productLogger.info('리뷰AI 분석 불가(Gemini 실패/미가용), 섹션 미표시:', productId);
    return null;
  }

  // 5. 캐시 저장 (비동기, 에러 무시) — 실분석 결과만 캐시
  saveCacheAnalysis(productId, productType, result).catch(() => {
    // 캐시 저장 실패는 무시
  });

  return result;
}
