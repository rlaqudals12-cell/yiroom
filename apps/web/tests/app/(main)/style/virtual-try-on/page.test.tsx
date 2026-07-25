/**
 * 가상 스타일링 페이지 — 폴백 정직 배지 및 난수 좌표 탭 비활성 테스트
 *
 * @description AI 불변식: 얼굴 검출이 Mock 폴백(표준 위치)이면
 *   ① 결과에 정직 배지(vto-fallback-notice) 노출
 *   ② 난수 좌표 기반 블러셔·아이섀도 탭 비활성 + 사유 텍스트 노출
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// CDN 사전 확인 모킹 — 폴백 여부를 결정론적으로 제어
vi.mock('@/lib/analysis', () => ({
  checkMediaPipeCDN: vi.fn(),
}));

// 시뮬레이션 엔진만 모킹, 프리셋/시즌 헬퍼는 실제 구현 사용
vi.mock('@/lib/virtual-try-on', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('@/lib/virtual-try-on');
  return {
    ...actual,
    applyLipColor: vi.fn(),
    applyBlush: vi.fn(),
    applyHairColor: vi.fn(),
    applyEyeshadow: vi.fn(),
    applyFoundation: vi.fn(),
  };
});

vi.mock('@/lib/virtual-try-on/product-matcher', () => ({
  matchProductsByColor: vi.fn().mockResolvedValue([]),
  rgbToLab: vi.fn(),
  calculateDeltaE: vi.fn(),
}));

vi.mock('@/components/common/BeforeAfterViewer', () => ({
  BeforeAfterViewer: () => <div data-testid="before-after-viewer" />,
}));

vi.mock('@/components/common/AIBadge', () => ({
  AITransparencyNotice: () => <div data-testid="ai-transparency-notice" />,
}));

import VirtualTryOnPage from '@/app/(main)/style/virtual-try-on/page';
import { checkMediaPipeCDN } from '@/lib/analysis';
import { applyLipColor, applyBlush } from '@/lib/virtual-try-on';
import type { MakeupResult } from '@/lib/virtual-try-on';

/** 이미지 로드를 즉시 성공시키는 Mock Image (handleApply의 로드 대기 해소) */
class MockImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = '';
  naturalWidth = 100;
  naturalHeight = 100;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.());
  }
}

/** Mock 시뮬레이션 결과 생성 */
function createMakeupResult(usedFallback: boolean, type: 'lip' | 'blush' = 'lip'): MakeupResult {
  return {
    dataUrl: 'data:image/jpeg;base64,mock',
    config: { type, color: { r: 210, g: 40, b: 40, a: 1 }, opacity: 0.55 },
    processingTimeMs: 12,
    usedFallback,
  };
}

/** 파일 업로드 → 미리보기 노출까지 진행 */
async function uploadImage(): Promise<void> {
  const page = screen.getByTestId('virtual-try-on-page');
  const input = page.querySelector('input[type="file"]') as HTMLInputElement;
  const file = new File(['face-bytes'], 'face.png', { type: 'image/png' });

  fireEvent.change(input, { target: { files: [file] } });

  // FileReader(jsdom)가 dataUrl을 만들 때까지 대기
  await screen.findByAltText('업로드된 사진');
}

describe('VirtualTryOnPage — 폴백 정직 노출', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('Image', MockImage);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should disable blush/eyeshadow tabs with reason when CDN precheck fails', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(false);

    render(<VirtualTryOnPage />);

    // 사전 확인이 폴백을 감지하면 사유 텍스트 노출
    expect(await screen.findByTestId('vto-fallback-tab-reason')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '블러셔' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '아이섀도' })).toBeDisabled();
    // 고정 Mock 기반 탭은 유지
    expect(screen.getByRole('button', { name: '립스틱' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '파운데이션' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '헤어 컬러' })).toBeEnabled();
  });

  it('should keep all tabs enabled when CDN precheck succeeds', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);

    render(<VirtualTryOnPage />);

    await waitFor(() => {
      expect(checkMediaPipeCDN).toHaveBeenCalled();
    });

    expect(screen.queryByTestId('vto-fallback-tab-reason')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '블러셔' })).toBeEnabled();
    expect(screen.getByRole('button', { name: '아이섀도' })).toBeEnabled();
  });

  it('should show honest badge when lip result used fallback landmarks', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(applyLipColor).mockResolvedValue(createMakeupResult(true));

    render(<VirtualTryOnPage />);
    await uploadImage();

    fireEvent.click(screen.getByRole('button', { name: '적용하기' }));

    // 결과는 표시하되 정직 배지 동반
    expect(await screen.findByTestId('vto-fallback-notice')).toBeInTheDocument();
    expect(screen.getByTestId('before-after-viewer')).toBeInTheDocument();

    // 폴백이 확인되었으므로 난수 좌표 탭도 잠긴다
    expect(screen.getByRole('button', { name: '블러셔' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '아이섀도' })).toBeDisabled();
  });

  it('should not show badge when detection is real', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(applyLipColor).mockResolvedValue(createMakeupResult(false));

    render(<VirtualTryOnPage />);
    await uploadImage();

    fireEvent.click(screen.getByRole('button', { name: '적용하기' }));

    expect(await screen.findByTestId('before-after-viewer')).toBeInTheDocument();
    expect(screen.queryByTestId('vto-fallback-notice')).not.toBeInTheDocument();
  });

  it('should discard blush fallback result (난수 아티팩트 차단) and lock tabs', async () => {
    vi.mocked(checkMediaPipeCDN).mockResolvedValue(true);
    vi.mocked(applyBlush).mockResolvedValue(createMakeupResult(true, 'blush'));

    render(<VirtualTryOnPage />);
    await uploadImage();

    // 블러셔 탭으로 이동 후 적용 (사전 확인은 통과했지만 실행 시 폴백 감지 시나리오)
    fireEvent.click(screen.getByRole('button', { name: '블러셔' }));
    fireEvent.click(screen.getByRole('button', { name: '적용하기' }));

    // 폴백 감지 → 탭 잠금 사유 노출, 난수 좌표 결과는 표시하지 않음
    expect(await screen.findByTestId('vto-fallback-tab-reason')).toBeInTheDocument();
    expect(screen.queryByTestId('before-after-viewer')).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '블러셔' })).toBeDisabled();
      expect(screen.getByRole('button', { name: '아이섀도' })).toBeDisabled();
    });
  });
});
