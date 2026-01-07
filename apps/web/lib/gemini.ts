/**
 * Google Gemini AI 클라이언트
 *
 * PC-1 (퍼스널 컬러), S-1 (피부 분석), C-1 (체형 분석) AI 연동을 위한 모듈
 * Week 5: Gemini 3 Pro API 연동 (S-1, C-1)
 * Week 6: PC-1 Real AI 연동
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { buildFoodAnalysisPrompt as buildFoodAnalysisPromptFromModule } from '@/lib/gemini/prompts/foodAnalysis';
import { geminiLogger } from '@/lib/utils/logger';

// Mock Fallback 함수 import
import { generateMockAnalysisResult as generateMockSkinAnalysis } from '@/lib/mock/skin-analysis';
import { generateMockBodyAnalysis3 as generateMockBodyAnalysis } from '@/lib/mock/body-analysis';
import { generateMockPersonalColorResult } from '@/lib/mock/personal-color';
import {
  generateMockWorkoutAnalysis,
  generateMockExerciseRecommendation,
  generateMockWorkoutInsights,
} from '@/lib/mock/workout-analysis';
import { generateMockFoodAnalysis, generateMockMealSuggestion } from '@/lib/mock/food-analysis';
import {
  generateMockHairAnalysisResult,
  type HairAnalysisResult as MockHairAnalysisResult,
} from '@/lib/mock/hair-analysis';
import {
  generateMockMakeupAnalysisResult,
  type MakeupAnalysisResult as MockMakeupAnalysisResult,
} from '@/lib/mock/makeup-analysis';

// Mock 모드 환경변수
const FORCE_MOCK = process.env.FORCE_MOCK_AI === 'true';

// API 키 검증
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
if (!apiKey) {
  geminiLogger.warn('GOOGLE_GENERATIVE_AI_API_KEY is not set');
}

// Gemini 클라이언트 초기화
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// 안전 설정 (이미지 분석용)
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
  },
];

// 모델 설정 (환경변수로 오버라이드 가능)
// 2025-12-22: Gemini 3 Flash로 업그레이드 (무료 티어 + 성능 향상)
const modelConfig = {
  model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
  safetySettings,
};

/**
 * S-1 피부 분석 결과 타입
 */
export interface GeminiSkinAnalysisResult {
  overallScore: number;
  skinType: 'dry' | 'normal' | 'oily' | 'combination';
  skinTypeLabel: string;
  sensitivityLevel: 'low' | 'medium' | 'high';
  metrics: Array<{
    id: string;
    name: string;
    value: number;
    status: 'good' | 'normal' | 'warning';
    description: string;
  }>;
  concernAreas: string[];
  insight: string;
  recommendedIngredients: Array<{
    name: string;
    reason: string;
    efficacy?: string;
  }>;
  avoidIngredients?: Array<{
    name: string;
    reason: string;
  }>;
  // 이미지 품질 정보
  imageQuality?: {
    lightingCondition: 'natural' | 'artificial' | 'mixed';
    makeupDetected: boolean;
    analysisReliability: 'high' | 'medium' | 'low';
  };
  // 분석 근거 (신뢰성 리포트용)
  analysisEvidence?: {
    tZoneOiliness: 'dry' | 'normal' | 'oily' | 'very_oily';
    uZoneHydration: 'dehydrated' | 'normal' | 'well_hydrated';
    poreVisibility: 'minimal' | 'visible' | 'enlarged' | 'very_enlarged';
    skinTexture: 'smooth' | 'slightly_rough' | 'rough' | 'very_rough';
    rednessLevel: 'none' | 'slight' | 'moderate' | 'severe';
    pigmentationPattern: 'even' | 'slight_spots' | 'moderate_spots' | 'severe_spots';
    wrinkleDepth: 'none' | 'fine_lines' | 'moderate' | 'deep';
    elasticityObservation: 'firm' | 'slightly_loose' | 'loose' | 'very_loose';
  };
  // 다각도 분석 메타데이터
  multiAngleMeta?: {
    imagesAnalyzed: {
      front: boolean;
      left: boolean;
      right: boolean;
    };
    asymmetryDetected: boolean;
    asymmetryDetails?: string;
  };
}

/**
 * C-1 체형 분석 결과 타입 (3타입 골격진단 시스템)
 * - S: 스트레이트 (Straight) - 상체 볼륨, 입체적, 직선적
 * - W: 웨이브 (Wave) - 하체 볼륨, 곡선적, 부드러운
 * - N: 내추럴 (Natural) - 골격감, 프레임 큼, 자연스러운
 */
export interface GeminiBodyAnalysisResult {
  bodyType: 'S' | 'W' | 'N';
  bodyTypeLabel: string;
  bodyTypeLabelEn: string;
  bodyTypeDescription: string;
  characteristics: string;
  confidence: number;
  matchedFeatures: number; // 5개 중 일치한 특징 개수
  keywords: string[];
  measurements: Array<{
    name: string;
    value: number;
    description: string;
  }>;
  strengths: string[];
  avoidStyles: string[];
  insight: string;
  styleRecommendations: Array<{
    item: string;
    reason: string;
  }>;
  // 분석 근거 (신뢰성 리포트용)
  analysisEvidence?: {
    shoulderLine: 'angular' | 'rounded' | 'wide' | 'narrow';
    waistDefinition: 'defined' | 'straight' | 'natural';
    hipLine: 'curved' | 'straight' | 'wide';
    boneStructure: 'small' | 'medium' | 'large';
    muscleAttachment: 'easy' | 'moderate' | 'difficult';
    upperLowerBalance: 'upper_dominant' | 'balanced' | 'lower_dominant';
    silhouette: 'I' | 'S' | 'X' | 'H' | 'Y';
  };
  // 이미지 품질 정보
  imageQuality?: {
    angle: 'front' | 'side' | 'angled';
    poseNatural: boolean;
    clothingFit: 'fitted' | 'loose' | 'oversized';
    analysisReliability: 'high' | 'medium' | 'low';
  };
}

/**
 * W-1 운동 타입 분석 결과 타입
 */
export interface GeminiWorkoutAnalysisResult {
  workoutType: 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';
  workoutTypeLabel: string;
  workoutTypeDescription: string;
  confidence: number;
  reason: string;
  bodyTypeAdvice: string;
  goalAdvice: string;
  cautionAdvice?: string;
  recommendedExercises: Array<{
    name: string;
    category: string;
    reason: string;
  }>;
  weeklyPlanSuggestion: {
    workoutDays: number;
    focusAreas: string[];
    intensity: 'low' | 'medium' | 'high';
  };
}

/**
 * W-1 운동 추천 결과 타입 (Task 3.3)
 * 운동 DB 기반 상세 운동 추천
 */
export interface GeminiExerciseRecommendationResult {
  dailyExercises: Array<{
    exerciseId: string;
    reason: string;
    sets: number;
    reps: number;
    restSeconds: number;
    weight?: {
      male: number;
      female: number;
      unit: 'kg' | 'bodyweight';
    };
    duration?: number; // 유산소용 (분)
    priority: number; // 1=필수, 2=권장, 3=선택
  }>;
  warmupExercises: string[]; // 워밍업 운동 ID들
  cooldownExercises: string[]; // 쿨다운 운동 ID들
  focusBodyParts: string[];
  estimatedMinutes: number;
  estimatedCalories: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  aiTips: string[];
}

/**
 * W-1 운동 추천 입력 타입
 */
export interface WorkoutAnalysisInput {
  bodyType?: string;
  bodyProportions?: {
    shoulder: number;
    waist: number;
    hip: number;
  };
  goals: string[];
  concerns: string[];
  frequency: string;
  location: string;
  equipment: string[];
  injuries?: string[];
  targetWeight?: number;
  currentWeight?: number;
  height?: number;
  age?: number;
  gender?: string;
}

/**
 * PC-1 퍼스널 컬러 분석 결과 타입
 */
export interface GeminiPersonalColorResult {
  seasonType: 'spring' | 'summer' | 'autumn' | 'winter';
  seasonLabel: string;
  seasonDescription: string;
  tone: 'warm' | 'cool';
  depth: 'light' | 'deep';
  confidence: number;
  // 분석 근거 (신뢰성 리포트용)
  analysisEvidence?: {
    veinColor: 'blue' | 'purple' | 'green' | 'olive' | 'mixed' | 'unknown';
    veinScore: number; // 0-100 쿨톤 확률
    skinUndertone: 'yellow' | 'pink' | 'olive' | 'neutral';
    skinHairContrast: 'low' | 'medium' | 'high' | 'very_high';
    eyeColor: 'light_brown' | 'brown' | 'dark_brown' | 'black';
    lipNaturalColor: 'coral' | 'pink' | 'neutral';
  };
  // 이미지 품질 정보
  imageQuality?: {
    lightingCondition: 'natural' | 'artificial' | 'mixed';
    makeupDetected: boolean;
    wristImageProvided: boolean;
    analysisReliability: 'high' | 'medium' | 'low';
  };
  bestColors: Array<{
    hex: string;
    name: string;
  }>;
  worstColors: Array<{
    hex: string;
    name: string;
  }>;
  lipstickRecommendations: Array<{
    colorName: string;
    hex: string;
    brandExample?: string;
  }>;
  clothingRecommendations: Array<{
    item: string;
    colorSuggestion: string;
    reason: string;
  }>;
  styleDescription: {
    imageKeywords: string[];
    makeupStyle: string;
    fashionStyle: string;
    accessories: string;
  };
  insight: string;
}

/**
 * Base64 이미지를 Gemini 형식으로 변환
 */
function formatImageForGemini(base64Image: string): {
  inlineData: { mimeType: string; data: string };
} {
  // data:image/jpeg;base64, 형식에서 실제 데이터만 추출
  const base64Data = base64Image.includes('base64,')
    ? base64Image.split('base64,')[1]
    : base64Image;

  // MIME 타입 추출 (기본값: jpeg)
  let mimeType = 'image/jpeg';
  if (base64Image.includes('data:')) {
    const match = base64Image.match(/data:([^;]+);/);
    if (match) {
      mimeType = match[1];
    }
  }

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * S-1 피부 분석 프롬프트 (고도화 v2)
 * Fitzpatrick/Baumann 피부타입 참조, 과학적 분석 기준 적용
 */
const SKIN_ANALYSIS_PROMPT = `당신은 전문 피부과학 기반 AI 분석가입니다. 업로드된 얼굴 이미지를 분석하여 피부 상태를 평가해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 조명 상태: 자연광/인공광 구분 → 인공광은 피부톤을 왜곡할 수 있음
2. 메이크업 여부: 베이스 메이크업이 있으면 실제 피부 상태 파악 어려움
3. 이미지 해상도: 저해상도는 세부 분석 정확도 저하

📋 분석 순서 (Step-by-Step):
1. 먼저 이미지 품질(조명, 메이크업, 해상도)을 평가하세요.
2. T존(이마/코/턱)의 유분과 모공 상태를 분석하세요.
3. U존(볼/눈가)의 수분과 주름 상태를 분석하세요.
4. 전체 피부 톤, 색소침착, 트러블을 평가하세요.
5. 종합 점수와 피부 타입을 판정하세요.
6. 맞춤 인사이트와 추천 성분을 도출하세요.

⚠️ 할루시네이션 방지 규칙:
- 저화질 이미지: analysisReliability를 "low"로 설정
- 메이크업 감지 시: wrinkles, pores 점수는 신뢰도 낮음 표시
- 불확실한 지표: 추측하지 말고 "normal" 점수 + 신뢰도 낮춤

📊 과학적 분석 기준:

[수분도 hydration]
- 피부 표면의 촉촉함, 각질 상태, 건조 주름 유무
- 입가/눈가 건조선, 볼 당김 정도 확인
- 건성: 0-40, 중성: 41-70, 지성: 71-100 (수분 많음)

[유분도 oil]
- T존(이마, 코, 턱) 번들거림 정도
- 모공 내 피지 산화(블랙헤드) 유무
- 건성: 0-30, 중성: 31-60, 지성: 61-100

[모공 pores]
- 코 주변, 볼 모공 크기와 분포
- 확장된 모공 개수와 깊이
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

[주름 wrinkles]
- 눈가 잔주름, 이마 주름, 팔자주름
- 표정주름 vs 노화주름 구분
- 연령대별 상대 평가 (20대 기준 높은 점수)

[탄력 elasticity]
- 볼 처짐, 턱선 정의, 피부 팽팽함
- 얼굴 윤곽선 선명도
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

[색소침착 pigmentation]
- 기미, 잡티, 다크서클, 과색소침착
- 멜라닌 침착 범위와 농도
- 깨끗: 71-100, 약간: 41-70, 많음: 0-40

[트러블 trouble]
- 여드름(화이트헤드/블랙헤드/염증성)
- 홍조, 민감성 발적
- 깨끗: 71-100, 약간: 41-70, 많음: 0-40

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "overallScore": [0-100 사이 종합 점수],
  "skinType": "[dry|normal|oily|combination]",
  "skinTypeLabel": "[건성|중성|지성|복합성]",
  "sensitivityLevel": "[low|medium|high]",
  "estimatedAgeRange": "[20대 초반|20대 후반|30대 초반|30대 후반|40대 이상]",
  "metrics": [
    {"id": "hydration", "name": "수분도", "value": [0-100], "status": "good|normal|warning", "description": "[피부 수분 상태 설명]"},
    {"id": "oil", "name": "유분도", "value": [0-100], "status": "good|normal|warning", "description": "[피지 분비 상태 설명]"},
    {"id": "pores", "name": "모공", "value": [0-100], "status": "good|normal|warning", "description": "[모공 상태 설명]"},
    {"id": "wrinkles", "name": "주름", "value": [0-100], "status": "good|normal|warning", "description": "[주름 상태 설명]"},
    {"id": "elasticity", "name": "탄력", "value": [0-100], "status": "good|normal|warning", "description": "[탄력 상태 설명]"},
    {"id": "pigmentation", "name": "색소침착", "value": [0-100], "status": "good|normal|warning", "description": "[색소침착 상태 설명]"},
    {"id": "trouble", "name": "트러블", "value": [0-100], "status": "good|normal|warning", "description": "[트러블 상태 설명]"}
  ],
  "concernAreas": ["[주요 고민 부위1]", "[주요 고민 부위2]"],
  "insight": "[피부 상태에 대한 맞춤 인사이트 1-2문장]",
  "recommendedIngredients": [
    {"name": "[성분명]", "reason": "[추천 이유]", "efficacy": "[기대 효과]"},
    {"name": "[성분명]", "reason": "[추천 이유]", "efficacy": "[기대 효과]"},
    {"name": "[성분명]", "reason": "[추천 이유]", "efficacy": "[기대 효과]"}
  ],
  "avoidIngredients": [
    {"name": "[성분명]", "reason": "[피해야 할 이유]"}
  ],
  "imageQuality": {
    "lightingCondition": "[natural|artificial|mixed]",
    "makeupDetected": [true|false],
    "analysisReliability": "[high|medium|low]"
  },
  "analysisEvidence": {
    "tZoneOiliness": "[dry|normal|oily|very_oily] T존(이마/코) 유분 상태",
    "uZoneHydration": "[dehydrated|normal|well_hydrated] U존(볼/턱) 수분 상태",
    "poreVisibility": "[minimal|visible|enlarged|very_enlarged] 모공 가시성",
    "skinTexture": "[smooth|slightly_rough|rough|very_rough] 피부 결",
    "rednessLevel": "[none|slight|moderate|severe] 홍조/발적 정도",
    "pigmentationPattern": "[even|slight_spots|moderate_spots|severe_spots] 색소침착 패턴",
    "wrinkleDepth": "[none|fine_lines|moderate|deep] 주름 깊이",
    "elasticityObservation": "[firm|slightly_loose|loose|very_loose] 탄력 관찰"
  }
}

점수 기준:
- 71-100: good (좋음)
- 41-70: normal (보통)
- 0-40: warning (주의)

추천 성분 예시:
- 건성: 히알루론산, 세라마이드, 스쿠알란
- 지성: 나이아신아마이드, 살리실산, 티트리
- 색소침착: 비타민C, 아르부틴, 트라넥삼산
- 노화: 레티놀, 펩타이드, 아데노신
- 민감성: 판테놀, 센텔라, 알란토인`;

/**
 * C-1 체형 분석 프롬프트 (고도화 v2)
 * 일본 골격진단 + Kibbe 체형 시스템 참조, 정밀 골격 분석
 */
const BODY_ANALYSIS_PROMPT = `당신은 전문 체형 분석 AI입니다. 업로드된 전신 이미지를 분석하여 골격 타입을 진단해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 촬영 각도: 정면 촬영 필수 (측면/기울어진 각도는 왜곡됨)
2. 의류 영향: 오버핏/루즈핏은 실제 체형 파악 어려움
3. 포즈: 자연스러운 서있는 자세 (손 올림/허리 꺾기는 비율 왜곡)

📊 3타입 골격진단 시스템 (정밀 기준):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
S (스트레이트/Straight) - 입체적이고 탄탄한 실루엣
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[핵심 특징 - 5개 중 4개 이상 해당 시 S타입]
□ 상체에 볼륨감이 있고 근육이 잘 붙음 (특히 가슴/어깨)
□ 어깨선이 직선적이고 각진 느낌
□ 허리 위치가 높고 상체가 길어 보임
□ 목이 짧거나 보통, 쇄골이 잘 안 보이거나 수평
□ 손목/발목이 둥글고 굵은 편

[체형 비율]
- 어깨 ≥ 골반 (상체 우세)
- 허리 라인이 잘록하지 않음 (직선적)
- 전체적으로 I자 실루엣

[스타일 키워드]
심플, 베이직, I라인, 정장, 깔끔, 미니멀

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
W (웨이브/Wave) - 부드럽고 여성스러운 실루엣
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[핵심 특징 - 5개 중 4개 이상 해당 시 W타입]
□ 하체에 볼륨감이 있음 (특히 힙/허벅지)
□ 어깨선이 둥글고 부드러운 느낌
□ 허리가 잘록하고 곡선미가 있음
□ 목이 길고 쇄골이 가늘게 두드러짐
□ 손목/발목이 가늘고 뼈가 작음

[체형 비율]
- 골반 > 어깨 (하체 우세)
- 허리 라인이 잘록함 (S자/X자)
- 전체적으로 부드러운 곡선 실루엣

[스타일 키워드]
페미닌, X라인, 하이웨이스트, 프릴, 러플, 소프트

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
N (내추럴/Natural) - 자연스럽고 골격감 있는 실루엣
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[핵심 특징 - 5개 중 4개 이상 해당 시 N타입]
□ 뼈대가 크고 프레임이 넓음
□ 어깨가 넓고 각지거나 살짝 처진 느낌
□ 쇄골이 굵고 두드러지게 보임
□ 관절(손목, 손가락, 무릎)이 크고 두드러짐
□ 전체적으로 마르거나 살이 쪄도 뼈대감이 느껴짐

[체형 비율]
- 어깨 ≈ 골반 (균형 또는 어깨 우세)
- 허리 라인이 길고 자연스러움
- 전체적으로 H자 또는 Y자 실루엣

[스타일 키워드]
캐주얼, 오버핏, 레이어드, 내추럴, 릴렉스드

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ 판정 원칙:
1. 뼈대/골격 위주로 판단 (살이 쪄도 뼈대 타입은 변하지 않음)
2. 의류에 가려진 부분은 보이는 부분으로 유추
3. 5개 특징 중 4개 이상 일치해야 확정 판정
4. 3개 이하 일치 시 → 가장 많이 일치하는 타입 + 낮은 신뢰도

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "bodyType": "[S|W|N]",
  "bodyTypeLabel": "[스트레이트|웨이브|내추럴]",
  "bodyTypeLabelEn": "[Straight|Wave|Natural]",
  "bodyTypeDescription": "[체형 한줄 설명]",
  "characteristics": "[체형의 구체적인 특징 설명 2-3문장]",
  "confidence": [70-95 신뢰도 - 특징 일치도에 따라],
  "matchedFeatures": [일치한 핵심 특징 개수 1-5],
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "measurements": [
    {"name": "어깨", "value": [0-100 상대적 넓이 지수], "description": "[어깨 라인 설명]"},
    {"name": "허리", "value": [0-100 상대적 넓이 지수], "description": "[허리 라인 설명]"},
    {"name": "골반", "value": [0-100 상대적 넓이 지수], "description": "[골반 라인 설명]"}
  ],
  "silhouette": "[I|S|X|H|Y]",
  "upperLowerBalance": "[상체우세|균형|하체우세]",
  "strengths": ["[강점1]", "[강점2]", "[강점3]", "[강점4]"],
  "avoidStyles": ["[피해야 할 스타일1]", "[피해야 할 스타일2]", "[피해야 할 스타일3]"],
  "insight": "[체형에 맞는 스타일링 인사이트 1-2문장]",
  "styleRecommendations": [
    {"item": "[추천 아이템1]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템2]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템3]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템4]", "reason": "[추천 이유]"}
  ],
  "analysisEvidence": {
    "shoulderLine": "[angular|rounded|wide|narrow]",
    "waistDefinition": "[defined|straight|natural]",
    "hipLine": "[curved|straight|wide]",
    "boneStructure": "[small|medium|large]",
    "muscleAttachment": "[easy|moderate|difficult]",
    "upperLowerBalance": "[upper_dominant|balanced|lower_dominant]",
    "silhouette": "[I|S|X|H|Y]"
  },
  "imageQuality": {
    "angle": "[front|side|angled]",
    "poseNatural": [true|false],
    "clothingFit": "[fitted|loose|oversized]",
    "analysisReliability": "[high|medium|low]"
  }
}

측정값은 상대적 비율 지수입니다 (0-100).
신뢰도 기준: 5개 일치=95%, 4개=85%, 3개=75%, 2개 이하=70%`;

/**
 * PC-1 퍼스널 컬러 분석 프롬프트 (고도화 v2)
 * 12시즌 시스템 + 과학적 색채 분석 기반
 * 얼굴 이미지와 손목 이미지를 통합 분석
 */
const PERSONAL_COLOR_ANALYSIS_PROMPT = `당신은 전문 퍼스널 컬러 분석 AI입니다. 과학적 색채 이론과 한국인 피부 특성을 기반으로 정밀 분석합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 최우선 판정 기준: 손목 혈관 색상
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
손목 이미지가 제공된 경우, 혈관 색상이 웜/쿨을 결정합니다:
✅ 파란색/보라색 혈관 → 무조건 쿨톤 (summer 또는 winter)
✅ 녹색/올리브색 혈관 → 무조건 웜톤 (spring 또는 autumn)

⚠️ 중요: 피부색이 노랗게 보여도, 혈관이 파란색이면 쿨톤입니다!
⚠️ 조명 왜곡: 실내 조명은 피부를 노랗게 만들지만, 혈관색은 변하지 않습니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 4시즌 + 12서브톤 시스템
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[SPRING 봄 웜톤] - 밝고 화사한 웜톤
├─ Spring Bright: 선명하고 생기있는 (고채도, 고명도)
├─ Spring Light: 밝고 맑은 (저채도, 고명도)
└─ Spring True: 따뜻하고 화사한 (중채도, 중명도)
특징: 황금빛 광채, 복숭아빛 피부, 밝은 갈색 눈동자
베스트: 코랄, 살구색, 밝은 오렌지, 아이보리

[SUMMER 여름 쿨톤] - 부드럽고 우아한 쿨톤 ⭐한국인 쿨톤 대다수
├─ Summer Light: 밝고 소프트한 (저채도, 고명도)
├─ Summer Mute: 회색끼 도는 뮤트한 (저채도, 중명도)
└─ Summer True: 시원하고 청순한 (중채도, 중명도)
특징: 핑크빛 피부, 부드러운 갈색/회갈색 눈, 낮은 대비
베스트: 라벤더, 민트, 파우더핑크, 스카이블루, 로즈

[AUTUMN 가을 웜톤] - 깊고 풍부한 웜톤
├─ Autumn Deep: 깊고 진한 (고채도, 저명도)
├─ Autumn Mute: 차분하고 내추럴한 (저채도, 중명도)
└─ Autumn True: 따뜻하고 풍부한 (중채도, 중명도)
특징: 올리브/베이지 피부, 진한 갈색 눈, 따뜻한 깊이감
베스트: 버건디, 테라코타, 카키, 머스타드, 브라운

[WINTER 겨울 쿨톤] - 선명하고 시크한 쿨톤 ⚠️매우 드문 타입
├─ Winter Bright: 선명하고 비비드한 (고채도, 고명도)
├─ Winter Deep: 깊고 강렬한 (고채도, 저명도)
└─ Winter True: 차갑고 또렷한 (고채도, 중명도)
특징: 새하얀/차가운 피부, 새까만 눈동자/머리, 높은 대비
베스트: 블랙, 퓨어화이트, 로열블루, 버건디, 퓨시아

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 절대 판정 규칙 (반드시 따를 것)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 규칙 1: 손목 혈관이 파란색/보라색이면 → 무조건 쿨톤
   - 피부가 노랗게 보여도 쿨톤
   - 조명이 따뜻해 보여도 쿨톤
   - 다른 증거와 상관없이 쿨톤

🔴 규칙 2: 손목 혈관이 녹색이면 → 무조건 웜톤

🔴 규칙 3: 쿨톤 확정 후 여름/겨울 구분
   - 기본값: summer (여름 쿨톤)
   - winter는 아래 조건 모두 충족 시에만:
     □ 피부가 새하얗고 차가움
     □ 머리카락이 순수한 블랙
     □ 눈동자가 새까만 검정
     □ 피부-머리 대비가 극도로 높음
   - 조건 미충족 시 반드시 summer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 조명 왜곡 보정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- 실내 조명(형광등, 백열등, LED)은 피부를 노랗게 왜곡
- 하지만 혈관 색상은 조명에 영향받지 않음
- 피부색 판단보다 혈관색 판단을 우선시 할 것!

[조명 보정 예시]
- 피부가 노란색 + 혈관이 파란색 → 쿨톤 (조명 왜곡)
- 피부가 노란색 + 혈관이 녹색 → 웜톤 (실제 웜톤)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "seasonType": "[spring|summer|autumn|winter]",
  "seasonLabel": "[봄 웜톤|여름 쿨톤|가을 웜톤|겨울 쿨톤]",
  "seasonSubtype": "[bright|light|true|mute|deep]",
  "seasonDescription": "[해당 계절 타입에 대한 설명]",
  "tone": "[warm|cool]",
  "depth": "[light|medium|deep]",
  "chroma": "[bright|muted]",
  "confidence": [70-95 사이의 신뢰도 점수],
  "analysisEvidence": {
    "veinColor": "[blue|purple|green|olive|mixed|unknown]",
    "veinScore": [0-100 쿨톤 확률],
    "skinUndertone": "[yellow|pink|olive|neutral]",
    "skinHairContrast": "[low|medium|high|very_high]",
    "eyeColor": "[light_brown|brown|dark_brown|black]",
    "lipNaturalColor": "[coral|pink|neutral]"
  },
  "bestColors": [
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"}
  ],
  "worstColors": [
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"},
    {"hex": "#XXXXXX", "name": "[컬러명]"}
  ],
  "lipstickRecommendations": [
    {"colorName": "[립 컬러명]", "hex": "#XXXXXX", "brandExample": "[추천 브랜드/제품]"},
    {"colorName": "[립 컬러명]", "hex": "#XXXXXX", "brandExample": "[추천 브랜드/제품]"},
    {"colorName": "[립 컬러명]", "hex": "#XXXXXX", "brandExample": "[추천 브랜드/제품]"}
  ],
  "clothingRecommendations": [
    {"item": "[의류 아이템]", "colorSuggestion": "[추천 컬러]", "reason": "[추천 이유]"},
    {"item": "[의류 아이템]", "colorSuggestion": "[추천 컬러]", "reason": "[추천 이유]"},
    {"item": "[의류 아이템]", "colorSuggestion": "[추천 컬러]", "reason": "[추천 이유]"}
  ],
  "styleDescription": {
    "imageKeywords": ["[이미지 키워드1]", "[이미지 키워드2]", "[이미지 키워드3]", "[이미지 키워드4]", "[이미지 키워드5]"],
    "makeupStyle": "[해당 시즌에 어울리는 메이크업 스타일 설명]",
    "fashionStyle": "[해당 시즌에 어울리는 패션 스타일 설명]",
    "accessories": "[해당 시즌에 어울리는 액세서리 설명]"
  },
  "imageQuality": {
    "lightingCondition": "[natural|artificial|mixed]",
    "makeupDetected": [true|false],
    "wristImageProvided": [true|false],
    "analysisReliability": "[high|medium|low]"
  },
  "insight": "[이 분석 결과에 대한 맞춤 인사이트 1-2문장]"
}

신뢰도 기준:
- 손목 이미지 + 자연광 + 노메이크업: 90-95%
- 손목 이미지 + 인공광: 80-90%
- 얼굴만 + 자연광: 75-85%
- 얼굴만 + 인공광/메이크업: 70-80%

베스트 컬러 10개, 워스트 컬러 5개, 립/의류 추천 각 3개
한국어로 자연스럽게 작성`;

/**
 * W-1 운동 타입 분석 프롬프트 빌더
 */
function buildWorkoutAnalysisPrompt(input: WorkoutAnalysisInput): string {
  // 목표 라벨 매핑
  const goalLabels: Record<string, string> = {
    weight_loss: '체중 감량',
    strength: '근력 강화',
    endurance: '체력 향상',
    stress: '스트레스 해소',
    posture: '체형 교정',
  };

  // 고민 라벨 매핑
  const concernLabels: Record<string, string> = {
    belly: '뱃살',
    thigh: '허벅지',
    arm: '팔뚝',
    back: '등살',
    hip: '힙업',
    calf: '종아리',
    shoulder: '어깨',
    overall: '전체적인 체중',
  };

  // 빈도 라벨 매핑
  const frequencyLabels: Record<string, string> = {
    '1-2': '주 1-2회',
    '3-4': '주 3-4회',
    '5-6': '주 5-6회',
    daily: '매일',
  };

  // 장소 라벨 매핑
  const locationLabels: Record<string, string> = {
    home: '집',
    gym: '헬스장',
    outdoor: '야외',
  };

  const goalsText = input.goals.map((g) => goalLabels[g] || g).join(', ');
  const concernsText = input.concerns.map((c) => concernLabels[c] || c).join(', ');
  const frequencyText = frequencyLabels[input.frequency] || input.frequency;
  const locationText = locationLabels[input.location] || input.location;
  const equipmentText = input.equipment.join(', ') || '없음';
  const injuriesText = input.injuries?.length ? input.injuries.join(', ') : '없음';

  let bodyInfo = '';
  if (input.bodyType) {
    bodyInfo = `체형: ${input.bodyType}형`;
    if (input.bodyProportions) {
      bodyInfo += ` (어깨: ${input.bodyProportions.shoulder}, 허리: ${input.bodyProportions.waist}, 골반: ${input.bodyProportions.hip})`;
    }
  }

  let physicalInfo = '';
  if (input.height || input.currentWeight) {
    const parts = [];
    if (input.height) parts.push(`키: ${input.height}cm`);
    if (input.currentWeight) parts.push(`체중: ${input.currentWeight}kg`);
    if (input.targetWeight) parts.push(`목표 체중: ${input.targetWeight}kg`);
    if (input.age) parts.push(`나이: ${input.age}세`);
    if (input.gender) parts.push(`성별: ${input.gender === 'female' ? '여성' : '남성'}`);
    physicalInfo = parts.join(', ');
  }

  return `당신은 전문 피트니스 트레이너이자 운동 처방 전문가입니다. 사용자의 신체 정보와 운동 목표를 분석하여 최적의 운동 타입을 추천해주세요.

## 사용자 정보

${bodyInfo ? `- ${bodyInfo}` : ''}
${physicalInfo ? `- ${physicalInfo}` : ''}
- 운동 목표: ${goalsText}
- 신체 고민 부위: ${concernsText}
- 운동 빈도: ${frequencyText}
- 운동 장소: ${locationText}
- 사용 가능 장비: ${equipmentText}
- 부상/통증 부위: ${injuriesText}

## 5가지 운동 타입

1. **토너 (TONER)**: 근육 탄력과 라인 만들기에 집중. 적당한 강도의 저항 운동과 필라테스 위주.
2. **빌더 (BUILDER)**: 근육량 증가와 근력 강화에 집중. 웨이트 트레이닝 중심.
3. **버너 (BURNER)**: 체지방 연소와 체중 감량에 집중. 고강도 유산소와 HIIT 위주.
4. **무버 (MOVER)**: 체력 향상과 심폐 기능 강화에 집중. 유산소 운동과 기능성 운동.
5. **플렉서 (FLEXER)**: 유연성과 균형감각 향상에 집중. 요가, 스트레칭, 코어 운동.

## 📋 분석 순서 (Step-by-Step)

1. 먼저 사용자의 신체 정보(체형, 체중, 나이)를 분석하세요.
2. 운동 제약조건(부상 부위, 빈도, 장비, 장소)을 파악하세요.
3. 운동 목표와 고민 부위를 5가지 타입에 매핑하세요.
4. 제약조건에 맞는 최적 타입을 선택하세요.
5. 신뢰도와 추천 운동을 도출하세요.

## ⚠️ 우선순위 규칙

- **부상 부위 > 운동 목표**: 부상이 있으면 해당 부위 회피가 최우선
- **장비/장소 제약 > 이상적 운동**: 현실적으로 가능한 운동 추천
- **불확실한 경우**: confidence를 70-75%로 낮추고 보수적 추천

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "workoutType": "[toner|builder|burner|mover|flexer]",
  "workoutTypeLabel": "[토너|빌더|버너|무버|플렉서]",
  "workoutTypeDescription": "[해당 타입에 대한 1-2문장 설명]",
  "confidence": [70-95 사이의 신뢰도],
  "reason": "[이 타입을 추천하는 이유 2-3문장]",
  "bodyTypeAdvice": "[체형 기반 운동 조언 1-2문장]",
  "goalAdvice": "[목표 달성을 위한 구체적 조언 1-2문장]",
  "cautionAdvice": "[부상 부위가 있다면 주의사항, 없으면 null]",
  "recommendedExercises": [
    {"name": "[운동명]", "category": "[upper|lower|core|cardio]", "reason": "[추천 이유]"},
    {"name": "[운동명]", "category": "[upper|lower|core|cardio]", "reason": "[추천 이유]"},
    {"name": "[운동명]", "category": "[upper|lower|core|cardio]", "reason": "[추천 이유]"},
    {"name": "[운동명]", "category": "[upper|lower|core|cardio]", "reason": "[추천 이유]"},
    {"name": "[운동명]", "category": "[upper|lower|core|cardio]", "reason": "[추천 이유]"}
  ],
  "weeklyPlanSuggestion": {
    "workoutDays": [주간 운동 일수],
    "focusAreas": ["[집중 부위1]", "[집중 부위2]"],
    "intensity": "[low|medium|high]"
  }
}

## 주의사항

- 사용자의 운동 빈도와 장소, 장비를 고려하여 현실적인 추천을 해주세요.
- 부상 부위가 있다면 해당 부위에 무리가 가는 운동은 피하고 대안을 제시해주세요.
- 추천 운동은 사용 가능한 장비와 장소에 맞춰 선정해주세요.
- 한국어로 자연스럽게 작성해주세요.`;
}

/**
 * JSON 응답 파싱 헬퍼
 */
function parseJsonResponse<T>(text: string): T {
  // JSON 코드 블록 제거
  let cleanText = text.trim();
  if (cleanText.startsWith('```json')) {
    cleanText = cleanText.slice(7);
  }
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.slice(3);
  }
  if (cleanText.endsWith('```')) {
    cleanText = cleanText.slice(0, -3);
  }
  cleanText = cleanText.trim();

  return JSON.parse(cleanText) as T;
}

/**
 * S-1 피부 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 피부 분석 결과
 */
export async function analyzeSkin(imageBase64: string): Promise<GeminiSkinAnalysisResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[S-1] Using mock (FORCE_MOCK_AI=true)');
    return generateMockSkinAnalysis() as unknown as GeminiSkinAnalysisResult;
  }

  if (!genAI) {
    geminiLogger.warn('[S-1] Gemini not configured, using mock');
    return generateMockSkinAnalysis() as unknown as GeminiSkinAnalysisResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([SKIN_ANALYSIS_PROMPT, imagePart]),
          3000,
          '[S-1] Gemini timeout'
        ),
      2,
      1000
    );
    const response = await result.response;
    const text = response.text();

    geminiLogger.info('[S-1] Gemini analysis completed');
    return parseJsonResponse<GeminiSkinAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[S-1] Gemini error, falling back to mock:', error);
    return generateMockSkinAnalysis() as unknown as GeminiSkinAnalysisResult;
  }
}

/**
 * C-1 체형 분석 실행 (다각도 지원)
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param frontImageBase64 - Base64 인코딩된 정면 이미지 (필수)
 * @param sideImageBase64 - Base64 인코딩된 측면 이미지 (선택)
 * @param backImageBase64 - Base64 인코딩된 후면 이미지 (선택)
 * @returns 체형 분석 결과
 */
export async function analyzeBody(
  frontImageBase64: string,
  sideImageBase64?: string,
  backImageBase64?: string
): Promise<GeminiBodyAnalysisResult> {
  // 다각도 분석 여부
  const hasMultiAngle = !!(sideImageBase64 || backImageBase64);
  const imageCount = 1 + (sideImageBase64 ? 1 : 0) + (backImageBase64 ? 1 : 0);
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[C-1] Using mock (FORCE_MOCK_AI=true)');
    return generateMockBodyAnalysis() as unknown as GeminiBodyAnalysisResult;
  }

  if (!genAI) {
    geminiLogger.warn('[C-1] Gemini not configured, using mock');
    return generateMockBodyAnalysis() as unknown as GeminiBodyAnalysisResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // 이미지 배열 구성
    const contentParts: (string | { inlineData: { mimeType: string; data: string } })[] = [];

    // 프롬프트 구성 (다각도 분석 안내 추가)
    let prompt = BODY_ANALYSIS_PROMPT;

    if (hasMultiAngle) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다각도 이미지 분석 (${imageCount}장 제공)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
여러 각도의 이미지가 제공되었습니다:
- 정면: 어깨/허리/골반 비율, 전체 실루엣 판단의 기준
${sideImageBase64 ? '- 측면: 자세 정렬, 복부 돌출도, 엉덩이 곡선 분석' : ''}
${backImageBase64 ? '- 후면: 어깨뼈 대칭, 허리 곡선, 척추 정렬 분석' : ''}

[다각도 분석 규칙]
✅ 정면에서 판단하기 어려운 부분은 측면/후면으로 보완
✅ 측면에서 복부 돌출도와 자세 정렬을 정확히 파악
✅ 다각도 분석으로 신뢰도 향상 (confidence +10~15%)
✅ imageQuality.analysisReliability를 "high"로 설정`;
    }

    contentParts.push(prompt);

    // 정면 이미지 추가
    contentParts.push(formatImageForGemini(frontImageBase64));

    // 측면 이미지 추가
    if (sideImageBase64) {
      contentParts.push(formatImageForGemini(sideImageBase64));
    }

    // 후면 이미지 추가
    if (backImageBase64) {
      contentParts.push(formatImageForGemini(backImageBase64));
    }

    geminiLogger.info(`[C-1] Starting analysis with ${imageCount} image(s)`);

    // 타임아웃 (다각도는 10초, 단일은 3초) + 재시도 (최대 2회) 적용
    const timeoutMs = hasMultiAngle ? 10000 : 3000;
    const result = await withRetry(
      () => withTimeout(model.generateContent(contentParts), timeoutMs, '[C-1] Gemini timeout'),
      2,
      1000
    );
    const response = result.response;
    const text = response.text();

    geminiLogger.info('[C-1] Gemini analysis completed');
    return parseJsonResponse<GeminiBodyAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[C-1] Gemini error, falling back to mock:', error);
    return generateMockBodyAnalysis() as unknown as GeminiBodyAnalysisResult;
  }
}

/**
 * PC-1 다각도 이미지 입력 인터페이스
 * @description 정면(필수) + 좌/우(선택) 다각도 이미지 지원
 */
export interface PersonalColorMultiAngleInput {
  /** 정면 이미지 (필수) */
  frontImageBase64: string;
  /** 좌측 이미지 (선택) */
  leftImageBase64?: string;
  /** 우측 이미지 (선택) */
  rightImageBase64?: string;
  /** 손목 이미지 (선택) - 웜/쿨 판단 정확도 향상 */
  wristImageBase64?: string;
}

/**
 * PC-1 퍼스널 컬러 분석 (다각도 지원)
 * - 정면 이미지 필수, 좌/우측 이미지 선택
 * - 다각도 분석 시 신뢰도 향상 (95% vs 80%)
 * - 하위 호환성: 기존 2파라미터 시그니처 유지
 *
 * @param faceImageBase64 - 정면 얼굴 이미지 또는 MultiAngleInput 객체
 * @param wristImageBase64 - 손목 이미지 (선택, 하위 호환용)
 * @returns 퍼스널 컬러 분석 결과
 */
export async function analyzePersonalColor(
  faceImageBase64: string | PersonalColorMultiAngleInput,
  wristImageBase64?: string
): Promise<GeminiPersonalColorResult> {
  // 입력 정규화: 다각도 객체 또는 단일 이미지
  let input: PersonalColorMultiAngleInput;

  if (typeof faceImageBase64 === 'string') {
    // 하위 호환: 단일 이미지
    input = {
      frontImageBase64: faceImageBase64,
      wristImageBase64,
    };
  } else {
    // 다각도 입력
    input = faceImageBase64;
  }

  // 다각도 분석 여부
  const hasMultiAngle = !!(input.leftImageBase64 || input.rightImageBase64);
  const imageCount = 1 + (input.leftImageBase64 ? 1 : 0) + (input.rightImageBase64 ? 1 : 0);

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[PC-1] Using mock (FORCE_MOCK_AI=true)');
    const mockResult = generateMockPersonalColorResult() as unknown as GeminiPersonalColorResult;
    // 다각도 분석 시 신뢰도 향상
    if (hasMultiAngle && mockResult.imageQuality) {
      mockResult.imageQuality.analysisReliability = 'high';
    }
    return mockResult;
  }

  if (!genAI) {
    geminiLogger.warn('[PC-1] Gemini not configured, using mock');
    return generateMockPersonalColorResult() as unknown as GeminiPersonalColorResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // 이미지 배열 구성
    const contentParts: (string | { inlineData: { mimeType: string; data: string } })[] = [];

    // 프롬프트 구성 (다각도 분석 안내 추가)
    let prompt = PERSONAL_COLOR_ANALYSIS_PROMPT;

    if (hasMultiAngle) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다각도 이미지 분석 (${imageCount}장 제공)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
여러 각도의 이미지가 제공되었습니다:
- 정면: 전체적인 피부톤, 언더톤 판단의 기준
${input.leftImageBase64 ? '- 좌측: 측면 피부색, 볼 색조 분석' : ''}
${input.rightImageBase64 ? '- 우측: 측면 피부색, 볼 색조 분석 (좌우 비교)' : ''}

[다각도 분석 규칙]
✅ 좌우 피부톤이 다를 경우, 더 자연스러운 쪽 기준으로 판단
✅ 조명 영향이 적은 각도 우선 고려
✅ 다각도 분석으로 신뢰도 향상 (analysisReliability: high)`;
    }

    contentParts.push(prompt);

    // 정면 이미지 추가
    contentParts.push(formatImageForGemini(input.frontImageBase64));

    // 좌측 이미지 추가
    if (input.leftImageBase64) {
      contentParts.push(formatImageForGemini(input.leftImageBase64));
    }

    // 우측 이미지 추가
    if (input.rightImageBase64) {
      contentParts.push(formatImageForGemini(input.rightImageBase64));
    }

    // 손목 이미지가 있으면 추가
    if (input.wristImageBase64) {
      contentParts.push(formatImageForGemini(input.wristImageBase64));
      // 프롬프트 업데이트
      const wristNote = `\n\n첨부된 ${hasMultiAngle ? '마지막' : '두 번째'} 이미지는 손목 안쪽 사진입니다. 혈관 색상을 분석하여 웜톤/쿨톤 판단에 활용해주세요. 파란색/보라색 혈관은 쿨톤, 녹색 혈관은 웜톤을 나타냅니다.`;
      contentParts[0] = prompt + wristNote;
    }

    geminiLogger.info(
      `[PC-1] Starting analysis with ${imageCount} face image(s)${input.wristImageBase64 ? ' + wrist' : ''}`
    );

    // 타임아웃 (15초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(contentParts), 15000, '[PC-1] Gemini timeout'),
      2,
      1000
    );
    const response = result.response;
    const text = response.text();

    geminiLogger.info('[PC-1] Gemini analysis completed');
    return parseJsonResponse<GeminiPersonalColorResult>(text);
  } catch (error) {
    geminiLogger.error('[PC-1] Gemini error, falling back to mock:', error);
    return generateMockPersonalColorResult() as unknown as GeminiPersonalColorResult;
  }
}

/**
 * 타임아웃이 있는 Promise 래퍼
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage = 'Request timeout'
): Promise<T> {
  let timeoutId: NodeJS.Timeout;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(errorMessage));
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timeoutId!);
    return result;
  } catch (error) {
    clearTimeout(timeoutId!);
    throw error;
  }
}

/**
 * 재시도 로직이 포함된 함수 실행
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2, delayMs = 1000): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      geminiLogger.warn(`Attempt ${attempt + 1}/${maxRetries + 1} failed:`, lastError.message);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

/**
 * W-1 운동 타입 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 운동 분석 입력 데이터
 * @returns 운동 타입 분석 결과
 */
export async function analyzeWorkout(
  input: WorkoutAnalysisInput
): Promise<GeminiWorkoutAnalysisResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[W-1] Using mock (FORCE_MOCK_AI=true)');
    return generateMockWorkoutAnalysis(input) as unknown as GeminiWorkoutAnalysisResult;
  }

  if (!genAI) {
    geminiLogger.warn('[W-1] Gemini not configured, using mock');
    return generateMockWorkoutAnalysis(input) as unknown as GeminiWorkoutAnalysisResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildWorkoutAnalysisPrompt(input);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(prompt), 3000, '[W-1] Gemini timeout'),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[W-1] Gemini analysis completed');
    return parseJsonResponse<GeminiWorkoutAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[W-1] Gemini error, falling back to mock:', error);
    return generateMockWorkoutAnalysis(input) as unknown as GeminiWorkoutAnalysisResult;
  }
}

/**
 * W-1 AI 인사이트 결과 타입 (Task 4.1)
 */
export interface GeminiWorkoutInsightResult {
  insights: Array<{
    type: 'balance' | 'progress' | 'streak' | 'comparison' | 'tip';
    message: string;
    priority: 'high' | 'medium' | 'low';
    data?: {
      percentage?: number;
      trend?: 'up' | 'down' | 'stable';
      targetArea?: string;
    };
  }>;
  weeklyHighlight: string;
  motivationalMessage: string;
}

/**
 * W-1 AI 인사이트 입력 타입 (Task 4.1)
 */
export interface WorkoutInsightInput {
  // 운동 기록 요약
  workoutLogs: Array<{
    date: string;
    exerciseCount: number;
    totalVolume: number; // 세트 x 횟수 x 무게
    bodyParts: string[];
    duration: number; // 분
    caloriesBurned: number;
  }>;
  // 이전 주 비교 데이터
  previousWeekStats?: {
    totalVolume: number;
    totalSessions: number;
    averageDuration: number;
  };
  // 현재 주 데이터
  currentWeekStats: {
    totalVolume: number;
    totalSessions: number;
    averageDuration: number;
  };
  // 사용자 통계
  userStats: {
    currentStreak: number;
    longestStreak: number;
    totalWorkouts: number;
    workoutType: string;
  };
  // 또래 비교 (선택)
  peerComparison?: {
    ageGroup: string;
    averageSessions: number;
    userPercentile?: number;
  };
  // 부위별 운동 비율
  bodyPartDistribution: {
    upper: number; // 0-1 비율
    lower: number;
    core: number;
    cardio: number;
  };
  // 사용자 정보
  userName?: string;
  goals?: string[];
}

/**
 * W-1 운동 추천 입력 타입 (Task 3.3)
 */
export interface ExerciseRecommendationInput {
  workoutType: 'toner' | 'builder' | 'burner' | 'mover' | 'flexer';
  bodyType?: string;
  goals: string[];
  concerns: string[]; // 집중할 부위
  injuries?: string[]; // 피해야 할 부상 부위
  equipment: string[];
  location: 'home' | 'gym' | 'outdoor';
  availableExercises: Array<{
    id: string;
    name: string;
    category: string;
    bodyParts: string[];
    equipment: string[];
    difficulty: string;
    met: number;
  }>;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  sessionMinutes?: number; // 목표 운동 시간 (기본 30분)
  userWeight?: number; // 체중 (칼로리 계산용)
}

/**
 * W-1 운동 추천 AI 프롬프트 빌더 (Task 3.3)
 */
function buildExerciseRecommendationPrompt(input: ExerciseRecommendationInput): string {
  const workoutTypeLabels: Record<string, string> = {
    toner: '토너 (근육 탄력/라인)',
    builder: '빌더 (근육량 증가)',
    burner: '버너 (체지방 연소)',
    mover: '무버 (체력 향상)',
    flexer: '플렉서 (유연성)',
  };

  const concernLabels: Record<string, string> = {
    belly: '복부',
    thigh: '허벅지',
    arm: '팔',
    back: '등',
    hip: '엉덩이',
    calf: '종아리',
    shoulder: '어깨',
    chest: '가슴',
    overall: '전신',
  };

  const injuryLabels: Record<string, string> = {
    neck: '목',
    shoulder: '어깨',
    back: '허리',
    knee: '무릎',
    ankle: '발목',
    wrist: '손목',
  };

  const workoutTypeText = workoutTypeLabels[input.workoutType] || input.workoutType;
  const concernsText = input.concerns.map((c) => concernLabels[c] || c).join(', ');
  const injuriesText = input.injuries?.length
    ? input.injuries.map((i) => injuryLabels[i] || i).join(', ')
    : '없음';
  const equipmentText = input.equipment.length > 0 ? input.equipment.join(', ') : '맨몸';
  const sessionMinutes = input.sessionMinutes || 30;
  const userLevel = input.userLevel || 'beginner';

  // 사용 가능한 운동 목록을 JSON 형식으로 변환
  const exerciseListJson = JSON.stringify(
    input.availableExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      category: ex.category,
      bodyParts: ex.bodyParts,
      equipment: ex.equipment,
      difficulty: ex.difficulty,
    })),
    null,
    2
  );

  return `당신은 전문 피트니스 트레이너입니다. 사용자의 운동 타입과 조건에 맞춰 아래 운동 DB에서 최적의 운동을 선별하여 오늘의 운동 루틴을 구성해주세요.

## 사용자 정보

- 운동 타입: ${workoutTypeText}
- 체형: ${input.bodyType || '미지정'}
- 목표: ${input.goals.join(', ')}
- 집중 부위: ${concernsText || '전신'}
- 부상/통증 부위: ${injuriesText}
- 사용 가능 장비: ${equipmentText}
- 운동 장소: ${input.location === 'home' ? '집' : input.location === 'gym' ? '헬스장' : '야외'}
- 운동 레벨: ${userLevel === 'beginner' ? '초급' : userLevel === 'intermediate' ? '중급' : '고급'}
- 목표 운동 시간: ${sessionMinutes}분

## 운동 타입별 추천 원칙

- 토너: 중강도 저항 운동 + 코어 강화, 15-20회 고반복
- 빌더: 고중량 웨이트 트레이닝, 8-12회 중반복
- 버너: 고강도 유산소 + HIIT, 짧은 휴식
- 무버: 유산소 + 기능성 운동, 중강도 지속
- 플렉서: 스트레칭 + 요가 + 코어, 저강도 장시간

## 사용 가능한 운동 DB

\`\`\`json
${exerciseListJson}
\`\`\`

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "dailyExercises": [
    {
      "exerciseId": "[위 DB의 id 값]",
      "reason": "[이 운동을 선택한 이유 1문장]",
      "sets": [세트 수 2-5],
      "reps": [반복 횟수 8-20],
      "restSeconds": [세트 간 휴식 30-90],
      "weight": { "male": [남성 권장 무게 kg], "female": [여성 권장 무게 kg], "unit": "kg" },
      "duration": [유산소 운동시 분 단위, 없으면 null],
      "priority": [1=필수, 2=권장, 3=선택]
    }
  ],
  "warmupExercises": ["[워밍업용 운동 id 2-3개]"],
  "cooldownExercises": ["[쿨다운용 운동 id 1-2개]"],
  "focusBodyParts": ["[오늘 집중 부위]"],
  "estimatedMinutes": [예상 총 소요시간],
  "estimatedCalories": [예상 칼로리 소모 (체중 ${input.userWeight || 60}kg 기준)],
  "difficultyLevel": "[beginner|intermediate|advanced]",
  "aiTips": ["[오늘 운동 팁 2-3개]"]
}

## 주의사항

1. **반드시 위 운동 DB에 있는 id만 사용하세요.** DB에 없는 운동은 추천하지 마세요.
2. 부상 부위(${injuriesText})가 있다면 해당 부위에 부담이 가는 운동은 제외하세요.
3. 사용 가능한 장비(${equipmentText})에 맞는 운동만 선택하세요.
4. 운동 레벨에 맞는 난이도의 운동을 선택하세요.
5. 총 운동 시간이 ${sessionMinutes}분 내외가 되도록 구성하세요.
6. 메인 운동 3-5개, 워밍업 2-3개, 쿨다운 1-2개를 추천하세요.
7. weight 필드는 웨이트 운동에만 포함하고, 맨몸 운동은 "unit": "bodyweight"로 표시하세요.
8. 한국어로 자연스럽게 작성해주세요.`;
}

/**
 * W-1 운동 추천 실행 (Task 3.3)
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 운동 추천 입력 데이터
 * @returns 상세 운동 추천 결과
 */
export async function recommendExercises(
  input: ExerciseRecommendationInput
): Promise<GeminiExerciseRecommendationResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[W-1] Using mock for exercise recommendation (FORCE_MOCK_AI=true)');
    return generateMockExerciseRecommendation(
      input
    ) as unknown as GeminiExerciseRecommendationResult;
  }

  if (!genAI) {
    geminiLogger.warn('[W-1] Gemini not configured, using mock');
    return generateMockExerciseRecommendation(
      input
    ) as unknown as GeminiExerciseRecommendationResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildExerciseRecommendationPrompt(input);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(prompt), 3000, '[W-1] Gemini timeout'),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[W-1] Exercise recommendation completed');
    return parseJsonResponse<GeminiExerciseRecommendationResult>(text);
  } catch (error) {
    geminiLogger.error('[W-1] Gemini error, falling back to mock:', error);
    return generateMockExerciseRecommendation(
      input
    ) as unknown as GeminiExerciseRecommendationResult;
  }
}

/**
 * W-1 AI 인사이트 생성 프롬프트 빌더 (Task 4.1)
 */
function buildWorkoutInsightPrompt(input: WorkoutInsightInput): string {
  const workoutTypeLabels: Record<string, string> = {
    toner: '토너',
    builder: '빌더',
    burner: '버너',
    mover: '무버',
    flexer: '플렉서',
  };

  const goalLabels: Record<string, string> = {
    weight_loss: '체중 감량',
    strength: '근력 강화',
    endurance: '체력 향상',
    stress: '스트레스 해소',
    posture: '체형 교정',
  };

  // 운동 기록 요약 (최근 7일)
  const recentLogs = input.workoutLogs.slice(-7);
  const recentLogsJson = JSON.stringify(
    recentLogs.map((log) => ({
      date: log.date,
      exercises: log.exerciseCount,
      volume: log.totalVolume,
      parts: log.bodyParts,
      minutes: log.duration,
      calories: log.caloriesBurned,
    })),
    null,
    2
  );

  // 부위 균형 분석
  const { upper, lower, core, cardio } = input.bodyPartDistribution;
  const balanceText = `상체: ${(upper * 100).toFixed(0)}%, 하체: ${(lower * 100).toFixed(0)}%, 코어: ${(core * 100).toFixed(0)}%, 유산소: ${(cardio * 100).toFixed(0)}%`;

  // 볼륨 변화 계산
  let volumeChangeText = '이전 데이터 없음';
  if (input.previousWeekStats) {
    const volumeChange =
      input.previousWeekStats.totalVolume > 0
        ? ((input.currentWeekStats.totalVolume - input.previousWeekStats.totalVolume) /
            input.previousWeekStats.totalVolume) *
          100
        : 0;
    volumeChangeText = `${volumeChange >= 0 ? '+' : ''}${volumeChange.toFixed(1)}% (이전 주 대비)`;
  }

  // 또래 비교 텍스트
  let peerComparisonText = '비교 데이터 없음';
  if (input.peerComparison) {
    peerComparisonText = `${input.peerComparison.ageGroup} 평균: 주 ${input.peerComparison.averageSessions}회`;
    if (input.peerComparison.userPercentile) {
      peerComparisonText += `, 상위 ${100 - input.peerComparison.userPercentile}%`;
    }
  }

  // 목표 텍스트
  const goalsText = input.goals?.map((g) => goalLabels[g] || g).join(', ') || '미설정';

  return `당신은 친근하고 동기부여를 잘하는 피트니스 코치입니다. 사용자의 운동 데이터를 분석하여 개인화된 인사이트를 제공해주세요.

## 사용자 정보

- 이름: ${input.userName || '사용자'}
- 운동 타입: ${workoutTypeLabels[input.userStats.workoutType] || input.userStats.workoutType}
- 운동 목표: ${goalsText}
- 현재 연속 운동일: ${input.userStats.currentStreak}일
- 최장 연속 운동일: ${input.userStats.longestStreak}일
- 총 운동 횟수: ${input.userStats.totalWorkouts}회

## 이번 주 운동 데이터

- 총 운동 횟수: ${input.currentWeekStats.totalSessions}회
- 총 볼륨: ${input.currentWeekStats.totalVolume.toLocaleString()}
- 평균 운동 시간: ${input.currentWeekStats.averageDuration}분
- 볼륨 변화: ${volumeChangeText}

## 부위별 운동 분포

${balanceText}

## 또래 비교

${peerComparisonText}

## 최근 운동 기록 (최대 7일)

\`\`\`json
${recentLogsJson}
\`\`\`

## 인사이트 생성 규칙

1. **balance (부위 균형)**: 특정 부위가 30% 미만이면 균형 추천 (우선순위: high)
2. **progress (진행 상황)**: 볼륨/횟수 변화 분석 (±10% 이상 변화 시)
3. **streak (연속 기록)**: 3일 이상 연속 시 축하, 7일 달성 시 특별 메시지
4. **comparison (또래 비교)**: 상위 30% 이상이면 칭찬, 평균 이하면 격려
5. **tip (운동 팁)**: 사용자 타입/목표에 맞는 실용적 조언

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "insights": [
    {
      "type": "[balance|progress|streak|comparison|tip]",
      "message": "[인사이트 메시지 - 친근하고 동기부여가 되는 톤으로]",
      "priority": "[high|medium|low]",
      "data": {
        "percentage": [관련 수치가 있으면],
        "trend": "[up|down|stable - 진행 상황 타입일 때]",
        "targetArea": "[관련 부위가 있으면]"
      }
    }
  ],
  "weeklyHighlight": "[이번 주 가장 인상적인 성과 1문장]",
  "motivationalMessage": "[개인화된 동기부여 메시지 1-2문장]"
}

## 주의사항

- 최대 3개의 인사이트만 반환 (우선순위 높은 순)
- 메시지는 20-50자 내외로 간결하게
- 이모지를 적절히 사용하여 친근하게
- 부정적인 표현 대신 긍정적인 방향으로 제안
- 한국어로 자연스럽게 작성`;
}

/**
 * W-1 AI 인사이트 생성 (Task 4.1)
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 인사이트 생성 입력 데이터
 * @returns AI 생성 인사이트
 */
export async function generateWorkoutInsights(
  input: WorkoutInsightInput
): Promise<GeminiWorkoutInsightResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[W-1] Using mock for workout insights (FORCE_MOCK_AI=true)');
    return generateMockWorkoutInsights(input) as unknown as GeminiWorkoutInsightResult;
  }

  if (!genAI) {
    geminiLogger.warn('[W-1] Gemini not configured, using mock');
    return generateMockWorkoutInsights(input) as unknown as GeminiWorkoutInsightResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildWorkoutInsightPrompt(input);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(prompt), 3000, '[W-1] Gemini timeout'),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[W-1] Workout insights generated');
    return parseJsonResponse<GeminiWorkoutInsightResult>(text);
  } catch (error) {
    geminiLogger.error('[W-1] Gemini error, falling back to mock:', error);
    return generateMockWorkoutInsights(input) as unknown as GeminiWorkoutInsightResult;
  }
}

/**
 * Gemini 연결 테스트
 */
export async function testConnection(): Promise<boolean> {
  if (!genAI) {
    return false;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const result = await model.generateContent("Hello, respond with 'OK'");
    const response = await result.response;
    return response.text().includes('OK');
  } catch {
    return false;
  }
}

// ============================================
// N-1 영양/식단 분석 (Task 2.1)
// ============================================

/**
 * N-1 음식 분석 결과 타입
 */
export interface GeminiFoodAnalysisResult {
  foods: Array<{
    name: string;
    portion: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    trafficLight: 'green' | 'yellow' | 'red';
    confidence: number;
    foodId?: string;
  }>;
  totalCalories: number;
  totalProtein?: number;
  totalCarbs?: number;
  totalFat?: number;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  insight?: string;
  analyzedAt?: string;
}

/**
 * N-1 음식 분석 입력 타입
 */
export interface FoodAnalysisInput {
  imageBase64: string;
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  date?: string;
}

/**
 * N-1 식단 추천 입력 타입
 * 피부/체형 연동으로 통합 추천 지원
 */
export interface MealSuggestionInput {
  goal: 'weight_loss' | 'maintain' | 'muscle' | 'skin' | 'health';
  tdee: number;
  consumedCalories: number;
  remainingCalories: number;
  allergies: string[];
  dislikedFoods: string[];
  cookingSkill: 'beginner' | 'intermediate' | 'advanced' | 'none';
  budget: 'economy' | 'moderate' | 'premium' | 'any';
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  preferences?: string[];
  // S-1 피부 분석 연동 (선택)
  skinContext?: {
    concerns: string[]; // 피부 고민 (수분 부족, 트러블 등)
    recommendedFoods: string[]; // 피부에 좋은 음식
  };
  // C-1 체형 분석 연동 (선택)
  bodyContext?: {
    bodyType: string; // 체형 (S/W/N 또는 8타입)
    targetWeight?: number; // 목표 체중
    currentWeight?: number; // 현재 체중
  };
}

/**
 * N-1 식단 추천 결과 타입
 */
export interface GeminiMealSuggestionResult {
  meals: Array<{
    name: string;
    estimatedCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    trafficLight: 'green' | 'yellow' | 'red';
    reason: string;
    difficulty: 'easy' | 'medium' | 'hard';
    cookingTime?: number;
    ingredients?: string[];
  }>;
  totalCalories: number;
  nutritionBalance: {
    protein: number;
    carbs: number;
    fat: number;
  };
  tips: string[];
}

/**
 * N-1 식단 추천 프롬프트 빌더
 */
function buildMealSuggestionPrompt(input: MealSuggestionInput): string {
  const goalLabels: Record<string, string> = {
    weight_loss: '체중 감량',
    maintain: '체중 유지',
    muscle: '근육 증가',
    skin: '피부 개선',
    health: '건강 관리',
  };

  const mealTypeLabels: Record<string, string> = {
    breakfast: '아침',
    lunch: '점심',
    dinner: '저녁',
    snack: '간식',
  };

  const cookingLabels: Record<string, string> = {
    beginner: '초보 (간단한 요리만)',
    intermediate: '중급 (대부분 요리 가능)',
    advanced: '고급 (복잡한 요리도 가능)',
    none: '요리 안 함 (완제품/배달만)',
  };

  const budgetLabels: Record<string, string> = {
    economy: '경제적 (저렴하게)',
    moderate: '적당 (일반적)',
    premium: '프리미엄 (비용 무관)',
    any: '상관없음',
  };

  const goalText = goalLabels[input.goal] || input.goal;
  const mealTypeText = mealTypeLabels[input.mealType] || input.mealType;
  const cookingText = cookingLabels[input.cookingSkill] || input.cookingSkill;
  const budgetText = budgetLabels[input.budget] || input.budget;
  const allergiesText = input.allergies.length > 0 ? input.allergies.join(', ') : '없음';
  const dislikedText = input.dislikedFoods.length > 0 ? input.dislikedFoods.join(', ') : '없음';

  // 피부/체형 컨텍스트 빌드 (통합 추천용)
  let integratedContext = '';

  if (input.skinContext?.concerns.length) {
    integratedContext += `\n## 피부 상태 연동 (S-1)\n`;
    integratedContext += `- 피부 고민: ${input.skinContext.concerns.join(', ')}\n`;
    if (input.skinContext.recommendedFoods.length) {
      integratedContext += `- 피부에 좋은 음식: ${input.skinContext.recommendedFoods.join(', ')}\n`;
    }
    integratedContext += `→ 피부 개선에 도움되는 음식을 우선 추천해주세요.\n`;
  }

  if (input.bodyContext?.bodyType) {
    const bodyTypeLabels: Record<string, string> = {
      S: '스트레이트 (상체 볼륨, I라인)',
      W: '웨이브 (하체 볼륨, X라인)',
      N: '내추럴 (골격감, 레이어드)',
    };
    const bodyLabel = bodyTypeLabels[input.bodyContext.bodyType] || input.bodyContext.bodyType;
    integratedContext += `\n## 체형 상태 연동 (C-1)\n`;
    integratedContext += `- 체형: ${bodyLabel}\n`;
    if (input.bodyContext.currentWeight && input.bodyContext.targetWeight) {
      const diff = input.bodyContext.currentWeight - input.bodyContext.targetWeight;
      if (diff > 0) {
        integratedContext += `- 목표: ${diff.toFixed(1)}kg 감량 (현재 ${input.bodyContext.currentWeight}kg → 목표 ${input.bodyContext.targetWeight}kg)\n`;
      } else if (diff < 0) {
        integratedContext += `- 목표: ${Math.abs(diff).toFixed(1)}kg 증량 (현재 ${input.bodyContext.currentWeight}kg → 목표 ${input.bodyContext.targetWeight}kg)\n`;
      }
    }
  }

  return `당신은 전문 영양사이자 식단 설계 전문가입니다. 사용자의 조건에 맞는 ${mealTypeText} 식사를 추천해주세요.
${integratedContext ? `\n**통합 분석 데이터가 있으므로, 피부/체형 상태를 함께 고려해주세요.**` : ''}

## 사용자 정보

- 영양 목표: ${goalText}
- 하루 목표 칼로리 (TDEE): ${input.tdee}kcal
- 이미 섭취한 칼로리: ${input.consumedCalories}kcal
- 남은 칼로리: ${input.remainingCalories}kcal
- 요리 스킬: ${cookingText}
- 예산: ${budgetText}
- 알레르기: ${allergiesText}
- 기피 음식: ${dislikedText}
${input.preferences?.length ? `- 선호 사항: ${input.preferences.join(', ')}` : ''}${integratedContext}

## 식사 타입별 칼로리 배분 가이드

- 아침: 전체의 25-30%
- 점심: 전체의 35-40%
- 저녁: 전체의 25-30%
- 간식: 전체의 5-10%

## 목표별 영양소 비율

- 체중 감량: 단백질 30%, 탄수화물 40%, 지방 30%
- 체중 유지: 단백질 20%, 탄수화물 50%, 지방 30%
- 근육 증가: 단백질 35%, 탄수화물 45%, 지방 20%
- 피부 개선: 단백질 25%, 탄수화물 45%, 지방 30% (오메가3, 비타민 강조)
- 건강 관리: 단백질 20%, 탄수화물 50%, 지방 30%

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "meals": [
    {
      "name": "[음식명 - 한국어]",
      "estimatedCalories": [예상 칼로리],
      "protein": [단백질 g],
      "carbs": [탄수화물 g],
      "fat": [지방 g],
      "trafficLight": "[green|yellow|red]",
      "reason": "[추천 이유 1문장]",
      "difficulty": "[easy|medium|hard]",
      "cookingTime": [조리 시간 분 - 있으면],
      "ingredients": ["[재료1]", "[재료2]"]
    }
  ],
  "totalCalories": [추천 식사 총 칼로리],
  "nutritionBalance": {
    "protein": [단백질 g],
    "carbs": [탄수화물 g],
    "fat": [지방 g]
  },
  "tips": ["[식사 팁 1]", "[식사 팁 2]"]
}

## 주의사항

- 2-4개의 식사 옵션을 추천
- 알레르기 재료는 절대 포함하지 마세요
- 기피 음식은 피하고 대안을 제시
- 요리 스킬에 맞는 난이도로 추천
- 남은 칼로리(${input.remainingCalories}kcal)를 초과하지 않도록 구성
- 한국 음식 위주로 추천 (한식, 분식 등)
- 한국어로 자연스럽게 작성`;
}

/**
 * N-1 음식 사진 분석 실행 (Task 2.1)
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 5초 타임아웃 + 2회 재시도 후 Mock Fallback (이미지 분석은 더 긴 타임아웃)
 *
 * @param input - 음식 분석 입력 데이터
 * @returns 음식 분석 결과
 */
export async function analyzeFoodImage(
  input: FoodAnalysisInput
): Promise<GeminiFoodAnalysisResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[N-1] Using mock for food analysis (FORCE_MOCK_AI=true)');
    return {
      ...generateMockFoodAnalysis(input),
      analyzedAt: new Date().toISOString(),
    };
  }

  if (!genAI) {
    geminiLogger.warn('[N-1] Gemini not configured, using mock');
    return {
      ...generateMockFoodAnalysis(input),
      analyzedAt: new Date().toISOString(),
    };
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildFoodAnalysisPromptFromModule(input.mealType);
    const imagePart = formatImageForGemini(input.imageBase64);

    // 타임아웃 (5초) + 재시도 (최대 2회) 적용 - 이미지 분석은 더 긴 타임아웃
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([prompt, imagePart]),
          5000,
          '[N-1] Food analysis timeout'
        ),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    const parsed = parseJsonResponse<GeminiFoodAnalysisResult>(text);

    geminiLogger.info('[N-1] Food analysis completed');
    // 분석 시간 추가
    return {
      ...parsed,
      analyzedAt: new Date().toISOString(),
    };
  } catch (error) {
    geminiLogger.error('[N-1] Gemini error, falling back to mock:', error);
    return {
      ...generateMockFoodAnalysis(input),
      analyzedAt: new Date().toISOString(),
    };
  }
}

/**
 * N-1 식단 추천 생성 (Task 2.1)
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 식단 추천 입력 데이터
 * @returns 식단 추천 결과
 */
export async function generateMealSuggestion(
  input: MealSuggestionInput
): Promise<GeminiMealSuggestionResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[N-1] Using mock for meal suggestion (FORCE_MOCK_AI=true)');
    return generateMockMealSuggestion(input) as unknown as GeminiMealSuggestionResult;
  }

  if (!genAI) {
    geminiLogger.warn('[N-1] Gemini not configured, using mock');
    return generateMockMealSuggestion(input) as unknown as GeminiMealSuggestionResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildMealSuggestionPrompt(input);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(prompt), 3000, '[N-1] Meal suggestion timeout'),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[N-1] Meal suggestion generated');
    return parseJsonResponse<GeminiMealSuggestionResult>(text);
  } catch (error) {
    geminiLogger.error('[N-1] Gemini error, falling back to mock:', error);
    return generateMockMealSuggestion(input) as unknown as GeminiMealSuggestionResult;
  }
}

// ============================================
// 이미지 질문 AI (Inventory Q&A)
// ============================================

/**
 * 이미지 질문 결과 타입
 */
export interface GeminiImageQuestionResult {
  answer: string;
  suggestions?: string[];
  confidence: number;
}

/**
 * 이미지 질문 입력 타입
 */
export interface ImageQuestionInput {
  imageBase64: string;
  question: string;
  context?: {
    category?: string; // closet, beauty, equipment, etc.
    itemName?: string;
    personalColor?: string;
    bodyType?: string;
  };
}

/**
 * 이미지 질문 프롬프트 빌더
 */
function buildImageQuestionPrompt(input: ImageQuestionInput): string {
  const categoryLabels: Record<string, string> = {
    closet: '의류/패션 아이템',
    beauty: '화장품/스킨케어 제품',
    equipment: '운동 장비',
    supplement: '영양제/건강식품',
    pantry: '식재료/식품',
  };

  const categoryText = input.context?.category
    ? categoryLabels[input.context.category] || input.context.category
    : '아이템';

  let contextText = '';
  if (input.context?.itemName) {
    contextText += `\n- 아이템 이름: ${input.context.itemName}`;
  }
  if (input.context?.personalColor) {
    contextText += `\n- 사용자 퍼스널컬러: ${input.context.personalColor}`;
  }
  if (input.context?.bodyType) {
    contextText += `\n- 사용자 체형: ${input.context.bodyType}`;
  }

  return `당신은 ${categoryText} 전문가 AI 어시스턴트입니다. 사용자가 업로드한 이미지를 보고 질문에 답변해주세요.

## 사용자 질문
${input.question}
${contextText ? `\n## 참고 정보${contextText}` : ''}

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "answer": "[질문에 대한 상세하고 도움이 되는 답변 2-4문장]",
  "suggestions": ["[관련 추천 1]", "[관련 추천 2]", "[관련 추천 3]"],
  "confidence": [80-95 사이의 신뢰도]
}

## 주의사항

- 이미지에 보이는 내용을 정확히 분석하세요
- 패션/뷰티 관련 질문이면 퍼스널컬러와 체형을 고려하여 답변하세요
- 구체적이고 실용적인 조언을 제공하세요
- suggestions는 관련된 추가 정보나 추천 (없으면 빈 배열)
- 한국어로 자연스럽게 작성`;
}

/**
 * 이미지 질문 AI 실행
 * - 인벤토리 아이템에 대한 질문-답변
 * - FORCE_MOCK_AI 환경변수 지원
 * - 5초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 이미지 질문 입력 데이터
 * @returns 질문에 대한 AI 답변
 */
export async function askAboutImage(input: ImageQuestionInput): Promise<GeminiImageQuestionResult> {
  // Mock 응답 생성 함수
  const generateMockAnswer = (): GeminiImageQuestionResult => ({
    answer: `"${input.question}"에 대한 답변입니다. 이미지를 분석한 결과, 해당 아이템에 대해 유용한 정보를 제공해드릴 수 있습니다. 추가 질문이 있으시면 말씀해주세요.`,
    suggestions: ['관련 아이템 추천', '코디 조합 제안', '관리 팁'],
    confidence: 75,
  });

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[IMG-Q] Using mock (FORCE_MOCK_AI=true)');
    return generateMockAnswer();
  }

  if (!genAI) {
    geminiLogger.warn('[IMG-Q] Gemini not configured, using mock');
    return generateMockAnswer();
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildImageQuestionPrompt(input);
    const imagePart = formatImageForGemini(input.imageBase64);

    // 타임아웃 (5초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([prompt, imagePart]),
          5000,
          '[IMG-Q] Image question timeout'
        ),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[IMG-Q] Image question answered');
    return parseJsonResponse<GeminiImageQuestionResult>(text);
  } catch (error) {
    geminiLogger.error('[IMG-Q] Gemini error, falling back to mock:', error);
    return generateMockAnswer();
  }
}

// ============================================
// 날씨 기반 코디 추천 AI
// ============================================

/**
 * 날씨 코디 추천 결과 타입
 */
export interface GeminiWeatherOutfitResult {
  recommendation: string;
  outfit: {
    outer?: string;
    top: string;
    bottom: string;
    shoes?: string;
    accessories?: string[];
  };
  tips: string[];
  colorSuggestions: string[];
}

/**
 * 날씨 코디 추천 입력 타입
 */
export interface WeatherOutfitInput {
  weather: {
    temp: number;
    condition: string; // sunny, cloudy, rainy, snowy
    humidity?: number;
    wind?: number;
  };
  occasion: 'casual' | 'work' | 'date' | 'outdoor' | 'exercise';
  personalColor?: string;
  bodyType?: string;
  preferences?: string[];
}

/**
 * 날씨 코디 추천 프롬프트 빌더
 */
function buildWeatherOutfitPrompt(input: WeatherOutfitInput): string {
  const occasionLabels: Record<string, string> = {
    casual: '일상/캐주얼',
    work: '출근/업무',
    date: '데이트/약속',
    outdoor: '야외활동',
    exercise: '운동/스포츠',
  };

  const conditionLabels: Record<string, string> = {
    sunny: '맑음',
    cloudy: '흐림',
    rainy: '비',
    snowy: '눈',
  };

  const occasionText = occasionLabels[input.occasion] || input.occasion;
  const conditionText = conditionLabels[input.weather.condition] || input.weather.condition;

  let contextText = '';
  if (input.personalColor) {
    contextText += `\n- 퍼스널컬러: ${input.personalColor}`;
  }
  if (input.bodyType) {
    contextText += `\n- 체형: ${input.bodyType}`;
  }
  if (input.preferences?.length) {
    contextText += `\n- 선호 스타일: ${input.preferences.join(', ')}`;
  }

  return `당신은 전문 스타일리스트입니다. 오늘의 날씨와 상황에 맞는 코디를 추천해주세요.

## 오늘의 날씨
- 기온: ${input.weather.temp}°C
- 날씨: ${conditionText}
${input.weather.humidity ? `- 습도: ${input.weather.humidity}%` : ''}
${input.weather.wind ? `- 바람: ${input.weather.wind}m/s` : ''}

## 상황
- TPO: ${occasionText}
${contextText}

## 응답 형식

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "recommendation": "[오늘 코디 전체 설명 1-2문장]",
  "outfit": {
    "outer": "[아우터 - 10°C 이하일 때만, 아니면 null]",
    "top": "[상의 추천]",
    "bottom": "[하의 추천]",
    "shoes": "[신발 추천]",
    "accessories": ["[액세서리1]", "[액세서리2]"]
  },
  "tips": ["[스타일링 팁 1]", "[스타일링 팁 2]"],
  "colorSuggestions": ["[추천 컬러 1]", "[추천 컬러 2]", "[추천 컬러 3]"]
}

## 주의사항

- 기온에 맞는 옷을 추천하세요 (레이어링 고려)
- 비/눈 오면 방수/보온성 고려
- 퍼스널컬러가 있으면 어울리는 색상 위주로 추천
- 체형이 있으면 체형에 맞는 실루엣 추천
- 한국어로 자연스럽게 작성`;
}

/**
 * 날씨 기반 코디 추천 AI 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param input - 날씨 코디 추천 입력 데이터
 * @returns 코디 추천 결과
 */
export async function recommendWeatherOutfit(
  input: WeatherOutfitInput
): Promise<GeminiWeatherOutfitResult> {
  // Mock 응답 생성 함수
  const generateMockOutfit = (): GeminiWeatherOutfitResult => {
    const isWarm = input.weather.temp >= 20;
    const isCold = input.weather.temp <= 10;
    const isRainy = input.weather.condition === 'rainy';

    return {
      recommendation: isWarm
        ? '오늘은 가벼운 옷차림이 좋겠어요. 시원하고 편안한 코디를 추천드립니다.'
        : isCold
          ? '오늘은 따뜻하게 레이어링하세요. 아우터는 필수입니다.'
          : '오늘은 적당한 기온이에요. 가디건이나 얇은 자켓을 챙기세요.',
      outfit: {
        outer: isCold ? '울 코트' : undefined,
        top: isWarm ? '린넨 셔츠' : '니트 스웨터',
        bottom: '슬랙스',
        shoes: isRainy ? '레인부츠' : '로퍼',
        accessories: isRainy ? ['우산', '방수 가방'] : ['시계', '선글라스'],
      },
      tips: [isRainy ? '우산 꼭 챙기세요!' : '자외선 차단제 바르세요', '편안한 신발 추천드려요'],
      colorSuggestions: ['네이비', '베이지', '화이트'],
    };
  };

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[WEATHER-OUTFIT] Using mock (FORCE_MOCK_AI=true)');
    return generateMockOutfit();
  }

  if (!genAI) {
    geminiLogger.warn('[WEATHER-OUTFIT] Gemini not configured, using mock');
    return generateMockOutfit();
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const prompt = buildWeatherOutfitPrompt(input);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(prompt), 3000, '[WEATHER-OUTFIT] Timeout'),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[WEATHER-OUTFIT] Outfit recommendation generated');
    return parseJsonResponse<GeminiWeatherOutfitResult>(text);
  } catch (error) {
    geminiLogger.error('[WEATHER-OUTFIT] Gemini error, falling back to mock:', error);
    return generateMockOutfit();
  }
}

// ============================================
// 얼굴 이미지 검증 (다각도 촬영 시스템)
// ============================================

import type { FaceAngle, ValidateFaceImageResponse } from '@/types/visual-analysis';
import { generateMockFaceValidation } from '@/lib/mock/face-validation';

/**
 * 얼굴 이미지 검증 프롬프트 생성
 */
function buildFaceValidationPrompt(expectedAngle: FaceAngle): string {
  const angleLabels: Record<FaceAngle, string> = {
    front: '정면',
    left: '좌측 (왼쪽 얼굴이 더 보임)',
    right: '우측 (오른쪽 얼굴이 더 보임)',
  };

  return `당신은 얼굴 이미지 품질 검증 전문가입니다.

📋 검증 순서:
1. 얼굴이 이미지에 있는지 확인하세요.
2. 얼굴의 각도를 판단하세요 (정면/좌측/우측).
3. 조명 상태를 평가하세요.
4. 메이크업 여부를 확인하세요.
5. 흐림/저해상도 여부를 확인하세요.

⚠️ 판단 기준:
- 정면: 코가 얼굴 중앙, 양쪽 눈이 대칭적으로 보임
- 좌측: 왼쪽 얼굴이 더 많이 보임, 오른쪽 귀가 안 보이거나 거의 안 보임
- 우측: 오른쪽 얼굴이 더 많이 보임, 왼쪽 귀가 안 보이거나 거의 안 보임

📊 요청된 각도: ${angleLabels[expectedAngle]}

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "suitable": true 또는 false,
  "reason": "부적합 시 한국어로 사유 작성",
  "detectedAngle": "front" 또는 "left" 또는 "right" 또는 "unknown",
  "quality": {
    "lighting": "good" 또는 "dark" 또는 "bright" 또는 "uneven",
    "makeupDetected": true 또는 false,
    "faceDetected": true 또는 false,
    "blur": true 또는 false
  }
}

⚠️ 주의사항:
- suitable은 요청 각도와 감지 각도가 일치하고 얼굴이 잘 보이면 true
- reason은 suitable이 false일 때만 작성 (한국어로)
- 메이크업이 감지되어도 suitable은 true 가능 (경고만)
- 확신이 없으면 detectedAngle을 "unknown"으로`;
}

/**
 * 얼굴 이미지 검증 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - 2초 타임아웃 + 1회 재시도 후 Mock Fallback
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @param expectedAngle - 기대하는 촬영 각도
 * @returns 검증 결과
 */
export async function validateFaceImage(
  imageBase64: string,
  expectedAngle: FaceAngle
): Promise<ValidateFaceImageResponse> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[FACE-VALIDATE] Using mock (FORCE_MOCK_AI=true)');
    return generateMockFaceValidation(expectedAngle);
  }

  if (!genAI) {
    geminiLogger.warn('[FACE-VALIDATE] Gemini not configured, using mock');
    return generateMockFaceValidation(expectedAngle);
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);
    const prompt = buildFaceValidationPrompt(expectedAngle);

    // 타임아웃 (2초) + 재시도 (최대 1회) - 검증은 빠르게
    const result = await withRetry(
      () =>
        withTimeout(model.generateContent([prompt, imagePart]), 2000, '[FACE-VALIDATE] Timeout'),
      1,
      500
    );

    const response = await result.response;
    const text = response.text();

    geminiLogger.info('[FACE-VALIDATE] Validation completed');
    return parseJsonResponse<ValidateFaceImageResponse>(text);
  } catch (error) {
    geminiLogger.error('[FACE-VALIDATE] Gemini error, falling back to mock:', error);
    return generateMockFaceValidation(expectedAngle);
  }
}

// ============================================================
// A-1 자세 분석 (Posture Analysis)
// ============================================================

import {
  generateMockPostureAnalysis,
  type PostureAnalysisResult as MockPostureResult,
  type PostureType,
  type PostureMeasurement,
  type StretchingRecommendation,
} from '@/lib/mock/posture-analysis';

/**
 * A-1 자세 분석 결과 타입
 */
export interface GeminiPostureAnalysisResult {
  postureType: PostureType;
  postureTypeLabel: string;
  postureTypeDescription: string;
  overallScore: number;
  confidence: number;
  // 정면 분석
  frontAnalysis: {
    shoulderSymmetry: PostureMeasurement;
    pelvisSymmetry: PostureMeasurement;
    kneeAlignment: PostureMeasurement;
    footAngle: PostureMeasurement;
  };
  // 측면 분석
  sideAnalysis: {
    headForwardAngle: PostureMeasurement;
    thoracicKyphosis: PostureMeasurement;
    lumbarLordosis: PostureMeasurement;
    pelvicTilt: PostureMeasurement;
  };
  concerns: string[];
  stretchingRecommendations: StretchingRecommendation[];
  insight: string;
  // 분석 근거
  analysisEvidence?: {
    headPosition: 'aligned' | 'forward' | 'backward';
    shoulderPosition: 'aligned' | 'rounded' | 'elevated';
    spineAlignment: 'normal' | 'kyphotic' | 'lordotic' | 'flat';
    pelvisPosition: 'neutral' | 'anterior_tilt' | 'posterior_tilt';
    kneePosition: 'aligned' | 'hyperextended' | 'flexed';
  };
  // 이미지 품질 정보
  imageQuality?: {
    angle: 'front' | 'side' | 'both';
    fullBodyVisible: boolean;
    clothingFit: 'fitted' | 'loose';
    analysisReliability: 'high' | 'medium' | 'low';
  };
  // C-1 연동 정보
  bodyTypeCorrelation?: {
    bodyType: string;
    correlationNote: string;
    riskFactors: string[];
  };
}

/**
 * A-1 자세 분석 프롬프트
 */
const POSTURE_ANALYSIS_PROMPT = `당신은 전문 자세 분석 AI입니다. 업로드된 전신 이미지를 분석하여 자세 상태를 진단해주세요.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 이미지 분석 전 조건 확인
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 촬영 각도: 정면 또는 측면 촬영
2. 전신 포함: 머리부터 발끝까지 보여야 함
3. 의복: 체형이 드러나는 옷 권장

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 자세 타입 분류
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ideal] 이상적인 자세
- 귀-어깨-골반-무릎-발목이 일직선
- 자연스러운 척추 곡선 유지
- 어깨와 골반이 대칭

[forward_head] 거북목 (전방 두부 자세)
- 머리가 어깨보다 앞으로 나옴
- 턱이 앞으로 돌출
- 목 뒤 근육 긴장

[rounded_shoulders] 굽은 어깨
- 어깨가 앞으로 말림
- 가슴 근육 단축
- 등 상부 근육 약화

[swayback] 스웨이백
- 골반이 앞으로 밀림
- 등 상부가 뒤로 젖혀짐
- 무릎 과신전 경향

[flatback] 일자 허리
- 요추 전만 감소
- 골반 후방 경사
- 허리가 평평해 보임

[lordosis] 과전만 (요추 전만증)
- 허리가 과도하게 앞으로 휨
- 복부 돌출
- 골반 전방 경사

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 분석 기준
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[정면 분석]
- 어깨 대칭: 좌우 어깨 높이 차이 (50이 이상적)
- 골반 대칭: 좌우 골반 높이 차이 (50이 이상적)
- 무릎 정렬: 무릎 내/외반 정도
- 발 각도: 발의 외/내전 각도

[측면 분석]
- 목 전방 경사: 귀와 어깨의 전후 위치 관계 (50이 이상적, 낮을수록 거북목)
- 등 굽음 (흉추 후만): 등 상부 굽음 정도 (50이 이상적, 높을수록 굽음)
- 허리 만곡 (요추 전만): 허리 곡선 정도 (50이 이상적, 높을수록 과전만)
- 골반 기울기: 골반 전/후방 경사 (50이 이상적)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "postureType": "[ideal|forward_head|rounded_shoulders|swayback|flatback|lordosis]",
  "postureTypeLabel": "[자세 타입 한국어 라벨]",
  "postureTypeDescription": "[자세 타입 설명 1-2문장]",
  "overallScore": [0-100 전체 점수, 높을수록 좋음],
  "confidence": [70-95 분석 신뢰도],
  "frontAnalysis": {
    "shoulderSymmetry": {
      "name": "어깨 대칭",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "pelvisSymmetry": {
      "name": "골반 대칭",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "kneeAlignment": {
      "name": "무릎 정렬",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "footAngle": {
      "name": "발 각도",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    }
  },
  "sideAnalysis": {
    "headForwardAngle": {
      "name": "목 전방 경사",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "thoracicKyphosis": {
      "name": "등 굽음",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "lumbarLordosis": {
      "name": "허리 만곡",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    },
    "pelvicTilt": {
      "name": "골반 기울기",
      "value": [0-100, 50이 이상적],
      "status": "[good|warning|alert]",
      "description": "[분석 설명]"
    }
  },
  "concerns": ["[우려 사항 1]", "[우려 사항 2]"],
  "stretchingRecommendations": [
    {
      "name": "[운동명]",
      "targetArea": "[타깃 부위]",
      "duration": "[시간/횟수]",
      "frequency": "[빈도]",
      "description": "[설명]",
      "difficulty": "[easy|medium|hard]"
    }
  ],
  "insight": "[자세에 대한 AI 인사이트 2-3문장]",
  "analysisEvidence": {
    "headPosition": "[aligned|forward|backward]",
    "shoulderPosition": "[aligned|rounded|elevated]",
    "spineAlignment": "[normal|kyphotic|lordotic|flat]",
    "pelvisPosition": "[neutral|anterior_tilt|posterior_tilt]",
    "kneePosition": "[aligned|hyperextended|flexed]"
  },
  "imageQuality": {
    "angle": "[front|side|both]",
    "fullBodyVisible": [true|false],
    "clothingFit": "[fitted|loose]",
    "analysisReliability": "[high|medium|low]"
  }
}

⚠️ 주의사항:
- 측정값 0-100 범위에서 50이 이상적 (대칭/균형)
- 이미지가 측면인지 정면인지에 따라 해당 분석 정확도 조절
- 정면 이미지에서는 측면 분석의 신뢰도를 낮추고, 그 반대도 마찬가지
- 확신이 없으면 confidence를 낮추고 analysisReliability를 "low"로 설정
- stretchingRecommendations은 2-4개 제공`;

/**
 * A-1 자세 분석 (정면 + 측면 다각도 지원)
 * - 정면 이미지 필수, 측면 이미지 선택
 * - Mock Fallback 지원
 * - C-1 체형 분석 연동 지원
 *
 * @param frontImageBase64 - 정면 이미지 (필수)
 * @param sideImageBase64 - 측면 이미지 (선택)
 * @param bodyType - C-1 체형 타입 (선택, 연동용)
 * @returns 자세 분석 결과
 */
export async function analyzePosture(
  frontImageBase64: string,
  sideImageBase64?: string,
  bodyType?: string
): Promise<GeminiPostureAnalysisResult> {
  const hasMultiAngle = !!sideImageBase64;
  const imageCount = 1 + (sideImageBase64 ? 1 : 0);

  // Mock 결과를 GeminiPostureAnalysisResult로 변환하는 함수
  const convertMockToResult = (mock: MockPostureResult): GeminiPostureAnalysisResult => ({
    postureType: mock.postureType,
    postureTypeLabel: mock.postureTypeLabel,
    postureTypeDescription: mock.postureTypeDescription,
    overallScore: mock.overallScore,
    confidence: mock.confidence,
    frontAnalysis: mock.frontAnalysis,
    sideAnalysis: mock.sideAnalysis,
    concerns: mock.concerns,
    stretchingRecommendations: mock.stretchingRecommendations,
    insight: mock.insight,
    bodyTypeCorrelation: mock.bodyTypeCorrelation,
    imageQuality: {
      angle: hasMultiAngle ? 'both' : 'front',
      fullBodyVisible: true,
      clothingFit: 'fitted',
      analysisReliability: hasMultiAngle ? 'high' : 'medium',
    },
  });

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[A-1] Using mock (FORCE_MOCK_AI=true)');
    const mockResult = generateMockPostureAnalysis(bodyType);
    return convertMockToResult(mockResult);
  }

  if (!genAI) {
    geminiLogger.warn('[A-1] Gemini not configured, using mock');
    const mockResult = generateMockPostureAnalysis(bodyType);
    return convertMockToResult(mockResult);
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);

    // 이미지 배열 구성
    const contentParts: (string | { inlineData: { mimeType: string; data: string } })[] = [];

    // 프롬프트 구성
    let prompt = POSTURE_ANALYSIS_PROMPT;

    if (hasMultiAngle) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
다각도 이미지 분석 (${imageCount}장 제공)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
정면과 측면 이미지가 모두 제공되었습니다:
- 정면: 어깨/골반 대칭, 무릎 정렬 분석
- 측면: 목 전방 경사, 등 굽음, 허리 만곡, 골반 기울기 분석

[다각도 분석 규칙]
✅ 정면에서는 frontAnalysis 정확도 향상
✅ 측면에서는 sideAnalysis 정확도 향상
✅ 다각도 분석으로 신뢰도 향상 (confidence +10-15%)
✅ imageQuality.analysisReliability를 "high"로 설정`;
    }

    // C-1 체형 연동 정보 추가
    if (bodyType) {
      prompt += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
C-1 체형 연동 정보
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
사용자의 체형 타입: ${bodyType}

체형별 자세 상관관계 참고:
- S (스트레이트): 상체 근육 발달로 어깨가 앞으로 말리기 쉬움
- W (웨이브): 하체 무게 중심으로 골반 전방 경사 경향
- N (내추럴): 큰 골격으로 자세가 비교적 안정적

bodyTypeCorrelation 필드에 체형과 자세의 연관성을 포함해주세요.`;
    }

    contentParts.push(prompt);

    // 정면 이미지 추가
    contentParts.push(formatImageForGemini(frontImageBase64));

    // 측면 이미지 추가
    if (sideImageBase64) {
      contentParts.push(formatImageForGemini(sideImageBase64));
    }

    geminiLogger.info(`[A-1] Starting posture analysis with ${imageCount} image(s)`);

    // 타임아웃 (다각도는 10초, 단일은 5초) + 재시도 (최대 2회) 적용
    const timeoutMs = hasMultiAngle ? 10000 : 5000;
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent(contentParts),
          timeoutMs,
          '[A-1] Posture analysis timeout'
        ),
      2,
      1000
    );

    const response = result.response;
    const text = response.text();

    geminiLogger.info('[A-1] Posture analysis completed');
    return parseJsonResponse<GeminiPostureAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[A-1] Gemini error, falling back to mock:', error);
    const mockResult = generateMockPostureAnalysis(bodyType);
    return convertMockToResult(mockResult);
  }
}

// ============================================================
// H-1 헤어 분석 (Hair Analysis)
// ============================================================

/**
 * H-1 헤어 분석 결과 타입
 */
export interface GeminiHairAnalysisResult {
  // 기본 정보
  hairType: 'straight' | 'wavy' | 'curly' | 'coily';
  hairTypeLabel: string;
  hairThickness: 'fine' | 'medium' | 'thick';
  hairThicknessLabel: string;
  scalpType: 'dry' | 'normal' | 'oily' | 'sensitive';
  scalpTypeLabel: string;

  // 점수
  overallScore: number;
  metrics: Array<{
    id: string;
    label: string;
    value: number;
    status: 'good' | 'normal' | 'warning';
    description: string;
  }>;

  // 분석 결과
  concerns: string[];
  insight: string;

  // 추천
  recommendedIngredients: string[];
  recommendedProducts: Array<{
    category: string;
    name: string;
    description: string;
  }>;

  // 케어 팁
  careTips: string[];

  // 메타데이터
  analysisReliability: 'high' | 'medium' | 'low';

  // 이미지 품질 정보
  imageQuality?: {
    lightingCondition: 'natural' | 'artificial' | 'mixed';
    hairVisible: boolean;
    scalpVisible: boolean;
  };
}

/**
 * H-1 헤어 분석 프롬프트
 */
const HAIR_ANALYSIS_PROMPT = `당신은 전문 트리콜로지스트(모발/두피 전문가) AI입니다. 업로드된 헤어 이미지를 분석하여 모발과 두피 상태를 평가해주세요.

⚠️ 이미지 분석 전 조건 확인:
1. 조명 상태: 자연광에서 모발 결과 윤기가 정확히 보임
2. 이미지 해상도: 모발 결과 두피가 선명하게 보여야 함
3. 촬영 범위: 모발 전체 또는 두피 클로즈업

📋 분석 순서 (Step-by-Step):
1. 먼저 이미지 품질(조명, 해상도, 촬영 범위)을 평가하세요.
2. 모발 타입(직모/웨이브/곱슬/강한 곱슬)을 판단하세요.
3. 모발 굵기(가는/보통/굵은)를 분석하세요.
4. 두피 타입(건성/중성/지성/민감성)을 판단하세요.
5. 각 지표(수분도, 두피 건강, 손상도, 밀도, 탄력, 윤기)를 평가하세요.
6. 종합 점수와 맞춤 인사이트를 도출하세요.

⚠️ 할루시네이션 방지 규칙:
- 저화질/흐린 이미지: analysisReliability를 "low"로 설정
- 두피가 안 보이면: 두피 관련 지표는 신뢰도 낮춤
- 불확실한 경우: 추측하지 말고 "normal" 점수 + 신뢰도 낮춤

📊 과학적 분석 기준:

[수분도 hydration]
- 모발의 촉촉함, 건조함, 푸석함 정도
- 끝 갈라짐, 거칠기 확인
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

[두피 건강 scalp]
- 두피 색상, 각질, 염증 유무
- 모낭 상태, 홍반 확인
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

[손상도 damage]
- 열/화학적 손상 흔적
- 끝 갈라짐, 끊어짐 정도
- 낮음(건강): 71-100, 중간: 41-70, 높음(손상): 0-40

[모발 밀도 density]
- 모발의 밀집도, 숱
- 탈모 징후 확인
- 풍성: 71-100, 보통: 41-70, 적음: 0-40

[탄력 elasticity]
- 모발의 탄력성, 볼륨감
- 늘어남과 복원력
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

[윤기 shine]
- 모발의 광택, 반사도
- 건강한 큐티클 상태 반영
- 좋음: 71-100, 보통: 41-70, 주의: 0-40

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "hairType": "[straight|wavy|curly|coily]",
  "hairTypeLabel": "[직모|웨이브|곱슬|강한 곱슬]",
  "hairThickness": "[fine|medium|thick]",
  "hairThicknessLabel": "[가는 모발|보통|굵은 모발]",
  "scalpType": "[dry|normal|oily|sensitive]",
  "scalpTypeLabel": "[건성 두피|중성 두피|지성 두피|민감성 두피]",
  "overallScore": [0-100 사이 종합 점수],
  "metrics": [
    {"id": "hydration", "label": "수분도", "value": [0-100], "status": "[good|normal|warning]", "description": "[모발 수분 상태 설명]"},
    {"id": "scalp", "label": "두피 건강", "value": [0-100], "status": "[good|normal|warning]", "description": "[두피 상태 설명]"},
    {"id": "damage", "label": "손상도", "value": [0-100], "status": "[good|normal|warning]", "description": "[손상 정도 설명 - 높을수록 건강]"},
    {"id": "density", "label": "모발 밀도", "value": [0-100], "status": "[good|normal|warning]", "description": "[모발 밀도 설명]"},
    {"id": "elasticity", "label": "탄력", "value": [0-100], "status": "[good|normal|warning]", "description": "[탄력 상태 설명]"},
    {"id": "shine", "label": "윤기", "value": [0-100], "status": "[good|normal|warning]", "description": "[윤기 상태 설명]"}
  ],
  "concerns": ["[주요 고민1]", "[주요 고민2]"],
  "insight": "[모발/두피 상태에 대한 맞춤 인사이트 2-3문장]",
  "recommendedIngredients": ["[추천 성분1]", "[추천 성분2]", "[추천 성분3]", "[추천 성분4]"],
  "recommendedProducts": [
    {"category": "샴푸", "name": "[추천 샴푸 타입]", "description": "[추천 이유]"},
    {"category": "트리트먼트", "name": "[추천 제품 타입]", "description": "[추천 이유]"},
    {"category": "에센스", "name": "[추천 제품 타입]", "description": "[추천 이유]"}
  ],
  "careTips": ["[케어 팁1]", "[케어 팁2]", "[케어 팁3]", "[케어 팁4]"],
  "analysisReliability": "[high|medium|low]",
  "imageQuality": {
    "lightingCondition": "[natural|artificial|mixed]",
    "hairVisible": [true|false],
    "scalpVisible": [true|false]
  }
}

두피 타입별 추천 성분:
- 건성: 히알루론산, 아르간 오일, 시어버터, 판테놀
- 중성: 케라틴, 실크 아미노산, 비오틴, 프로비타민 B5
- 지성: 티트리 오일, 살리실산, 녹차 추출물, 멘톨
- 민감성: 알로에베라, 카모마일, 센텔라, 병풀 추출물`;

/**
 * H-1 헤어 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 5초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param imageBase64 - Base64 인코딩된 헤어 이미지
 * @returns 헤어 분석 결과
 */
export async function analyzeHair(imageBase64: string): Promise<GeminiHairAnalysisResult> {
  // Mock 결과를 GeminiHairAnalysisResult로 변환
  const convertMockToResult = (mock: MockHairAnalysisResult): GeminiHairAnalysisResult => ({
    hairType: mock.hairType,
    hairTypeLabel: mock.hairTypeLabel,
    hairThickness: mock.hairThickness,
    hairThicknessLabel: mock.hairThicknessLabel,
    scalpType: mock.scalpType,
    scalpTypeLabel: mock.scalpTypeLabel,
    overallScore: mock.overallScore,
    metrics: mock.metrics,
    concerns: mock.concerns,
    insight: mock.insight,
    recommendedIngredients: mock.recommendedIngredients,
    recommendedProducts: mock.recommendedProducts,
    careTips: mock.careTips,
    analysisReliability: mock.analysisReliability,
    imageQuality: {
      lightingCondition: 'natural',
      hairVisible: true,
      scalpVisible: true,
    },
  });

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[H-1] Using mock (FORCE_MOCK_AI=true)');
    const mockResult = generateMockHairAnalysisResult();
    return convertMockToResult(mockResult);
  }

  if (!genAI) {
    geminiLogger.warn('[H-1] Gemini not configured, using mock');
    const mockResult = generateMockHairAnalysisResult();
    return convertMockToResult(mockResult);
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (5초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([HAIR_ANALYSIS_PROMPT, imagePart]),
          5000,
          '[H-1] Hair analysis timeout'
        ),
      2,
      1000
    );

    const response = await result.response;
    const text = response.text();

    geminiLogger.info('[H-1] Hair analysis completed');
    return parseJsonResponse<GeminiHairAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[H-1] Gemini error, falling back to mock:', error);
    const mockResult = generateMockHairAnalysisResult();
    return convertMockToResult(mockResult);
  }
}

// ============================================================================
// M-1 메이크업 분석
// ============================================================================

/**
 * M-1 Gemini 메이크업 분석 결과 타입
 */
export interface GeminiMakeupAnalysisResult {
  undertone: 'warm' | 'cool' | 'neutral';
  undertoneLabel: string;
  eyeShape: 'monolid' | 'double' | 'hooded' | 'round' | 'almond' | 'downturned';
  eyeShapeLabel: string;
  lipShape: 'full' | 'thin' | 'wide' | 'small' | 'heart' | 'asymmetric';
  lipShapeLabel: string;
  faceShape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
  faceShapeLabel: string;
  overallScore: number;
  metrics: {
    id: string;
    label: string;
    value: number;
    status: 'good' | 'normal' | 'warning';
    description: string;
  }[];
  concerns: string[];
  insight: string;
  recommendedStyles: string[];
  colorRecommendations: {
    category: string;
    categoryLabel: string;
    colors: {
      name: string;
      hex: string;
      description: string;
    }[];
  }[];
  makeupTips: {
    category: string;
    tips: string[];
  }[];
  personalColorConnection?: {
    season: string;
    compatibility: 'high' | 'medium' | 'low';
    note: string;
  };
  analysisReliability: 'high' | 'medium' | 'low';
  imageQuality: {
    lightingCondition: 'natural' | 'artificial' | 'mixed';
    faceVisible: boolean;
    makeupDetected: boolean;
  };
}

/**
 * M-1 메이크업 분석 프롬프트
 */
const MAKEUP_ANALYSIS_PROMPT = `당신은 전문 메이크업 아티스트이자 뷰티 컨설턴트 AI입니다.

업로드된 얼굴 이미지를 분석하여 사용자에게 맞춤형 메이크업 추천을 제공하세요.

⚠️ 이미지 분석 전 조건 확인:
1. 얼굴이 충분히 보이는가? → 불충분하면 analysisReliability를 "low"로 설정
2. 조명 상태는? → 인공광이면 undertone 판정에 주의
3. 이미 메이크업이 되어있는가? → 메이크업 감지 시 원래 피부톤 추정에 주의

📊 분석 기준:

[언더톤 undertone]
- warm: 노란빛, 복숭아빛, 골드가 어울림
- cool: 핑크빛, 푸른빛, 실버가 어울림
- neutral: 다양한 톤이 어울림
- 혈관 색상, 피부 표면색, 눈동자/머리카락 색상 종합 판단

[눈 모양 eyeShape]
- monolid: 무쌍 (쌍꺼풀 없음)
- double: 유쌍 (쌍꺼풀 있음)
- hooded: 속쌍 (쌍꺼풀이 안으로 접힘)
- round: 둥근 눈
- almond: 아몬드형
- downturned: 처진 눈 (눈꼬리가 내려감)

[입술 모양 lipShape]
- full: 도톰한 입술
- thin: 얇은 입술
- wide: 넓은 입술
- small: 작은 입술
- heart: 하트형 (윗입술이 도톰)
- asymmetric: 비대칭

[얼굴형 faceShape]
- oval: 계란형
- round: 둥근형
- square: 각진형
- heart: 하트형 (이마 넓고 턱 좁음)
- oblong: 긴 얼굴
- diamond: 다이아몬드 (광대 넓음)

📋 분석 순서:
1. 먼저 이미지 품질과 기존 메이크업 여부를 확인하세요.
2. 피부 언더톤을 분석하세요 (혈관색, 피부표면색, 전체적인 느낌).
3. 눈 모양, 입술 모양, 얼굴형을 순서대로 분석하세요.
4. 피부 상태(결, 톤 균일도, 수분, 모공, 유수분 밸런스)를 평가하세요.
5. 분석 결과를 바탕으로 맞춤 색상과 메이크업 스타일을 추천하세요.

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "undertone": "[warm|cool|neutral]",
  "undertoneLabel": "[웜톤|쿨톤|뉴트럴]",
  "eyeShape": "[monolid|double|hooded|round|almond|downturned]",
  "eyeShapeLabel": "[무쌍|유쌍|속쌍|둥근 눈|아몬드형|처진 눈]",
  "lipShape": "[full|thin|wide|small|heart|asymmetric]",
  "lipShapeLabel": "[도톰한 입술|얇은 입술|넓은 입술|작은 입술|하트형|비대칭]",
  "faceShape": "[oval|round|square|heart|oblong|diamond]",
  "faceShapeLabel": "[계란형|둥근형|각진형|하트형|긴 얼굴|다이아몬드]",
  "overallScore": [0-100 피부 상태 종합 점수],
  "metrics": [
    {"id": "skinTexture", "label": "피부 결", "value": [0-100], "status": "[good|normal|warning]", "description": "[피부 결 상태]"},
    {"id": "skinTone", "label": "피부톤 균일도", "value": [0-100], "status": "[good|normal|warning]", "description": "[톤 균일성]"},
    {"id": "hydration", "label": "수분감", "value": [0-100], "status": "[good|normal|warning]", "description": "[피부 수분]"},
    {"id": "poreVisibility", "label": "모공 상태", "value": [0-100], "status": "[good|normal|warning]", "description": "[모공 눈에 띄는 정도 - 높을수록 덜 보임]"},
    {"id": "oilBalance", "label": "유수분 밸런스", "value": [0-100], "status": "[good|normal|warning]", "description": "[유분/수분 균형]"}
  ],
  "concerns": ["[피부 고민1: dark-circles|redness|uneven-tone|large-pores|oily-tzone|dry-patches|acne-scars|fine-lines]", "[피부 고민2]"],
  "insight": "[사용자의 얼굴 특성과 피부 상태에 대한 맞춤 인사이트 2-3문장]",
  "recommendedStyles": ["[추천 스타일1: natural|glam|cute|chic|vintage|edgy]", "[추천 스타일2]", "[추천 스타일3]"],
  "colorRecommendations": [
    {
      "category": "foundation",
      "categoryLabel": "파운데이션",
      "colors": [
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"}
      ]
    },
    {
      "category": "lip",
      "categoryLabel": "립",
      "colors": [
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"},
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"},
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"}
      ]
    },
    {
      "category": "eyeshadow",
      "categoryLabel": "아이섀도",
      "colors": [
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"},
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"},
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"}
      ]
    },
    {
      "category": "blush",
      "categoryLabel": "블러셔",
      "colors": [
        {"name": "[색상명]", "hex": "[#XXXXXX]", "description": "[설명]"}
      ]
    }
  ],
  "makeupTips": [
    {"category": "베이스", "tips": ["[팁1]", "[팁2]"]},
    {"category": "아이 메이크업", "tips": ["[팁1]", "[팁2]"]},
    {"category": "립 메이크업", "tips": ["[팁1]", "[팁2]"]},
    {"category": "컨투어링", "tips": ["[팁1]", "[팁2]"]}
  ],
  "personalColorConnection": {
    "season": "[예상 퍼스널 컬러 시즌]",
    "compatibility": "[high|medium|low]",
    "note": "[퍼스널 컬러 진단과의 연동 안내]"
  },
  "analysisReliability": "[high|medium|low]",
  "imageQuality": {
    "lightingCondition": "[natural|artificial|mixed]",
    "faceVisible": [true|false],
    "makeupDetected": [true|false]
  }
}

⚠️ 언더톤별 색상 추천 가이드:
- 웜톤: 코랄, 오렌지, 브릭레드, 골드브라운, 피치계열
- 쿨톤: 로즈핑크, 버건디, 플럼, 로즈골드, 라벤더계열
- 뉴트럴: 모브핑크, 로지브라운, 토프, 샴페인, 베리계열`;

/**
 * M-1 메이크업 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 5초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 메이크업 분석 결과
 */
export async function analyzeMakeup(imageBase64: string): Promise<GeminiMakeupAnalysisResult> {
  // Mock 결과를 GeminiMakeupAnalysisResult로 변환
  const convertMockToResult = (mock: MockMakeupAnalysisResult): GeminiMakeupAnalysisResult => ({
    undertone: mock.undertone,
    undertoneLabel: mock.undertoneLabel,
    eyeShape: mock.eyeShape,
    eyeShapeLabel: mock.eyeShapeLabel,
    lipShape: mock.lipShape,
    lipShapeLabel: mock.lipShapeLabel,
    faceShape: mock.faceShape,
    faceShapeLabel: mock.faceShapeLabel,
    overallScore: mock.overallScore,
    metrics: mock.metrics,
    concerns: mock.concerns,
    insight: mock.insight,
    recommendedStyles: mock.recommendedStyles,
    colorRecommendations: mock.colorRecommendations.map((cr) => ({
      category: cr.category,
      categoryLabel: cr.categoryLabel,
      colors: cr.colors,
    })),
    makeupTips: mock.makeupTips,
    personalColorConnection: mock.personalColorConnection,
    analysisReliability: mock.analysisReliability,
    imageQuality: {
      lightingCondition: 'natural',
      faceVisible: true,
      makeupDetected: false,
    },
  });

  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[M-1] Using mock (FORCE_MOCK_AI=true)');
    const mockResult = generateMockMakeupAnalysisResult();
    return convertMockToResult(mockResult);
  }

  if (!genAI) {
    geminiLogger.warn('[M-1] Gemini not configured, using mock');
    const mockResult = generateMockMakeupAnalysisResult();
    return convertMockToResult(mockResult);
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (5초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([MAKEUP_ANALYSIS_PROMPT, imagePart]),
          5000,
          '[M-1] Makeup analysis timeout'
        ),
      2,
      1000
    );

    const response = await result.response;
    const text = response.text();

    geminiLogger.info('[M-1] Makeup analysis completed');
    return parseJsonResponse<GeminiMakeupAnalysisResult>(text);
  } catch (error) {
    geminiLogger.error('[M-1] Gemini error, falling back to mock:', error);
    const mockResult = generateMockMakeupAnalysisResult();
    return convertMockToResult(mockResult);
  }
}
