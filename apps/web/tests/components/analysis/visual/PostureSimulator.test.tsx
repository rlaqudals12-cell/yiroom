import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PostureSimulator from '@/components/analysis/visual/PostureSimulator';
import type { PostureMeasurements } from '@/components/analysis/visual/PostureSimulator';

// Mock HTMLCanvasElement
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    strokeStyle: '',
    fillStyle: '',
    lineWidth: 0,
    setLineDash: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    fill: vi.fn(),
    arc: vi.fn(),
    fillText: vi.fn(),
    font: '',
  })) as unknown as typeof HTMLCanvasElement.prototype.getContext;

  // Mock Image 객체 - 즉시 로드 완료 시뮬레이션
  global.Image = class MockImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    src = '';
    crossOrigin: string | null = null;
    width = 600;
    height = 800;

    constructor() {
      // 이미지 로드를 즉시 완료 시뮬레이션
      setTimeout(() => {
        if (this.onload) {
          this.onload();
        }
      }, 0);
    }
  } as typeof Image;
});

describe('PostureSimulator', () => {
  const mockImageUrl = '/test-posture.jpg';
  const mockMeasurements: PostureMeasurements = {
    headForwardAngle: 20,
    shoulderDifference: 2.5,
    pelvicTilt: 'anterior',
    spineCurvature: 'lordosis',
  };

  it('컴포넌트가 렌더링됨', () => {
    render(
      <PostureSimulator imageUrl={mockImageUrl} measurements={mockMeasurements} showGuides={true} />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();
  });

  it('Canvas가 렌더링됨', () => {
    render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={mockMeasurements}
        showGuides={false}
      />
    );

    const container = screen.getByTestId('posture-simulator');
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas?.tagName).toBe('CANVAS');
  });

  it('토글 버튼이 표시됨', () => {
    render(
      <PostureSimulator imageUrl={mockImageUrl} measurements={mockMeasurements} showGuides={true} />
    );

    expect(screen.getByText('교정 전')).toBeInTheDocument();
    expect(screen.getByText('교정 후 예상')).toBeInTheDocument();
  });

  it('"교정 후 예상" 버튼 클릭 시 뷰 모드 변경', () => {
    render(
      <PostureSimulator imageUrl={mockImageUrl} measurements={mockMeasurements} showGuides={true} />
    );

    const afterButton = screen.getByText('교정 후 예상');
    fireEvent.click(afterButton);

    // "교정 후 예상" 버튼이 활성화된 상태 확인 (variant="default")
    expect(afterButton).toHaveClass('bg-primary');
  });

  it('showGuides=true일 때 범례가 표시됨', async () => {
    render(
      <PostureSimulator imageUrl={mockImageUrl} measurements={mockMeasurements} showGuides={true} />
    );

    // 이미지 로드 대기
    await waitFor(() => {
      expect(screen.getByText('가이드 라인')).toBeInTheDocument();
    });

    // 기본 가이드
    expect(screen.getByText('수직 기준선')).toBeInTheDocument();
    expect(screen.getByText('어깨 수평선')).toBeInTheDocument();
    expect(screen.getByText('골반선')).toBeInTheDocument();
  });

  it('headForwardAngle > 15일 때 머리 전방 각도 가이드 표시', async () => {
    render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, headForwardAngle: 20 }}
        showGuides={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('머리 전방 각도')).toBeInTheDocument();
    });
  });

  it('headForwardAngle <= 15일 때 머리 전방 각도 가이드 미표시', async () => {
    render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, headForwardAngle: 10 }}
        showGuides={true}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('가이드 라인')).toBeInTheDocument();
    });

    expect(screen.queryByText('머리 전방 각도')).not.toBeInTheDocument();
  });

  it('showGuides=false일 때 범례가 표시되지 않음', () => {
    render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={mockMeasurements}
        showGuides={false}
      />
    );

    expect(screen.queryByText('가이드 라인')).not.toBeInTheDocument();
  });

  it('다양한 골반 기울기 측정값 처리', () => {
    const { rerender } = render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, pelvicTilt: 'anterior' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();

    rerender(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, pelvicTilt: 'posterior' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();

    rerender(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, pelvicTilt: 'neutral' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();
  });

  it('다양한 척추 곡률 측정값 처리', () => {
    const { rerender } = render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, spineCurvature: 'lordosis' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();

    rerender(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, spineCurvature: 'flatback' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();

    rerender(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={{ ...mockMeasurements, spineCurvature: 'normal' }}
        showGuides={true}
      />
    );

    expect(screen.getByTestId('posture-simulator')).toBeInTheDocument();
  });

  it('className prop이 적용됨', () => {
    render(
      <PostureSimulator
        imageUrl={mockImageUrl}
        measurements={mockMeasurements}
        showGuides={true}
        className="custom-class"
      />
    );

    const container = screen.getByTestId('posture-simulator');
    expect(container).toHaveClass('custom-class');
  });
});
