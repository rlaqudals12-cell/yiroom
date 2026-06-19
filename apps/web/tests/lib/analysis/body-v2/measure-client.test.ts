/**
 * A1: measureBodyClient 테스트
 *
 * detectPose는 브라우저/MediaPipe CDN 의존 → mock으로 고정 pose 주입.
 * calculateBodyRatios / classifyBodyType은 실제 실행 → 비율/체형 결정성 검증.
 *
 * @see docs/specs/SDD-BODY-V2-INTEGRATED-ACCURACY.md (A1, §6 Mock/테스트)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PoseDetectionResult } from '@/lib/analysis/body-v2';

// detectPose만 mock (CDN 의존). ratio-calculator가 의존하는 다른 pose-detector 유틸은 실제 유지.
vi.mock('@/lib/analysis/body-v2/pose-detector', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/analysis/body-v2/pose-detector')>();
  return { ...actual, detectPose: vi.fn() };
});

import { detectPose } from '@/lib/analysis/body-v2/pose-detector';
import { generateMockPoseResult } from '@/lib/analysis/body-v2/mock';
import { measureBodyClient } from '@/lib/analysis/body-v2/measure-client';

const detectPoseMock = vi.mocked(detectPose);
const VALID_BODY_SHAPES = ['rectangle', 'inverted-triangle', 'triangle', 'oval', 'hourglass'];

describe('measureBodyClient', () => {
  beforeEach(() => {
    detectPoseMock.mockReset();
  });

  it('고정 랜드마크로 측정 비율/체형/신뢰도를 결정적으로 산출한다', async () => {
    const pose = generateMockPoseResult();
    detectPoseMock.mockResolvedValue(pose);

    const result = await measureBodyClient('data:image/jpeg;base64,AAA');

    expect(result).not.toBeNull();
    expect(typeof result!.ratios.shoulderWidth).toBe('number');
    expect(typeof result!.ratios.waistWidth).toBe('number');
    expect(result!.confidence).toBe(pose.overallVisibility);
    expect(VALID_BODY_SHAPES).toContain(result!.shape);
  });

  it('랜드마크가 없으면 null을 반환한다', async () => {
    detectPoseMock.mockResolvedValue({
      landmarks: [],
      overallVisibility: 0,
      confidence: 0,
    } as PoseDetectionResult);

    const result = await measureBodyClient('data:image/jpeg;base64,AAA');
    expect(result).toBeNull();
  });

  it('검출이 실패(throw)하면 null을 반환한다 (서버 Gemini 폴백)', async () => {
    detectPoseMock.mockRejectedValue(new Error('MediaPipe CDN load failed'));

    const result = await measureBodyClient('data:image/jpeg;base64,AAA');
    expect(result).toBeNull();
  });
});
