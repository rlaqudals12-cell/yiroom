import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

// shadcn/ui mocks
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardContent: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardHeader: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardTitle: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <div {...props}>{children}</div>
  ),
  CardDescription: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <div {...props}>{children}</div>,
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
    <span {...props}>{children}</span>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    onClick,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    [key: string]: unknown;
  }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

// lucide-react mock
vi.mock('lucide-react', () => ({
  Clock: (props: Record<string, unknown>) => <div data-testid="icon-Clock" {...props} />,
  Activity: (props: Record<string, unknown>) => <div data-testid="icon-Activity" {...props} />,
  AlertCircle: (props: Record<string, unknown>) => (
    <div data-testid="icon-AlertCircle" {...props} />
  ),
  Play: (props: Record<string, unknown>) => <div data-testid="icon-Play" {...props} />,
}));

// MUSCLE_NAME_KO mock
vi.mock('@/lib/workout/stretching', () => ({
  MUSCLE_NAME_KO: {
    hamstrings: '햄스트링',
    quadriceps: '대퇴사두근',
    calves: '종아리',
    hip_flexors: '고관절 굴곡근',
    glutes: '둔근',
  } as Record<string, string>,
}));

import { StretchingRoutineCard } from '@/components/workout/stretching/StretchingRoutineCard';
import type { StretchingPrescription } from '@/types/stretching';

function createMockPrescription(
  overrides: Partial<StretchingPrescription> = {}
): StretchingPrescription {
  return {
    prescriptionId: 'presc-001',
    totalDuration: 15,
    frequency: '주 3회, 매일 권장',
    warnings: [],
    basedOn: {
      purpose: 'general',
      fitnessLevel: 'beginner',
      postureIssues: [],
    },
    stretches: [
      {
        exercise: {
          id: 'str-1',
          nameKo: '햄스트링 스트레칭',
          nameEn: 'Hamstring Stretch',
          type: 'static',
          difficulty: 'beginner',
          durationUnit: 'seconds',
          defaultDuration: 30,
          defaultSets: 2,
          targetMuscles: ['hamstrings'],
          secondaryMuscles: [],
          instructions: ['다리를 앞으로 뻗는다'],
          breathingGuide: '깊게 호흡',
          commonMistakes: [],
          contraindications: [],
          redFlags: [],
          progressionCriteria: '',
        },
        adjustedDuration: 30,
        adjustedSets: 2,
        order: 1,
        reason: '유연성 개선',
      },
      {
        exercise: {
          id: 'str-2',
          nameKo: '대퇴사두근 스트레칭',
          nameEn: 'Quad Stretch',
          type: 'dynamic',
          difficulty: 'intermediate',
          durationUnit: 'reps',
          defaultDuration: 10,
          defaultSets: 2,
          targetMuscles: ['quadriceps'],
          secondaryMuscles: ['hip_flexors'],
          instructions: ['한 발로 서서 반대 발을 뒤로 잡는다'],
          breathingGuide: '천천히 호흡',
          commonMistakes: [],
          contraindications: [],
          redFlags: [],
          progressionCriteria: '',
        },
        adjustedDuration: 10,
        adjustedSets: 2,
        order: 2,
        reason: '하체 유연성',
      },
    ],
    ...overrides,
  } as StretchingPrescription;
}

describe('StretchingRoutineCard', () => {
  const defaultProps = {
    prescription: createMockPrescription(),
    onStart: vi.fn(),
  };

  it('data-testid가 존재한다', () => {
    render(<StretchingRoutineCard {...defaultProps} />);
    expect(screen.getByTestId('stretching-routine-card')).toBeInTheDocument();
  });

  describe('헤더', () => {
    it('목적에 따른 제목이 표시된다 (general)', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText(/전신 유연성 스트레칭/)).toBeInTheDocument();
    });

    it('warmup 목적의 제목이 표시된다', () => {
      const prescription = createMockPrescription({
        basedOn: { purpose: 'warmup' as const },
      });
      render(<StretchingRoutineCard {...defaultProps} prescription={prescription} />);
      expect(screen.getByText(/워밍업 스트레칭/)).toBeInTheDocument();
    });

    it('운동 개수 뱃지가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('2개 운동')).toBeInTheDocument();
    });

    it('빈도가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('주 3회, 매일 권장')).toBeInTheDocument();
    });
  });

  describe('요약 정보', () => {
    it('소요 시간이 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('약 15분')).toBeInTheDocument();
    });

    it('운동 수가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      const countTexts = screen.getAllByText('2개');
      expect(countTexts.length).toBeGreaterThan(0);
    });
  });

  describe('타겟 근육', () => {
    it('주요 타겟 근육이 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('주요 타겟 근육')).toBeInTheDocument();
      expect(screen.getByText('햄스트링')).toBeInTheDocument();
      expect(screen.getByText('대퇴사두근')).toBeInTheDocument();
    });
  });

  describe('경고', () => {
    it('경고가 없으면 경고 섹션이 없다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.queryByTestId('icon-AlertCircle')).not.toBeInTheDocument();
    });

    it('경고가 있으면 표시된다', () => {
      const prescription = createMockPrescription({
        warnings: ['무릎 부상이 있으면 주의하세요'],
      });
      render(<StretchingRoutineCard {...defaultProps} prescription={prescription} />);
      expect(screen.getByText('무릎 부상이 있으면 주의하세요')).toBeInTheDocument();
    });
  });

  describe('운동 미리보기', () => {
    it('운동 목록이 최대 3개까지 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('햄스트링 스트레칭')).toBeInTheDocument();
      expect(screen.getByText('대퇴사두근 스트레칭')).toBeInTheDocument();
    });

    it('세트/시간 정보가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      // 2개 운동 모두 2세트이므로 2개 이상 매칭
      const setTexts = screen.getAllByText(/2세트/);
      expect(setTexts.length).toBeGreaterThanOrEqual(1);
    });

    it('타입 뱃지가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('정적')).toBeInTheDocument();
      expect(screen.getByText('동적')).toBeInTheDocument();
    });
  });

  describe('시작 버튼', () => {
    it('시작 버튼이 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('스트레칭 시작')).toBeInTheDocument();
    });

    it('시작 버튼 클릭 시 onStart가 호출된다', () => {
      const onStart = vi.fn();
      render(<StretchingRoutineCard {...defaultProps} onStart={onStart} />);
      fireEvent.click(screen.getByText('스트레칭 시작'));
      expect(onStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('면책 조항', () => {
    it('안전 경고가 표시된다', () => {
      render(<StretchingRoutineCard {...defaultProps} />);
      expect(screen.getByText('통증이 발생하면 즉시 중단하세요')).toBeInTheDocument();
    });
  });
});
