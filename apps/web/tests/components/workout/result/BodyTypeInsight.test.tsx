import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// lucide-react mock
vi.mock('lucide-react', () => ({
  Sparkles: (props: Record<string, unknown>) => <div data-testid="icon-Sparkles" {...props} />,
}));

import { vi } from 'vitest';
import BodyTypeInsight from '@/components/workout/result/BodyTypeInsight';
import type { WorkoutType } from '@/types/workout';

describe('BodyTypeInsight', () => {
  const defaultProps = {
    bodyType: 'X',
    workoutType: 'toner' as WorkoutType,
    concerns: [] as string[],
  };

  it('체형 맞춤 인사이트 타이틀이 표시된다', () => {
    render(<BodyTypeInsight {...defaultProps} />);
    expect(screen.getByText('체형 맞춤 인사이트')).toBeInTheDocument();
  });

  describe('체형별 인사이트', () => {
    it('X자 체형 + toner 타입의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="X" workoutType="toner" />);
      expect(screen.getByText(/X자 체형을 유지하면서/)).toBeInTheDocument();
    });

    it('H자 체형 + builder 타입의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="H" workoutType="builder" />);
      expect(screen.getByText(/어깨와 엉덩이 근육을 키워/)).toBeInTheDocument();
    });

    it('A자 체형 + burner 타입의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="A" workoutType="burner" />);
      expect(screen.getByText(/하체 중심 유산소로/)).toBeInTheDocument();
    });

    it('V자 체형의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="V" workoutType="flexer" />);
      expect(screen.getByText(/하체 유연성을 키워/)).toBeInTheDocument();
    });

    it('O자 체형의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="O" workoutType="mover" />);
      expect(screen.getByText(/꾸준한 활동으로/)).toBeInTheDocument();
    });

    it('I자 체형의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="I" workoutType="builder" />);
      expect(screen.getByText(/가장 적합한 체형/)).toBeInTheDocument();
    });

    it('Y자 체형의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="Y" workoutType="toner" />);
      expect(screen.getByText(/하체 라인을 탄탄하게/)).toBeInTheDocument();
    });

    it('8자 체형의 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="8" workoutType="toner" />);
      expect(screen.getByText(/글래머러스한 8자 체형/)).toBeInTheDocument();
    });
  });

  describe('체형 데이터 없음', () => {
    it('bodyType이 null이면 기본 인사이트를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType={null} />);
      expect(screen.getByText(/체형 분석 결과를 기반으로/)).toBeInTheDocument();
    });

    it('알 수 없는 체형이면 기본 메시지를 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} bodyType="Z" />);
      expect(screen.getByText(/당신의 체형에 맞는 운동을 시작해보세요/)).toBeInTheDocument();
    });
  });

  describe('신체 고민 팁', () => {
    it('고민이 있으면 팁을 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={['belly']} />);
      expect(screen.getByText(/복부 운동을 꾸준히/)).toBeInTheDocument();
    });

    it('허벅지 고민 팁을 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={['thigh']} />);
      expect(screen.getByText(/하체 운동과 스트레칭을 병행/)).toBeInTheDocument();
    });

    it('팔 고민 팁을 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={['arm']} />);
      expect(screen.getByText(/가벼운 무게로 높은 횟수/)).toBeInTheDocument();
    });

    it('고민이 없으면 팁 섹션이 없다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={[]} />);
      expect(screen.queryByText('Tip:')).not.toBeInTheDocument();
    });

    it('여러 고민 중 첫 번째 고민의 팁만 표시한다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={['belly', 'arm']} />);
      expect(screen.getByText(/복부 운동을 꾸준히/)).toBeInTheDocument();
      expect(screen.queryByText(/가벼운 무게로/)).not.toBeInTheDocument();
    });

    it('매핑되지 않는 고민은 팁을 표시하지 않는다', () => {
      render(<BodyTypeInsight {...defaultProps} concerns={['unknown_concern']} />);
      expect(screen.queryByText('Tip:')).not.toBeInTheDocument();
    });
  });
});
