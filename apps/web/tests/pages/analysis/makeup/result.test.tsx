import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import * as React from 'react';

// Mock 타입 정의
interface MakeupAnalysisResult {
  id: string;
  clerk_user_id: string;
  image_url: string;
  undertone: 'warm' | 'cool' | 'neutral';
  eye_shape: 'monolid' | 'double' | 'hooded' | 'round' | 'almond' | 'downturned';
  lip_shape: 'full' | 'thin' | 'wide' | 'small' | 'heart' | 'asymmetric';
  face_shape: 'oval' | 'round' | 'square' | 'heart' | 'oblong' | 'diamond';
  skin_texture: number;
  skin_tone_uniformity: number;
  hydration: number;
  pore_visibility: number;
  oil_balance: number;
  overall_score: number;
  concerns: string[];
  recommendations: {
    insight: string;
    styles: string[];
    colors: Array<{
      category: string;
      categoryLabel: string;
      colors: Array<{ name: string; hex: string; description: string }>;
    }>;
    tips: Array<{ category: string; tips: string[] }>;
  };
  created_at: string;
}

// Mock Supabase 클라이언트
const mockSupabase = {
  from: vi.fn(),
};

// Mock 데이터
const mockMakeupAnalysisData: MakeupAnalysisResult = {
  id: 'makeup-123',
  clerk_user_id: 'user-1',
  image_url: 'https://example.com/makeup.jpg',
  undertone: 'warm',
  eye_shape: 'almond',
  lip_shape: 'full',
  face_shape: 'oval',
  skin_texture: 75,
  skin_tone_uniformity: 70,
  hydration: 65,
  pore_visibility: 60,
  oil_balance: 72,
  overall_score: 68,
  concerns: ['dark-circles', 'oily-tzone'],
  recommendations: {
    insight: '웜톤에 계란형 얼굴형이시네요. 코랄, 브라운 계열의 메이크업을 추천드려요.',
    styles: ['natural', 'glam'],
    colors: [
      {
        category: 'lip',
        categoryLabel: '립',
        colors: [
          { name: '코랄 오렌지', hex: '#FF6B4A', description: '화사한 코랄' },
          { name: '브릭 레드', hex: '#B84A3A', description: '따뜻한 브릭 레드' },
        ],
      },
    ],
    tips: [
      {
        category: '베이스',
        tips: ['프라이머로 모공을 먼저 메워주세요', 'T존은 파우더로 유분기를 잡아주세요'],
      },
    ],
  },
  created_at: new Date().toISOString(),
};

// 임시 페이지 컴포넌트 스텁
function MakeupAnalysisResultPage({ params }: { params: { id: string } }) {
  const [result, setResult] = React.useState<MakeupAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string>('basic');

  const getUndertoneLabel = (undertone: string) => {
    const labels: Record<string, string> = { warm: '웜톤', cool: '쿨톤', neutral: '뉴트럴' };
    return labels[undertone] || undertone;
  };

  const getFaceShapeLabel = (faceShape: string) => {
    const labels: Record<string, string> = {
      oval: '계란형',
      round: '둥근형',
      square: '각진형',
      heart: '하트형',
      oblong: '긴 얼굴',
      diamond: '다이아몬드',
    };
    return labels[faceShape] || faceShape;
  };

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await mockSupabase
          .from('makeup_analyses')
          .select('*')
          .eq('id', params.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('분석 결과를 찾을 수 없습니다');

        setResult(data);
      } catch (err: any) {
        setError(err.message || '결과를 불러올 수 없습니다');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (isLoading) {
    return (
      <div data-testid="makeup-result-page">
        <div role="status" className="animate-spin">
          결과를 불러오는 중...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div data-testid="makeup-result-page">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div data-testid="makeup-result-page">
      {result && (
        <>
          <h1>메이크업 분석 결과</h1>
          <div>{getUndertoneLabel(result.undertone)}</div>
          <div>{getFaceShapeLabel(result.face_shape)}</div>
          <div>{result.overall_score}</div>

          <div role="tablist">
            <button
              role="tab"
              aria-selected={activeTab === 'basic'}
              onClick={() => setActiveTab('basic')}
            >
              분석
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'colors'}
              onClick={() => setActiveTab('colors')}
            >
              컬러
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'tips'}
              onClick={() => setActiveTab('tips')}
            >
              팁
            </button>
          </div>

          {activeTab === 'basic' && (
            <div>
              <p>{result.recommendations.insight}</p>
            </div>
          )}
          {activeTab === 'colors' && (
            <div>
              {result.recommendations.colors.map((c) => (
                <div key={c.category}>{c.categoryLabel}</div>
              ))}
            </div>
          )}
          {activeTab === 'tips' && (
            <div>
              {result.recommendations.tips.map((t) => (
                <div key={t.category}>{t.category}</div>
              ))}
            </div>
          )}

          <button onClick={() => alert('공유')}>공유하기</button>
          <button
            onClick={() =>
              (window.location.href = `/products?undertone=${result.undertone}&category=makeup`)
            }
          >
            맞춤 화장품 보기
          </button>
        </>
      )}
    </div>
  );
}

describe('MakeupAnalysisResultPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  describe('정상 케이스', () => {
    it('페이지 렌더링 성공', async () => {
      const analysisId = 'makeup-123';
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: analysisId }} />);

      await waitFor(() => {
        expect(screen.getByTestId('makeup-result-page')).toBeInTheDocument();
      });
    });

    it('DB에서 분석 결과 조회', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith('makeup_analyses');
        expect(screen.getByText('웜톤')).toBeInTheDocument();
        expect(screen.getByText('계란형')).toBeInTheDocument();
        expect(screen.getByText('68')).toBeInTheDocument();
      });
    });

    it('탭 전환 동작 - 컬러 탭', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('분석')).toBeInTheDocument();
      });

      const colorTab = screen.getByText('컬러');
      fireEvent.click(colorTab);

      await waitFor(() => {
        expect(colorTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('립')).toBeInTheDocument();
      });
    });

    it('탭 전환 동작 - 팁 탭', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('팁')).toBeInTheDocument();
      });

      const tipsTab = screen.getByText('팁');
      fireEvent.click(tipsTab);

      await waitFor(() => {
        expect(tipsTab).toHaveAttribute('aria-selected', 'true');
        expect(screen.getByText('베이스')).toBeInTheDocument();
      });
    });

    it('공유 버튼 클릭', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('공유하기')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('공유하기');
      fireEvent.click(shareButton);

      expect(alertSpy).toHaveBeenCalledWith('공유');
      alertSpy.mockRestore();
    });

    it('제품 추천 버튼 클릭', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('맞춤 화장품 보기')).toBeInTheDocument();
      });

      const productButton = screen.getByText('맞춤 화장품 보기');
      fireEvent.click(productButton);

      expect(window.location.href).toBe('/products?undertone=warm&category=makeup');
    });
  });

  describe('에러 케이스', () => {
    it('분석 결과 없을 때', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'invalid-id' }} />);

      await waitFor(() => {
        expect(screen.getByText(/분석 결과를 찾을 수 없습니다/)).toBeInTheDocument();
      });
    });

    it('DB 조회 실패 시', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Network error'),
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      });
    });
  });

  describe('로딩 상태', () => {
    it('로딩 중 표시', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockReturnValue(
                new Promise((resolve) =>
                  setTimeout(() => resolve({ data: mockMakeupAnalysisData, error: null }), 100)
                )
              ),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      expect(screen.getByText(/결과를 불러오는 중/)).toBeInTheDocument();
    });

    it('로딩 스피너 표시', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockReturnValue(
                new Promise((resolve) =>
                  setTimeout(() => resolve({ data: mockMakeupAnalysisData, error: null }), 100)
                )
              ),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      expect(screen.getByRole('status')).toHaveClass('animate-spin');
    });

    it('로딩 완료 후 데이터 표시', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockMakeupAnalysisData,
              error: null,
            }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.queryByText(/결과를 불러오는 중/)).not.toBeInTheDocument();
        expect(screen.getByText('웜톤')).toBeInTheDocument();
      });
    });
  });

  describe('언더톤별 렌더링', () => {
    it('웜톤 결과', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMakeupAnalysisData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('웜톤')).toBeInTheDocument();
      });
    });

    it('쿨톤 결과', async () => {
      const coolData = { ...mockMakeupAnalysisData, undertone: 'cool' as const };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: coolData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('쿨톤')).toBeInTheDocument();
      });
    });

    it('뉴트럴 결과', async () => {
      const neutralData = { ...mockMakeupAnalysisData, undertone: 'neutral' as const };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: neutralData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('뉴트럴')).toBeInTheDocument();
      });
    });
  });

  describe('얼굴형별 렌더링', () => {
    it('계란형 결과', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockMakeupAnalysisData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('계란형')).toBeInTheDocument();
      });
    });

    it('둥근형 결과', async () => {
      const roundData = { ...mockMakeupAnalysisData, face_shape: 'round' as const };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: roundData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('둥근형')).toBeInTheDocument();
      });
    });

    it('각진형 결과', async () => {
      const squareData = { ...mockMakeupAnalysisData, face_shape: 'square' as const };
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: squareData, error: null }),
          }),
        }),
      });

      render(<MakeupAnalysisResultPage params={{ id: 'makeup-123' }} />);

      await waitFor(() => {
        expect(screen.getByText('각진형')).toBeInTheDocument();
      });
    });
  });
});
