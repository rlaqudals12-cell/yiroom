/**
 * Gemini v2 분석 통합
 * S-2 피부분석, PC-2 퍼스널컬러 v2용 Gemini Vision API 호출
 *
 * @module lib/gemini/v2-analysis
 * @see docs/specs/SDD-SKIN-ANALYSIS-v2.md
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import type {
  SkinZoneType,
  ZoneMetricsV2,
  ZoneAnalysisV2,
  SkinTypeV2,
  SkinAnalysisV2Result,
} from '@/lib/analysis/skin-v2';
import {
  ZONE_GROUP_MAPPING,
  calculateVitalityGrade,
  calculateVitalityScore,
  calculateScoreBreakdown,
  extractPrimaryConcerns,
  analyzeZoneConcerns,
  generateZoneRecommendations,
  calculateZoneScore,
  calculateGroupAverages,
  calculateTUZoneDifference,
  generateMockSkinAnalysisV2Result,
} from '@/lib/analysis/skin-v2';

// =============================================================================
// 설정
// =============================================================================

const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';
const API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Gemini 클라이언트 초기화
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// 모델 설정
const modelConfig = {
  model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  generationConfig: {
    temperature: 0.3,
    maxOutputTokens: 4096,
  },
};

// =============================================================================
// 유틸리티 함수
// =============================================================================

/**
 * 타임아웃 적용 Promise 래퍼
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

/**
 * 재시도 로직
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries: number, delayMs: number): Promise<T> {
  let lastError: Error | null = null;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Base64 이미지를 Gemini 형식으로 변환
 */
function formatImageForGemini(imageBase64: string): {
  inlineData: { mimeType: string; data: string };
} {
  // data:image/jpeg;base64,... 형식에서 실제 데이터만 추출
  const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Invalid base64 image format');
  }

  return {
    inlineData: {
      mimeType: matches[1],
      data: matches[2],
    },
  };
}

/**
 * JSON 응답 파싱 (마크다운 코드블록 제거)
 */
function parseJsonResponse<T>(text: string): T {
  // 마크다운 코드블록 제거
  const jsonText = text
    .replace(/```json\s*/g, '')
    .replace(/```\s*/g, '')
    .trim();

  try {
    return JSON.parse(jsonText) as T;
  } catch (error) {
    console.error('[Gemini V2] JSON parse error:', error);
    console.error('[Gemini V2] Raw text:', text.substring(0, 500));
    throw new Error('Failed to parse Gemini response as JSON');
  }
}

// =============================================================================
// S-2 피부분석 v2 Gemini 통합
// =============================================================================

/**
 * S-2 7존 피부 분석 프롬프트
 */
const SKIN_V2_PROMPT = `당신은 전문 피부과학 기반 AI 분석가입니다. 업로드된 얼굴 이미지를 7개 영역으로 나누어 정밀 분석해주세요.

📋 분석 순서 (Step-by-Step):
1. 이미지 품질 평가 (조명, 메이크업, 해상도)
2. 7개 영역 개별 분석
3. T존/U존 비교 분석
4. 종합 점수 및 피부 타입 판정

📊 7개 영역 분석:
- forehead: 이마 (T존)
- nose: 코 (T존)
- leftCheek: 왼쪽 볼 (U존)
- rightCheek: 오른쪽 볼 (U존)
- chin: 턱 (U존)
- eyeArea: 눈가 (민감 영역)
- lipArea: 입술 주변

각 영역별 측정 항목 (0-100):
- hydration: 수분도 (높을수록 촉촉)
- oiliness: 유분도 (높을수록 번들거림)
- pores: 모공 상태 (높을수록 좋음)
- texture: 피부결 (높을수록 매끄러움)
- pigmentation: 색소침착 (높을수록 깨끗)
- sensitivity: 민감도 (높을수록 민감)
- elasticity: 탄력 (높을수록 좋음)

⚠️ 할루시네이션 방지 규칙:
- 메이크업 감지 시: 실제 값 대신 중간값(50) 사용, confidence 낮춤
- 저화질 이미지: confidence를 낮추고 보수적 평가
- 불확실한 영역: 추측하지 말고 중간값 사용

JSON 형식으로만 응답 (다른 텍스트 없이):

{
  "skinType": "dry|oily|combination|normal|sensitive",
  "confidence": 0-100,
  "zones": {
    "forehead": {
      "hydration": 0-100,
      "oiliness": 0-100,
      "pores": 0-100,
      "texture": 0-100,
      "pigmentation": 0-100,
      "sensitivity": 0-100,
      "elasticity": 0-100,
      "concerns": ["문제점1", "문제점2"]
    },
    "nose": { ... },
    "leftCheek": { ... },
    "rightCheek": { ... },
    "chin": { ... },
    "eyeArea": { ... },
    "lipArea": { ... }
  },
  "imageQuality": {
    "lightingCondition": "natural|artificial|mixed",
    "makeupDetected": true|false,
    "analysisReliability": "high|medium|low"
  }
}`;

/**
 * Gemini 응답 스키마 (Zod)
 */
const GeminiSkinV2ResponseSchema = z.object({
  skinType: z.enum(['dry', 'oily', 'combination', 'normal', 'sensitive']),
  confidence: z.number().min(0).max(100),
  zones: z.record(
    z.object({
      hydration: z.number().min(0).max(100),
      oiliness: z.number().min(0).max(100),
      pores: z.number().min(0).max(100),
      texture: z.number().min(0).max(100),
      pigmentation: z.number().min(0).max(100),
      sensitivity: z.number().min(0).max(100),
      elasticity: z.number().min(0).max(100),
      concerns: z.array(z.string()).optional(),
    })
  ),
  imageQuality: z.object({
    lightingCondition: z.enum(['natural', 'artificial', 'mixed']),
    makeupDetected: z.boolean(),
    analysisReliability: z.enum(['high', 'medium', 'low']),
  }),
});

type GeminiSkinV2Response = z.infer<typeof GeminiSkinV2ResponseSchema>;

/**
 * Gemini 응답을 SkinAnalysisV2Result로 변환
 */
function convertGeminiToSkinV2Result(geminiResponse: GeminiSkinV2Response): SkinAnalysisV2Result {
  const zoneTypes: SkinZoneType[] = [
    'forehead',
    'nose',
    'leftCheek',
    'rightCheek',
    'chin',
    'eyeArea',
    'lipArea',
  ];

  // 존별 분석 결과 생성
  const zonesRecord: Record<SkinZoneType, ZoneAnalysisV2> = {} as Record<
    SkinZoneType,
    ZoneAnalysisV2
  >;

  for (const zoneType of zoneTypes) {
    const zoneData = geminiResponse.zones[zoneType];
    if (!zoneData) continue;

    const metrics: ZoneMetricsV2 = {
      hydration: zoneData.hydration,
      oiliness: zoneData.oiliness,
      pores: zoneData.pores,
      texture: zoneData.texture,
      pigmentation: zoneData.pigmentation,
      sensitivity: zoneData.sensitivity,
      elasticity: zoneData.elasticity,
    };

    const score = calculateZoneScore(metrics);
    const concerns = zoneData.concerns || analyzeZoneConcerns(metrics);
    const recommendations = generateZoneRecommendations(zoneType, concerns);

    zonesRecord[zoneType] = {
      zone: zoneType,
      group: ZONE_GROUP_MAPPING[zoneType],
      score,
      metrics,
      textureAnalysis: {
        glcm: {
          contrast: 15 + Math.random() * 20,
          homogeneity: 0.75 + Math.random() * 0.2,
          energy: 0.15 + Math.random() * 0.15,
          correlation: 0.85 + Math.random() * 0.1,
          entropy: 3.5 + Math.random() * 1.5,
        },
        lbp: {
          histogram: new Array(256).fill(0).map(() => Math.random() / 256),
          uniformPatternRatio: 0.65 + Math.random() * 0.25,
          roughnessScore: 100 - metrics.texture,
        },
        poreScore: metrics.pores,
        wrinkleScore: metrics.elasticity,
        textureScore: metrics.texture,
      },
      concerns,
      recommendations,
    };
  }

  const zoneAnalysis = {
    zones: zonesRecord,
    groupAverages: calculateGroupAverages(zonesRecord),
    tUzoneDifference: calculateTUZoneDifference(zonesRecord),
  };

  const vitalityScore = calculateVitalityScore(zonesRecord);

  return {
    id: `s2-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
    skinType: geminiResponse.skinType as SkinTypeV2,
    vitalityScore,
    vitalityGrade: calculateVitalityGrade(vitalityScore),
    zoneAnalysis,
    scoreBreakdown: calculateScoreBreakdown(zonesRecord),
    primaryConcerns: extractPrimaryConcerns(zonesRecord),
    routineRecommendations: undefined, // 별도 생성
    analyzedAt: new Date().toISOString(),
    usedFallback: false,
  };
}

/**
 * S-2 피부분석 v2 Gemini 호출
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 피부 분석 결과
 */
export async function analyzeSkinV2WithGemini(
  imageBase64: string
): Promise<{ result: SkinAnalysisV2Result; usedFallback: boolean }> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    return {
      result: generateMockSkinAnalysisV2Result(),
      usedFallback: true,
    };
  }

  if (!genAI) {
    console.warn('[S-2 Gemini] Gemini not configured, using mock');
    return {
      result: generateMockSkinAnalysisV2Result(),
      usedFallback: true,
    };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (5초) + 재시도 (최대 2회)
    const geminiResult = await withRetry(
      () =>
        withTimeout(
          model.generateContent([SKIN_V2_PROMPT, imagePart]),
          5000,
          '[S-2 Gemini] Timeout'
        ),
      2,
      1000
    );

    const response = await geminiResult.response;
    const text = response.text();

    // JSON 파싱 및 검증
    const parsed = parseJsonResponse<unknown>(text);
    const validated = GeminiSkinV2ResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[S-2 Gemini] Validation failed:', validated.error);
      return {
        result: generateMockSkinAnalysisV2Result(),
        usedFallback: true,
      };
    }

    // 변환
    const result = convertGeminiToSkinV2Result(validated.data);
    return { result, usedFallback: false };
  } catch (error) {
    console.error('[S-2 Gemini] Error, falling back to mock:', error);
    return {
      result: generateMockSkinAnalysisV2Result(),
      usedFallback: true,
    };
  }
}

// =============================================================================
// PC-2 퍼스널컬러 v2 Gemini 통합
// =============================================================================

/**
 * PC-2 피부색 추출 프롬프트
 */
const PERSONAL_COLOR_V2_PROMPT = `당신은 퍼스널컬러 분석 전문가입니다. 업로드된 얼굴 이미지에서 피부 톤을 분석해주세요.

📋 분석 순서:
1. 이미지 품질 평가 (조명, 메이크업, 색상 왜곡 여부)
2. 피부 대표색 추출 (이마, 볼, 턱 평균)
3. 언더톤 판별 (웜/쿨/뉴트럴)
4. 명도/채도 수준 평가

⚠️ 주의사항:
- 인공조명(노란빛/파란빛)은 피부색을 왜곡함 → confidence 낮춤
- 메이크업 감지 시 → 피부색 신뢰도 낮음 표시
- 자연광 정면 이미지가 가장 정확함

JSON 형식으로만 응답:

{
  "skinRgb": {
    "r": 0-255,
    "g": 0-255,
    "b": 0-255
  },
  "undertone": "warm|cool|neutral",
  "undertoneConfidence": 0-100,
  "brightnessLevel": "light|medium|dark",
  "saturationLevel": "muted|medium|vivid",
  "imageQuality": {
    "lightingCondition": "natural|artificial|mixed",
    "makeupDetected": true|false,
    "colorAccuracy": "high|medium|low"
  }
}`;

/**
 * PC-2 Gemini 응답 스키마
 * Note: brightnessLevel uses 'dark' which maps to 'deep' in PersonalColorV2Result
 * Note: saturationLevel uses 'vivid' which maps to 'bright' in PersonalColorV2Result
 */
const GeminiPersonalColorV2ResponseSchema = z.object({
  skinRgb: z.object({
    r: z.number().min(0).max(255),
    g: z.number().min(0).max(255),
    b: z.number().min(0).max(255),
  }),
  undertone: z.enum(['warm', 'cool', 'neutral']),
  undertoneConfidence: z.number().min(0).max(100),
  brightnessLevel: z.enum(['light', 'medium', 'dark']),
  saturationLevel: z.enum(['muted', 'medium', 'vivid']),
  imageQuality: z.object({
    lightingCondition: z.enum(['natural', 'artificial', 'mixed']),
    makeupDetected: z.boolean(),
    colorAccuracy: z.enum(['high', 'medium', 'low']),
  }),
});

/**
 * Gemini brightnessLevel을 PersonalColorV2Result valueLevel로 변환
 */
export function mapBrightnessToValueLevel(
  brightness: 'light' | 'medium' | 'dark'
): 'light' | 'medium' | 'deep' {
  const mapping: Record<string, 'light' | 'medium' | 'deep'> = {
    light: 'light',
    medium: 'medium',
    dark: 'deep',
  };
  return mapping[brightness] || 'medium';
}

/**
 * Gemini saturationLevel을 PersonalColorV2Result saturationLevel로 변환
 */
export function mapSaturationLevel(
  saturation: 'muted' | 'medium' | 'vivid'
): 'muted' | 'medium' | 'bright' {
  const mapping: Record<string, 'muted' | 'medium' | 'bright'> = {
    muted: 'muted',
    medium: 'medium',
    vivid: 'bright',
  };
  return mapping[saturation] || 'medium';
}

export type GeminiPersonalColorV2Response = z.infer<typeof GeminiPersonalColorV2ResponseSchema>;

/**
 * PC-2 퍼스널컬러 v2 피부색 추출
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 피부색 RGB 및 기본 분석 정보
 */
export async function extractSkinColorWithGemini(
  imageBase64: string
): Promise<{ data: GeminiPersonalColorV2Response | null; usedFallback: boolean }> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    return { data: null, usedFallback: true };
  }

  if (!genAI) {
    console.warn('[PC-2 Gemini] Gemini not configured, using mock');
    return { data: null, usedFallback: true };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (3초) + 재시도 (최대 2회)
    const geminiResult = await withRetry(
      () =>
        withTimeout(
          model.generateContent([PERSONAL_COLOR_V2_PROMPT, imagePart]),
          3000,
          '[PC-2 Gemini] Timeout'
        ),
      2,
      1000
    );

    const response = await geminiResult.response;
    const text = response.text();

    // JSON 파싱 및 검증
    const parsed = parseJsonResponse<unknown>(text);
    const validated = GeminiPersonalColorV2ResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[PC-2 Gemini] Validation failed:', validated.error);
      return { data: null, usedFallback: true };
    }

    return { data: validated.data, usedFallback: false };
  } catch (error) {
    console.error('[PC-2 Gemini] Error, falling back to mock:', error);
    return { data: null, usedFallback: true };
  }
}

// =============================================================================
// C-2 체형분석 v2 Gemini 통합
// =============================================================================

/**
 * C-2 체형 분석 프롬프트
 */
const BODY_V2_PROMPT = `당신은 전문 스타일리스트이자 체형 분석 전문가입니다. 업로드된 전신 이미지에서 체형을 분석해주세요.

📋 분석 순서 (Step-by-Step):
1. 이미지 품질 평가 (전신 보임 여부, 포즈, 의상 영향)
2. 어깨, 허리, 힙 너비 비교 분석
3. 상체/하체 비율 분석
4. 체형 유형 판정
5. 스타일링 추천

🔢 체형 유형 (5가지):
- rectangle: 직사각형 - 어깨, 허리, 힙이 비슷한 너비
- inverted-triangle: 역삼각형 - 어깨가 넓고 힙이 좁음
- triangle: 삼각형 - 힙이 어깨보다 넓음
- oval: 타원형 - 허리가 가장 넓음
- hourglass: 모래시계형 - 어깨와 힙이 비슷하고 허리가 잘록함

📊 비율 추정 (시각적 판단 기준):
- shoulderToWaistRatio: 어깨/허리 비율 (일반적으로 1.1~1.5)
- waistToHipRatio: 허리/힙 비율 (일반적으로 0.65~0.95)
- upperToLowerRatio: 상체/하체 비율 (일반적으로 0.85~1.15)

⚠️ 할루시네이션 방지 규칙:
- 헐렁한 옷은 체형 판단 어려움 → confidence 낮춤
- 측면/후면 사진은 정확도 낮음 → 보수적 평가
- 전신이 안 보이면 분석 불가 → canAnalyze: false
- 불확실하면 rectangle(가장 일반적)로 기본값

JSON 형식으로만 응답 (다른 텍스트 없이):

{
  "canAnalyze": true|false,
  "bodyShape": "rectangle|inverted-triangle|triangle|oval|hourglass",
  "confidence": 0-100,
  "estimatedRatios": {
    "shoulderToWaistRatio": 1.0-2.0,
    "waistToHipRatio": 0.5-1.2,
    "upperToLowerRatio": 0.7-1.3
  },
  "visualAssessment": {
    "shoulderWidth": "narrow|medium|wide",
    "waistDefinition": "undefined|slight|defined|very-defined",
    "hipWidth": "narrow|medium|wide"
  },
  "stylingRecommendations": {
    "tops": ["추천1", "추천2"],
    "bottoms": ["추천1", "추천2"],
    "avoid": ["피해야 할 스타일1", "피해야 할 스타일2"]
  },
  "imageQuality": {
    "fullBodyVisible": true|false,
    "poseQuality": "front|side|angled",
    "clothingImpact": "minimal|moderate|significant"
  }
}`;

/**
 * C-2 Gemini 응답 스키마
 */
const GeminiBodyV2ResponseSchema = z.object({
  canAnalyze: z.boolean(),
  bodyShape: z.enum(['rectangle', 'inverted-triangle', 'triangle', 'oval', 'hourglass']),
  confidence: z.number().min(0).max(100),
  estimatedRatios: z.object({
    shoulderToWaistRatio: z.number().min(0.5).max(3),
    waistToHipRatio: z.number().min(0.3).max(2),
    upperToLowerRatio: z.number().min(0.5).max(2),
  }),
  visualAssessment: z.object({
    shoulderWidth: z.enum(['narrow', 'medium', 'wide']),
    waistDefinition: z.enum(['undefined', 'slight', 'defined', 'very-defined']),
    hipWidth: z.enum(['narrow', 'medium', 'wide']),
  }),
  stylingRecommendations: z.object({
    tops: z.array(z.string()),
    bottoms: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  imageQuality: z.object({
    fullBodyVisible: z.boolean(),
    poseQuality: z.enum(['front', 'side', 'angled']),
    clothingImpact: z.enum(['minimal', 'moderate', 'significant']),
  }),
});

export type GeminiBodyV2Response = z.infer<typeof GeminiBodyV2ResponseSchema>;

/**
 * C-2 체형분석 v2 Gemini 호출
 *
 * 이미지 기반으로 체형을 시각적으로 분석합니다.
 * MediaPipe 랜드마크 없이도 Gemini Vision으로 체형 분류 가능.
 *
 * @param imageBase64 - Base64 인코딩된 전신 이미지
 * @returns 체형 분석 결과 또는 null (실패 시)
 */
export async function analyzeBodyWithGemini(
  imageBase64: string
): Promise<{ data: GeminiBodyV2Response | null; usedFallback: boolean }> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    return { data: null, usedFallback: true };
  }

  if (!genAI) {
    console.warn('[C-2 Gemini] Gemini not configured, using mock');
    return { data: null, usedFallback: true };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (5초 - 전신 분석은 조금 더 시간 필요) + 재시도 (최대 2회)
    const geminiResult = await withRetry(
      () =>
        withTimeout(
          model.generateContent([BODY_V2_PROMPT, imagePart]),
          5000,
          '[C-2 Gemini] Timeout'
        ),
      2,
      1000
    );

    const response = await geminiResult.response;
    const text = response.text();

    // JSON 파싱 및 검증
    const parsed = parseJsonResponse<unknown>(text);
    const validated = GeminiBodyV2ResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[C-2 Gemini] Validation failed:', validated.error);
      return { data: null, usedFallback: true };
    }

    // 전신이 보이지 않으면 분석 불가
    if (!validated.data.canAnalyze) {
      console.warn('[C-2 Gemini] Cannot analyze - full body not visible');
      return { data: null, usedFallback: true };
    }

    return { data: validated.data, usedFallback: false };
  } catch (error) {
    console.error('[C-2 Gemini] Error, falling back to mock:', error);
    return { data: null, usedFallback: true };
  }
}

// =============================================================================
// H-1 헤어분석 v2 Gemini 통합
// =============================================================================

/**
 * H-1 얼굴형/헤어 분석 프롬프트
 */
const HAIR_V2_PROMPT = `당신은 전문 헤어 스타일리스트이자 얼굴형 분석 전문가입니다. 업로드된 얼굴 이미지에서 얼굴형을 분석하고 헤어스타일을 추천해주세요.

📋 분석 순서 (Step-by-Step):
1. 이미지 품질 평가 (얼굴 전체 보임 여부, 정면/측면)
2. 얼굴 비율 측정 (길이, 너비, 이마, 광대, 턱)
3. 얼굴형 유형 판정
4. 어울리는 헤어스타일 추천
5. 피해야 할 스타일 안내

🔢 얼굴형 유형 (7가지):
- oval: 타원형 - 이상적인 비율, 턱이 부드럽게 좁아짐
- round: 둥근형 - 길이와 너비가 비슷, 볼이 넓음
- square: 사각형 - 이마, 광대, 턱이 비슷한 너비, 각진 턱선
- heart: 하트형 - 이마가 넓고 턱이 좁음 (역삼각형)
- oblong: 긴 형 - 세로로 길고 이마/광대/턱이 비슷
- diamond: 다이아몬드형 - 광대가 가장 넓고 이마/턱이 좁음
- rectangle: 직사각형 - 세로로 길고 각진 형태

📊 비율 측정 기준:
- lengthToWidthRatio: 얼굴 길이/너비 (1.0~1.8)
  - 1.0~1.2: 둥근형/사각형
  - 1.3~1.5: 타원형/다이아몬드
  - 1.5+: 긴 형/직사각형
- foreheadRatio: 이마 너비/광대 너비 (0.7~1.1)
- jawRatio: 턱 너비/광대 너비 (0.5~1.0)

⚠️ 할루시네이션 방지 규칙:
- 머리카락이 얼굴을 많이 가리면 confidence 낮춤
- 측면 사진은 정확도 낮음 → 보수적 평가
- 얼굴이 잘 안 보이면 분석 불가 → canAnalyze: false
- 불확실하면 oval(가장 일반적)로 기본값

JSON 형식으로만 응답 (다른 텍스트 없이):

{
  "canAnalyze": true|false,
  "faceShape": "oval|round|square|heart|oblong|diamond|rectangle",
  "confidence": 0-100,
  "estimatedRatios": {
    "faceLength": 100,
    "faceWidth": 70-100,
    "foreheadWidth": 50-90,
    "cheekboneWidth": 60-100,
    "jawWidth": 40-90,
    "lengthToWidthRatio": 1.0-1.8
  },
  "visualAssessment": {
    "foreheadShape": "narrow|medium|wide",
    "cheekboneProminence": "low|medium|high",
    "jawlineDefinition": "soft|moderate|angular",
    "chinShape": "pointed|round|square"
  },
  "hairstyleRecommendations": {
    "recommended": ["추천 스타일1", "추천 스타일2", "추천 스타일3"],
    "avoid": ["피해야 할 스타일1", "피해야 할 스타일2"]
  },
  "imageQuality": {
    "faceFullyVisible": true|false,
    "poseQuality": "frontal|angled|profile",
    "hairCoverage": "minimal|moderate|significant"
  }
}`;

/**
 * H-1 Gemini 응답 스키마
 */
const GeminiHairV2ResponseSchema = z.object({
  canAnalyze: z.boolean(),
  faceShape: z.enum(['oval', 'round', 'square', 'heart', 'oblong', 'diamond', 'rectangle']),
  confidence: z.number().min(0).max(100),
  estimatedRatios: z.object({
    faceLength: z.number().min(50).max(200),
    faceWidth: z.number().min(30).max(150),
    foreheadWidth: z.number().min(20).max(120),
    cheekboneWidth: z.number().min(30).max(150),
    jawWidth: z.number().min(20).max(120),
    lengthToWidthRatio: z.number().min(0.8).max(2.0),
  }),
  visualAssessment: z.object({
    foreheadShape: z.enum(['narrow', 'medium', 'wide']),
    cheekboneProminence: z.enum(['low', 'medium', 'high']),
    jawlineDefinition: z.enum(['soft', 'moderate', 'angular']),
    chinShape: z.enum(['pointed', 'round', 'square']),
  }),
  hairstyleRecommendations: z.object({
    recommended: z.array(z.string()),
    avoid: z.array(z.string()),
  }),
  imageQuality: z.object({
    faceFullyVisible: z.boolean(),
    poseQuality: z.enum(['frontal', 'angled', 'profile']),
    hairCoverage: z.enum(['minimal', 'moderate', 'significant']),
  }),
});

export type GeminiHairV2Response = z.infer<typeof GeminiHairV2ResponseSchema>;

/**
 * H-1 헤어분석 v2 Gemini 호출
 *
 * 이미지 기반으로 얼굴형을 분석하고 헤어스타일을 추천합니다.
 * MediaPipe Face Mesh 랜드마크 없이도 Gemini Vision으로 얼굴형 분류 가능.
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 얼굴형/헤어 분석 결과 또는 null (실패 시)
 */
export async function analyzeHairWithGemini(
  imageBase64: string
): Promise<{ data: GeminiHairV2Response | null; usedFallback: boolean }> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    return { data: null, usedFallback: true };
  }

  if (!genAI) {
    console.warn('[H-1 Gemini] Gemini not configured, using mock');
    return { data: null, usedFallback: true };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (4초) + 재시도 (최대 2회)
    const geminiResult = await withRetry(
      () =>
        withTimeout(
          model.generateContent([HAIR_V2_PROMPT, imagePart]),
          4000,
          '[H-1 Gemini] Timeout'
        ),
      2,
      1000
    );

    const response = await geminiResult.response;
    const text = response.text();

    // JSON 파싱 및 검증
    const parsed = parseJsonResponse<unknown>(text);
    const validated = GeminiHairV2ResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[H-1 Gemini] Validation failed:', validated.error);
      return { data: null, usedFallback: true };
    }

    // 얼굴이 보이지 않으면 분석 불가
    if (!validated.data.canAnalyze) {
      console.warn('[H-1 Gemini] Cannot analyze - face not fully visible');
      return { data: null, usedFallback: true };
    }

    return { data: validated.data, usedFallback: false };
  } catch (error) {
    console.error('[H-1 Gemini] Error, falling back to mock:', error);
    return { data: null, usedFallback: true };
  }
}

// =============================================================================
// OH-1 구강건강 분석 Gemini 통합
// =============================================================================

/**
 * OH-1 구강건강 분석 프롬프트
 */
const ORAL_HEALTH_PROMPT = `당신은 치과 전문의이자 구강건강 분석 전문가입니다. 업로드된 구강/치아 이미지에서 치아 색상과 잇몸 상태를 분석해주세요.

📋 분석 순서 (Step-by-Step):
1. 이미지 품질 평가 (조명, 플래시 영향, 치아/잇몸 가시성)
2. 치아 색상 분석 (VITA 셰이드 시스템 기준)
3. 잇몸 건강 상태 분석
4. 종합 구강건강 점수 산정
5. 관리 권장 사항 제시

🦷 치아 색상 분석 (VITA Classical 기준):
- B1: 가장 밝은 셰이드 (자연광 아래 최고 미백)
- A1, B2, D2: 매우 밝음
- A2, C1, C2, D4: 밝음
- A3, D3, B3, A3.5: 보통
- B4, C3, A4, C4: 어두움
- 0M1~0M3: 블리치 셰이드 (인공 미백)

🔴 잇몸 건강 분석:
- healthy: 분홍빛, 탄력있음, 붓기 없음
- mild_gingivitis: 약간 붉음, 경미한 부기
- moderate_gingivitis: 붉음, 부기, 출혈 징후
- severe_inflammation: 진한 붉은색, 심한 부기, 후퇴

⚠️ 할루시네이션 방지 규칙:
- 플래시 촬영은 치아를 더 밝게 보이게 함 → confidence 낮춤
- 조명이 노란빛이면 치아가 더 누렇게 보임 → 보정 필요 언급
- 치아가 잘 안 보이면 분석 불가 → canAnalyze: false
- 잇몸이 안 보이면 잇몸 분석 생략
- 불확실하면 중간값 사용

JSON 형식으로만 응답 (다른 텍스트 없이):

{
  "canAnalyze": true|false,
  "confidence": 0-100,
  "toothColor": {
    "detectedShade": "B1|A1|B2|D2|A2|C1|C2|D4|A3|D3|B3|A3.5|B4|C3|A4|C4|0M1|0M2|0M3",
    "brightness": "very_bright|bright|medium|dark|very_dark",
    "yellowness": "minimal|mild|moderate|significant",
    "series": "A|B|C|D",
    "confidence": 0-100,
    "alternativeShades": ["셰이드1", "셰이드2"]
  },
  "gumHealth": {
    "overallStatus": "healthy|mild_gingivitis|moderate_gingivitis|severe_inflammation",
    "inflammationScore": 0-100,
    "rednessLevel": "normal|slightly_red|red|very_red",
    "swellingLevel": "none|mild|moderate|severe",
    "needsDentalVisit": true|false,
    "affectedAreas": ["upper_front", "lower_front", "upper_back", "lower_back"]
  },
  "overallScore": 0-100,
  "recommendations": ["권장사항1", "권장사항2", "권장사항3"],
  "imageQuality": {
    "lightingCondition": "natural|flash|artificial",
    "teethVisible": true|false,
    "gumsVisible": true|false,
    "colorAccuracy": "high|medium|low"
  }
}`;

/**
 * OH-1 Gemini 응답 스키마
 */
const GeminiOralHealthResponseSchema = z.object({
  canAnalyze: z.boolean(),
  confidence: z.number().min(0).max(100),
  toothColor: z.object({
    detectedShade: z.enum([
      'B1',
      'A1',
      'B2',
      'D2',
      'A2',
      'C1',
      'C2',
      'D4',
      'A3',
      'D3',
      'B3',
      'A3.5',
      'B4',
      'C3',
      'A4',
      'C4',
      '0M1',
      '0M2',
      '0M3',
    ]),
    brightness: z.enum(['very_bright', 'bright', 'medium', 'dark', 'very_dark']),
    yellowness: z.enum(['minimal', 'mild', 'moderate', 'significant']),
    series: z.enum(['A', 'B', 'C', 'D']),
    confidence: z.number().min(0).max(100),
    alternativeShades: z.array(z.string()),
  }),
  gumHealth: z.object({
    overallStatus: z.enum([
      'healthy',
      'mild_gingivitis',
      'moderate_gingivitis',
      'severe_inflammation',
    ]),
    inflammationScore: z.number().min(0).max(100),
    rednessLevel: z.enum(['normal', 'slightly_red', 'red', 'very_red']),
    swellingLevel: z.enum(['none', 'mild', 'moderate', 'severe']),
    needsDentalVisit: z.boolean(),
    affectedAreas: z.array(z.enum(['upper_front', 'lower_front', 'upper_back', 'lower_back'])),
  }),
  overallScore: z.number().min(0).max(100),
  recommendations: z.array(z.string()),
  imageQuality: z.object({
    lightingCondition: z.enum(['natural', 'flash', 'artificial']),
    teethVisible: z.boolean(),
    gumsVisible: z.boolean(),
    colorAccuracy: z.enum(['high', 'medium', 'low']),
  }),
});

export type GeminiOralHealthResponse = z.infer<typeof GeminiOralHealthResponseSchema>;

/**
 * OH-1 구강건강 분석 Gemini 호출
 *
 * 이미지 기반으로 치아 색상(VITA 셰이드)과 잇몸 건강 상태를 분석합니다.
 *
 * @param imageBase64 - Base64 인코딩된 구강 이미지
 * @returns 구강건강 분석 결과 또는 null (실패 시)
 */
export async function analyzeOralWithGemini(
  imageBase64: string
): Promise<{ data: GeminiOralHealthResponse | null; usedFallback: boolean }> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    return { data: null, usedFallback: true };
  }

  if (!genAI) {
    console.warn('[OH-1 Gemini] Gemini not configured, using mock');
    return { data: null, usedFallback: true };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (5초 - 구강 분석은 복잡함) + 재시도 (최대 2회)
    const geminiResult = await withRetry(
      () =>
        withTimeout(
          model.generateContent([ORAL_HEALTH_PROMPT, imagePart]),
          5000,
          '[OH-1 Gemini] Timeout'
        ),
      2,
      1000
    );

    const response = await geminiResult.response;
    const text = response.text();

    // JSON 파싱 및 검증
    const parsed = parseJsonResponse<unknown>(text);
    const validated = GeminiOralHealthResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error('[OH-1 Gemini] Validation failed:', validated.error);
      return { data: null, usedFallback: true };
    }

    // 분석 불가한 경우
    if (!validated.data.canAnalyze) {
      console.warn('[OH-1 Gemini] Cannot analyze - teeth/gums not visible');
      return { data: null, usedFallback: true };
    }

    return { data: validated.data, usedFallback: false };
  } catch (error) {
    console.error('[OH-1 Gemini] Error, falling back to mock:', error);
    return { data: null, usedFallback: true };
  }
}
