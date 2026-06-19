/**
 * A1: 클라이언트 측정 어댑터 (body-v2 → 통합 분석)
 *
 * 전신 이미지(dataURL)에서 MediaPipe Pose로 실제 측정 비율/체형을 산출한다.
 * 통합 분석 제출 직전 클라이언트에서 1회 호출 → 결과를 API payload(measuredBody)에 첨부 →
 * 서버(runBodyAxis)가 측정값을 Gemini "눈대중 추정"보다 우선 사용한다.
 *
 * 브라우저 전용: detectPose가 MediaPipe CDN에 의존하므로 서버/SSR에서 호출 금지.
 * 모듈 내부 sibling import(barrel 미경유) — barrel↔measure-client 순환 방지 (P8).
 *
 * @see docs/specs/SDD-BODY-V2-INTEGRATED-ACCURACY.md (원자 A1)
 */

import { detectPose } from './pose-detector';
import { calculateBodyRatios } from './ratio-calculator';
import { classifyBodyType } from './type-classifier';
import type { BodyRatios, BodyShapeType } from './types';

export interface MeasuredBody {
  /** 측정 비율 (어깨/허리/힙 폭 추정 등) */
  ratios: BodyRatios;
  /** 측정 기반 체형 (body-v2 5형 — 통합 플로우의 기존 taxonomy와 동일, drop-in) */
  shape: BodyShapeType;
  /** 0~1, 랜드마크 가시성 기반 신뢰도 */
  confidence: number;
}

/**
 * 전신 이미지에서 측정 비율/체형을 산출한다.
 * 실패(랜드마크 부족·CDN 미로드·검출 실패 등) 시 null 반환(throw 금지) → 서버가 Gemini로 폴백.
 */
export async function measureBodyClient(imageDataUrl: string): Promise<MeasuredBody | null> {
  try {
    const pose = await detectPose(imageDataUrl);
    if (!pose || pose.landmarks.length === 0) {
      return null;
    }

    const ratios = calculateBodyRatios(pose);
    const shape = classifyBodyType(ratios);

    return {
      ratios,
      shape,
      confidence: pose.overallVisibility,
    };
  } catch (error) {
    // 측정 실패는 정상 경로(서버가 Gemini 추정으로 폴백) — throw 대신 null
    console.error('[measureBodyClient] 측정 실패, Gemini 추정으로 폴백:', error);
    return null;
  }
}
