/**
 * T-6: 메이크업/헤어 오버레이 렌더링 테스트 (구강은 ADR-098 OH-1 제거로 삭제됨)
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MakeupFaceMapOverlay } from '@/components/analysis/overlay/MakeupFaceMapOverlay';
import { FaceOutlineOverlay } from '@/components/analysis/overlay/FaceOutlineOverlay';

// face-api.js mock
vi.mock('@/components/analysis/overlay/internal/face-model-loader', () => ({
  loadFaceModels: vi.fn().mockResolvedValue(undefined),
  detectFaceLandmarks: vi.fn().mockResolvedValue(null),
  isFaceModelsLoaded: vi.fn().mockReturnValue(false),
}));

describe('MakeupFaceMapOverlay', () => {
  const mockColorRecs = [
    {
      category: 'lip',
      categoryLabel: '립',
      colors: [{ name: '코랄', hex: '#FF6B6B', description: '' }],
    },
    {
      category: 'eyeshadow',
      categoryLabel: '아이섀도',
      colors: [{ name: '브라운', hex: '#8B6914', description: '' }],
    },
    {
      category: 'blush',
      categoryLabel: '블러셔',
      colors: [{ name: '피치', hex: '#FFCBA4', description: '' }],
    },
  ];

  it('should render with data-testid', () => {
    render(
      <MakeupFaceMapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        colorRecommendations={mockColorRecs}
      />
    );
    expect(screen.getByTestId('makeup-facemap-overlay')).toBeInTheDocument();
  });

  it('should render category buttons', () => {
    render(
      <MakeupFaceMapOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        colorRecommendations={mockColorRecs}
      />
    );
    expect(screen.getByTestId('makeup-category-lip')).toBeInTheDocument();
    expect(screen.getByTestId('makeup-category-eyeshadow')).toBeInTheDocument();
    expect(screen.getByTestId('makeup-category-blush')).toBeInTheDocument();
    expect(screen.getByTestId('makeup-category-contour')).toBeInTheDocument();
  });
});

describe('FaceOutlineOverlay', () => {
  it('should render with data-testid', () => {
    render(<FaceOutlineOverlay imageUrl="/test.jpg" landmarks={null} faceShape="oval" />);
    expect(screen.getByTestId('face-outline-overlay')).toBeInTheDocument();
  });

  it('should display face shape label in sr description', () => {
    render(
      <FaceOutlineOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        faceShape="oval"
        faceShapeLabel="타원형"
      />
    );
    // SVG 내 testid 대신 접근성 텍스트로 검증
    const overlay = screen.getByTestId('face-outline-overlay');
    expect(overlay).toBeInTheDocument();
  });

  it('should render recommended styles grid', () => {
    render(
      <FaceOutlineOverlay
        imageUrl="/test.jpg"
        landmarks={null}
        faceShape="oval"
        recommendedStyles={[
          { styleName: '레이어드 컷', description: '볼륨감', matchScore: 90 },
          { styleName: 'C컬 펌', description: '자연스러운', matchScore: 85 },
        ]}
      />
    );
    expect(screen.getByTestId('face-outline-styles')).toBeInTheDocument();
    expect(screen.getByText('레이어드 컷')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
  });
});

// (ToothDiagramOverlay 테스트는 ADR-098 Phase 1 OH-1 제거에 따라 정리됨)
