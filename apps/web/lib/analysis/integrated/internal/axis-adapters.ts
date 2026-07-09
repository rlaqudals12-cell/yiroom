/**
 * 축별 분석 Adapter (4개 축: PC/S/C/H)
 *
 * @module lib/analysis/integrated/internal/axis-adapters
 * @description
 *   각 축의 기존 분석 모듈(lib/analysis/*-v2, lib/analysis/hair)을 호출하고
 *   session_id를 포함한 DB 저장을 수행하여 AxisResult로 정규화.
 *
 *   v1은 Mock-First 전략 (ADR-007 준수):
 *   - FORCE_MOCK_AI=true 또는 AI 실패 시 generateMockResult 활용
 *   - 실제 Gemini 호출은 기존 /api/analyze/*-v2 route와 분리 (Phase A 범위 외)
 *
 * @see docs/adr/ADR-099-integrated-analysis-flow.md §5
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md §6 ATOM 4
 *
 * @internal — 외부 import 금지 (오케스트레이터 전용)
 */

import { createServiceRoleClient } from '@/lib/supabase/service-role';
import {
  generateMockResult as generateMockPC,
  rgbToLab,
  classifyTone,
  getTonePalette,
} from '@/lib/analysis/personal-color-v2';
import { generateMockSkinAnalysisV2Result } from '@/lib/analysis/skin-v2';
import { generateMockBodyAnalysisResult, type BodyShapeType } from '@/lib/analysis/body-v2';
import { bodyShapeToType3 } from '@/lib/body';
import { generateMockHairAnalysisResult } from '@/lib/analysis/hair';
import { buildSkinEnrichment } from './skin-enrichment';
import {
  extractSkinColorWithGemini,
  analyzeSkinV2WithGemini,
  analyzeBodyWithGemini,
  analyzeHairWithGemini,
} from '@/lib/gemini/v2-analysis';
import { getSkinPriorHint, getBodyPriorHint, getHairPriorHint } from '@/lib/analysis/prior-context';
import type {
  AxisResult,
  AxisError,
  AxisErrorCode,
  PersonalColorAxisData,
  SkinAxisData,
  BodyAxisData,
  HairAxisData,
  IntegratedAnalysisInput,
} from '../types';

// ============================================
// Shared utilities
// ============================================

/** 통합 세션임을 표시하는 sentinel image URL (Storage 업로드는 Phase B) */
function sessionImageSentinel(sessionId: string, kind: 'face' | 'body'): string {
  return `integrated://${kind}/${sessionId}`;
}

/** 에러를 AxisError로 정규화 */
function normalizeError(
  code: AxisErrorCode,
  error: unknown,
  userMessage: string,
  retryable = true
): AxisError {
  return {
    code,
    message: error instanceof Error ? error.message : String(error),
    userMessage,
    retryable,
  };
}

/** FORCE_MOCK_AI 환경변수 체크 (출시 전까진 true) */
function isMockMode(): boolean {
  return process.env.FORCE_MOCK_AI === 'true';
}

// ============================================
// 1. PC-2 Adapter (Personal Color)
// ============================================

export async function runPersonalColorAxis(
  sessionId: string,
  clerkUserId: string,
  input: IntegratedAnalysisInput
): Promise<AxisResult<PersonalColorAxisData>> {
  try {
    // Phase F.3 (ADR-104 #3): 실제 Gemini → Lab 분석. FORCE_MOCK_AI=true이거나 실패 시 Mock.
    let classification: {
      season: string;
      tone: string;
      subtype: string;
      undertone: string;
      confidence: number;
    };
    let mainColors: string[] = [];
    let avoidColors: string[] = [];
    let usedFallback = false;

    if (isMockMode()) {
      const mock = generateMockPC();
      classification = {
        season: mock.classification.season,
        tone: mock.classification.tone,
        subtype: mock.classification.subtype,
        undertone: mock.classification.undertone,
        confidence: mock.classification.confidence,
      };
      mainColors = mock.palette.mainColors ?? [];
      avoidColors = mock.palette.avoidColors ?? [];
      usedFallback = true;
    } else {
      const geminiResult = await extractSkinColorWithGemini(input.faceImageBase64);
      if (geminiResult.data && !geminiResult.usedFallback) {
        const { r, g, b } = geminiResult.data.skinRgb;
        const skinLab = rgbToLab(r, g, b);
        const c = classifyTone(skinLab);
        const palette = getTonePalette(c.tone);
        classification = {
          season: c.season,
          tone: c.tone,
          subtype: c.subtype,
          undertone: c.undertone,
          confidence: c.confidence,
        };
        mainColors = palette.mainColors ?? [];
        avoidColors = palette.avoidColors ?? [];
      } else {
        // Gemini 실패 → Mock fallback
        const mock = generateMockPC();
        classification = {
          season: mock.classification.season,
          tone: mock.classification.tone,
          subtype: mock.classification.subtype,
          undertone: mock.classification.undertone,
          confidence: mock.classification.confidence,
        };
        mainColors = mock.palette.mainColors ?? [];
        avoidColors = mock.palette.avoidColors ?? [];
        usedFallback = true;
      }
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('personal_color_assessments')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        questionnaire_answers: {},
        face_image_url: sessionImageSentinel(sessionId, 'face'),
        season: classification.season,
        undertone: classification.undertone,
        confidence: classification.confidence,
        image_analysis: {
          version: 2,
          source: 'integrated',
          tone: classification.tone,
          subtype: classification.subtype,
          // 퍼스널 대비 실측값(ADR-116) — 클라이언트 실측이 전달됐을 때만 저장(없으면 생략).
          // 단독 PC 경로(image_analysis.contrastLevel)와 동일 키 → 결과/홈 소비 코드 재사용.
          ...(input.measuredContrastLevel ? { contrastLevel: input.measuredContrastLevel } : {}),
          usedFallback,
        },
        best_colors: mainColors,
        worst_colors: avoidColors,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: normalizeError('DB_SAVE_FAILED', error, '퍼스널컬러 결과 저장에 실패했어요.'),
      };
    }

    return {
      success: true,
      usedFallback,
      data: {
        id: data?.id as string | undefined,
        season: classification.season,
        tone: classification.tone,
        undertone: classification.undertone,
        confidence: classification.confidence,
        palette: mainColors,
        // 액션 플랜(립 발색 강도)·홈 배색이 소비 — 실측이 있을 때만(ADR-116)
        ...(input.measuredContrastLevel ? { contrastLevel: input.measuredContrastLevel } : {}),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeError('UNKNOWN', error, '퍼스널컬러 분석 중 오류가 발생했어요.'),
    };
  }
}

// ============================================
// 2. S-2 Adapter (Skin)
// ============================================

export async function runSkinAxis(
  sessionId: string,
  clerkUserId: string,
  input: IntegratedAnalysisInput
): Promise<AxisResult<SkinAxisData>> {
  try {
    // Phase F.3: 실제 Gemini 우선, 실패 시 Mock
    let result: ReturnType<typeof generateMockSkinAnalysisV2Result>;
    let usedFallback: boolean;

    if (isMockMode()) {
      result = generateMockSkinAnalysisV2Result();
      usedFallback = true;
    } else {
      // Level 3: 직전 분석 앵커 주입 (없으면 null → Level 2와 동일)
      const skinPrior = await getSkinPriorHint(clerkUserId);
      const gemini = await analyzeSkinV2WithGemini(input.faceImageBase64, skinPrior);
      result = gemini.result;
      usedFallback = gemini.usedFallback;
    }

    const supabase = createServiceRoleClient();

    // scoreBreakdown 4개 지표(hydration/elasticity/clarity/tone)를 테이블 6개 지표로 매핑.
    // ⚠️ 테이블 규약 = 6개 지표 전부 "높을수록 좋음"(결과 페이지 getStatus ≥71 good 동일 적용) —
    // 과거 100-clarity/100-tone 반전 저장은 단독 분석 경로와 컬럼 의미가 반대였던 버그 (2026-07-09 수리).
    const metrics = {
      hydration: result.scoreBreakdown?.hydration ?? 70,
      oil_level: result.scoreBreakdown?.clarity ?? 70, // 맑음 → 유수분 밸런스 양호 근사
      pores: result.scoreBreakdown?.clarity ?? 70,
      pigmentation: result.scoreBreakdown?.tone ?? 70,
      wrinkles: result.scoreBreakdown?.elasticity ?? 80,
      sensitivity: 70, // 통합 경로엔 민감도 신호 없음 — 중립 근사 (구 20은 "매우 민감"으로 위장)
    };

    // ADR-109 Phase 2C: 통합 저장을 단독 skin 분석과 동일한 깊이로 (성분경고·루틴·추천성분·insight).
    // 대부분 skinType+지표에서 결정론적으로 파생 — 풍부화 실패는 무시하고 기본 저장은 진행(무손실 보강).
    let enrichment: Awaited<ReturnType<typeof buildSkinEnrichment>> | null = null;
    try {
      enrichment = await buildSkinEnrichment(
        supabase,
        clerkUserId,
        result.skinType,
        metrics,
        result.primaryConcerns ?? []
      );
    } catch {
      enrichment = null;
    }

    const { data, error } = await supabase
      .from('skin_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: sessionImageSentinel(sessionId, 'face'),
        skin_type: result.skinType,
        ...metrics,
        overall_score: result.vitalityScore,
        recommendations: {
          version: 2,
          source: 'integrated',
          selfReported: input.questionnaire.skin,
          primaryConcerns: result.primaryConcerns,
          zones: result.zoneAnalysis?.zones,
          usedFallback,
          ...(enrichment?.recommendationExtras ?? {}),
        },
        // 단독 분석과 동일한 상세 저장 필드 (풍부화 성공 시에만)
        ...(enrichment
          ? {
              products: enrichment.products,
              ingredient_warnings: enrichment.ingredient_warnings,
              personal_color_season: enrichment.personal_color_season,
              foundation_recommendation: enrichment.foundation_recommendation,
            }
          : {}),
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: normalizeError('DB_SAVE_FAILED', error, '피부 분석 저장에 실패했어요.'),
      };
    }

    return {
      success: true,
      usedFallback,
      data: {
        id: data?.id as string | undefined,
        skinType: result.skinType,
        overallScore: result.vitalityScore,
        zones: result.zoneAnalysis?.zones as Record<string, unknown> | undefined,
        recommendations: result.primaryConcerns,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeError('UNKNOWN', error, '피부 분석 중 오류가 발생했어요.'),
    };
  }
}

// ============================================
// 3. C-2 Adapter (Body)
// ============================================

export async function runBodyAxis(
  sessionId: string,
  clerkUserId: string,
  input: IntegratedAnalysisInput
): Promise<AxisResult<BodyAxisData>> {
  try {
    // 전신 사진도 없고 자가입력도 없으면 축 실패 (MISSING_INPUT)
    const hasBodyImage = Boolean(input.bodyImageBase64);
    const body = input.questionnaire.body;
    const hasMeasurements =
      body.heightCm !== undefined ||
      body.weightKg !== undefined ||
      body.shoulderWidthCm !== undefined ||
      body.waistCm !== undefined;

    if (!hasBodyImage && !hasMeasurements) {
      return {
        success: false,
        error: {
          code: 'MISSING_INPUT',
          message: 'No body image or self-reported measurements',
          userMessage: '체형 분석을 위해 전신 사진이나 신체 정보가 필요해요.',
          retryable: true,
        },
      };
    }

    // Phase F.3: 전신 사진 있고 FORCE_MOCK 아닐 때만 Gemini 시도
    const mockResult = generateMockBodyAnalysisResult();
    let bodyShape = mockResult.bodyShape;
    let shoulderToWaistRatio = mockResult.bodyRatios?.shoulderToWaistRatio;
    let stylingRecommendations = mockResult.stylingRecommendations;
    const characteristics = mockResult.bodyShapeInfo?.characteristics ?? null;
    let usedFallback = isMockMode();

    // A3: 측정값 우선 — 클라이언트 MediaPipe 측정(measuredBody)이 충분히 신뢰되면
    // Gemini "눈대중 추정"보다 우선 사용한다. (측정 5형 + 측정 비율)
    const measured = input.measuredBody;
    const hasReliableMeasurement = Boolean(measured && measured.confidence >= 0.5);

    // A4: 측정 출처 — measured(MediaPipe 실측) vs estimated(Gemini/Mock 추정). A5 배지 입력.
    let measurementSource: 'measured' | 'estimated' = 'estimated';

    if (measured && hasReliableMeasurement) {
      bodyShape = measured.shape as BodyShapeType;
      if (measured.waistWidth > 0) {
        shoulderToWaistRatio = measured.shoulderWidth / measured.waistWidth;
      }
      usedFallback = false;
      measurementSource = 'measured';
    } else if (!isMockMode() && hasBodyImage && input.bodyImageBase64) {
      const bodyPrior = await getBodyPriorHint(clerkUserId);
      const gemini = await analyzeBodyWithGemini(input.bodyImageBase64, bodyPrior);
      if (gemini.data && !gemini.usedFallback) {
        bodyShape = gemini.data.bodyShape;
        shoulderToWaistRatio = gemini.data.estimatedRatios.shoulderToWaistRatio;
        stylingRecommendations = {
          ...stylingRecommendations,
          tops: gemini.data.stylingRecommendations.tops,
          bottoms: gemini.data.stylingRecommendations.bottoms,
          avoid: gemini.data.stylingRecommendations.avoid,
        } as typeof stylingRecommendations;
      } else {
        usedFallback = true;
      }
    } else if (!hasBodyImage) {
      // 자가입력만 있는 경우 — Mock 기반 추정 (AI 호출 스킵)
      usedFallback = true;
    }

    // ADR-108: 저장/반환 taxonomy = S/W/N(골격). 측정/추정 5형(BodyShapeType)을 S/W/N으로 통일.
    // 옷장 추천(closet/recommend)·cross-module이 S/W/N을 기대하므로 일관성 확보. 표시는 getBodyShapeLabel이 한글화.
    const bodyType3 = bodyShapeToType3(bodyShape);

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('body_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: hasBodyImage
          ? sessionImageSentinel(sessionId, 'body')
          : sessionImageSentinel(sessionId, 'face'), // 자가입력 모드
        height: body.heightCm ?? null,
        weight: body.weightKg ?? null,
        body_type: bodyType3,
        ratio: shoulderToWaistRatio ?? null,
        style_recommendations: stylingRecommendations,
        strengths: characteristics,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: normalizeError('DB_SAVE_FAILED', error, '체형 분석 저장에 실패했어요.'),
      };
    }

    // A4: 측정 출처 + 측정 비율 전체(ADR-110 Tier full)를 best-effort로 기록.
    // 컬럼이 아직 없으면(마이그 전) update가 실패하지만 핵심 저장은 이미 성공했으므로 무시
    // → 배포-마이그 순서에 무관하게 안전.
    if (data?.id) {
      await supabase
        .from('body_analyses')
        .update({
          measurement_source: measurementSource,
          // 신뢰 측정일 때만 축적 — ratio 오버라이드와 동일 게이트 (아바타가 body_ratios를 우선 신뢰)
          body_ratios: hasReliableMeasurement ? (input.measuredBody?.ratios ?? null) : null,
        })
        .eq('id', data.id);
    }

    return {
      success: true,
      usedFallback,
      data: {
        id: data?.id as string | undefined,
        bodyType: bodyType3,
        ratio: shoulderToWaistRatio,
        stylingPrinciples: mockResult.bodyShapeInfo?.stylingTips,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeError('UNKNOWN', error, '체형 분석 중 오류가 발생했어요.'),
    };
  }
}

// ============================================
// 4. H-1 Adapter (Hair)
// ============================================

export async function runHairAxis(
  sessionId: string,
  clerkUserId: string,
  input: IntegratedAnalysisInput
): Promise<AxisResult<HairAxisData>> {
  try {
    // Phase F.3: 얼굴형 판정은 얼굴 셀카에서 Gemini로 추출 가능
    const mockResult = generateMockHairAnalysisResult();
    let faceShape = mockResult.faceShapeAnalysis.faceShape;
    let styleRecommendations = mockResult.styleRecommendations;
    let usedFallback = isMockMode();

    if (!isMockMode()) {
      const hairPrior = await getHairPriorHint(clerkUserId);
      const gemini = await analyzeHairWithGemini(input.faceImageBase64, hairPrior);
      if (gemini.data && !gemini.usedFallback) {
        faceShape = gemini.data.faceShape;
        // Gemini 응답의 hairAnalysis.stylingTips 있으면 사용 (schema에 따라)
        const tips = (gemini.data as Record<string, unknown>).stylingTips;
        if (Array.isArray(tips) && tips.length > 0) {
          styleRecommendations = tips as typeof styleRecommendations;
        }
      } else {
        usedFallback = true;
      }
    }

    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from('hair_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: sessionImageSentinel(sessionId, 'face'),
        face_shape: faceShape,
        hair_type: input.questionnaire.hair.curlType ?? null,
        hair_thickness: input.questionnaire.hair.density ?? null,
        style_recommendations: styleRecommendations,
      })
      .select('id')
      .single();

    if (error) {
      return {
        success: false,
        error: normalizeError('DB_SAVE_FAILED', error, '헤어 분석 저장에 실패했어요.'),
      };
    }

    return {
      success: true,
      usedFallback,
      data: {
        id: data?.id as string | undefined,
        faceShape,
        hairType: input.questionnaire.hair.curlType,
        recommendedStyles: mockResult.styleRecommendations?.map((s) => s.name ?? ''),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeError('UNKNOWN', error, '헤어 분석 중 오류가 발생했어요.'),
    };
  }
}
