import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import type { PostureAnalysisResult, PostureType } from '@/lib/mock/posture-analysis';

// animations mock: children을 그대로 렌더링, CountUp은 end 값 즉시 표시
vi.mock('@/components/animations', () => ({
  FadeInUp: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  ScaleIn: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  CountUp: ({ end }: { end: number }) => <span>{end}</span>,
}));

// POSTURE_TYPES, getPostureTypeColor, getScoreColor mock
vi.mock('@/lib/mock/posture-analysis', async () => {
  const actual = await vi.importActual<typeof import('@/lib/mock/posture-analysis')>(
    '@/lib/mock/posture-analysis'
  );
  return {
    ...actual,
    POSTURE_TYPES: {
      ...actual.POSTURE_TYPES,
    },
    getPostureTypeColor: actual.getPostureTypeColor,
    getScoreColor: actual.getScoreColor,
  };
});

// AnalysisResult는 default export이므로 동적 import
import AnalysisResult from '@/app/(main)/analysis/posture/_components/AnalysisResult';

// 기본 mock 데이터
function createMockResult(overrides: Partial<PostureAnalysisResult> = {}): PostureAnalysisResult {
  return {
    postureType: 'forward_head' as PostureType,
    postureTypeLabel: '거북목',
    postureTypeDescription: '머리가 앞으로 나온 자세',
    overallScore: 65,
    confidence: 85,
    frontAnalysis: {
      shoulderSymmetry: {
        name: '어깨 대칭',
        value: 45,
        status: 'warning',
        description: '약간 비대칭',
      },
      pelvisSymmetry: {
        name: '골반 대칭',
        value: 50,
        status: 'good',
        description: '양호',
      },
      kneeAlignment: {
        name: '무릎 정렬',
        value: 48,
        status: 'good',
        description: '양호',
      },
      footAngle: {
        name: '발 각도',
        value: 52,
        status: 'good',
        description: '양호',
      },
    },
    sideAnalysis: {
      headForwardAngle: {
        name: '머리 전방 각도',
        value: 35,
        status: 'alert',
        description: '심한 거북목',
      },
      thoracicKyphosis: {
        name: '흉추 굴곡',
        value: 55,
        status: 'warning',
        description: '약간 굽음',
      },
      lumbarLordosis: {
        name: '요추 만곡',
        value: 50,
        status: 'good',
        description: '양호',
      },
      pelvicTilt: {
        name: '골반 기울기',
        value: 48,
        status: 'good',
        description: '양호',
      },
    },
    concerns: ['거북목 자세가 심합니다', '어깨가 비대칭입니다'],
    stretchingRecommendations: [
      {
        name: '턱 당기기',
        targetArea: '목 앞쪽',
        duration: '10초',
        frequency: '하루 10회',
        description: '턱을 뒤로 당기기',
        difficulty: 'easy' as const,
      },
      {
        name: '가슴 스트레칭',
        targetArea: '가슴',
        duration: '15초',
        frequency: '하루 5회',
        description: '가슴을 열어주기',
        difficulty: 'medium' as const,
      },
    ],
    insight: 'AI가 분석한 인사이트 내용입니다.',
    analyzedAt: new Date('2026-02-12T10:00:00Z'),
    bodyTypeCorrelation: undefined,
    ...overrides,
  };
}

describe('AnalysisResult (자세 분석 결과)', () => {
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    mockOnRetry.mockClear();
  });

  describe('기본 렌더링', () => {
    it('자세 타입 라벨을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('거북목')).toBeInTheDocument();
    });

    it('전체 점수를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      // CountUp mock이 end 값을 바로 렌더링
      expect(screen.getByText('65')).toBeInTheDocument();
      expect(screen.getByText('/100')).toBeInTheDocument();
    });

    it('신뢰도를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('%')).toBeInTheDocument();
    });

    it('자세 타입 설명을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('머리가 앞으로 나온 자세')).toBeInTheDocument();
    });

    it('"자세 타입" 소제목을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('자세 타입')).toBeInTheDocument();
    });
  });

  describe('정면 분석 섹션', () => {
    it('"정면 분석" 헤더를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('정면 분석')).toBeInTheDocument();
    });

    it('4개 정면 측정값 이름을 모두 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('어깨 대칭')).toBeInTheDocument();
      expect(screen.getByText('골반 대칭')).toBeInTheDocument();
      expect(screen.getByText('무릎 정렬')).toBeInTheDocument();
      expect(screen.getByText('발 각도')).toBeInTheDocument();
    });

    it('정면 측정값의 설명을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('약간 비대칭')).toBeInTheDocument();
    });
  });

  describe('옆모습 분석 섹션', () => {
    it('"옆모습 분석" 헤더를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('옆모습 분석')).toBeInTheDocument();
    });

    it('4개 옆모습 측정값 이름을 모두 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('머리 전방 각도')).toBeInTheDocument();
      expect(screen.getByText('흉추 굴곡')).toBeInTheDocument();
      expect(screen.getByText('요추 만곡')).toBeInTheDocument();
      expect(screen.getByText('골반 기울기')).toBeInTheDocument();
    });

    it('옆모습 측정값의 설명을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('심한 거북목')).toBeInTheDocument();
      expect(screen.getByText('약간 굽음')).toBeInTheDocument();
    });
  });

  describe('MeasurementLegend 표시', () => {
    it('"중앙(50) = 이상적" 텍스트를 정면/옆모습 섹션 모두에 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      const legends = screen.getAllByText('중앙(50) = 이상적');
      expect(legends).toHaveLength(2);
    });
  });

  describe('상태 라벨 표시', () => {
    it('"양호" 배지가 존재한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      const goodLabels = screen.getAllByText('양호');
      // 정면 3개 (pelvisSymmetry, kneeAlignment, footAngle) + 옆모습 2개 (lumbarLordosis, pelvicTilt) + Legend 2개
      expect(goodLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('"주의" 배지가 존재한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      const warningLabels = screen.getAllByText('주의');
      // shoulderSymmetry(warning) + thoracicKyphosis(warning) + Legend 2개
      expect(warningLabels.length).toBeGreaterThanOrEqual(1);
    });

    it('"개선 필요" 배지가 존재한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      const alertLabels = screen.getAllByText('개선 필요');
      // headForwardAngle(alert) + Legend 2개
      expect(alertLabels.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('주의사항 섹션', () => {
    it('concerns 배열의 항목을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('거북목 자세가 심합니다')).toBeInTheDocument();
      expect(screen.getByText('어깨가 비대칭입니다')).toBeInTheDocument();
    });

    it('"주의사항" 헤더를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('주의사항')).toBeInTheDocument();
    });
  });

  describe('AI 인사이트 섹션', () => {
    it('insight 텍스트를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('AI가 분석한 인사이트 내용입니다.')).toBeInTheDocument();
    });

    it('"AI 인사이트" 헤더를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('AI 인사이트')).toBeInTheDocument();
    });
  });

  describe('스트레칭 추천 섹션', () => {
    it('스트레칭 이름을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('턱 당기기')).toBeInTheDocument();
      expect(screen.getByText('가슴 스트레칭')).toBeInTheDocument();
    });

    it('타깃 부위를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('타깃: 목 앞쪽')).toBeInTheDocument();
      expect(screen.getByText('타깃: 가슴')).toBeInTheDocument();
    });

    it('시간과 빈도를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('시간: 10초')).toBeInTheDocument();
      expect(screen.getByText('빈도: 하루 10회')).toBeInTheDocument();
      expect(screen.getByText('시간: 15초')).toBeInTheDocument();
      expect(screen.getByText('빈도: 하루 5회')).toBeInTheDocument();
    });

    it('난이도 라벨을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('쉬움')).toBeInTheDocument();
      expect(screen.getByText('보통')).toBeInTheDocument();
    });

    it('"추천 스트레칭" 헤더를 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('추천 스트레칭')).toBeInTheDocument();
    });

    it('스트레칭 설명을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('턱을 뒤로 당기기')).toBeInTheDocument();
      expect(screen.getByText('가슴을 열어주기')).toBeInTheDocument();
    });
  });

  describe('분석 시간 표시', () => {
    it('포맷된 분석 시간을 표시한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      // toLocaleString('ko-KR') 형식
      const timeText = screen.getByText(/분석 시간:/);
      expect(timeText).toBeInTheDocument();
    });
  });

  describe('다시 분석하기 버튼', () => {
    it('"다시 분석하기" 버튼이 존재한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.getByText('다시 분석하기')).toBeInTheDocument();
    });

    it('클릭 시 onRetry 콜백을 호출한다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      fireEvent.click(screen.getByText('다시 분석하기'));
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
    });
  });

  describe('조건부 렌더링', () => {
    it('ideal 자세이고 concerns가 비어있으면 "주의사항" 섹션을 숨긴다', () => {
      const idealResult = createMockResult({
        postureType: 'ideal' as PostureType,
        postureTypeLabel: '이상적인 자세',
        postureTypeDescription: '척추 정렬이 균형 잡혀 있는 상태',
        concerns: [],
      });

      render(<AnalysisResult result={idealResult} onRetry={mockOnRetry} />);

      // "주의사항" 헤더가 표시되지 않아야 함
      const headings = screen.queryAllByText('주의사항');
      expect(headings).toHaveLength(0);
    });

    it('bodyTypeCorrelation이 있으면 "체형 연동 분석" 섹션을 표시한다', () => {
      const resultWithCorrelation = createMockResult({
        bodyTypeCorrelation: {
          bodyType: 'S',
          correlationNote: '스트레이트 체형은 어깨가 앞으로 말리기 쉬워요',
          riskFactors: ['거북목', '어깨 긴장'],
        },
      });

      render(<AnalysisResult result={resultWithCorrelation} onRetry={mockOnRetry} />);

      expect(screen.getByText('체형 연동 분석')).toBeInTheDocument();
      expect(screen.getByText('S 타입')).toBeInTheDocument();
      expect(screen.getByText('스트레이트 체형은 어깨가 앞으로 말리기 쉬워요')).toBeInTheDocument();
      // "거북목"은 postureTypeLabel과 riskFactors 양쪽에 존재
      const turtleNeckElements = screen.getAllByText('거북목');
      expect(turtleNeckElements.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText('어깨 긴장')).toBeInTheDocument();
    });

    it('bodyTypeCorrelation이 없으면 "체형 연동 분석" 섹션을 표시하지 않는다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      expect(screen.queryByText('체형 연동 분석')).not.toBeInTheDocument();
    });
  });

  describe('접근성', () => {
    it('최상위 요소에 role="region"과 aria-label="자세 분석 결과"가 있다', () => {
      render(<AnalysisResult result={createMockResult()} onRetry={mockOnRetry} />);

      const region = screen.getByRole('region', { name: '자세 분석 결과' });
      expect(region).toBeInTheDocument();
    });
  });

  describe('난이도 라벨 렌더링', () => {
    it('hard 난이도는 "어려움"으로 표시한다', () => {
      const resultWithHardStretch = createMockResult({
        stretchingRecommendations: [
          {
            name: '고급 스트레칭',
            targetArea: '전신',
            duration: '30초',
            frequency: '하루 3회',
            description: '전신 스트레칭',
            difficulty: 'hard' as const,
          },
        ],
      });

      render(<AnalysisResult result={resultWithHardStretch} onRetry={mockOnRetry} />);

      expect(screen.getByText('어려움')).toBeInTheDocument();
    });
  });
});
