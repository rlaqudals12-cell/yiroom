import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DrapingSection } from '@/components/analysis/personal-color';

// 캔버스 파이프 mock — jsdom엔 2D 컨텍스트가 없다 (동작 검증은 렌더 계약으로)
const mockApplyDrape = vi.fn();
vi.mock('@/lib/analysis/canvas-utils', () => ({
  getConstrainedCanvasSize: (w: number, h: number) => ({ width: w, height: h, scale: 1 }),
  createOptimizedContext: () => null, // ctx 없음 → drawDrape 조기 반환(렌더 계약만 검증)
}));
vi.mock('@/lib/analysis/drape-reflectance', () => ({
  applyDrapeColor: (...args: unknown[]) => mockApplyDrape(...args),
}));

// 이미지 로드 제어 — jsdom의 Image는 실제 로드를 못 하므로 성공/실패를 플래그로 재현
let imageShouldFail = false;
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';
  naturalWidth = 800;
  naturalHeight = 1000;
  set src(_v: string) {
    queueMicrotask(() => (imageShouldFail ? this.onerror?.() : this.onload?.()));
  }
}
vi.stubGlobal('Image', MockImage);

const BEST = [
  { hex: '#C79AA0', name: '더스티 로즈' },
  { hex: '#9A86A6', name: '소프트 라일락' },
];
const WORST = [{ hex: '#FF5A4E' }, { hex: '#FFD23F' }];

describe('DrapingSection — 드레이핑 비교(기기 내 캔버스 합성)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    imageShouldFail = false;
  });

  it('베스트/워스트 캔버스 2개와 스와치를 렌더한다 (바이럴 정본 형식 = 병치)', async () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    await waitFor(() => {
      expect(screen.getByTestId('draping-canvas-best')).toBeInTheDocument();
      expect(screen.getByTestId('draping-canvas-worst')).toBeInTheDocument();
    });
    expect(screen.getByTestId('draping-swatch-best-1')).toBeInTheDocument();
    expect(screen.getByTestId('draping-swatch-worst-0')).toBeInTheDocument();
  });

  it('정직 표기(가상 드레이프·기기 내 처리)를 항상 노출한다', () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    // next-intl 목 = t(key)=>key
    expect(screen.getByText('draping.honestNote')).toBeInTheDocument();
  });

  it('무엇을 볼지 알려주는 관찰 지시를 노출한다 (판정이 아닌 체험)', () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    expect(screen.getByTestId('draping-observe-hint')).toHaveTextContent('draping.observeHint');
  });

  it('인쇄물에서 제외된다 (얼굴 사진 0장 계약)', () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    expect(screen.getByTestId('draping-section')).toHaveAttribute('data-print-hide');
  });

  it('캔버스는 role="img"이고, 스와치는 색명으로 라벨링된다 (name 없으면 hex 기반 색명)', async () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    await waitFor(() => {
      expect(screen.getByTestId('draping-canvas-best')).toHaveAttribute('role', 'img');
    });
    // 진단 색명이 있으면 그대로
    expect(screen.getByTestId('draping-swatch-best-0')).toHaveAttribute(
      'aria-label',
      '더스티 로즈'
    );
    // 색명이 없으면 hex → 한국어 색명 (#FF5A4E = 레드 계열)
    expect(screen.getByTestId('draping-swatch-worst-0')).toHaveAttribute('aria-label', '레드');
  });

  it('재시도는 부모 재조회(onRetry)를 호출한다 — 만료된 서명 URL은 새로 발급받아야 산다', async () => {
    imageShouldFail = true;
    const onRetry = vi.fn();
    render(
      <DrapingSection
        imageUrl="https://x/expired.jpg"
        bestColors={BEST}
        worstColors={WORST}
        onRetry={onRetry}
      />
    );
    await waitFor(() => {
      expect(screen.getByTestId('draping-load-error')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('draping.retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('사진 로드 실패 시 정직한 실패 문구 + 재시도를 보여준다 (조용한 숨김 금지)', async () => {
    imageShouldFail = true;
    render(
      <DrapingSection imageUrl="https://x/expired.jpg" bestColors={BEST} worstColors={WORST} />
    );
    await waitFor(() => {
      expect(screen.getByTestId('draping-load-error')).toBeInTheDocument();
    });
    // 재시도 → 성공 경로 복귀
    imageShouldFail = false;
    fireEvent.click(screen.getByText('draping.retry'));
    await waitFor(() => {
      expect(screen.getByTestId('draping-canvas-best')).toBeInTheDocument();
    });
  });

  it('스와치 탭으로 드레이프 색을 교체한다', async () => {
    render(<DrapingSection imageUrl="https://x/sig.jpg" bestColors={BEST} worstColors={WORST} />);
    await waitFor(() => screen.getByTestId('draping-swatch-best-1'));
    fireEvent.click(screen.getByTestId('draping-swatch-best-1'));
    expect(screen.getByTestId('draping-swatch-best-1')).toHaveAttribute('aria-pressed', 'true');
  });

  it('베스트 팔레트가 없으면 렌더하지 않는다 (지어내기 금지)', () => {
    const { container } = render(
      <DrapingSection imageUrl="https://x/sig.jpg" bestColors={[]} worstColors={WORST} />
    );
    expect(container.firstChild).toBeNull();
  });
});
