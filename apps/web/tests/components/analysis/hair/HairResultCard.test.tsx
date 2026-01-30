import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock 타입 정의 (실제 구현 시 lib/mock/hair-analysis.ts에서 import)
interface HairAnalysisResult {
  overallScore: number;
  hairType?: 'straight' | 'wavy' | 'curly' | 'coily';
  scalpHealth?: number;
  hairDensity?: number;
  hairThickness?: number;
  damageLevel?: number;
  recommendations?: string[];
}

// 임시 컴포넌트 스텁 (실제 구현 후 제거)
function HairResultCard({ result }: { result: HairAnalysisResult | null }) {
  if (!result) {
    return <div data-testid="hair-result-card">분석 결과가 없습니다</div>;
  }

  // overallScore가 undefined인 경우만 정보 부족 (0도 유효한 값)
  if (result.overallScore === undefined) {
    return <div data-testid="hair-result-card">정보 부족</div>;
  }

  const getHairTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      straight: '직모',
      wavy: '웨이브',
      curly: '곱슬',
      coily: '코일리',
    };
    return labels[type] || type;
  };

  const getStatus = (value: number) => {
    if (value >= 71) return '좋음';
    if (value >= 41) return '보통';
    return '주의';
  };

  return (
    <div data-testid="hair-result-card">
      {result.hairType && <div>{getHairTypeLabel(result.hairType)}</div>}
      {result.overallScore !== undefined && (
        <div>
          전체 점수: {result.overallScore}
          <span>{getStatus(result.overallScore)}</span>
        </div>
      )}
      {result.scalpHealth !== undefined && (
        <div>
          두피 건강: {result.scalpHealth}
          <span>{getStatus(result.scalpHealth)}</span>
        </div>
      )}
      {result.hairDensity !== undefined && <div>모발 밀도: {result.hairDensity}</div>}
      {result.recommendations?.map((rec, i) => (
        <div key={i}>{rec}</div>
      ))}
    </div>
  );
}

describe('HairResultCard', () => {
  describe('정상 케이스', () => {
    it('렌더링 성공', () => {
      // Given: 유효한 헤어 분석 결과
      const mockResult: HairAnalysisResult = {
        overallScore: 85,
        hairType: 'wavy',
        scalpHealth: 70,
        hairDensity: 80,
        recommendations: ['보습 샴푸 사용', '주 2회 두피 케어'],
      };

      // When: 컴포넌트 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 결과 카드 표시
      expect(screen.getByTestId('hair-result-card')).toBeInTheDocument();
    });

    it('헤어 타입 표시', () => {
      // Given: wavy 헤어 타입
      const mockResult: HairAnalysisResult = {
        hairType: 'wavy',
        overallScore: 85,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 웨이브 타입 한글 표시
      expect(screen.getByText('웨이브')).toBeInTheDocument();
    });

    it('종합 점수 표시', () => {
      // Given: 85점 결과
      const mockResult: HairAnalysisResult = {
        overallScore: 85,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 전체 점수 표시
      expect(screen.getByText(/전체 점수/)).toBeInTheDocument();
    });

    it('두피 건강도 표시', () => {
      // Given: 두피 건강도 70점
      const mockResult: HairAnalysisResult = {
        overallScore: 80,
        scalpHealth: 70,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 두피 건강 지표 표시
      expect(screen.getByText(/두피 건강/)).toBeInTheDocument();
    });

    it('모발 밀도 표시', () => {
      // Given: 모발 밀도 75점 (overallScore와 다른 값 사용)
      const mockResult: HairAnalysisResult = {
        overallScore: 80,
        hairDensity: 75,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 밀도 지표 표시
      expect(screen.getByText(/모발 밀도/)).toBeInTheDocument();
    });

    it('추천 사항 표시', () => {
      // Given: 3개 추천
      const mockResult: HairAnalysisResult = {
        overallScore: 85,
        recommendations: ['보습 샴푸 사용', '주 2회 두피 케어', '열 보호 제품 사용'],
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 모든 추천 표시
      expect(screen.getByText('보습 샴푸 사용')).toBeInTheDocument();
      expect(screen.getByText('주 2회 두피 케어')).toBeInTheDocument();
      expect(screen.getByText('열 보호 제품 사용')).toBeInTheDocument();
    });
  });

  describe('점수에 따른 상태 표시', () => {
    it('좋은 상태 (71-100)', () => {
      // Given: 85점 두피 건강
      const mockResult: HairAnalysisResult = {
        overallScore: 85,
        scalpHealth: 85,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 좋은 상태 배지 표시 (여러 요소 가능)
      const goodStatuses = screen.getAllByText(/좋음/);
      expect(goodStatuses.length).toBeGreaterThanOrEqual(1);
    });

    it('보통 상태 (41-70)', () => {
      // Given: 60점 두피 건강
      const mockResult: HairAnalysisResult = {
        overallScore: 60,
        scalpHealth: 60,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 보통 상태 배지 표시 (여러 요소 가능)
      const normalStatuses = screen.getAllByText(/보통/);
      expect(normalStatuses.length).toBeGreaterThanOrEqual(1);
    });

    it('주의 상태 (0-40)', () => {
      // Given: 30점 두피 건강
      const mockResult: HairAnalysisResult = {
        overallScore: 30,
        scalpHealth: 30,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 주의 상태 배지 표시 (여러 요소 가능)
      const warningStatuses = screen.getAllByText(/주의/);
      expect(warningStatuses.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('헤어 타입별 라벨', () => {
    it('직모 타입 표시', () => {
      const mockResult: HairAnalysisResult = {
        hairType: 'straight',
        overallScore: 80,
      };
      render(<HairResultCard result={mockResult} />);
      expect(screen.getByText('직모')).toBeInTheDocument();
    });

    it('웨이브 타입 표시', () => {
      const mockResult: HairAnalysisResult = {
        hairType: 'wavy',
        overallScore: 80,
      };
      render(<HairResultCard result={mockResult} />);
      expect(screen.getByText('웨이브')).toBeInTheDocument();
    });

    it('곱슬 타입 표시', () => {
      const mockResult: HairAnalysisResult = {
        hairType: 'curly',
        overallScore: 80,
      };
      render(<HairResultCard result={mockResult} />);
      expect(screen.getByText('곱슬')).toBeInTheDocument();
    });

    it('코일리 타입 표시', () => {
      const mockResult: HairAnalysisResult = {
        hairType: 'coily',
        overallScore: 80,
      };
      render(<HairResultCard result={mockResult} />);
      expect(screen.getByText('코일리')).toBeInTheDocument();
    });
  });

  describe('에러 케이스', () => {
    it('결과 데이터 없을 때', () => {
      // Given: null 결과
      const mockResult = null;

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 에러 메시지 표시
      expect(screen.getByText(/분석 결과가 없습니다/)).toBeInTheDocument();
    });

    it('필수 필드 누락 시 (overallScore 없음)', () => {
      // overallScore가 undefined인 경우를 테스트하려면 타입 캐스팅 필요
      const invalidResult = { hairType: 'wavy' } as HairAnalysisResult;

      // When: 렌더링
      render(<HairResultCard result={invalidResult} />);

      // Then: 기본값 표시 또는 경고
      expect(screen.getByText(/정보 부족/)).toBeInTheDocument();
    });
  });

  describe('엣지 케이스', () => {
    it('추천 사항 없을 때', () => {
      // Given: recommendations 빈 배열
      const mockResult: HairAnalysisResult = {
        overallScore: 85,
        recommendations: [],
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 추천 사항 미표시 (빈 배열이므로 렌더링 안 됨)
      expect(screen.queryByText(/추천/)).not.toBeInTheDocument();
    });

    it('점수 0일 때 (최저)', () => {
      // Given: 모든 점수 0
      const mockResult: HairAnalysisResult = {
        overallScore: 0,
        scalpHealth: 0,
        hairDensity: 0,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 주의 상태 표시 (여러 요소 가능)
      const warningStatuses = screen.getAllByText(/주의/);
      expect(warningStatuses.length).toBeGreaterThanOrEqual(1);
    });

    it('점수 100일 때 (최고)', () => {
      // Given: 모든 점수 100
      const mockResult: HairAnalysisResult = {
        overallScore: 100,
        scalpHealth: 100,
      };

      // When: 렌더링
      render(<HairResultCard result={mockResult} />);

      // Then: 좋음 상태 표시 (여러 요소 가능)
      const goodStatuses = screen.getAllByText(/좋음/);
      expect(goodStatuses.length).toBeGreaterThanOrEqual(1);
    });
  });
});
