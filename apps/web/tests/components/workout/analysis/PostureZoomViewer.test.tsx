import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PostureMarker } from '@/components/workout/analysis/PostureMarker';
import { PostureFeedbackPanel } from '@/components/workout/analysis/PostureFeedbackPanel';
import { PostureZoomViewer } from '@/components/workout/analysis/PostureZoomViewer';
import type { PostureIssue } from '@/types/workout-posture';

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next.js Image - 자동으로 onLoad 호출
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
    setTimeout(() => onLoad?.(), 0);
    return <img src={src} alt={alt} {...props} data-testid="mock-image" />;
  },
}));

// 테스트용 Mock 데이터
const mockIssue: PostureIssue = {
  id: 'test-issue-1',
  type: 'knee_angle',
  severity: 'warning',
  location: { x: 45, y: 65, radius: 12 },
  currentAngle: 85,
  idealAngle: 90,
  description: '무릎이 발끝보다 앞으로 나가고 있어요.',
  correction: '무릎이 발끝 선상에 오도록 엉덩이를 더 뒤로 빼주세요.',
  relatedExerciseId: 'wall-squat',
};

const mockIssues: PostureIssue[] = [
  mockIssue,
  {
    id: 'test-issue-2',
    type: 'spine_curve',
    severity: 'good',
    location: { x: 50, y: 40, radius: 10 },
    description: '척추가 중립 자세를 잘 유지하고 있어요.',
    correction: '현재 자세를 유지하세요.',
  },
];

describe('PostureMarker', () => {
  it('마커를 올바른 위치에 렌더링한다', () => {
    const onClick = vi.fn();
    render(<PostureMarker issue={mockIssue} onClick={onClick} />);

    const marker = screen.getByTestId('posture-marker-test-issue-1');
    expect(marker).toBeInTheDocument();
    expect(marker).toHaveStyle({ left: '45%', top: '65%' });
  });

  it('자세 유형 라벨을 표시한다', () => {
    const onClick = vi.fn();
    render(<PostureMarker issue={mockIssue} onClick={onClick} showLabel />);

    expect(screen.getByText('무릎')).toBeInTheDocument();
  });

  it('클릭 시 onClick을 호출한다', () => {
    const onClick = vi.fn();
    render(<PostureMarker issue={mockIssue} onClick={onClick} />);

    fireEvent.click(screen.getByTestId('posture-marker-test-issue-1'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('선택 상태를 표시한다', () => {
    const onClick = vi.fn();
    render(<PostureMarker issue={mockIssue} onClick={onClick} isSelected />);

    const marker = screen.getByTestId('posture-marker-test-issue-1');
    expect(marker).toHaveStyle({ zIndex: '20' });
  });
});

describe('PostureFeedbackPanel', () => {
  it('issue가 null이면 렌더링하지 않는다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={null} onClose={onClose} />);

    expect(screen.queryByTestId('posture-feedback-overlay')).not.toBeInTheDocument();
  });

  it('issue가 있으면 패널을 렌더링한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    expect(screen.getByTestId('posture-feedback-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('posture-feedback-panel')).toBeInTheDocument();
  });

  it('자세 유형과 심각도를 표시한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    expect(screen.getByText('무릎')).toBeInTheDocument();
    expect(screen.getByText('주의')).toBeInTheDocument();
  });

  it('설명을 표시한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    expect(screen.getByText(mockIssue.description)).toBeInTheDocument();
  });

  it('각도 정보를 표시한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    expect(screen.getByText('85°')).toBeInTheDocument();
    expect(screen.getByText('90°')).toBeInTheDocument();
  });

  it('교정 방법을 표시한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    expect(screen.getByText(mockIssue.correction)).toBeInTheDocument();
  });

  it('닫기 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /패널 닫기/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ESC 키 입력 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(<PostureFeedbackPanel issue={mockIssue} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('교정 운동 버튼 클릭 시 onExerciseClick을 호출한다', () => {
    const onClose = vi.fn();
    const onExerciseClick = vi.fn();
    render(
      <PostureFeedbackPanel issue={mockIssue} onClose={onClose} onExerciseClick={onExerciseClick} />
    );

    fireEvent.click(screen.getByText('교정 운동 보기'));
    expect(onExerciseClick).toHaveBeenCalledWith('wall-squat');
  });
});

describe('PostureZoomViewer', () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it('이미지 뷰어를 렌더링한다', () => {
    render(<PostureZoomViewer imageUrl="/test-image.jpg" postureIssues={mockIssues} />);

    expect(screen.getByTestId('posture-zoom-viewer')).toBeInTheDocument();
  });

  it('이미지 로드 후 마커를 표시한다', async () => {
    render(<PostureZoomViewer imageUrl="/test-image.jpg" postureIssues={mockIssues} />);

    await waitFor(() => {
      expect(screen.getByTestId('posture-marker-test-issue-1')).toBeInTheDocument();
      expect(screen.getByTestId('posture-marker-test-issue-2')).toBeInTheDocument();
    });
  });

  it('마커 클릭 시 피드백 패널을 연다', async () => {
    render(<PostureZoomViewer imageUrl="/test-image.jpg" postureIssues={mockIssues} />);

    await waitFor(() => {
      expect(screen.getByTestId('posture-marker-test-issue-1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('posture-marker-test-issue-1'));

    expect(screen.getByTestId('posture-feedback-panel')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /무릎/ })).toBeInTheDocument();
  });

  it('교정 운동 클릭 시 운동 페이지로 이동한다', async () => {
    render(<PostureZoomViewer imageUrl="/test-image.jpg" postureIssues={mockIssues} />);

    await waitFor(() => {
      expect(screen.getByTestId('posture-marker-test-issue-1')).toBeInTheDocument();
    });

    // 마커 클릭하여 패널 열기
    fireEvent.click(screen.getByTestId('posture-marker-test-issue-1'));

    // 교정 운동 버튼 클릭
    fireEvent.click(screen.getByText('교정 운동 보기'));

    expect(mockPush).toHaveBeenCalledWith('/workout/exercise/wall-squat');
  });

  it('이슈가 없으면 좋은 자세 메시지를 표시한다', async () => {
    render(<PostureZoomViewer imageUrl="/test-image.jpg" postureIssues={[]} />);

    await waitFor(() => {
      expect(screen.getByText('자세가 좋아요!')).toBeInTheDocument();
    });
  });
});
