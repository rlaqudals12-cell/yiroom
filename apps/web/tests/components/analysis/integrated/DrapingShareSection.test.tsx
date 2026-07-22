import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrapingShareSection } from '@/app/(main)/analysis/integrated/result/[sessionId]/_components/DrapingShareSection';

// 캔버스 파이프 mock — jsdom엔 2D 컨텍스트가 없다
vi.mock('@/lib/analysis/canvas-utils', () => ({
  getConstrainedCanvasSize: (w: number, h: number) => ({ width: w, height: h, scale: 1 }),
  createOptimizedContext: () => null,
}));
vi.mock('@/lib/analysis/drape-reflectance', () => ({
  applyDrapeColor: vi.fn(),
}));

const mockCapture = vi.fn();
vi.mock('@/lib/share/imageGenerator', () => ({
  captureElementAsImage: (...args: unknown[]) => mockCapture(...args),
}));

const mockTrack = vi.fn();
vi.mock('@vercel/analytics', () => ({
  track: (...args: unknown[]) => mockTrack(...args),
}));

class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';
  naturalWidth = 800;
  naturalHeight = 1000;
  set src(_v: string) {
    queueMicrotask(() => this.onload?.());
  }
}
vi.stubGlobal('Image', MockImage);

const BEST = [
  { hex: '#C79AA0', name: '더스티 로즈' },
  { hex: '#9A86A6', name: '소프트 라일락' },
];

describe('DrapingShareSection — 얼굴 포함 공유 옵트인', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();
  });

  it('옵트인 기본 OFF — 체크 전에는 카드를 렌더하지 않는다 (얼굴 = 명시적 선택)', () => {
    render(
      <DrapingShareSection imageUrl="https://x/sig.jpg" toneName="뮤티드 서머" bestColors={BEST} />
    );
    const optin = screen.getByTestId('draping-share-optin');
    expect(optin).not.toBeChecked();
    expect(screen.queryByTestId('draping-share-card')).toBeNull();
  });

  it('인라인 고지(기기 내 생성·서버 미저장)를 옵트인 전에도 항상 노출한다 (법④)', () => {
    render(<DrapingShareSection imageUrl="https://x/sig.jpg" bestColors={BEST} />);
    expect(screen.getByTestId('draping-share-notice')).toHaveTextContent('drapingCard.notice');
  });

  it('옵트인 시 카드가 렌더되고 발급번호가 표시된다', async () => {
    render(
      <DrapingShareSection
        imageUrl="https://x/sig.jpg"
        toneName="뮤티드 서머"
        bestColors={BEST}
        serialNo={42}
      />
    );
    fireEvent.click(screen.getByTestId('draping-share-optin'));
    await waitFor(() => {
      expect(screen.getByTestId('draping-share-card')).toBeInTheDocument();
    });
    expect(screen.getByTestId('draping-card-canvas')).toBeInTheDocument();
    expect(screen.getByTestId('draping-card-serial')).toHaveTextContent('No.000042');
  });

  it('드레이프 캡션이 라벨 + 색이름으로 렌더된다 (사진=분석임을 명시, 리포트와 동일 문법)', async () => {
    render(
      <DrapingShareSection imageUrl="https://x/sig.jpg" toneName="뮤티드 서머" bestColors={BEST} />
    );
    fireEvent.click(screen.getByTestId('draping-share-optin'));
    await waitFor(() => {
      expect(screen.getByTestId('draping-card-caption')).toBeInTheDocument();
    });
    // 기본 드레이프 = 베스트 1번(더스티 로즈) — 라벨은 i18n 키, 이름은 팔레트에서 해석
    expect(screen.getByTestId('draping-card-caption')).toHaveTextContent(
      'reportCard.drapingLabel · 더스티 로즈'
    );
  });

  it('이미지 저장 클릭 시 캡처→계측이 일어난다', async () => {
    mockCapture.mockResolvedValue(new Blob(['png'], { type: 'image/png' }));
    render(<DrapingShareSection imageUrl="https://x/sig.jpg" bestColors={BEST} />);
    fireEvent.click(screen.getByTestId('draping-share-optin'));
    await waitFor(() => screen.getByTestId('draping-share-download'));

    fireEvent.click(screen.getByTestId('draping-share-download'));
    await waitFor(() => {
      expect(mockCapture).toHaveBeenCalledTimes(1);
      expect(mockTrack).toHaveBeenCalledWith('draping_card_share', { method: 'download' });
    });
    expect(screen.getByTestId('draping-share-message')).toHaveTextContent('shareCard.saved');
  });

  it('베스트 팔레트가 없으면 렌더하지 않는다 (지어내기 금지)', () => {
    const { container } = render(
      <DrapingShareSection imageUrl="https://x/sig.jpg" bestColors={[]} />
    );
    expect(container.firstChild).toBeNull();
  });
});
