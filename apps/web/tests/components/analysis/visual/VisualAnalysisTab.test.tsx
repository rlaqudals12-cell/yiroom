/**
 * VisualAnalysisTab — 폴백 정직 노출 분기 테스트
 *
 * @description AI 불변식: 랜드마크가 Mock 폴백이면 멜라닌/헤모글로빈 수치를
 *   실측처럼 노출하지 않고 참고용 안내(heatmap-fallback-notice)로 대체해야 한다.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// 분석 파이프라인 모킹 — 폴백 여부를 결정론적으로 제어
vi.mock('@/lib/analysis', () => ({
  analyzeDeviceCapability: vi.fn(() => ({ tier: 'high' })),
  extractFaceLandmarks: vi.fn(),
  createFaceMask: vi.fn(() => new Uint8Array(4)),
  analyzeSkinPigments: vi.fn(),
  preloadFaceMesh: vi.fn(),
}));

// 하위 시각화 컴포넌트 모킹 (캔버스 의존 제거)
vi.mock('@/components/analysis/visual/LightModeTab', () => ({
  default: () => <div data-testid="light-mode-tab" />,
  LightModeLegend: () => <div data-testid="light-mode-legend" />,
}));

vi.mock('@/components/analysis/visual/SkinHeatmapCanvas', () => ({
  default: () => <div data-testid="skin-heatmap-canvas" />,
  HeatmapMetrics: ({
    melaninAvg,
    hemoglobinAvg,
  }: {
    melaninAvg: number;
    hemoglobinAvg: number;
  }) => (
    <div data-testid="heatmap-metrics">
      {melaninAvg}/{hemoglobinAvg}
    </div>
  ),
}));

import VisualAnalysisTab from '@/components/analysis/visual/VisualAnalysisTab';
import { analyzeDeviceCapability, extractFaceLandmarks, analyzeSkinPigments } from '@/lib/analysis';

/** 이미지 로드를 즉시 성공시키는 Mock Image */
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';
  naturalWidth = 100;
  naturalHeight = 100;
  width = 100;
  height = 100;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

/** 468개 랜드마크 결과 생성 */
function createLandmarkResult(usedFallback: boolean): {
  landmarks: Array<{ x: number; y: number; z: number }>;
  faceOval: number[];
  leftEye: number[];
  rightEye: number[];
  lips: number[];
  usedFallback: boolean;
} {
  return {
    landmarks: Array.from({ length: 468 }, () => ({ x: 0.5, y: 0.5, z: 0 })),
    faceOval: [0, 1, 2],
    leftEye: [3, 4],
    rightEye: [5, 6],
    lips: [7, 8],
    usedFallback,
  };
}

describe('VisualAnalysisTab — 폴백 분기', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Image', MockImage);
    vi.mocked(analyzeDeviceCapability).mockReturnValue({ tier: 'high' } as never);
    vi.mocked(analyzeSkinPigments).mockResolvedValue({
      pigmentMaps: { melanin: new Float32Array(4), hemoglobin: new Float32Array(4) },
      summary: { melanin_avg: 42.1, hemoglobin_avg: 37.9 },
    } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should hide metrics and show honest notice when landmarks used fallback', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createLandmarkResult(true) as never);

    render(<VisualAnalysisTab imageUrl="https://example.com/face.jpg" />);

    // 분석 완료 대기
    expect(await screen.findByTestId('visual-analysis-tab')).toBeInTheDocument();

    // 지어낸 수치는 노출 금지, 참고용 안내로 대체
    expect(screen.getByTestId('heatmap-fallback-notice')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-metrics')).not.toBeInTheDocument();
  });

  it('should show metrics without notice when detection is real', async () => {
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createLandmarkResult(false) as never);

    render(<VisualAnalysisTab imageUrl="https://example.com/face.jpg" />);

    expect(await screen.findByTestId('visual-analysis-tab')).toBeInTheDocument();

    expect(screen.getByTestId('heatmap-metrics')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-fallback-notice')).not.toBeInTheDocument();
  });

  it('should force useMock on low-tier devices (폴백 안내가 함께 노출됨)', async () => {
    vi.mocked(analyzeDeviceCapability).mockReturnValue({ tier: 'low' } as never);
    // low tier는 useMock 강제 → extractFaceLandmarks가 폴백 플래그를 반환
    vi.mocked(extractFaceLandmarks).mockResolvedValue(createLandmarkResult(true) as never);

    render(<VisualAnalysisTab imageUrl="https://example.com/face.jpg" />);

    expect(await screen.findByTestId('visual-analysis-tab')).toBeInTheDocument();

    // useMock: true로 호출되었는지 확인 (tier=low 강제 경로)
    expect(extractFaceLandmarks).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ useMock: true })
    );
    expect(screen.getByTestId('heatmap-fallback-notice')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-metrics')).not.toBeInTheDocument();
  });
});
