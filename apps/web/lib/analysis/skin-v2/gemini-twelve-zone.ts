/**
 * 12존 피부 분석 Gemini 프롬프트 모듈 (T4.5.4)
 *
 * @module lib/analysis/skin-v2/gemini-twelve-zone
 * @description 12존 구조화 JSON 응답을 요청하는 Gemini 프롬프트 및 파싱
 * @see docs/principles/skin-physiology.md
 */

import type { DetailedZoneId } from '@/types/skin-zones';
import type { ZoneMetricsV2, SkinTypeV2 } from './types';
import { extractJsonFromCodeBlock } from '@/lib/utils/json-extract';

// ============================================
// 12존 ID 목록 (검증용)
// ============================================

/** 12존 전체 ID 목록 */
const ALL_DETAILED_ZONE_IDS: DetailedZoneId[] = [
  'forehead_center',
  'forehead_left',
  'forehead_right',
  'eye_left',
  'eye_right',
  'cheek_left',
  'cheek_right',
  'nose_bridge',
  'nose_tip',
  'chin_center',
  'chin_left',
  'chin_right',
];

// ============================================
// 메트릭 키 목록
// ============================================

/** ZoneMetricsV2의 7개 메트릭 키 */
const METRIC_KEYS: (keyof ZoneMetricsV2)[] = [
  'hydration',
  'oiliness',
  'pores',
  'texture',
  'pigmentation',
  'sensitivity',
  'elasticity',
];

/** 누락 메트릭 기본값 (중간값) */
const DEFAULT_METRIC_VALUE = 50;

// ============================================
// 분석 신뢰도 타입
// ============================================

/** 분석 신뢰도 수준 */
type AnalysisReliability = 'high' | 'medium' | 'low';

/** 조명 조건 */
type LightingCondition = 'natural' | 'artificial' | 'mixed';

// ============================================
// 결과 타입
// ============================================

/** Gemini에게 요청하는 12존 응답 구조 */
export interface TwelveZonePromptResult {
  zones: Record<
    string,
    {
      hydration: number;
      oiliness: number;
      pores: number;
      texture: number;
      pigmentation: number;
      sensitivity: number;
      elasticity: number;
    }
  >;
  overallSkinType: string;
  imageQuality: {
    analysisReliability: string;
    lightingCondition: string;
    makeupDetected: boolean;
  };
}

/** 파싱 및 검증 완료된 12존 분석 결과 */
export interface ParsedTwelveZoneResult {
  /** 12존별 메트릭 (검증 + 클램핑 완료) */
  zones: Record<DetailedZoneId, ZoneMetricsV2>;
  /** 피부 타입 */
  skinType: SkinTypeV2;
  /** 이미지 품질 정보 */
  imageQuality: {
    analysisReliability: AnalysisReliability;
    lightingCondition: LightingCondition;
    makeupDetected: boolean;
  };
  /** JSON 파싱 성공 여부 */
  parseSuccess: boolean;
}

// ============================================
// 시스템 프롬프트
// ============================================

/**
 * 12존 피부 분석 시스템 프롬프트
 *
 * Gemini에게 12개 얼굴 존별 피부 메트릭을 요청하는 지시문
 * 영어로 작성 (Gemini 성능 최적화)
 */
export const TWELVE_ZONE_SYSTEM_PROMPT = `You are an expert dermatologist AI specializing in facial skin zone analysis.

## Role
- Analyze facial skin across 12 distinct zones
- Provide numeric scores (0-100) for 7 skin metrics per zone
- Base analysis on visible skin characteristics in the image

## 12 Facial Zones
1. forehead_center — Center forehead (T-zone top, active sebum)
2. forehead_left — Left forehead (hairline contact area)
3. forehead_right — Right forehead (hairline contact area)
4. eye_left — Left periorbital area (dark circles, fine lines)
5. eye_right — Right periorbital area (dark circles, fine lines)
6. cheek_left — Left cheek (redness, pore enlargement)
7. cheek_right — Right cheek (redness, pore enlargement)
8. nose_bridge — Nose bridge (blackheads, dead skin)
9. nose_tip — Nose tip (sebum, pore management)
10. chin_center — Center chin (acne-prone)
11. chin_left — Left jawline (elasticity check)
12. chin_right — Right jawline (elasticity check)

## 7 Metrics Per Zone (all 0-100)
- hydration: Moisture level (100 = very hydrated)
- oiliness: Oil/sebum level (100 = very oily)
- pores: Pore condition (100 = minimal/good pores)
- texture: Skin texture smoothness (100 = very smooth)
- pigmentation: Even skin tone (100 = very even, no spots)
- sensitivity: Sensitivity/irritation level (100 = very sensitive — CAUTION: higher = worse)
- elasticity: Skin firmness/bounce (100 = very elastic)

## Output Format
Respond ONLY with valid JSON. No other text, no markdown code fences, no explanation.`;

// ============================================
// 유저 프롬프트 빌더
// ============================================

/**
 * 12존 분석 유저 프롬프트 생성
 *
 * @param imageBase64 - Base64 인코딩된 얼굴 이미지
 * @returns 유저 메시지 문자열
 */
export function buildTwelveZoneUserPrompt(imageBase64: string): string {
  return `Analyze the attached facial image across all 12 zones.

## Required Output JSON
{
  "zones": {
    "forehead_center": { "hydration": 0-100, "oiliness": 0-100, "pores": 0-100, "texture": 0-100, "pigmentation": 0-100, "sensitivity": 0-100, "elasticity": 0-100 },
    "forehead_left": { ... },
    "forehead_right": { ... },
    "eye_left": { ... },
    "eye_right": { ... },
    "cheek_left": { ... },
    "cheek_right": { ... },
    "nose_bridge": { ... },
    "nose_tip": { ... },
    "chin_center": { ... },
    "chin_left": { ... },
    "chin_right": { ... }
  },
  "overallSkinType": "dry|oily|combination|normal|sensitive",
  "imageQuality": {
    "analysisReliability": "high|medium|low",
    "lightingCondition": "natural|artificial|mixed",
    "makeupDetected": true|false
  }
}

## Rules
- Every zone MUST have all 7 metrics
- All values must be integers 0-100
- overallSkinType must be one of: dry, oily, combination, normal, sensitive
- Output ONLY valid JSON, nothing else

[IMAGE: ${imageBase64.slice(0, 20)}...]`;
}

// ============================================
// 유효한 값 목록
// ============================================

const VALID_SKIN_TYPES: SkinTypeV2[] = ['dry', 'oily', 'combination', 'normal', 'sensitive'];
const VALID_RELIABILITY: AnalysisReliability[] = ['high', 'medium', 'low'];
const VALID_LIGHTING: LightingCondition[] = ['natural', 'artificial', 'mixed'];

// ============================================
// 파싱 유틸리티
// ============================================

/** 값을 0-100 범위로 클램핑 */
function clampMetric(value: unknown): number {
  if (typeof value !== 'number' || isNaN(value)) {
    return DEFAULT_METRIC_VALUE;
  }
  return Math.round(Math.min(100, Math.max(0, value)));
}

/** 존 메트릭 객체를 파싱하고 검증 */
function parseZoneMetrics(raw: unknown): ZoneMetricsV2 {
  if (typeof raw !== 'object' || raw === null) {
    // 전체 누락 — 모든 메트릭 기본값
    return createDefaultMetrics();
  }

  const obj = raw as Record<string, unknown>;
  const result: Record<string, number> = {};

  for (const key of METRIC_KEYS) {
    result[key] = clampMetric(obj[key]);
  }

  return result as unknown as ZoneMetricsV2;
}

/** 기본 메트릭 생성 (모든 값 50) */
function createDefaultMetrics(): ZoneMetricsV2 {
  return {
    hydration: DEFAULT_METRIC_VALUE,
    oiliness: DEFAULT_METRIC_VALUE,
    pores: DEFAULT_METRIC_VALUE,
    texture: DEFAULT_METRIC_VALUE,
    pigmentation: DEFAULT_METRIC_VALUE,
    sensitivity: DEFAULT_METRIC_VALUE,
    elasticity: DEFAULT_METRIC_VALUE,
  };
}

/** 기본 파싱 실패 결과 생성 */
function createFailureResult(): ParsedTwelveZoneResult {
  const zones: Record<string, ZoneMetricsV2> = {};
  for (const zoneId of ALL_DETAILED_ZONE_IDS) {
    zones[zoneId] = createDefaultMetrics();
  }

  return {
    zones: zones as Record<DetailedZoneId, ZoneMetricsV2>,
    skinType: 'normal',
    imageQuality: {
      analysisReliability: 'low',
      lightingCondition: 'mixed',
      makeupDetected: false,
    },
    parseSuccess: false,
  };
}

// ============================================
// 메인 파서
// ============================================

/**
 * Gemini 12존 응답 파싱 및 검증
 *
 * JSON 파싱 실패 시 기본값으로 폴백하며, 누락된 존이나
 * 범위 밖 메트릭도 안전하게 처리
 *
 * @param rawResponse - Gemini의 원시 텍스트 응답
 * @returns 검증된 12존 분석 결과
 */
export function parseTwelveZoneResponse(rawResponse: string): ParsedTwelveZoneResult {
  if (!rawResponse || rawResponse.trim().length === 0) {
    return createFailureResult();
  }

  // JSON 추출 시도 (코드 블록 또는 순수 JSON)
  let parsed: TwelveZonePromptResult | null = null;

  try {
    // 코드 블록 내 JSON 추출 시도
    const extracted = extractJsonFromCodeBlock(rawResponse);
    if (extracted) {
      parsed = JSON.parse(extracted) as TwelveZonePromptResult;
    } else {
      // 순수 JSON 파싱 시도
      parsed = JSON.parse(rawResponse) as TwelveZonePromptResult;
    }
  } catch {
    console.error('[S-2] 12존 Gemini 응답 JSON 파싱 실패:', rawResponse.slice(0, 200));
    return createFailureResult();
  }

  if (!parsed || typeof parsed !== 'object') {
    return createFailureResult();
  }

  // 존 데이터 파싱
  const zones: Record<string, ZoneMetricsV2> = {};
  const rawZones = parsed.zones && typeof parsed.zones === 'object' ? parsed.zones : {};

  for (const zoneId of ALL_DETAILED_ZONE_IDS) {
    const rawZone = (rawZones as Record<string, unknown>)[zoneId];
    zones[zoneId] = parseZoneMetrics(rawZone);
  }

  // 피부 타입 파싱
  const rawSkinType = String(parsed.overallSkinType ?? '').toLowerCase();
  const skinType: SkinTypeV2 = VALID_SKIN_TYPES.includes(rawSkinType as SkinTypeV2)
    ? (rawSkinType as SkinTypeV2)
    : 'normal';

  // 이미지 품질 파싱
  const rawQuality =
    parsed.imageQuality && typeof parsed.imageQuality === 'object' ? parsed.imageQuality : {};

  const rawReliability = String(
    (rawQuality as Record<string, unknown>).analysisReliability ?? ''
  ).toLowerCase();
  const rawLighting = String(
    (rawQuality as Record<string, unknown>).lightingCondition ?? ''
  ).toLowerCase();
  const rawMakeup = (rawQuality as Record<string, unknown>).makeupDetected;

  const imageQuality = {
    analysisReliability: VALID_RELIABILITY.includes(rawReliability as AnalysisReliability)
      ? (rawReliability as AnalysisReliability)
      : ('low' as AnalysisReliability),
    lightingCondition: VALID_LIGHTING.includes(rawLighting as LightingCondition)
      ? (rawLighting as LightingCondition)
      : ('mixed' as LightingCondition),
    makeupDetected: typeof rawMakeup === 'boolean' ? rawMakeup : false,
  };

  return {
    zones: zones as Record<DetailedZoneId, ZoneMetricsV2>,
    skinType,
    imageQuality,
    parseSuccess: true,
  };
}
