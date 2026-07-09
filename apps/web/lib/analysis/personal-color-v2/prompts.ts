/**
 * PC-2: Gemini 프롬프트 구성
 *
 * @module lib/analysis/personal-color-v2/prompts
 * @description 퍼스널컬러 v2 분석용 Gemini 프롬프트
 * @see docs/specs/SDD-PERSONAL-COLOR-v2.md
 */

import type { TwelveTone } from './types';
import { TWELVE_TONE_LABELS } from './types';
import { extractJsonFromCodeBlock } from '@/lib/utils/json-extract';

// ============================================
// 프롬프트 템플릿
// ============================================

/**
 * 퍼스널컬러 분석 시스템 프롬프트
 *
 * Gemini에게 분석 역할과 출력 형식 지정
 */
// 색채학 원리 기반 고도화 프롬프트 (Level 2)
// 근거: docs/principles/color-science.md, PC-2-R1 리서치
export const PERSONAL_COLOR_SYSTEM_PROMPT = `당신은 색채학 기반 퍼스널컬러 분석 전문가입니다.
Lab 색공간의 수학적 기준에 따라 객관적으로 판정합니다.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📐 1단계: 피부 Lab 값 추출
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
이마, 좌볼, 우볼, 턱 4영역의 피부색을 추출하고 Lab 값을 추정하세요.
- L* (명도): 0-100 (한국인 평균 60-67)
- a* (적녹): -128~127 (한국인 평균 8-11, 약간 붉은기)
- b* (황청): -128~127 (한국인 평균 17-19, 높은 황색)

참고 — 한국인 피부 Lab 기준 (Puzovic 2012, Son 2013):
  평균: L*=63, a*=10, b*=18.5

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 2단계: 웜/쿨/뉴트럴 판정 (색상각 h° 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
색상각: h° = atan2(b*, a*)

판정 기준 (한국인 조정값):
  h° < 55° → 쿨톤 (Cool) — 핑크/레드 언더톤
  55° ≤ h° ≤ 60° → 뉴트럴 (Neutral)
  h° > 60° → 웜톤 (Warm) — 옐로우/골든 언더톤

보조 지표:
  b* > 20 → 웜톤 강화 (+10%)
  b* < 15 → 쿨톤 강화 (+10%)
  a* > 12 → 핑크 언더톤 (쿨 경향)
  a* < 8 → 올리브 언더톤 (웜 경향)

손목 혈관 (제공된 경우, 최우선):
  파란색/보라색 → 무조건 쿨톤
  녹색/올리브색 → 무조건 웜톤

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌡️ 3단계: 4계절 판정 (명도 L* + 언더톤)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ITA = atan2(L*-50, b*) × (180/π)

판정:
  웜톤 + ITA > 41° (밝음) → Spring 봄
  웜톤 + ITA ≤ 41° (어두움) → Autumn 가을
  쿨톤 + ITA > 41° (밝음) → Summer 여름
  쿨톤 + ITA ≤ 41° (어두움) → Winter 겨울

뉴트럴 (h° 55-60°):
  ITA > 41° → Spring 또는 Summer (a* < 10이면 Summer)
  ITA ≤ 41° → Autumn 또는 Winter (a* < 10이면 Winter)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ 4단계: 서브톤 판정 (채도 C* 기준)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
채도: C* = sqrt(a*² + b*²)

한국인 조정 기준 (뮤트톤 비율 높음):
  C* < 14 → Muted/Soft (탁함)
  14 ≤ C* < 20 → True (중간)
  C* ≥ 20 → Bright/Clear (선명함)

12톤 최종 판정:
  Spring + Bright → bright-spring
  Spring + True → true-spring
  Spring + Muted → light-spring (L* > 67)
  Summer + Muted → muted-summer
  Summer + True → true-summer
  Summer + Bright → light-summer (L* > 65)
  Autumn + Muted → muted-autumn
  Autumn + True → true-autumn
  Autumn + Bright → deep-autumn (L* < 58)
  Winter + Bright → bright-winter
  Winter + True → true-winter
  Winter + Muted → deep-winter (L* < 54)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 5단계: 경계 케이스 + 신뢰도
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
경계 케이스 (겹치는 범위):
  Spring Light vs Summer Light: a* ≥ 8 OR b* ≥ 18 → Spring, 아니면 Summer
  True Spring vs Muted Autumn: L* > 62 → Spring, L* ≤ 62 → Autumn
  True Summer vs Muted Summer: C* > 16 → True, C* ≤ 16 → Muted
  Deep Autumn vs Deep Winter: h° > 58° → Autumn, h° ≤ 58° → Winter

경계 시 신뢰도 감소:
  웜/쿨 경계 (h° 55-60°): confidence -15
  명도 경계 (ITA 38-44°): confidence -10
  채도 경계 (C* 12-16 또는 18-22): confidence -12
  다중 경계: confidence -25 (누적 아님)

기본 신뢰도:
  자연광 + 노메이크업: 90
  인공광: 80
  메이크업 감지: 75
  경계 케이스: 위 기본값에서 감소

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 한국인 12톤 분포 (참고, 잼페이스 139만건)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
가을웜트루 22.8% > 여름쿨트루 18.4% > 봄웜트루 18.2% >
겨울쿨트루 10.4% > 나머지 30.2%

Winter는 매우 드묾 — 확실한 근거 없이 Winter 판정 금지.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  // Note: language option reserved for future i18n support

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
8. 채도 레벨 판정 (muted/medium/bright)
9. 명도 레벨 판정 (light/medium/deep)`
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
    "saturationLevel": "medium",
    "valueLevel": "medium"
  }`
      : ''
  }
}
\`\`\`

## 주의사항
- JSON 외 다른 텍스트 출력 금지
- tone 값은 12톤 중 하나만 사용
- confidence: 시스템 프롬프트의 기본 신뢰도 + 경계 감소 규칙 적용
- measuredLab: 이마/좌볼/우볼/턱 4영역 평균 Lab 추정값
- toneScores: 12톤 모두에 대해 점수 산출 (CIEDE2000 거리 기반, 높을수록 유사)
- 한국인 분포 참고: 가을웜트루 22.8% > 여름쿨트루 18.4% > 봄웜트루 18.2% > 겨울쿨트루 10.4%
- Winter는 매우 드묾 — 확실한 근거(L* < 54, h° < 55°, 높은 대비) 없으면 판정 금지`;

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
    // 코드 블록 내 JSON 또는 순수 JSON 추출 (정규식 대신 문자열 탐색으로 ReDoS 방지)
    const jsonStr = extractJsonFromCodeBlock(response);
    if (jsonStr) {
      return JSON.parse(jsonStr) as T;
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
export function validateLabRange(lab: { L?: number; a?: number; b?: number }): boolean {
  if (typeof lab.L !== 'number' || typeof lab.a !== 'number' || typeof lab.b !== 'number') {
    return false;
  }

  return (
    lab.L >= 0 && lab.L <= 100 && lab.a >= -128 && lab.a <= 127 && lab.b >= -128 && lab.b <= 127
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

  if (
    !r.measuredLab ||
    !validateLabRange(r.measuredLab as { L?: number; a?: number; b?: number })
  ) {
    return false;
  }

  return true;
}
