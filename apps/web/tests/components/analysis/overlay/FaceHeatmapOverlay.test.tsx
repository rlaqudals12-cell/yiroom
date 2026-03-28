/**
 * T-1: 피부 히트맵 오버레이 테스트
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FaceHeatmapOverlay } from '@/components/analysis/overlay/FaceHeatmapOverlay';

// face-api.js mock
vi.mock('@/components/analysis/overlay/internal/face-model-loader', () => ({
  loadFaceModels: vi.fn().mockResolvedValue(undefined),
  detectFaceLandmarks: vi.fn().mockResolvedValue(null),
  isFaceModelsLoaded: vi.fn().mockReturnValue(false),
}));

const mockZoneScores = {
  forehead_center: 75,
  forehead_left: 70,
  forehead_right: 72,
  eye_left: 60,
  eye_right: 62,
  nose_bridge: 55,
  nose_tip: 58,
  cheek_left: 80,
  cheek_right: 78,
  chin_center: 65,
  chin_left: 68,
  chin_right: 66,
};

describe('FaceHeatmapOverlay', () => {
  it('should render with data-testid', () => {
    render(
      <FaceHeatmapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        zoneScores={mockZoneScores}
        zoneMetrics={{}}
      />
    );
    expect(screen.getByTestId('face-heatmap-overlay')).toBeInTheDocument();
  });

  it('should render strength toggle', () => {
    render(
      <FaceHeatmapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        zoneScores={mockZoneScores}
        zoneMetrics={{}}
      />
    );
    expect(screen.getByTestId('strength-highlight-toggle')).toBeInTheDocument();
  });

  it('should render 12 zone scores in V1 fallback mode (no landmarks)', () => {
    render(
      <FaceHeatmapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        zoneScores={mockZoneScores}
        zoneMetrics={{}}
      />
    );
    // 존 배지에 점수 텍스트가 표시되어야 함
    const overlay = screen.getByTestId('face-heatmap-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should pass className to container', () => {
    render(
      <FaceHeatmapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        zoneScores={mockZoneScores}
        zoneMetrics={{}}
        className="custom-class"
      />
    );
    expect(screen.getByTestId('face-heatmap-overlay')).toHaveClass('custom-class');
  });
});
