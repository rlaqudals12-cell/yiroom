import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PostureResultCard from '@/components/analysis/posture/PostureResultCard';
import type { PostureMeasurement, PostureType } from '@/lib/mock/posture-analysis';

// lucide-react mock
vi.mock('lucide-react', () => ({
  AlertTriangle: (props: Record<string, unknown>) => (
    <div data-testid="icon-AlertTriangle" {...props} />
  ),
  CheckCircle: (props: Record<string, unknown>) => (
    <div data-testid="icon-CheckCircle" {...props} />
  ),
}));

// 테스트용 측정값 생성 헬퍼
function createMeasurement(
  name: string,
  status: 'good' | 'warning' | 'alert',
  value = 50
): PostureMeasurement {
  return { name, value, status, description: `${name} 설명` };
}

// 기본 props 생성 헬퍼
function createDefaultProps(overrides = {}) {
  return {
    postureType: 'ideal' as PostureType,
    overallScore: 85,
    confidence: 90,
    frontAnalysis: {
      shoulderSymmetry: createMeasurement('어깨 대칭', 'good'),
      pelvisSymmetry: createMeasurement('골반 대칭', 'good'),
      kneeAlignment: createMeasurement('무릎 정렬', 'good'),
      footAngle: createMeasurement('발 각도', 'good'),
    },
    sideAnalysis: {
      headForwardAngle: createMeasurement('목 전방 경사', 'good'),
      thoracicKyphosis: createMeasurement('등 굽음', 'good'),
      lumbarLordosis: createMeasurement('허리 만곡', 'good'),
      pelvicTilt: createMeasurement('골반 기울기', 'good'),
    },
    ...overrides,
  };
}

describe('PostureResultCard', () => {
  describe('기본 렌더링', () => {
    it('data-testid가 올바르게 렌더링된다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      expect(screen.getByTestId('posture-result-card')).toBeInTheDocument();
    });

    it('자세 타입 라벨이 표시된다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      expect(screen.getByText('이상적인 자세')).toBeInTheDocument();
    });

    it('전체 점수가 표시된다', () => {
      render(<PostureResultCard {...createDefaultProps({ overallScore: 78 })} />);
      expect(screen.getByText('78')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('신뢰도가 표시된다', () => {
      render(<PostureResultCard {...createDefaultProps({ confidence: 92 })} />);
      expect(screen.getByText('신뢰도 92%')).toBeInTheDocument();
    });

    it('className이 적용된다', () => {
      render(<PostureResultCard {...createDefaultProps({ className: 'custom-class' })} />);
      const card = screen.getByTestId('posture-result-card');
      expect(card).toHaveClass('custom-class');
    });
  });

  describe('ideal 자세 타입', () => {
    it('이상적인 자세일 때 긍정 메시지가 표시된다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      expect(screen.getByText(/전반적으로 좋은 자세를 유지하고 있어요/)).toBeInTheDocument();
    });

    it('이상적인 자세일 때 개선 필요 메시지가 표시되지 않는다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      expect(screen.queryByText(/개선이 필요해요/)).not.toBeInTheDocument();
    });
  });

  describe('문제 자세 타입', () => {
    it('거북목 타입이 올바르게 표시된다', () => {
      const props = createDefaultProps({
        postureType: 'forward_head' as PostureType,
        frontAnalysis: {
          shoulderSymmetry: createMeasurement('어깨 대칭', 'warning'),
          pelvisSymmetry: createMeasurement('골반 대칭', 'good'),
          kneeAlignment: createMeasurement('무릎 정렬', 'good'),
          footAngle: createMeasurement('발 각도', 'good'),
        },
        sideAnalysis: {
          headForwardAngle: createMeasurement('목 전방 경사', 'alert'),
          thoracicKyphosis: createMeasurement('등 굽음', 'warning'),
          lumbarLordosis: createMeasurement('허리 만곡', 'good'),
          pelvicTilt: createMeasurement('골반 기울기', 'good'),
        },
      });
      render(<PostureResultCard {...props} />);
      expect(screen.getByText(/거북목/)).toBeInTheDocument();
    });

    it('문제가 있는 측정값 개수가 표시된다', () => {
      const props = createDefaultProps({
        postureType: 'forward_head' as PostureType,
        frontAnalysis: {
          shoulderSymmetry: createMeasurement('어깨 대칭', 'warning'),
          pelvisSymmetry: createMeasurement('골반 대칭', 'alert'),
          kneeAlignment: createMeasurement('무릎 정렬', 'good'),
          footAngle: createMeasurement('발 각도', 'good'),
        },
        sideAnalysis: {
          headForwardAngle: createMeasurement('목 전방 경사', 'alert'),
          thoracicKyphosis: createMeasurement('등 굽음', 'good'),
          lumbarLordosis: createMeasurement('허리 만곡', 'good'),
          pelvicTilt: createMeasurement('골반 기울기', 'good'),
        },
      });
      render(<PostureResultCard {...props} />);
      // 3개 항목(warning 2 + alert 1)에서 개선 필요
      expect(screen.getByText(/3개 항목에서 개선이 필요해요/)).toBeInTheDocument();
    });

    it('모든 측정값이 good이면 개선 메시지가 표시되지 않는다 (non-ideal 타입이어도)', () => {
      const props = createDefaultProps({
        postureType: 'forward_head' as PostureType,
        // 모든 측정값 good
      });
      render(<PostureResultCard {...props} />);
      expect(screen.queryByText(/개선이 필요해요/)).not.toBeInTheDocument();
    });
  });

  describe('측정값 미니카드', () => {
    it('4개의 주요 측정값이 표시된다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      expect(screen.getByText('목 전방 경사')).toBeInTheDocument();
      expect(screen.getByText('어깨 대칭')).toBeInTheDocument();
      expect(screen.getByText('허리 만곡')).toBeInTheDocument();
      expect(screen.getByText('골반 대칭')).toBeInTheDocument();
    });

    it('good 상태는 양호 뱃지를 표시한다', () => {
      render(<PostureResultCard {...createDefaultProps()} />);
      const badges = screen.getAllByText('양호');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('warning 상태는 주의 뱃지를 표시한다', () => {
      const props = createDefaultProps({
        postureType: 'forward_head' as PostureType,
        sideAnalysis: {
          headForwardAngle: createMeasurement('목 전방 경사', 'warning'),
          thoracicKyphosis: createMeasurement('등 굽음', 'good'),
          lumbarLordosis: createMeasurement('허리 만곡', 'good'),
          pelvicTilt: createMeasurement('골반 기울기', 'good'),
        },
      });
      render(<PostureResultCard {...props} />);
      expect(screen.getByText('주의')).toBeInTheDocument();
    });

    it('alert 상태는 개선필요 뱃지를 표시한다', () => {
      const props = createDefaultProps({
        postureType: 'lordosis' as PostureType,
        sideAnalysis: {
          headForwardAngle: createMeasurement('목 전방 경사', 'good'),
          thoracicKyphosis: createMeasurement('등 굽음', 'good'),
          lumbarLordosis: createMeasurement('허리 만곡', 'alert'),
          pelvicTilt: createMeasurement('골반 기울기', 'good'),
        },
      });
      render(<PostureResultCard {...props} />);
      expect(screen.getByText('개선필요')).toBeInTheDocument();
    });
  });

  describe('모든 자세 타입 렌더링', () => {
    const allPostureTypes: PostureType[] = [
      'ideal',
      'forward_head',
      'rounded_shoulders',
      'swayback',
      'flatback',
      'lordosis',
    ];

    allPostureTypes.forEach((type) => {
      it(`${type} 자세 타입이 정상적으로 렌더링된다`, () => {
        const props = createDefaultProps({ postureType: type });
        const { unmount } = render(<PostureResultCard {...props} />);
        expect(screen.getByTestId('posture-result-card')).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('점수 색상', () => {
    it('높은 점수(>=70)는 녹색 계열 클래스를 가진다', () => {
      render(<PostureResultCard {...createDefaultProps({ overallScore: 85 })} />);
      const scoreEl = screen.getByText('85');
      expect(scoreEl.closest('p')).toHaveClass('text-green-500');
    });

    it('중간 점수(50-69)는 황색 계열 클래스를 가진다', () => {
      render(<PostureResultCard {...createDefaultProps({ overallScore: 55 })} />);
      const scoreEl = screen.getByText('55');
      expect(scoreEl.closest('p')).toHaveClass('text-amber-500');
    });

    it('낮은 점수(<50)는 적색 계열 클래스를 가진다', () => {
      render(<PostureResultCard {...createDefaultProps({ overallScore: 35 })} />);
      const scoreEl = screen.getByText('35');
      expect(scoreEl.closest('p')).toHaveClass('text-red-500');
    });
  });
});
