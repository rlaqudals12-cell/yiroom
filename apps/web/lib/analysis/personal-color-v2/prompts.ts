/**
 * PC-2: Gemini 프롬프트 구성
 *
 * @module lib/analysis/personal-color-v2/prompts
 * @description 퍼스널컬러 v2 분석용 Gemini 프롬프트
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import type { TwelveTone } from './types';
import { TWELVE_TONE_LABELS } from './types';

// ============================================
// 프롬프트 템플릿
// ============================================

/**
 * 퍼스널컬러 분석 시스템 프롬프트
 *
 * Gemini에게 분석 역할과 출력 형식 지정
 */
export const PERSONAL_COLOR_SYSTEM_PROMPT = `당신은 전문 퍼스널컬러 분석가입니다.

## 역할
- 이미지에서 피부톤을 정밀 분석
- Lab 색공간 기반 12톤 시스템으로 분류
- 과학적 근거에 기반한 객관적 분석 제공

## 12톤 시스템
4계절(Spring, Summer, Autumn, Winter) × 3서브타입:
- Spring: light-spring, true-spring, bright-spring
- Summer: light-summer, true-summer, muted-summer
- Autumn: muted-autumn, true-autumn, deep-autumn
- Winter: deep-winter, true-winter, bright-winter

## 분석 기준
1. 피부톤 밝기 (L*): 밝음/중간/어두움
2. 채도 (Chroma): 선명함/중간/탁함
3. 언더톤 (Hue, b*): 웜톤/쿨톤/뉴트럴
4. ITA (Individual Typology Angle): 피부 밝기 지표

## 출력 형식
반드시 아래 JSON 형식으로만 응답하세요. 다른 텍스트 없이 JSON만 출력하세요.`;

/**
 * 퍼스널컬러 분석 메인 프롬프트 생성
 *
 * @param options - 프롬프트 옵션
 * @returns 분석 프롬프트 문자열
 */
export function generateAnalysisPrompt(options?: {
  includeDetailedAnalysis?: boolean;
  language?: 'ko' | 'en';
}): string {
  const includeDetailed = options?.includeDetailedAnalysis ?? true;
  const lang = options?.language ?? 'ko';

  const basePrompt = `## 분석 요청
첨부된 얼굴 이미지의 퍼스널컬러를 분석해주세요.

## 분석 항목
1. 이마, 볼, 턱 영역의 피부톤 추출
2. Lab 색공간 값 추정 (L*: 0-100, a*: -128~127, b*: -128~127)
3. 언더톤 판정 (warm/cool/neutral)
4. 12톤 분류
5. 신뢰도 산출 (0-100)`;

  const detailedSection = includeDetailed
    ? `
6. 머리카락 색상 Lab 추정 (선택)
7. 눈 색상 Lab 추정 (선택)
8. 대비 레벨 판정 (low/medium/high)
9. 채도 레벨 판정 (muted/medium/bright)
10. 명도 레벨 판정 (light/medium/deep)`
    : '';

  const outputFormat = `
## 출력 JSON 형식
\`\`\`json
{
  "tone": "true-spring",
  "season": "spring",
  "subtype": "true",
  "undertone": "warm",
  "confidence": 85,
  "measuredLab": {
    "L": 68.5,
    "a": 10.2,
    "b": 22.8
  },
  "toneScores": {
    "light-spring": 72.5,
    "true-spring": 88.3,
    "bright-spring": 65.0
    // ... 12톤 모두 포함
  }${
    includeDetailed
      ? `,
  "detailedAnalysis": {
    "hairColorLab": { "L": 28, "a": 3, "b": 8 },
    "eyeColorLab": { "L": 32, "a": 2, "b": 5 },
    "contrastLevel": "medium",
    "saturationLevel": "medium",
    "valueLevel": "medium"
  }`
      : ''
  }
}
\`\`\`

## 주의사항
- JSON 외 다른 텍스트 출력 금지
- 톤 값은 12톤 중 하나만 사용
- confidence는 분석 확신도 (불확실하면 70 이하)
- Lab 값은 실제 측정값 기반 추정`;

  return `${basePrompt}${detailedSection}\n${outputFormat}`;
}

/**
 * 드레이핑 시뮬레이션 프롬프트 생성
 *
 * 특정 색상이 피부톤과 어울리는지 분석
 *
 * @param colors - 테스트할 색상 HEX 배열
 * @returns 드레이핑 분석 프롬프트
 */
export function generateDrapingPrompt(colors: string[]): string {
  const colorList = colors.map((c, i) => `${i + 1}. ${c}`).join('\n');

  return `## 드레이핑 분석 요청
첨부된 얼굴 이미지와 아래 색상들의 조화도를 분석해주세요.

## 테스트 색상 (HEX)
${colorList}

## 분석 기준
각 색상에 대해:
1. 피부톤과의 조화도 (0-100)
2. 얼굴이 밝아 보이는지 / 어두워 보이는지
3. 피부 톤이 균일해 보이는지 / 불균일해 보이는지

## 출력 JSON 형식
\`\`\`json
{
  "results": [
    {
      "color": "#FF5733",
      "harmonyScore": 85,
      "brightnessEffect": "brighter",
      "evenness": "more_even",
      "recommendation": "강력 추천"
    }
  ],
  "bestColor": "#FF5733",
  "worstColor": "#2F4F4F"
}
\`\`\``;
}

/**
 * 메이크업 추천 프롬프트 생성
 *
 * @param tone - 분류된 12톤
 * @returns 메이크업 추천 프롬프트
 */
export function generateMakeupRecommendationPrompt(tone: TwelveTone): string {
  const toneLabel = TWELVE_TONE_LABELS[tone];

  return `## 메이크업 컬러 추천 요청
${toneLabel}(${tone}) 타입에 어울리는 메이크업 컬러를 추천해주세요.

## 추천 항목
1. 립 컬러 (3-4개 HEX)
2. 아이섀도 팔레트 (4개 HEX)
3. 블러쉬 컬러 (2-3개 HEX)
4. 하이라이터 톤 (gold/silver/rose)

## 출력 JSON 형식
\`\`\`json
{
  "lipColors": ["#FF6B6B", "#E57373", "#FFAB91"],
  "eyeshadowPalette": ["#FFE4E1", "#FFF0F5", "#E8D5B7", "#C5E1A5"],
  "blushColors": ["#FFCDD2", "#F8BBD9"],
  "highlighterTone": "gold",
  "tips": "화사한 코랄 톤으로 생기있는 메이크업을 연출하세요."
}
\`\`\``;
}

/**
 * 스타일링 추천 프롬프트 생성
 *
 * @param tone - 분류된 12톤
 * @returns 스타일링 추천 프롬프트
 */
export function generateStylingRecommendationPrompt(tone: TwelveTone): string {
  const toneLabel = TWELVE_TONE_LABELS[tone];

  return `## 스타일링 컬러 추천 요청
${toneLabel}(${tone}) 타입에 어울리는 패션 스타일링 컬러를 추천해주세요.

## 추천 항목
1. 상의 메인 컬러 (4-6개 HEX)
2. 하의 추천 컬러 (3-4개 HEX)
3. 아우터 추천 컬러 (3-4개 HEX)
4. 악세서리 금속 (gold/silver/rose-gold)
5. 피해야 할 컬러 (3-4개 HEX)

## 출력 JSON 형식
\`\`\`json
{
  "topColors": ["#FFEFD5", "#FFD1DC", "#FFFACD", "#E0FFFF"],
  "bottomColors": ["#F5F5DC", "#FAF0E6", "#FFF8DC"],
  "outerColors": ["#F5F5F5", "#FFFAF0", "#FDF5E6"],
  "metalRecommendation": "gold",
  "avoidColors": ["#2F4F4F", "#191970", "#8B0000"],
  "seasonalTips": {
    "spring": "파스텔 톤의 가벼운 소재로 봄 느낌 연출",
    "summer": "시원한 컬러의 린넨 소재 추천",
    "autumn": "따뜻한 니트와 코듀로이 소재 활용",
    "winter": "화사한 컬러로 무거움 방지"
  }
}
\`\`\``;
}

// ============================================
// JSON 파싱 유틸리티
// ============================================

/**
 * Gemini 응답에서 JSON 추출
 *
 * 코드 블록 내 JSON 또는 순수 JSON 파싱
 *
 * @param response - Gemini 응답 문자열
 * @returns 파싱된 객체 또는 null
 */
export function extractJsonFromResponse<T>(response: string): T | null {
  try {
    // 코드 블록 내 JSON 추출 시도
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    }

    // 순수 JSON 파싱 시도
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }

    return null;
  } catch {
    console.error('[PC-2] JSON 파싱 실패:', response.slice(0, 200));
    return null;
  }
}

/**
 * 12톤 값 검증
 *
 * @param tone - 검증할 톤 문자열
 * @returns 유효한 TwelveTone 또는 null
 */
export function validateToneValue(tone: string): TwelveTone | null {
  const validTones: TwelveTone[] = [
    'light-spring',
    'true-spring',
    'bright-spring',
    'light-summer',
    'true-summer',
    'muted-summer',
    'muted-autumn',
    'true-autumn',
    'deep-autumn',
    'deep-winter',
    'true-winter',
    'bright-winter',
  ];

  return validTones.includes(tone as TwelveTone) ? (tone as TwelveTone) : null;
}

/**
 * Lab 값 범위 검증
 *
 * @param lab - Lab 객체
 * @returns 유효 여부
 */
export function validateLabRange(lab: {
  L?: number;
  a?: number;
  b?: number;
}): boolean {
  if (typeof lab.L !== 'number' || typeof lab.a !== 'number' || typeof lab.b !== 'number') {
    return false;
  }

  return (
    lab.L >= 0 && lab.L <= 100 &&
    lab.a >= -128 && lab.a <= 127 &&
    lab.b >= -128 && lab.b <= 127
  );
}

/**
 * 분석 결과 검증
 *
 * @param result - Gemini 응답 파싱 결과
 * @returns 검증 성공 여부
 */
export function validateAnalysisResult(result: unknown): boolean {
  if (typeof result !== 'object' || result === null) {
    return false;
  }

  const r = result as Record<string, unknown>;

  // 필수 필드 검증
  if (!r.tone || !validateToneValue(r.tone as string)) {
    return false;
  }

  if (typeof r.confidence !== 'number' || r.confidence < 0 || r.confidence > 100) {
    return false;
  }

  if (!r.measuredLab || !validateLabRange(r.measuredLab as { L?: number; a?: number; b?: number })) {
    return false;
  }

  return true;
}
