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
import {
  generateMockBodyAnalysisResult,
  getBodyShapeInfo,
  getStylingPriorities,
  getStylesToAvoid,
  BODY_SHAPE_INFO,
  type BodyShapeType,
} from '@/lib/analysis/body-v2';
import { bodyShapeToType3 } from '@/lib/body';
import {
  generateMockHairAnalysisResult,
  recommendHairstyles,
  type FaceShapeType,
} from '@/lib/analysis/hair';
import { buildFallbackSeed } from '@/lib/utils/seeded-random';
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
  CaptureConditions,
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

/**
 * PC season/undertone을 DB 저장 규격(대문자 시작)으로 변환.
 *
 * 왜: prod `personal_color_assessments`의 CHECK 제약은 대문자 시작 값만 허용한다
 * (season ∈ {Spring,Summer,Autumn,Winter}, undertone ∈ {Warm,Cool,Neutral}).
 * 그런데 classifyTone·Mock은 소문자('spring'/'warm')를 낸다. 통합 경로는 이 변환이
 * 누락돼 PC INSERT가 100% CHECK 위반(23514)으로 실패 → 세션이 늘 status='partial'이었다.
 * (단독 `/api/analyze/personal-color-v2` route의 mapSeasonToDb/mapUndertoneToDb와 동일 계약.)
 * 반환 AxisData는 소문자를 유지한다 — persona-composer가 소문자 season으로 톤을 판정하기 때문.
 */
function mapSeasonToDb(season: string): string {
  const map: Record<string, string> = {
    spring: 'Spring',
    summer: 'Summer',
    autumn: 'Autumn',
    winter: 'Winter',
  };
  return map[season.toLowerCase()] ?? season;
}

function mapUndertoneToDb(undertone: string): string {
  const map: Record<string, string> = {
    warm: 'Warm',
    cool: 'Cool',
    neutral: 'Neutral',
  };
  return map[undertone.toLowerCase()] ?? undertone;
}

/**
 * 12톤 서브타입을 `season_subtype` 컬럼 표기로 변환.
 *
 * 왜: 컬럼의 정본 어휘는 단독 경로(Gemini 프롬프트)가 쓰는 bright/light/true/mute/deep이다
 * (마이그레이션 20260709_pc_season_subtype.sql 코멘트). 통합 경로의 classifyTone은 'muted'를
 * 내므로 그대로 넣으면 같은 12톤이 'mute'/'muted' 두 값으로 쪼개진다 → 표기를 통일해 저장한다.
 */
function mapSubtypeToDb(subtype: string): string {
  const key = subtype.toLowerCase();
  return key === 'muted' ? 'mute' : key;
}

/**
 * 클라이언트 측정 체형 문자열이 알려진 5형인지 검사.
 *
 * 왜: `measuredBody.shape`는 입력 스키마상 자유 문자열(z.string())이라 구/변조 클라이언트가
 * 미지의 값을 보낼 수 있다. 이제 체형 정보·스타일링을 체형 지식표에서 파생하므로
 * 미지 값을 그대로 쓰면 조회가 비어 축 전체가 실패한다 → 알 수 없으면 측정을 신뢰하지 않는다.
 */
function isKnownBodyShape(shape: string): shape is BodyShapeType {
  return Object.prototype.hasOwnProperty.call(BODY_SHAPE_INFO, shape);
}

// ============================================
// 1. PC-2 Adapter (Personal Color)
// ============================================

export async function runPersonalColorAxis(
  sessionId: string,
  clerkUserId: string,
  input: IntegratedAnalysisInput,
  capture?: CaptureConditions
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
        // DB CHECK 제약은 대문자 시작만 허용 → 저장 직전 변환 (반환 데이터는 소문자 유지)
        season: mapSeasonToDb(classification.season),
        undertone: mapUndertoneToDb(classification.undertone),
        // 12톤 서브타입은 전용 컬럼에도 저장 — 단독 진단지(result page)가 읽는 정본 위치다.
        // image_analysis.subtype만 채우던 시절엔 통합 사용자가 심화 진단지에서 시즌 폴백으로 떨어졌다.
        season_subtype: mapSubtypeToDb(classification.subtype),
        confidence: classification.confidence,
        image_analysis: {
          version: 2,
          source: 'integrated',
          tone: classification.tone,
          subtype: classification.subtype,
          // 퍼스널 대비 실측값(ADR-116) — 클라이언트 실측이 전달됐을 때만 저장(없으면 생략).
          // 단독 PC 경로(image_analysis.contrastLevel)와 동일 키 → 결과/홈 소비 코드 재사용.
          ...(input.measuredContrastLevel ? { contrastLevel: input.measuredContrastLevel } : {}),
          // 촬영 조건 — PC는 색 판정이라 조명(색온도)에 특히 민감하다.
          // 세션 간 웜↔쿨 플립이 관측될 때 원인이 사진인지 모델인지 이 값 없이는 구분 불가.
          ...(capture ? { capture } : {}),
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
  input: IntegratedAnalysisInput,
  capture?: CaptureConditions
): Promise<AxisResult<SkinAxisData>> {
  try {
    // Phase F.3: 실제 Gemini 우선, 실패 시 Mock
    let result: ReturnType<typeof generateMockSkinAnalysisV2Result>;
    let usedFallback: boolean;

    // 폴백 시드: 같은 사용자·같은 얼굴 사진이면 항상 같은 폴백 지표 (재현성 계약)
    const fallbackSeed = buildFallbackSeed(clerkUserId, 'skin', input.faceImageBase64);

    if (isMockMode()) {
      result = generateMockSkinAnalysisV2Result(undefined, fallbackSeed);
      usedFallback = true;
    } else {
      // Level 3: 직전 분석 앵커 주입 (없으면 null → Level 2와 동일)
      const skinPrior = await getSkinPriorHint(clerkUserId);
      // locale 전달 → concerns 등 자유 텍스트가 사용자 언어로 (기본 'ko', 회귀 0)
      // seed 전달 → Gemini 실패 시 내부 Mock 폴백도 같은 사진이면 같은 결과
      const gemini = await analyzeSkinV2WithGemini(
        input.faceImageBase64,
        skinPrior,
        input.options.locale,
        fallbackSeed
      );
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
          // 촬영 조건 — 피부 추이 비교의 전제. 조명·흐림이 다른 두 사진의 점수 차이를
          // "개선/악화"로 표시하면 노이즈를 사실로 파는 셈이 된다(정직성 계약 위반).
          // 단독 경로(`/api/analyze/skin`)가 recommendations.imageQuality에 남기는 것과
          // 같은 층위 — 통합 경로에만 빠져 있어 주 진입점의 조건이 통째로 휘발하고 있었다.
          ...(capture ? { capture } : {}),
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

    // A3: 측정값 우선 — 클라이언트 MediaPipe 측정(measuredBody)이 충분히 신뢰되면
    // Gemini "눈대중 추정"보다 우선 사용한다. (측정 5형 + 측정 비율)
    const measured = input.measuredBody;
    const hasReliableMeasurement = Boolean(measured && measured.confidence >= 0.5);

    // A4: 측정 출처 — measured(MediaPipe 실측) vs estimated(Gemini/Mock 추정). A5 배지 입력.
    let measurementSource: 'measured' | 'estimated' = 'estimated';

    /**
     * 결과는 "실제 신호(측정/AI)"에서만 구성한다.
     *
     * 왜: 예전엔 Mock 결과를 먼저 만들어 놓고 측정/AI 값으로 일부 필드만 덮어썼다.
     * 그러면 덮이지 않은 필드(스타일링·특징·스타일 원칙)는 usedFallback=false인데도
     * 조용히 Mock 값이 나갔다 — 지어낸 데이터가 진짜인 척 표시되는 정직성 위반이다.
     * 이제 Mock은 폴백 경로에서만 만들고, AI가 주지 않는 필드는 판정된 체형에서
     * 결정론적으로 파생한다(정적 지식표 = 단독 /api/analyze/body-v2와 동일 계약).
     */
    let bodyShape: BodyShapeType;
    let shoulderToWaistRatio: number | undefined;
    /** AI가 실제로 준 스타일링 추천만 담는다 (없으면 undefined → 체형 지식표에서 파생) */
    let aiStyling: { tops: string[]; bottoms: string[]; avoid: string[] } | undefined;
    let usedFallback = false;

    // 폴백 시드: 같은 사용자·같은 전신 사진이면 항상 같은 폴백 결과 (재현성 계약)
    const fallbackSeed = buildFallbackSeed(clerkUserId, 'body', input.bodyImageBase64);
    const bodyFallback = (): { shape: BodyShapeType; ratio: number | undefined } => {
      const mock = generateMockBodyAnalysisResult({ seed: fallbackSeed });
      return { shape: mock.bodyShape, ratio: mock.bodyRatios?.shoulderToWaistRatio };
    };

    // 알 수 없는 체형 문자열이면 측정을 신뢰하지 않는다 (isKnownBodyShape 주석 참조)
    if (measured && hasReliableMeasurement && isKnownBodyShape(measured.shape)) {
      bodyShape = measured.shape;
      // 허리 폭이 0이면 비율은 계산 불가 — 지어내지 않고 생략한다
      shoulderToWaistRatio =
        measured.waistWidth > 0 ? measured.shoulderWidth / measured.waistWidth : undefined;
      measurementSource = 'measured';
    } else if (!isMockMode() && hasBodyImage && input.bodyImageBase64) {
      const bodyPrior = await getBodyPriorHint(clerkUserId);
      // locale 전달 → 스타일링 추천 자유 텍스트가 사용자 언어로 (기본 'ko', 회귀 0)
      const gemini = await analyzeBodyWithGemini(
        input.bodyImageBase64,
        bodyPrior,
        input.options.locale
      );
      if (gemini.data && !gemini.usedFallback) {
        bodyShape = gemini.data.bodyShape;
        shoulderToWaistRatio = gemini.data.estimatedRatios.shoulderToWaistRatio;
        aiStyling = gemini.data.stylingRecommendations;
      } else {
        const fb = bodyFallback();
        bodyShape = fb.shape;
        shoulderToWaistRatio = fb.ratio;
        usedFallback = true;
      }
    } else {
      // FORCE_MOCK / 전신 사진 없이 자가입력만 → Mock 추정 (AI 호출 스킵)
      const fb = bodyFallback();
      bodyShape = fb.shape;
      shoulderToWaistRatio = fb.ratio;
      usedFallback = true;
    }

    // 판정된 체형의 정적 지식표(BODY_SHAPE_INFO) — Mock 생성기가 아니라 체형에서 파생.
    // 과거 결함: Mock의 체형 정보를 그대로 썼기 때문에 측정/AI가 '삼각형'이라 해도
    // 저장된 특징·스타일 팁은 Mock이 뽑은 다른 체형(예: 모래시계형)의 것이 나갔다.
    const shapeInfo = getBodyShapeInfo(bodyShape);
    const characteristics = shapeInfo.characteristics;
    // outerwear·silhouettes는 측정에도 AI 응답에도 신호가 없어 저장하지 않는다
    // (예전엔 Mock 상수 '롱 카디건' 등이 실제 추천인 척 저장됐다).
    const stylingRecommendations = {
      tops: aiStyling?.tops ?? shapeInfo.stylingTips.slice(0, 2),
      bottoms:
        aiStyling?.bottoms ??
        getStylingPriorities(bodyShape).filter((s) => s.includes('팬츠') || s.includes('스커트')),
      avoid: aiStyling?.avoid ?? getStylesToAvoid(bodyShape),
    };

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
        // 판정된 체형의 스타일 원칙 — Mock 결과가 아니라 체형에서 파생 (위 shapeInfo와 동일 출처)
        stylingPrinciples: shapeInfo.stylingTips,
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
    /**
     * Phase F.3: 얼굴형 판정은 얼굴 셀카에서 Gemini로 추출.
     *
     * 왜 Mock을 먼저 만들지 않는가: 예전 구조는 Mock 결과를 만들어 두고 AI 값으로
     * faceShape만 덮어썼다. 게다가 스타일 추천을 덮는 분기가 Gemini 응답의
     * `stylingTips`를 봤는데 H-1 스키마엔 그런 필드가 없다(`hairstyleRecommendations`).
     * 결과적으로 AI가 성공해도 저장된 스타일 추천은 100% Mock — usedFallback=false로
     * "AI 결과"인 척 나갔다. 이제 Mock은 폴백 경로에서만 만든다.
     */
    let faceShape: FaceShapeType;
    let usedFallback = false;

    // 폴백 시드: 같은 사용자·같은 얼굴 사진이면 항상 같은 폴백 얼굴형 (재현성 계약)
    const fallbackSeed = buildFallbackSeed(clerkUserId, 'hair', input.faceImageBase64);
    const hairFallbackShape = (): FaceShapeType =>
      generateMockHairAnalysisResult({ seed: fallbackSeed }).faceShapeAnalysis.faceShape;

    if (isMockMode()) {
      faceShape = hairFallbackShape();
      usedFallback = true;
    } else {
      const hairPrior = await getHairPriorHint(clerkUserId);
      // locale 전달 → 스타일 추천 자유 텍스트가 사용자 언어로 (기본 'ko', 회귀 0)
      const gemini = await analyzeHairWithGemini(
        input.faceImageBase64,
        hairPrior,
        input.options.locale
      );
      if (gemini.data && !gemini.usedFallback) {
        faceShape = gemini.data.faceShape;
      } else {
        faceShape = hairFallbackShape();
        usedFallback = true;
      }
    }

    // 스타일 추천은 "판정된 얼굴형"에서 결정론적으로 파생 — 단독 `/api/analyze/hair-v2`와 동일 계약.
    // Gemini의 자유 텍스트 추천(hairstyleRecommendations.recommended)은 suitability·length 메타가
    // 없어 리포트의 어울림 표시 계약을 만족하지 못하므로, 얼굴형 카탈로그 매핑을 정본으로 쓴다.
    const styleRecommendations = recommendHairstyles(faceShape, { maxResults: 5 });

    const supabase = createServiceRoleClient();
    // hair_analyses 스키마 = 단독 `/api/analyze/hair` 계약과 동일:
    //  - hair_type·hair_thickness·scalp_type는 NOT NULL (문진값 없으면 안전 기본값)
    //  - `style_recommendations` 컬럼은 존재하지 않음 → 스타일 추천은 recommendations(jsonb)에 담는다.
    // 왜: 과거엔 없는 컬럼(style_recommendations)을 넣고 NOT NULL scalp_type을 누락해
    // 헤어 INSERT가 100% 실패(PGRST204/23502) → 헤어 축이 늘 partial이었다 (2026-07-12 수리).
    const { data, error } = await supabase
      .from('hair_analyses')
      .insert({
        clerk_user_id: clerkUserId,
        session_id: sessionId,
        image_url: sessionImageSentinel(sessionId, 'face'),
        face_shape: faceShape,
        hair_type: input.questionnaire.hair.curlType ?? 'straight',
        hair_thickness: input.questionnaire.hair.density ?? 'medium',
        scalp_type: 'normal', // 통합 문진엔 두피 항목이 없음 — 중립 기본값
        recommendations: {
          version: 2,
          source: 'integrated',
          styleRecommendations,
          usedFallback,
        },
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
        // 저장한 것과 같은 목록 — 판정된 얼굴형 파생 (예전엔 Mock 결과를 그대로 내보냈다)
        recommendedStyles: styleRecommendations.map((s) => s.name),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: normalizeError('UNKNOWN', error, '헤어 분석 중 오류가 발생했어요.'),
    };
  }
}
