/**
 * 통합 분석 플로우 타입 정의 (5축 병렬 분석)
 *
 * @module lib/analysis/integrated/types
 * @description ADR-099/SDD-INTEGRATED-ANALYSIS — 5축(PC/S/C/H/M) 통합 분석
 * @see docs/adr/ADR-099-integrated-analysis-flow.md
 * @see docs/specs/SDD-INTEGRATED-ANALYSIS.md
 */

import { z } from 'zod';

// ============================================
// 1. 축 코드 (Literal Union)
// ============================================

/** 5축 식별자 */
export const AXIS_CODES = ['personal_color', 'skin', 'body', 'hair', 'makeup'] as const;
export type AxisCode = (typeof AXIS_CODES)[number];

// ============================================
// 2. 입력 스키마 (Zod)
// ============================================

/** S-1 피부 자가입력 */
export const skinQuestionnaireSchema = z
  .object({
    selfReportedType: z
      .enum(['dry', 'oily', 'combination', 'normal', 'sensitive', 'unknown'])
      .default('unknown'),
    concerns: z.array(z.string()).max(5).default([]),
  })
  .default({});

/** H-1 헤어 자가입력 */
export const hairQuestionnaireSchema = z
  .object({
    length: z.enum(['very_short', 'short', 'medium', 'long', 'very_long']).optional(),
    density: z.enum(['thin', 'medium', 'thick']).optional(),
    curlType: z.enum(['straight', 'wavy', 'curly', 'coily']).optional(),
  })
  .default({});

/** C-1 체형 자가입력 (전신 사진 없을 때 최소 입력) */
export const bodyQuestionnaireSchema = z
  .object({
    heightCm: z.number().int().min(100).max(220).optional(),
    weightKg: z.number().int().min(30).max(200).optional(),
    shoulderWidthCm: z.number().int().min(25).max(60).optional(),
    waistCm: z.number().int().min(40).max(150).optional(),
  })
  .default({});

/** 통합 분석 요청 입력 */
export const integratedAnalysisInputSchema = z.object({
  /** 얼굴 셀카 (필수) — PC/S/H 축 공유 */
  faceImageBase64: z
    .string()
    .min(1, '얼굴 사진이 필요해요')
    .refine((val) => val.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),

  /** 전신 사진 (선택) — C 축 전용. 없으면 자가입력 기반 추정 */
  bodyImageBase64: z
    .string()
    .optional()
    .refine((val) => !val || val.startsWith('data:image/'), '올바른 이미지 형식이 아니에요'),

  /** 축별 자가입력 */
  questionnaire: z
    .object({
      skin: skinQuestionnaireSchema,
      hair: hairQuestionnaireSchema,
      body: bodyQuestionnaireSchema,
    })
    .default({}),

  /** 분석 옵션 */
  options: z
    .object({
      locale: z.enum(['ko', 'en', 'ja', 'zh']).default('ko'),
      /** M-1 composer 건너뛰기 (테스트/디버그용) */
      skipMakeup: z.boolean().default(false),
    })
    .default({}),
});

export type IntegratedAnalysisInput = z.infer<typeof integratedAnalysisInputSchema>;
export type SkinQuestionnaire = z.infer<typeof skinQuestionnaireSchema>;
export type HairQuestionnaire = z.infer<typeof hairQuestionnaireSchema>;
export type BodyQuestionnaire = z.infer<typeof bodyQuestionnaireSchema>;

// ============================================
// 3. 축별 에러 타입
// ============================================

/** 축별 실패 원인 코드 */
export type AxisErrorCode =
  | 'AI_TIMEOUT'
  | 'AI_SERVICE_ERROR'
  | 'IMAGE_QUALITY'
  | 'MISSING_INPUT'
  | 'REQUIRES_PC_AND_S' // M-1 전용: PC/S 실패 시
  | 'DB_SAVE_FAILED'
  | 'UNKNOWN';

export interface AxisError {
  code: AxisErrorCode;
  /** 기술 메시지 (로깅용, 영문) */
  message: string;
  /** 사용자 메시지 (UI 표시, 한국어) */
  userMessage: string;
  /** 다시 시도 가능 여부 */
  retryable: boolean;
}

// ============================================
// 4. 축 결과 (Discriminated Union)
// ============================================

/**
 * 개별 축 분석 결과.
 * - success=true: data 접근 가능
 * - success=false: error로 실패 원인 확인
 *
 * @template T - 축별 결과 데이터 타입 (PC/S/C/H/M 각각 다름)
 */
export type AxisResult<T> =
  | { success: true; data: T; usedFallback: boolean }
  | { success: false; error: AxisError };

// ============================================
// 5. 축별 결과 데이터 (느슨 결합)
// ============================================

/**
 * 각 축의 결과 데이터는 통합 관점에서 "JSON 직렬화 가능한 객체"로 취급.
 * 구체 타입은 axis-adapters에서 각 축 공개 API 타입으로 좁힘.
 * 이 방식으로 통합 모듈과 각 축 모듈의 결합도를 최소화 (P8 준수).
 */
export interface PersonalColorAxisData {
  id?: string; // DB 저장 후 ID
  season: string;
  tone: string;
  undertone: string;
  confidence: number;
  palette?: string[];
  [key: string]: unknown;
}

export interface SkinAxisData {
  id?: string;
  skinType: string;
  overallScore: number;
  zones?: Record<string, unknown>;
  recommendations?: string[];
  [key: string]: unknown;
}

export interface BodyAxisData {
  id?: string;
  bodyType: string;
  ratio?: number;
  stylingPrinciples?: string[];
  outfitExamples?: unknown[];
  [key: string]: unknown;
}

export interface HairAxisData {
  id?: string;
  faceShape: string;
  hairType?: string;
  recommendedStyles?: string[];
  [key: string]: unknown;
}

export interface MakeupAxisData {
  id?: string;
  baseRecommendation: string;
  lipPalette?: string[];
  eyeshadowPalette?: string[];
  tutorialSteps?: string[];
  [key: string]: unknown;
}

// ============================================
// 6. 나 프로필 (ADR-104 체크리스트 #1 — "1명의 나로 통합")
// ============================================

/**
 * 5축 결과를 "1명의 온전한 나"로 통합한 내러티브.
 * ADR-098 P1 "5축이 하나의 '나 프로필'로 통합" 비전의 구현체.
 *
 * 생성 방식:
 * - 5축 중 성공한 축 결과를 입력으로 받아
 * - Gemini가 한국어 한 단락 페르소나로 합성
 * - 실패 시 axis 라벨 조합 기반 Mock fallback
 *
 * @see docs/adr/ADR-098-identity-redefinition-5axis-model.md §P1
 * @see docs/adr/ADR-104-yiroom-launch-criteria.md §2.1 체크리스트 #1
 */
export interface PersonaProfile {
  /** 한 문장 페르소나 (예: "봄볕에 피는 꽃 같은 사람") */
  oneLine: string;

  /** 2-4문장 내러티브 (나를 하나의 존재로 설명) */
  narrative: string;

  /** 핵심 인사이트 3개 (축 조합 기반, UI 노출용) */
  keyInsights: string[];

  /** Mock fallback 여부 (AI 호출 실패 시 true) */
  usedFallback: boolean;
}

// ============================================
// 7. 통합 분석 결과
// ============================================

export interface IntegratedAnalysisResult {
  /** 세션 ID (integrated_analysis_sessions.id) */
  sessionId: string;

  /** 전체 세션 상태 */
  status: 'completed' | 'partial' | 'failed';

  /** 5축 결과 */
  axes: {
    personalColor: AxisResult<PersonalColorAxisData>;
    skin: AxisResult<SkinAxisData>;
    body: AxisResult<BodyAxisData>;
    hair: AxisResult<HairAxisData>;
    makeup: AxisResult<MakeupAxisData>;
  };

  /**
   * 나 프로필 — ADR-104 체크리스트 #1.
   * null이면 성공 축이 너무 적어 생성 불가 (최소 PC + S 필요).
   */
  persona: PersonaProfile | null;

  /** 성공한 축 코드 배열 */
  axesCompleted: AxisCode[];

  /** 실패한 축 코드 배열 */
  axesFailed: AxisCode[];

  /** Mock Fallback이 적용된 축 코드 배열 */
  usedFallback: AxisCode[];

  /** ISO 타임스탬프 */
  createdAt: string;
  completedAt: string;
}

// ============================================
// 7. 세션 상태 타입
// ============================================

export type SessionStatus = 'pending' | 'partial' | 'completed' | 'failed';

/** DB 레코드 매핑 (integrated_analysis_sessions) */
export interface IntegratedSessionRow {
  id: string;
  clerk_user_id: string;
  face_image_url: string | null;
  body_image_url: string | null;
  questionnaire: Record<string, unknown>;
  status: SessionStatus;
  axes_completed: AxisCode[];
  axes_failed: AxisCode[];
  used_fallback: AxisCode[];
  /** ADR-104 나 프로필 (JSONB, null 가능) */
  persona: PersonaProfile | null;
  created_at: string;
  completed_at: string | null;
}
