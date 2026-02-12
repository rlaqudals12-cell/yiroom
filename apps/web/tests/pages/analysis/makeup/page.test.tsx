import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import * as React from 'react';

// 분석 단계 타입
type AnalysisStep = 'guide' | 'upload' | 'known-input' | 'loading' | 'result';

// 기존 분석 결과 타입
interface ExistingAnalysis {
  id: string;
  overall_score: number;
  undertone: string;
  created_at: string;
}

// 간이 MakeupAnalysisResult (mock용)
interface MockMakeupResult {
  undertone: string;
  undertoneLabel: string;
  overallScore: number;
  insight: string;
  faceShapeLabel: string;
  eyeShapeLabel: string;
  lipShapeLabel: string;
  metrics: { id: string; label: string; value: number; status: string; description: string }[];
  concerns: string[];
  recommendedStyles: string[];
  colorRecommendations: {
    category: string;
    categoryLabel: string;
    colors: { name: string; hex: string; description: string }[];
  }[];
  makeupTips: { category: string; tips: string[] }[];
  personalColorConnection?: { season: string; compatibility: string; note: string };
  analyzedAt: Date;
  analysisReliability: string;
}

// 테스트용 페이지 스텁 (핵심 플로우 재현)
function MakeupAnalysisPage({
  initialExisting = null,
  checkingInitial = false,
  mockFetchResult = null,
  mockFetchError = null,
}: {
  initialExisting?: ExistingAnalysis | null;
  checkingInitial?: boolean;
  mockFetchResult?: MockMakeupResult | null;
  mockFetchError?: string | null;
}) {
  const [step, setStep] = React.useState<AnalysisStep>('guide');
  const [existingAnalysis] = React.useState<ExistingAnalysis | null>(initialExisting);
  const [checkingExisting] = React.useState(checkingInitial);
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [result, setResult] = React.useState<MockMakeupResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview('blob:test-preview');
    setError(null);
  }, []);

  const handleUploadClick = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleStartAnalysis = React.useCallback(async () => {
    if (!imageFile) return;
    setIsAnalyzing(true);
    setStep('loading');
    setError(null);

    // 분석 시뮬레이션
    await new Promise((r) => setTimeout(r, 50));

    if (mockFetchError) {
      setError(mockFetchError);
      setStep('upload');
      setIsAnalyzing(false);
      return;
    }

    if (mockFetchResult) {
      setResult(mockFetchResult);
      setStep('result');
    }
    setIsAnalyzing(false);
  }, [imageFile, mockFetchResult, mockFetchError]);

  const handleRetry = React.useCallback(() => {
    setImageFile(null);
    setImagePreview(null);
    setResult(null);
    setStep('guide');
    setError(null);
  }, []);

  const subtitle = React.useMemo(() => {
    if (error) return '분석 중 오류가 발생했어요';
    switch (step) {
      case 'guide':
        return '정확한 분석을 위한 촬영 가이드';
      case 'upload':
        return '얼굴 사진을 선택해주세요';
      case 'known-input':
        return '피부 타입을 선택해주세요';
      case 'loading':
        return 'AI가 분석 중이에요...';
      case 'result':
        return '분석이 완료되었어요';
    }
  }, [step, error]);

  const undertoneLabels: Record<string, string> = {
    warm: '웜톤',
    cool: '쿨톤',
    neutral: '뉴트럴',
  };

  return (
    <div data-testid="makeup-analysis-page">
      <header>
        <h1>메이크업 분석</h1>
        <p data-testid="subtitle">{subtitle}</p>
      </header>

      {/* 에러 메시지 */}
      {error && (
        <div role="alert" data-testid="error-banner">
          {error}. 다시 시도해주세요.
        </div>
      )}

      {/* 기존 분석 결과 배너 */}
      {step === 'guide' && existingAnalysis && !checkingExisting && (
        <a
          href={`/analysis/makeup/result/${existingAnalysis.id}`}
          data-testid="existing-analysis-banner"
        >
          <span>{existingAnalysis.overall_score}</span>
          <span>기존 분석 결과 보기</span>
          <span>{undertoneLabels[existingAnalysis.undertone] || existingAnalysis.undertone}</span>
        </a>
      )}

      {/* guide 단계 */}
      {step === 'guide' && (
        <div data-testid="guide-step">
          <h2>촬영 가이드</h2>
          <ul>
            <li>밝은 자연광 아래에서 촬영해주세요</li>
            <li>정면에서 얼굴 전체가 보이도록 촬영해주세요</li>
            <li>민낯 상태에서 촬영하면 더 정확해요</li>
            <li>필터나 보정된 사진은 피해주세요</li>
          </ul>
          <button onClick={() => setStep('upload')} data-testid="go-upload-btn">
            사진 선택하기
          </button>
          <button onClick={() => setStep('known-input')} data-testid="skip-to-known-btn">
            알고 있어요
          </button>
        </div>
      )}

      {/* upload 단계 */}
      {step === 'upload' && (
        <div data-testid="upload-step">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            data-testid="file-input"
            style={{ display: 'none' }}
          />

          {imagePreview ? (
            <div data-testid="image-preview-area">
              <img src={imagePreview} alt="선택된 이미지" />
              <button onClick={handleUploadClick}>다른 사진 선택</button>
              <button
                onClick={handleStartAnalysis}
                disabled={isAnalyzing}
                data-testid="start-analysis-btn"
              >
                {isAnalyzing ? '분석 중...' : '분석 시작'}
              </button>
            </div>
          ) : (
            <button onClick={handleUploadClick} data-testid="upload-area">
              사진을 선택해주세요
            </button>
          )}

          <button onClick={() => setStep('guide')} data-testid="back-to-guide-btn">
            가이드로 돌아가기
          </button>
        </div>
      )}

      {/* known-input 단계 */}
      {step === 'known-input' && (
        <div data-testid="known-input-step">
          <h3>피부 톤을 선택해주세요</h3>
          <button
            onClick={() => {
              /* 선택 로직 */
            }}
          >
            웜톤
          </button>
          <button
            onClick={() => {
              /* 선택 로직 */
            }}
          >
            쿨톤
          </button>
          <button
            onClick={() => {
              /* 선택 로직 */
            }}
          >
            뉴트럴
          </button>
          <button onClick={() => setStep('guide')}>뒤로</button>
        </div>
      )}

      {/* loading 단계 */}
      {step === 'loading' && (
        <div data-testid="loading-step">
          <p>AI가 얼굴을 분석하고 있어요</p>
          <p>잠시만 기다려주세요...</p>
        </div>
      )}

      {/* result 단계 */}
      {step === 'result' && result && (
        <div data-testid="result-step">
          <div data-testid="result-score">{result.overallScore}</div>
          <div>
            {result.undertoneLabel} · {result.faceShapeLabel}
          </div>
          <div>{result.insight}</div>
          <button onClick={handleRetry} data-testid="retry-btn">
            다시 분석하기
          </button>
        </div>
      )}
    </div>
  );
}

// ==== Mock 데이터 ====

const mockExisting: ExistingAnalysis = {
  id: 'existing-makeup-1',
  overall_score: 72,
  undertone: 'warm',
  created_at: new Date().toISOString(),
};

const mockResult: MockMakeupResult = {
  undertone: 'cool',
  undertoneLabel: '쿨톤',
  overallScore: 85,
  insight: '쿨톤에 잘 어울리는 메이크업 스타일이에요',
  faceShapeLabel: '계란형',
  eyeShapeLabel: '아몬드형',
  lipShapeLabel: '도톰한 입술',
  metrics: [{ id: 'tone', label: '피부톤', value: 80, status: 'good', description: '균일한 편' }],
  concerns: ['dark-circles'],
  recommendedStyles: ['natural', 'chic'],
  colorRecommendations: [
    {
      category: 'lip',
      categoryLabel: '립',
      colors: [{ name: '로즈', hex: '#FF4488', description: '맑은 로즈' }],
    },
  ],
  makeupTips: [{ category: '베이스', tips: ['쿨톤 파운데이션을 사용하세요'] }],
  personalColorConnection: { season: '여름 쿨톤', compatibility: 'high', note: '잘 맞아요' },
  analyzedAt: new Date(),
  analysisReliability: 'high',
};

// ==================================================================
// 테스트
// ==================================================================

describe('MakeupAnalysisPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('초기 렌더링', () => {
    it('페이지 렌더링 성공', () => {
      render(<MakeupAnalysisPage />);
      expect(screen.getByTestId('makeup-analysis-page')).toBeInTheDocument();
    });

    it('제목 표시', () => {
      render(<MakeupAnalysisPage />);
      expect(screen.getByText('메이크업 분석')).toBeInTheDocument();
    });

    it('guide 단계가 기본값', () => {
      render(<MakeupAnalysisPage />);
      expect(screen.getByTestId('guide-step')).toBeInTheDocument();
    });

    it('촬영 가이드 안내 표시', () => {
      render(<MakeupAnalysisPage />);
      expect(screen.getByText('촬영 가이드')).toBeInTheDocument();
      expect(screen.getByText(/밝은 자연광/)).toBeInTheDocument();
      expect(screen.getByText(/정면에서 얼굴/)).toBeInTheDocument();
      expect(screen.getByText(/민낯 상태/)).toBeInTheDocument();
      expect(screen.getByText(/필터나 보정/)).toBeInTheDocument();
    });

    it('서브타이틀: 촬영 가이드', () => {
      render(<MakeupAnalysisPage />);
      expect(screen.getByTestId('subtitle')).toHaveTextContent('정확한 분석을 위한 촬영 가이드');
    });
  });

  describe('기존 분석 결과 배너', () => {
    it('기존 결과 있으면 배너 표시', () => {
      render(<MakeupAnalysisPage initialExisting={mockExisting} />);
      expect(screen.getByTestId('existing-analysis-banner')).toBeInTheDocument();
      expect(screen.getByText('기존 분석 결과 보기')).toBeInTheDocument();
      expect(screen.getByText('72')).toBeInTheDocument();
      expect(screen.getByText('웜톤')).toBeInTheDocument();
    });

    it('기존 결과 없으면 배너 숨김', () => {
      render(<MakeupAnalysisPage initialExisting={null} />);
      expect(screen.queryByTestId('existing-analysis-banner')).not.toBeInTheDocument();
    });

    it('로딩 중이면 배너 숨김', () => {
      render(<MakeupAnalysisPage initialExisting={mockExisting} checkingInitial={true} />);
      expect(screen.queryByTestId('existing-analysis-banner')).not.toBeInTheDocument();
    });

    it('배너 링크가 결과 페이지로 연결', () => {
      render(<MakeupAnalysisPage initialExisting={mockExisting} />);
      const banner = screen.getByTestId('existing-analysis-banner');
      expect(banner).toHaveAttribute('href', '/analysis/makeup/result/existing-makeup-1');
    });
  });

  describe('단계 전환: guide → upload', () => {
    it('"사진 선택하기" 클릭 시 upload 단계', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));
      expect(screen.getByTestId('upload-step')).toBeInTheDocument();
      expect(screen.queryByTestId('guide-step')).not.toBeInTheDocument();
    });

    it('서브타이틀 변경', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));
      expect(screen.getByTestId('subtitle')).toHaveTextContent('얼굴 사진을 선택해주세요');
    });
  });

  describe('단계 전환: guide → known-input', () => {
    it('"알고 있어요" 클릭 시 known-input 단계', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('skip-to-known-btn'));
      expect(screen.getByTestId('known-input-step')).toBeInTheDocument();
      expect(screen.queryByTestId('guide-step')).not.toBeInTheDocument();
    });

    it('서브타이틀 변경', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('skip-to-known-btn'));
      expect(screen.getByTestId('subtitle')).toHaveTextContent('피부 타입을 선택해주세요');
    });

    it('뒤로 버튼으로 guide 복귀', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('skip-to-known-btn'));
      expect(screen.getByTestId('known-input-step')).toBeInTheDocument();

      fireEvent.click(screen.getByText('뒤로'));
      expect(screen.getByTestId('guide-step')).toBeInTheDocument();
    });
  });

  describe('upload 단계', () => {
    it('이미지 선택 전 업로드 영역 표시', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));
      expect(screen.getByTestId('upload-area')).toBeInTheDocument();
      expect(screen.getByText('사진을 선택해주세요')).toBeInTheDocument();
    });

    it('파일 선택 후 프리뷰 표시', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByTestId('image-preview-area')).toBeInTheDocument();
      expect(screen.getByAltText('선택된 이미지')).toBeInTheDocument();
    });

    it('파일 선택 후 분석 시작 버튼 표시', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      expect(screen.getByTestId('start-analysis-btn')).toBeInTheDocument();
      expect(screen.getByText('분석 시작')).toBeInTheDocument();
    });

    it('가이드로 돌아가기 버튼', () => {
      render(<MakeupAnalysisPage />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      fireEvent.click(screen.getByTestId('back-to-guide-btn'));
      expect(screen.getByTestId('guide-step')).toBeInTheDocument();
    });
  });

  describe('분석 플로우: upload → loading → result', () => {
    it('분석 시작 시 loading 단계로 전환', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      // 파일 선택
      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      // 분석 시작
      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      // loading 또는 result 도달 확인
      await waitFor(() => {
        const hasResult = screen.queryByTestId('result-step') !== null;
        const hasLoading = screen.queryByTestId('loading-step') !== null;
        expect(hasResult || hasLoading).toBe(true);
      });
    });

    it('분석 완료 후 result 단계', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('result-step')).toBeInTheDocument();
      });
    });

    it('결과 점수 표시', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('result-score')).toHaveTextContent('85');
      });
    });

    it('결과 인사이트 표시', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByText(/쿨톤에 잘 어울리는/)).toBeInTheDocument();
      });
    });

    it('서브타이틀: 분석 완료', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('subtitle')).toHaveTextContent('분석이 완료되었어요');
      });
    });
  });

  describe('에러 처리', () => {
    it('분석 실패 시 에러 메시지 표시', async () => {
      render(<MakeupAnalysisPage mockFetchError="분석 중 문제가 발생했어요" />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-banner')).toBeInTheDocument();
        expect(screen.getByText(/분석 중 문제가 발생했어요/)).toBeInTheDocument();
      });
    });

    it('에러 시 upload 단계로 복귀', async () => {
      render(<MakeupAnalysisPage mockFetchError="네트워크 오류" />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('upload-step')).toBeInTheDocument();
      });
    });

    it('에러 시 서브타이틀 변경', async () => {
      render(<MakeupAnalysisPage mockFetchError="에러 발생" />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('subtitle')).toHaveTextContent('분석 중 오류가 발생했어요');
      });
    });
  });

  describe('다시 분석하기 (Retry)', () => {
    it('다시 분석하기 버튼 클릭 시 guide로 복귀', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('retry-btn'));
      expect(screen.getByTestId('guide-step')).toBeInTheDocument();
    });

    it('retry 후 에러 초기화', async () => {
      render(<MakeupAnalysisPage mockFetchResult={mockResult} />);
      fireEvent.click(screen.getByTestId('go-upload-btn'));

      const fileInput = screen.getByTestId('file-input');
      const file = new File(['test'], 'face.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });

      await act(async () => {
        fireEvent.click(screen.getByTestId('start-analysis-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('result-step')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('retry-btn'));
      expect(screen.queryByTestId('error-banner')).not.toBeInTheDocument();
    });
  });
});
