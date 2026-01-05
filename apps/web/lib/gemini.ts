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
  metrics: Array<{
    id: string;
    name: string;
    value: number;
    status: 'good' | 'normal' | 'warning';
    description: string;
  }>;
  insight: string;
  recommendedIngredients: Array<{
    name: string;
    reason: string;
  }>;
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
 * S-1 피부 분석 프롬프트
 */
const SKIN_ANALYSIS_PROMPT = `당신은 전문 피부 분석 AI입니다. 업로드된 얼굴 이미지를 분석하여 피부 상태를 평가해주세요.

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "overallScore": [0-100 사이 종합 점수],
  "metrics": [
    {"id": "hydration", "name": "수분도", "value": [0-100], "status": "good|normal|warning", "description": "[피부 수분 상태 설명]"},
    {"id": "oil", "name": "유분도", "value": [0-100], "status": "good|normal|warning", "description": "[피지 분비 상태 설명]"},
    {"id": "pores", "name": "모공", "value": [0-100], "status": "good|normal|warning", "description": "[모공 상태 설명]"},
    {"id": "wrinkles", "name": "주름", "value": [0-100], "status": "good|normal|warning", "description": "[주름 상태 설명]"},
    {"id": "elasticity", "name": "탄력", "value": [0-100], "status": "good|normal|warning", "description": "[탄력 상태 설명]"},
    {"id": "pigmentation", "name": "색소침착", "value": [0-100], "status": "good|normal|warning", "description": "[색소침착 상태 설명]"},
    {"id": "trouble", "name": "트러블", "value": [0-100], "status": "good|normal|warning", "description": "[트러블 상태 설명]"}
  ],
  "insight": "[피부 상태에 대한 맞춤 인사이트 1-2문장]",
  "recommendedIngredients": [
    {"name": "[성분명]", "reason": "[추천 이유]"},
    {"name": "[성분명]", "reason": "[추천 이유]"}
  ]
}

점수 기준:
- 71-100: good (좋음)
- 41-70: normal (보통)
- 0-40: warning (주의)

높은 값이 좋은 상태를 의미합니다.
추천 성분은 피부 상태에 맞는 2-3개를 선택해주세요.`;

/**
 * C-1 체형 분석 프롬프트 (3타입 골격진단 시스템)
 * 일본 골격진단/카카오스타일 기반 3타입 분류
 */
const BODY_ANALYSIS_PROMPT = `당신은 전문 체형 분석 AI입니다. 업로드된 전신 이미지를 분석하여 골격 타입을 진단해주세요.

3가지 골격 체형 타입 (골격진단 기반):

S (스트레이트/Straight) - 입체적이고 탄탄한 실루엣
- 상체에 볼륨감이 있고 근육이 잘 붙는 체형
- 어깨선이 직선적이고 허리 위치가 높음
- 목이 짧은 편, 쇄골이 잘 안 보임
- 손목과 발목이 굵은 편
- 어울리는 스타일: 심플, 베이직, I라인, 정장

W (웨이브/Wave) - 부드럽고 여성스러운 실루엣
- 하체에 볼륨감이 있고 곡선미가 돋보이는 체형
- 어깨선이 둥글고 허리가 잘록함
- 목이 긴 편, 쇄골이 가늘게 보임
- 손목과 발목이 가는 편
- 어울리는 스타일: 페미닌, X라인, 하이웨이스트, 프릴

N (내추럴/Natural) - 자연스럽고 골격감 있는 실루엣
- 뼈대가 크고 관절이 두드러지는 체형
- 어깨가 넓고 프레임이 큰 편
- 쇄골이 굵게 보임
- 손목, 손가락 관절이 두드러짐
- 어울리는 스타일: 캐주얼, 오버핏, 레이어드

판단 기준:
1. 상체/하체 볼륨 비율
2. 어깨선의 형태 (직선/둥근/넓은)
3. 쇄골과 관절의 두드러짐
4. 전체적인 골격 프레임 크기
5. 근육과 지방의 붙는 위치

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "bodyType": "[S|W|N]",
  "bodyTypeLabel": "[스트레이트|웨이브|내추럴]",
  "bodyTypeLabelEn": "[Straight|Wave|Natural]",
  "bodyTypeDescription": "[체형 한줄 설명]",
  "characteristics": "[체형의 구체적인 특징 설명 2-3문장]",
  "keywords": ["키워드1", "키워드2", "키워드3", "키워드4", "키워드5"],
  "measurements": [
    {"name": "어깨", "value": [0-100 상대적 넓이 지수], "description": "[어깨 라인 설명]"},
    {"name": "허리", "value": [0-100 상대적 넓이 지수], "description": "[허리 라인 설명]"},
    {"name": "골반", "value": [0-100 상대적 넓이 지수], "description": "[골반 라인 설명]"}
  ],
  "strengths": ["[강점1]", "[강점2]", "[강점3]", "[강점4]"],
  "avoidStyles": ["[피해야 할 스타일1]", "[피해야 할 스타일2]", "[피해야 할 스타일3]"],
  "insight": "[체형에 맞는 스타일링 인사이트 1-2문장]",
  "styleRecommendations": [
    {"item": "[추천 아이템1]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템2]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템3]", "reason": "[추천 이유]"},
    {"item": "[추천 아이템4]", "reason": "[추천 이유]"}
  ]
}

측정값은 상대적 비율 지수입니다 (0-100).`;

/**
 * PC-1 퍼스널 컬러 분석 프롬프트
 * 얼굴 이미지와 손목 이미지를 통합 분석
 */
const PERSONAL_COLOR_ANALYSIS_PROMPT = `당신은 전문 퍼스널 컬러 분석 AI입니다. 업로드된 이미지를 분석하여 퍼스널 컬러를 진단해주세요.

4가지 계절 타입:
- spring (봄 웜톤): 밝고 화사한 웜톤. 피부에 황금빛 광채, 밝고 맑은 컬러가 어울림
- summer (여름 쿨톤): 부드럽고 우아한 쿨톤. 피부에 핑크빛, 뮤트하고 소프트한 컬러가 어울림
- autumn (가을 웜톤): 깊고 풍부한 웜톤. 피부에 따뜻한 베이지톤, 차분하고 깊은 컬러가 어울림
- winter (겨울 쿨톤): 선명하고 시크한 쿨톤. 피부에 차가운 느낌, 비비드하고 강렬한 컬러가 어울림

이미지 분석 시 확인할 요소:
1. 피부톤 (황톤/핑크톤/중립)
2. 입술 본연의 색상
3. 눈동자 색상
4. 피부의 광택과 깊이감
5. 손목 혈관색 (제공된 경우): 파란색/보라색 = 쿨톤, 녹색 = 웜톤

웜/쿨 판단 기준 (우선순위):
1. 손목 혈관 색상 (가장 객관적)
2. 피부 언더톤 (황톤 vs 핑크톤)
3. 입술과 눈동자 색상

다음 JSON 형식으로만 응답해주세요 (다른 텍스트 없이 JSON만):

{
  "seasonType": "[spring|summer|autumn|winter]",
  "seasonLabel": "[봄 웜톤|여름 쿨톤|가을 웜톤|겨울 쿨톤]",
  "seasonDescription": "[해당 계절 타입에 대한 설명]",
  "tone": "[warm|cool]",
  "depth": "[light|deep]",
  "confidence": [85-95 사이의 신뢰도 점수],
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
  "insight": "[이 분석 결과에 대한 맞춤 인사이트 1-2문장]"
}

주의사항:
- 신뢰도(confidence)는 이미지 품질을 고려해 85-95% 사이로 설정
- 손목 이미지가 제공된 경우 신뢰도를 5% 높게 설정
- 베스트 컬러는 10개, 워스트 컬러는 5개를 제공
- 립스틱과 의류 추천은 각각 3개씩
- 스타일 키워드는 5개 제공 (예: 화사한, 생기있는, 청순한, 밝은, 발랄한)
- 한국어로 자연스럽게 작성`;

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
 * C-1 체형 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param imageBase64 - Base64 인코딩된 전신 이미지
 * @returns 체형 분석 결과
 */
export async function analyzeBody(imageBase64: string): Promise<GeminiBodyAnalysisResult> {
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
    const imagePart = formatImageForGemini(imageBase64);

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () =>
        withTimeout(
          model.generateContent([BODY_ANALYSIS_PROMPT, imagePart]),
          3000,
          '[C-1] Gemini timeout'
        ),
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
 * PC-1 퍼스널 컬러 분석 실행
 * - FORCE_MOCK_AI 환경변수 지원
 * - API 키 미설정 시 Mock 반환
 * - 3초 타임아웃 + 2회 재시도 후 Mock Fallback
 *
 * @param faceImageBase64 - Base64 인코딩된 얼굴 이미지
 * @param wristImageBase64 - Base64 인코딩된 손목 이미지 (선택적 - 웜/쿨 판단 정확도 향상)
 * @returns 퍼스널 컬러 분석 결과
 */
export async function analyzePersonalColor(
  faceImageBase64: string,
  wristImageBase64?: string
): Promise<GeminiPersonalColorResult> {
  // Mock 모드 확인
  if (FORCE_MOCK) {
    geminiLogger.info('[PC-1] Using mock (FORCE_MOCK_AI=true)');
    return generateMockPersonalColorResult() as unknown as GeminiPersonalColorResult;
  }

  if (!genAI) {
    geminiLogger.warn('[PC-1] Gemini not configured, using mock');
    return generateMockPersonalColorResult() as unknown as GeminiPersonalColorResult;
  }

  try {
    const model = genAI.getGenerativeModel(modelConfig);
    const faceImagePart = formatImageForGemini(faceImageBase64);

    // 프롬프트 구성
    let prompt = PERSONAL_COLOR_ANALYSIS_PROMPT;

    // 이미지 배열 구성
    const contentParts: (string | { inlineData: { mimeType: string; data: string } })[] = [
      prompt,
      faceImagePart,
    ];

    // 손목 이미지가 있으면 추가
    if (wristImageBase64) {
      const wristImagePart = formatImageForGemini(wristImageBase64);
      contentParts.push(wristImagePart);
      // 프롬프트에 손목 이미지 분석 안내 추가
      prompt += `\n\n첨부된 두 번째 이미지는 손목 안쪽 사진입니다. 혈관 색상을 분석하여 웜톤/쿨톤 판단에 활용해주세요. 파란색/보라색 혈관은 쿨톤, 녹색 혈관은 웜톤을 나타냅니다.`;
      contentParts[0] = prompt;
    }

    // 타임아웃 (3초) + 재시도 (최대 2회) 적용
    const result = await withRetry(
      () => withTimeout(model.generateContent(contentParts), 3000, '[PC-1] Gemini timeout'),
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
