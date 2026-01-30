import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ProblemMarker } from '@/components/analysis/ProblemMarker';
import { SkinImageViewer } from '@/components/analysis/SkinImageViewer';
import { SolutionPanel } from '@/components/analysis/SolutionPanel';
import { SkinZoomViewer } from '@/components/analysis/SkinZoomViewer';
import type { ProblemArea } from '@/types/skin-problem-area';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// 이미지 로드 시뮬레이션 헬퍼
// JSDOM에서는 이미지가 실제로 로드되지 않으므로 load 이벤트를 수동으로 발생시킴
async function simulateImageLoad() {
  const img = document.querySelector('img[alt="피부 분석 이미지"]');
  if (img) {
    fireEvent.load(img);
    // React 상태 업데이트 대기
    await waitFor(() => {});
  }
}

// Mock Next.js Image - auto trigger onLoad
vi.mock('next/image', () => ({
  default: ({
    src,
    alt,
    onLoad,
    onError,
    ...props
  }: {
    src: string;
    alt: string;
    onLoad?: () => void;
    onError?: () => void;
  }) => {
    // 렌더링 후 자동으로 onLoad 호출
    setTimeout(() => onLoad?.(), 0);

    return <img src={src} alt={alt} {...props} data-testid="mock-image" />;
  },
}));

// 테스트용 Mock 데이터
const mockProblemArea: ProblemArea = {
  id: 'test-area-1',
  type: 'pores',
  severity: 'moderate',
  location: { x: 50, y: 40, radius: 12 },
  description: '모공이 넓어져 있어요. 피지 관리가 필요해요.',
  recommendations: ['BHA 토너', '클레이 마스크'],
};

const mockProblemAreas: ProblemArea[] = [
  mockProblemArea,
  {
    id: 'test-area-2',
    type: 'dryness',
    severity: 'mild',
    location: { x: 30, y: 55, radius: 10 },
    description: '건조한 부위가 있어요.',
    recommendations: ['히알루론산 세럼'],
  },
];

describe('ProblemMarker', () => {
  it('renders marker at correct position', () => {
    const onClick = vi.fn();
    render(<ProblemMarker area={mockProblemArea} onClick={onClick} />);

    const marker = screen.getByTestId('problem-marker-test-area-1');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveStyle({ left: '50%', top: '40%' });
  });

  it('displays problem type label', () => {
    const onClick = vi.fn();
    render(<ProblemMarker area={mockProblemArea} onClick={onClick} showLabel />);

    expect(screen.getByText('모공')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<ProblemMarker area={mockProblemArea} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('problem-marker-test-area-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows selected state', () => {
    const onClick = vi.fn();
    render(<ProblemMarker area={mockProblemArea} onClick={onClick} isSelected />);

    const marker = screen.getByTestId('problem-marker-test-area-1');
    expect(marker).toHaveStyle({ zIndex: '20' });
  });
});

describe('SkinImageViewer', () => {
  it('renders with test id', () => {
    const onAreaClick = vi.fn();
    render(
      <SkinImageViewer
        imageUrl="/test-image.jpg"
        problemAreas={mockProblemAreas}
        onAreaClick={onAreaClick}
      />
    );

    expect(screen.getByTestId('skin-image-viewer')).toBeInTheDocument();
  });

  it('renders all problem markers after image load', async () => {
    const onAreaClick = vi.fn();
    render(
      <SkinImageViewer
        imageUrl="/test-image.jpg"
        problemAreas={mockProblemAreas}
        onAreaClick={onAreaClick}
      />
    );

    // 이미지 로드 시뮬레이션
    await simulateImageLoad();

    await waitFor(() => {
      expect(screen.getByTestId('problem-marker-test-area-1')).toBeInTheDocument();
      expect(screen.getByTestId('problem-marker-test-area-2')).toBeInTheDocument();
    });
  });

  it('calls onAreaClick when marker is clicked', async () => {
    const onAreaClick = vi.fn();
    render(
      <SkinImageViewer
        imageUrl="/test-image.jpg"
        problemAreas={mockProblemAreas}
        onAreaClick={onAreaClick}
      />
    );

    // 이미지 로드 시뮬레이션
    await simulateImageLoad();

    await waitFor(() => {
      expect(screen.getByTestId('problem-marker-test-area-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('problem-marker-test-area-1'));
    expect(onAreaClick).toHaveBeenCalledWith(mockProblemArea);
  });

  it('shows guide text when no area is selected', async () => {
    const onAreaClick = vi.fn();
    render(
      <SkinImageViewer
        imageUrl="/test-image.jpg"
        problemAreas={mockProblemAreas}
        onAreaClick={onAreaClick}
        selectedAreaId={null}
      />
    );

    // 이미지 로드 시뮬레이션
    await simulateImageLoad();

    await waitFor(() => {
      expect(screen.getByText('마커를 탭하여 상세 정보 확인')).toBeInTheDocument();
    });
  });
});

describe('SolutionPanel', () => {
  it('does not render when area is null', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={null} onClose={onClose} />);

    expect(screen.queryByTestId('solution-panel-overlay')).not.toBeInTheDocument();
  });

  it('renders panel when area is provided', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    expect(screen.getByTestId('solution-panel-overlay')).toBeInTheDocument();
  });

  it('displays problem type and severity', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    expect(screen.getByText('모공')).toBeInTheDocument();
    expect(screen.getByText('보통')).toBeInTheDocument();
  });

  it('displays problem description', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    expect(screen.getByText(mockProblemArea.description)).toBeInTheDocument();
  });

  it('displays recommended ingredients', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    expect(screen.getByText('BHA 토너')).toBeInTheDocument();
    expect(screen.getByText('클레이 마스크')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /패널 닫기/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    const onClose = vi.fn();
    render(<SolutionPanel area={mockProblemArea} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onProductClick when ingredient is clicked', () => {
    const onClose = vi.fn();
    const onProductClick = vi.fn();
    render(
      <SolutionPanel area={mockProblemArea} onClose={onClose} onProductClick={onProductClick} />
    );

    fireEvent.click(screen.getByText('BHA 토너'));
    expect(onProductClick).toHaveBeenCalledWith('BHA 토너');
  });
});

describe('SkinZoomViewer', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('renders image viewer and handles area selection', () => {
    render(<SkinZoomViewer imageUrl="/test-image.jpg" problemAreas={mockProblemAreas} />);

    expect(screen.getByTestId('skin-image-viewer')).toBeInTheDocument();
  });

  it('opens solution panel when marker is clicked', async () => {
    render(<SkinZoomViewer imageUrl="/test-image.jpg" problemAreas={mockProblemAreas} />);

    // 이미지 로드 시뮬레이션
    await simulateImageLoad();

    await waitFor(() => {
      expect(screen.getByTestId('problem-marker-test-area-1')).toBeInTheDocument();
    });

    // 마커 클릭
    fireEvent.click(screen.getByTestId('problem-marker-test-area-1'));

    // 솔루션 패널 표시
    expect(screen.getByTestId('solution-panel-overlay')).toBeInTheDocument();
    // 패널 제목 (h2)에서 "모공" 확인
    expect(screen.getByRole('heading', { name: /모공/ })).toBeInTheDocument();
  });

  it('navigates to products page when ingredient is clicked', async () => {
    render(<SkinZoomViewer imageUrl="/test-image.jpg" problemAreas={mockProblemAreas} />);

    // 이미지 로드 시뮬레이션
    await simulateImageLoad();

    await waitFor(() => {
      expect(screen.getByTestId('problem-marker-test-area-1')).toBeInTheDocument();
    });

    // 마커 클릭하여 패널 열기
    fireEvent.click(screen.getByTestId('problem-marker-test-area-1'));

    // 성분 클릭
    fireEvent.click(screen.getByText('BHA 토너'));

    expect(mockPush).toHaveBeenCalledWith('/products?search=BHA%20%ED%86%A0%EB%84%88');
  });
});
