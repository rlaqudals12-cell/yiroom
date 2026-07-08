import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ScanPage from '@/app/(main)/scan/page';

// Mock Next.js router (제품함 추가 토스트 액션에서 사용)
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
}));

// Mock sonner (성공/실패 토스트)
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

// Mock 컴포넌트
vi.mock('@/components/scan/ScanCamera', () => ({
  ScanCamera: ({
    onScan,
  }: {
    onScan: (r: { text: string; format: string; confidence: number }) => void;
  }) => (
    <div data-testid="scan-camera">
      <button
        data-testid="mock-scan-btn"
        onClick={() => onScan({ text: '8801234567890', format: 'EAN-13', confidence: 0.95 })}
      >
        Scan
      </button>
    </div>
  ),
}));

vi.mock('@/components/scan/BarcodeInput', () => ({
  BarcodeInput: ({ onSubmit }: { onSubmit: (barcode: string) => void }) => (
    <div data-testid="barcode-input">
      <button data-testid="mock-submit-btn" onClick={() => onSubmit('8801234567890')}>
        Submit
      </button>
    </div>
  ),
}));

vi.mock('@/components/scan/ScanResult', () => ({
  ScanResult: ({ onAddToShelf }: { onAddToShelf?: () => void }) => (
    <div data-testid="scan-result">
      Result
      <button data-testid="mock-add-shelf-btn" onClick={onAddToShelf}>
        내 제품함에 추가
      </button>
    </div>
  ),
}));

vi.mock('@/components/scan/IngredientCapture', () => ({
  IngredientCapture: ({ onResult }: { onResult: (r: unknown) => void }) => (
    <div data-testid="ingredient-capture">
      <button
        data-testid="mock-ocr-btn"
        onClick={() =>
          onResult({
            success: true,
            productName: '테스트 제품',
            brandName: '테스트 브랜드',
            ingredients: [
              { order: 1, inciName: 'Water', nameKo: '정제수', ewgGrade: 1 },
              { order: 2, inciName: 'Glycerin', nameKo: '글리세린', ewgGrade: 1 },
            ],
            confidence: 'high',
            language: 'ko',
          })
        }
      >
        OCR
      </button>
    </div>
  ),
}));

// Mock lib/scan
vi.mock('@/lib/scan', () => ({
  lookupProduct: vi.fn().mockResolvedValue({
    found: true,
    product: { name: '테스트', brand: '브랜드', barcode: '8801234567890' },
    source: 'seed',
    confidence: 0.9,
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ScanPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          overallScore: 85,
          skinCompatibility: { score: 85, goodPoints: [], warnings: [] },
          ingredientAnalysis: { beneficial: [], caution: [], avoid: [], interactions: [] },
          hasUserAnalysis: { skinAnalysis: false, personalColor: false },
        }),
    });
  });

  it('renders with correct test id', () => {
    render(<ScanPage />);
    expect(screen.getByTestId('scan-page')).toBeInTheDocument();
  });

  it('shows 3 mode tabs: barcode, ingredient, manual', () => {
    render(<ScanPage />);
    expect(screen.getByText('바코드')).toBeInTheDocument();
    expect(screen.getByText('성분표')).toBeInTheDocument();
    expect(screen.getByText('직접 입력')).toBeInTheDocument();
  });

  it('defaults to camera/barcode mode', () => {
    render(<ScanPage />);
    expect(screen.getByTestId('scan-camera')).toBeInTheDocument();
  });

  it('switches to ingredient mode on tab click', () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('성분표'));
    expect(screen.getByTestId('ingredient-capture')).toBeInTheDocument();
  });

  it('switches to manual mode on tab click', () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('직접 입력'));
    expect(screen.getByTestId('barcode-input')).toBeInTheDocument();
  });

  it('handles barcode scan and shows result', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByTestId('mock-scan-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('scan-result')).toBeInTheDocument();
    });
  });

  it('handles OCR result and shows ingredient analysis', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('성분표'));
    fireEvent.click(screen.getByTestId('mock-ocr-btn'));

    await waitFor(() => {
      expect(screen.getByText('테스트 제품')).toBeInTheDocument();
      expect(screen.getByText('테스트 브랜드')).toBeInTheDocument();
    });

    // 성분 목록 표시 확인
    expect(screen.getByText(/정제수/)).toBeInTheDocument();
    expect(screen.getByText(/글리세린/)).toBeInTheDocument();
  });

  it('shows compatibility score after OCR analysis', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('성분표'));
    fireEvent.click(screen.getByTestId('mock-ocr-btn'));

    await waitFor(() => {
      expect(screen.getByText('85점')).toBeInTheDocument();
    });
  });

  it('shows confidence badge', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('성분표'));
    fireEvent.click(screen.getByTestId('mock-ocr-btn'));

    await waitFor(() => {
      expect(screen.getByText('높은 정확도')).toBeInTheDocument();
    });
  });

  it('shows disclaimer text', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByText('성분표'));
    fireEvent.click(screen.getByTestId('mock-ocr-btn'));

    await waitFor(() => {
      expect(screen.getByText(/참고용이며/)).toBeInTheDocument();
    });
  });

  it('adds product to shelf via POST /api/scan/shelf and shows success toast', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 'shelf-item-1' }),
    });

    render(<ScanPage />);
    fireEvent.click(screen.getByTestId('mock-scan-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('scan-result')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('mock-add-shelf-btn'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/scan/shelf',
        expect.objectContaining({ method: 'POST' })
      );
      expect(mockToastSuccess).toHaveBeenCalled();
    });

    const [, options] = mockFetch.mock.calls.find(([url]) => url === '/api/scan/shelf')!;
    const body = JSON.parse((options as RequestInit).body as string);
    expect(body.productName).toBe('테스트');
    expect(body.scanMethod).toBe('barcode');
  });

  it('shows error toast when shelf API fails', async () => {
    render(<ScanPage />);
    fireEvent.click(screen.getByTestId('mock-scan-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('scan-result')).toBeInTheDocument();
    });

    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: '제품함 추가 중 오류가 발생했습니다' }),
    });

    fireEvent.click(screen.getByTestId('mock-add-shelf-btn'));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalled();
    });
  });
});
